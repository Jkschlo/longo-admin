"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, BookOpen, Layers, Users, FileDown } from "lucide-react";

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

        if (error || !user) {
          await supabase.auth.signOut();
          router.replace("/login");
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
      } catch (err) {
        console.error("Auth check error:", err);
        if (mounted) {
          await supabase.auth.signOut();
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
      async (event, session) => {
        if (!mounted) return;

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
    await supabase.auth.signOut();
    router.replace("/login");
  };

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
    </div>
  );
}
