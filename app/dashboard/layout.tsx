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
  const extendSessionRef = useRef<(() => void) | null>(null);
  const hasAuthenticatedRef = useRef(false); // Track if we've ever successfully authenticated

  // Session timeout handler - defined early so it can be used in session timeout hook
  const handleSessionTimeout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore sign out errors - we'll redirect anyway
      console.error("Session timeout logout error:", error);
    }
    router.replace("/login");
  }, [router]);

  // Use session timeout hook - must be defined before fetchUser so extendSession is available
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout(
    handleSessionTimeout,
    {
      warningTime: 14 * 60 * 1000, // Show warning after 14 minutes of inactivity
      timeoutTime: 15 * 60 * 1000, // Auto-logout after 15 minutes of inactivity
      checkInterval: 60 * 1000, // Check every minute
    }
  );

  // Store extendSession in ref so fetchUser can use it (update in effect, not during render)
  useEffect(() => {
    extendSessionRef.current = extendSession;
  }, [extendSession]);

  const fetchUser = useCallback(async (isInitialCheck = false) => {
    if (!mountedRef.current) return;
    
    // Set email loading state (only if we don't already have email to avoid flicker)
    if (mountedRef.current && (!email || isInitialCheck)) {
      setIsLoadingEmail(true);
    }
    
    try {
      const sessionResp = await withTimeout<
        Awaited<ReturnType<typeof supabase.auth.getSession>>
      >(supabase.auth.getSession(), "Session check", 15000); // Increased timeout to 15s
      const session = sessionResp.data?.session;
      const sessionError = sessionResp.error;

      if (!mountedRef.current) return;

      // If there is a session error, log and don't redirect - let session timeout handle it
      // Only redirect if it's a clear authentication error, not a network issue
      if (sessionError) {
        // Check if it's a real auth error (invalid token, etc.) vs network/timeout
        const isAuthError = sessionError.message?.includes("JWT") || 
                           sessionError.message?.includes("token") ||
                           sessionError.message?.includes("expired") ||
                           sessionError.message?.includes("invalid");
        
        if (isAuthError) {
          // Real auth error - session is invalid
          console.warn("Session authentication error:", sessionError);
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore sign out errors
          }
          if (mountedRef.current) {
            setIsAuthenticated(false);
            hasAuthenticatedRef.current = false;
            setIsLoadingEmail(false);
            router.replace("/login");
          }
          return;
        } else {
          // Network/timeout error - don't redirect, preserve auth state
          console.warn("Session check network error (non-critical):", sessionError.message);
          if (mountedRef.current) {
            setIsLoadingEmail(false);
            // Preserve authentication state if we were previously authenticated
            // This prevents the UI from blocking when switching tabs
            if (hasAuthenticatedRef.current && isAuthenticated !== true) {
              // If we've authenticated before, preserve that state on transient errors
              setIsAuthenticated(true);
            }
          }
          return;
        }
      }

      if (!session?.user) {
        // No session - only redirect if this is initial check or explicit sign out
        // Otherwise, let session timeout hook handle it
        if (isInitialCheck) {
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore sign out errors
          }
          if (mountedRef.current) {
            setIsAuthenticated(false);
            hasAuthenticatedRef.current = false;
            setIsLoadingEmail(false);
            router.replace("/login");
          }
        } else {
          // Periodic check found no session - just log, don't redirect
          // The session timeout hook will handle logout if user is inactive
          console.warn("No session found in periodic check");
          if (mountedRef.current) {
            setIsLoadingEmail(false);
            // Preserve authentication state - don't block UI on transient session issues
            // The session timeout hook will handle actual logout
            if (hasAuthenticatedRef.current && isAuthenticated !== true) {
              setIsAuthenticated(true);
            }
          }
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
        "Admin profile check",
        15000 // Increased timeout
      );
      const prof = profileResp.data;
      const profError = profileResp.error;

      if (!mountedRef.current) return;

      if (profError) {
        // Database error - log but don't redirect unless it's initial check
        console.warn("Profile check error:", profError);
        if (isInitialCheck) {
          // On initial check, redirect if we can't verify admin status
          await supabase.auth.signOut();
          if (mountedRef.current) {
            setIsAuthenticated(false);
            hasAuthenticatedRef.current = false;
            setIsLoadingEmail(false);
            router.replace("/login");
          }
        } else {
          // Periodic check - just log, don't redirect, preserve auth state
          if (mountedRef.current) {
            setIsLoadingEmail(false);
            // Preserve authentication state to prevent UI blocking
            if (hasAuthenticatedRef.current && isAuthenticated !== true) {
              setIsAuthenticated(true);
            }
          }
        }
        return;
      }

      if (!prof?.is_admin) {
        // Not admin - always redirect
        await supabase.auth.signOut();
        if (mountedRef.current) {
          setIsAuthenticated(false);
          hasAuthenticatedRef.current = false;
          setIsLoadingEmail(false);
          router.replace("/login");
        }
        return;
      }

      // User is authenticated and is admin - success!
      // Reset activity timer since we successfully verified session
      if (mountedRef.current) {
        setEmail(prof.email || "");
        setIsAuthenticated(true);
        hasAuthenticatedRef.current = true; // Mark that we've successfully authenticated
        setIsLoadingEmail(false);
        // Reset session timeout activity timer on successful check
        // This ensures that periodic checks don't cause premature timeouts
        if (extendSessionRef.current) {
          extendSessionRef.current();
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Auth check error:", error);
      
      // Check if it's a clear auth error vs network/timeout error
      const isAuthError = error.message?.includes("JWT") || 
                         error.message?.includes("token") ||
                         error.message?.includes("expired") ||
                         error.message?.includes("invalid") ||
                         error.message?.includes("Unauthorized");
      
      const isTimeoutError = error.message?.includes("timed out");
      
      if (isAuthError) {
        // Real auth error - session is invalid, redirect to login
        if (mountedRef.current) {
          setIsAuthenticated(false);
          hasAuthenticatedRef.current = false;
          setIsLoadingEmail(false);
          router.replace("/login");
        }
      } else if (isTimeoutError && isInitialCheck) {
        // Timeout on initial check - retry once before giving up
        console.warn("Initial auth check timed out, retrying...");
        try {
          const retryResp = await supabase.auth.getSession();
          if (retryResp.data?.session?.user) {
            // Session exists, verify admin status
            const { data: prof } = await supabase
              .from("profiles")
              .select("is_admin, email")
              .eq("id", retryResp.data.session.user.id)
              .maybeSingle();
            
            if (prof?.is_admin && mountedRef.current) {
              setEmail(prof.email || "");
              setIsAuthenticated(true);
              hasAuthenticatedRef.current = true;
              setIsLoadingEmail(false);
              return;
            }
          }
          // Retry failed or not admin - redirect
          if (mountedRef.current) {
            setIsAuthenticated(false);
            hasAuthenticatedRef.current = false;
            setIsLoadingEmail(false);
            router.replace("/login");
          }
        } catch {
          // Retry also failed - redirect to login
          if (mountedRef.current) {
            setIsAuthenticated(false);
            hasAuthenticatedRef.current = false;
            setIsLoadingEmail(false);
            router.replace("/login");
          }
        }
      } else if (isInitialCheck) {
        // Other error on initial check - redirect to login
        if (mountedRef.current) {
          setIsAuthenticated(false);
          hasAuthenticatedRef.current = false;
          setIsLoadingEmail(false);
          router.replace("/login");
        }
      } else {
        // Periodic check failed due to network/timeout - just log, don't redirect
        // The session timeout hook will handle logout if user is actually inactive
        if (mountedRef.current) {
          setIsLoadingEmail(false);
          // Preserve authentication state to prevent UI blocking on transient errors
          if (hasAuthenticatedRef.current && isAuthenticated !== true) {
            setIsAuthenticated(true);
          }
        }
      }
    }
  }, [router, email]);

  useEffect(() => {
    mountedRef.current = true;
    let authCheckInterval: NodeJS.Timeout | null = null;
    let lastVisibilityCheck = 0;
    const VISIBILITY_CHECK_COOLDOWN = 30 * 1000; // Don't check more than once per 30 seconds
    
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && mountedRef.current) {
        const now = Date.now();
        // Extend session activity when tab becomes visible
        // This prevents session timeout when switching tabs
        if (extendSessionRef.current) {
          extendSessionRef.current();
        }
        // Only check if it's been at least 30 seconds since last check
        // This prevents excessive checks when tabbing back and forth
        if (now - lastVisibilityCheck > VISIBILITY_CHECK_COOLDOWN) {
          lastVisibilityCheck = now;
          fetchUser(false); // Not initial check
        }
      }
    };

    // Initial check - fetch user data in background (non-blocking)
    // Use setTimeout to avoid calling setState synchronously within effect
    setTimeout(() => {
      fetchUser(true); // Initial check
    }, 0);

    // Set up session monitoring - check every 5 minutes for security
    // These are periodic checks, not initial, so they won't redirect on transient errors
    authCheckInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchUser(false); // Periodic check, not initial
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
            hasAuthenticatedRef.current = false;
            setIsLoadingEmail(false);
            router.replace("/login");
          }
          return;
        }

        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          // Refresh user data when token is refreshed or user signs in
          // Reset activity timer since token refresh means user is active
          if (extendSessionRef.current) {
            extendSessionRef.current();
          }
          await fetchUser(false); // Not initial check
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

  // If not authenticated (false), redirect will happen, show nothing
  if (isAuthenticated === false) {
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
      <main className="flex-1 overflow-y-auto p-8">
        {isAuthenticated === null ? (
          <div className="w-full flex items-center justify-center h-[70vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093075]"></div>
              <p className="text-gray-500">Loading content...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

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
