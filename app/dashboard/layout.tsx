"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, Layers, Users, FileDown } from "lucide-react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 10000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out. Please try again.`));
    }, ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking, true = authenticated, false = not authenticated
  const mountedRef = useRef(true);

  const fetchUser = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Set email loading state
    if (mountedRef.current) {
      setIsLoadingEmail(true);
    }
    
    try {
      const sessionResp = await withTimeout<
        Awaited<ReturnType<typeof supabase.auth.getSession>>
      >(supabase.auth.getSession(), "Session check");
      const session = sessionResp.data?.session;
      const sessionError = sessionResp.error;

      if (!mountedRef.current) return;

      // If there is a session error, log and retry later (do not interrupt UX)
      if (sessionError) {
        console.warn("Session check error:", sessionError);
        if (mountedRef.current) {
          setIsLoadingEmail(false);
        }
        return;
      }

      if (!session?.user) {
        // No session - redirect to login immediately
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore sign out errors
        }
        if (mountedRef.current) {
          setIsAuthenticated(false);
          setIsLoadingEmail(false);
          router.replace("/login");
        }
        return;
      }

      // Verify admin access with timeout
      type ProfileResponse = {
        data: { is_admin: boolean | null; email: string | null } | null;
        error: { message?: string } | null;
      };

      const profileResp = await withTimeout<ProfileResponse>(
        supabase
          .from("profiles")
          .select("is_admin, email")
          .eq("id", session.user.id)
          .maybeSingle(),
        "Admin profile check"
      );
      const prof = profileResp.data;
      const profError = profileResp.error;

      if (!mountedRef.current) return;

      if (profError || !prof?.is_admin) {
        // Not admin or error - redirect to login
        await supabase.auth.signOut();
        if (mountedRef.current) {
          setIsAuthenticated(false);
          setIsLoadingEmail(false);
          router.replace("/login");
        }
        return;
      }

      // User is authenticated and is admin
      if (mountedRef.current) {
        setEmail(prof.email || "");
        setIsAuthenticated(true);
        setIsLoadingEmail(false);
      }
    } catch (err: unknown) {
      console.error("Auth check error:", err);
      // On error, redirect to login for security
      if (mountedRef.current) {
        setIsAuthenticated(false);
        setIsLoadingEmail(false);
        router.replace("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    let authCheckInterval: NodeJS.Timeout | null = null;
    
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && mountedRef.current) {
        fetchUser();
      }
    };

    // Initial check - fetch user data in background (non-blocking)
    fetchUser();

    // Set up session monitoring - check every 5 minutes for security
    authCheckInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchUser();
      }
    }, 5 * 60 * 1000);

    document.addEventListener("visibilitychange", handleVisibility);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mountedRef.current) return;

        if (event === "SIGNED_OUT" || !session) {
          if (mountedRef.current) {
            setIsAuthenticated(false);
            setIsLoadingEmail(false);
            router.replace("/login");
          }
          return;
        }

        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          // Refresh user data when token is refreshed or user signs in
          await fetchUser();
        }
      }
    );

    return () => {
      mountedRef.current = false;
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      subscription.unsubscribe();
    };
  }, [fetchUser, router]);

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

  // If authentication status is unknown (null), show nothing while checking
  // If not authenticated (false), redirect will happen, show nothing
  // Only show dashboard if authenticated (true)
  if (isAuthenticated !== true) {
    // Auth check in progress or user not authenticated - redirect will happen
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A2C57] text-white flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-center py-6 border-b border-white/10">
            <a
              href="https://longotraining.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Go to Longo Training"
            >
              <Image
                src="/longologo.png"
                alt="Longo Logo"
                width={180}
                height={50}
                priority
              />
            </a>
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
          <span 
            className="text-xs text-white/70 truncate w-32" 
            title={email || "Loading..."}
          >
            {isLoadingEmail ? (
              <span className="inline-block w-20 h-3 bg-white/20 rounded animate-pulse">Loading...</span>
            ) : email ? (
              email
            ) : (
              <span className="text-white/50">No email</span>
            )}
          </span>
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
