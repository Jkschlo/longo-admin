"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  /** 
   * Don't check for existing sessions - require manual login
   * The dashboard will handle redirecting here if needed
   */
  // Removed auto-login check - users must manually enter credentials

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if account is temporarily locked
    if (lockedUntil && new Date() < lockedUntil) {
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      setError(`Too many failed attempts. Please try again in ${minutesLeft} minute(s).`);
      return;
    }

    // Reset lock if time has passed
    if (lockedUntil && new Date() >= lockedUntil) {
      setLockedUntil(null);
      setAttempts(0);
    }

    // Input validation
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Password length validation (basic)
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      /* ---------------------------
         STEP 1: Sign in
      ----------------------------*/
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        // Don't leak specific error details to prevent user enumeration
        // Generic error message for security
        
        // Rate limiting: lock after 5 failed attempts for 15 minutes
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          setLockedUntil(lockUntil);
          setError("Too many failed attempts. Your account is temporarily locked. Please try again in 15 minutes.");
        } else {
          setError("Incorrect email or password.");
        }
        
        setLoading(false);
        return;
      }

      // Reset attempts on successful login
      setAttempts(0);
      setLockedUntil(null);

      /* ---------------------------
         STEP 2: Wait for session hydrating
      ----------------------------*/
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        setError("Auth session failed. Please try again.");
        setLoading(false);
        return;
      }

      const user = session.user;

      /* ---------------------------
         STEP 3: Get profile 
      ----------------------------*/
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("id, email, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profErr) {
        console.error("Profile error:", profErr);
        setError("Unable to verify account permissions.");
        setLoading(false);
        return;
      }

      if (!profile) {
        setError("Profile not found for this user.");
        setLoading(false);
        return;
      }

      /* ---------------------------
         STEP 4: Check admin flag
      ----------------------------*/
      if (!profile.is_admin) {
        setError("Must be an admin user to continue.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      /* ---------------------------
         STEP 5: Redirect to dashboard/modules
      ----------------------------*/
      router.replace("/dashboard/modules");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      console.error("Login error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2C57] via-[#123E7A] to-[#6EC1E4] animate-gradient"></div>

      {/* Top Logo */}
      <div className="relative mt-14 mb-6">
        <Image
          src="/longologo.png"
          alt="Longo Carpet Cleaning Logo"
          width={280}
          height={80}
          className="relative z-10 drop-shadow-md"
          priority
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-extrabold text-center mb-2">Admin Login</h1>
        <p className="text-center text-sm text-blue-100 mb-8">
          Sign in to access your dashboard
        </p>

        <form onSubmit={signIn} className="space-y-5">
          <div>
            <label className="text-xs text-blue-100 block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-[#6EC1E4]"
              placeholder="admin@longocarpetcleaning.com"
            />
          </div>

          <div>
            <label className="text-xs text-blue-100 block mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-[#6EC1E4]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 py-3 font-bold rounded-xl shadow-md text-white transition-all duration-300 ${
              loading
                ? "bg-[#6EC1E4]/70 cursor-not-allowed"
                : "bg-[#6EC1E4] hover:bg-[#5bb7de] cursor-pointer"
            }`}
          >
            {loading ? "Signing in..." : "Log In"}
          </button>

          <div className="mt-6 pt-6 border-t border-white/20 flex justify-center items-center gap-2 text-xs text-blue-100">
            <a href="/privacy" className="hover:text-white underline">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="/terms" className="hover:text-white underline">
              Terms of Service
            </a>
          </div>
        </form>
      </div>

      {/* Bottom Logo */}
      <div className="relative z-10 mb-12 mt-12">
        <Image
          src="/affordlogo.png"
          alt="Affordable Duct Cleaning Logo"
          width={260}
          height={70}
          priority
        />
      </div>

      {/* Animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 12s ease infinite;
        }
      `}</style>
    </div>
  );
}
