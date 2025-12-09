"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, BookOpen, Layers, Users, FileDown } from "lucide-react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    let authCheckInterval: NodeJS.Timeout | null = null;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;

        if (!mounted) return;

        // Handle token refresh errors gracefully
        if (error) {
          // Check if it's a refresh token error
          if (
            error.message?.includes("Refresh Token") ||
            error.message?.includes("refresh_token") ||
            error.name === "AuthApiError"
          ) {
            // Token is invalid, sign out silently
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              // Ignore sign out errors
            }
            if (mounted) {
              router.replace("/login");
            }
            return;
          }
          // Other errors - sign out and redirect
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            // Ignore sign out errors
          }
          if (mounted) {
            router.replace("/login");
          }
          return;
        }

        if (!user) {
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            // Ignore sign out errors
          }
          if (mounted) {
            router.replace("/login");
          }
          return;
        }

        // Verify admin access
        const { data: prof, error: profError } = await supabase
          .from("profiles")
          .select("is_admin, email")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profError || !prof?.is_admin) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        setEmail(prof.email);
      } catch (err: any) {
        // Handle errors gracefully, especially refresh token errors
        if (
          err?.message?.includes("Refresh Token") ||
          err?.message?.includes("refresh_token") ||
          err?.name === "AuthApiError"
        ) {
          // Silently handle refresh token errors
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            // Ignore sign out errors
          }
        } else {
          console.error("Auth check error:", err);
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            // Ignore sign out errors
          }
        }
        if (mounted) {
          router.replace("/login");
        }
      }
    };

    // Initial check
    fetchUser();

    // Set up session monitoring - check every 5 minutes
    authCheckInterval = setInterval(() => {
      if (mounted) {
        fetchUser();
      }
    }, 5 * 60 * 1000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !session) {
          if (mounted) {
            router.replace("/login");
          }
          return;
        }

        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED") {
          try {
            await fetchUser();
          } catch (err) {
            // If token refresh fails, sign out
            console.error("Token refresh error:", err);
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              // Ignore sign out errors
            }
            if (mounted) {
              router.replace("/login");
            }
          }
          return;
        }

        if (event === "SIGNED_IN") {
          await fetchUser();
        }
      }
    );

    return () => {
      mounted = false;
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
      subscription.unsubscribe();
    };
  }, [router]);

  const navItems = [
    {
      name: "Content",
      icon: <Layers size={18} />,
      route: "/dashboard/modules",
    },
    { name: "Users", icon: <Users size={18} />, route: "/dashboard/users" },
    {
      name: "Analytics",
      icon: <FileDown size={18} />,
      route: "/dashboard/reports",
    },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore sign out errors - we'll redirect anyway
      console.error("Logout error:", error);
    }
    router.replace("/login");
  };

  // Session timeout handler
  const handleSessionTimeout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore sign out errors - we'll redirect anyway
      console.error("Session timeout logout error:", error);
    }
    router.replace("/login");
  };

  // Use session timeout hook
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout(
    handleSessionTimeout,
    {
      warningTime: 14 * 60 * 1000, // Show warning after 14 minutes of inactivity
      timeoutTime: 15 * 60 * 1000, // Auto-logout after 15 minutes of inactivity
      checkInterval: 60 * 1000, // Check every minute
    }
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A2C57] text-white flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-center py-6 border-b border-white/10">
            <Image
              src="/longologo.png"
              alt="Longo Logo"
              width={180}
              height={50}
              priority
            />
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.route;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.route)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-[#6EC1E4]/20 text-[#6EC1E4]"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4 flex items-center justify-between">
          <span className="text-xs text-white/70 truncate w-32">{email}</span>
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>

      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        visible={showWarning}
        timeRemaining={timeRemaining}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </div>
  );
}
