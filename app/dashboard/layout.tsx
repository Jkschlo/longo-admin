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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUser = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await withTimeout<
        Awaited<ReturnType<typeof supabase.auth.getUser>>
      >(supabase.auth.getUser(), "Auth check");
      const user = data?.user;

      if (!mountedRef.current) return;

      // Handle token refresh errors gracefully
      if (error) {
        const refreshIssue =
          error.message?.includes("Refresh Token") ||
          error.message?.includes("refresh_token") ||
          error.name === "AuthApiError";
        if (refreshIssue) {
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore sign out errors
          }
          if (mountedRef.current) {
            router.replace("/login");
          }
          setLoading(false);
          return;
        }
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore sign out errors
        }
        if (mountedRef.current) {
          router.replace("/login");
        }
        setLoading(false);
        return;
      }

      if (!user) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore sign out errors
        }
        if (mountedRef.current) {
          router.replace("/login");
        }
        setLoading(false);
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
          .eq("id", user.id)
          .maybeSingle(),
        "Admin profile check"
      );
      const prof = profileResp.data;
      const profError = profileResp.error;

      if (!mountedRef.current) return;

      if (profError || !prof?.is_admin) {
        await supabase.auth.signOut();
        router.replace("/login");
        setLoading(false);
        return;
      }

      setEmail(prof.email || "");
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown authentication error";
      console.error("Auth check error:", err);
      setError(errorMessage);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    let authCheckInterval: NodeJS.Timeout | null = null;

    // Initial check (defer to avoid sync setState warning)
    setTimeout(() => {
      fetchUser();
    }, 0);

    // Set up session monitoring - check every 5 minutes
    authCheckInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchUser();
      }
    }, 5 * 60 * 1000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mountedRef.current) return;

        if (event === "SIGNED_OUT" || !session) {
          router.replace("/login");
          return;
        }

        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          await fetchUser();
        }
      }
    );

    return () => {
      mountedRef.current = false;
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur">
          <div className="flex flex-col items-center gap-3 text-[#0A2C57]">
            <div className="h-10 w-10 rounded-full border-4 border-[#6EC1E4] border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Checking your session…</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur">
          <div className="bg-white shadow-lg rounded-xl p-6 max-w-md w-full border border-gray-200">
            <h2 className="text-lg font-semibold text-[#0A2C57] mb-2">Unable to load session</h2>
            <p className="text-sm text-gray-600 mb-4">
              {error}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => router.replace("/login")}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Go to login
              </button>
              <button
                onClick={() => fetchUser()}
                className="px-4 py-2 rounded-md bg-[#0A2C57] text-white hover:bg-[#123E7A] transition"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
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
