"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: "admin" | "viewer") => {
    if (role === "admin") {
      setEmail("admin@cinebook.com");
      setPassword("AdminPass123!");
    } else {
      setEmail("viewer@cinebook.com");
      setPassword("ViewerPass123!");
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: role === "admin" ? "admin@cinebook.com" : "viewer@cinebook.com",
          password: role === "admin" ? "AdminPass123!" : "ViewerPass123!",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-[2px] mx-auto shadow-glow">
            <div className="w-full h-full bg-cinema-900 rounded-[14px] flex items-center justify-center">
              <Film className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Welcome Back</h1>
          <p className="text-xs text-zinc-400">
            Sign in to access your digital tickets and loyalty perks.
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5">
          <button
            type="button"
            onClick={() => handleQuickLogin("viewer")}
            className="py-2 px-3 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-amber-400 text-xs font-bold border border-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Demo Customer
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin")}
            className="py-2 px-3 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-amber-400 text-xs font-bold border border-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Demo Admin
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cinebook.com"
                className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-cinema-950 font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : "Sign In to CineBook"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 pt-2">
          Don't have an account?{" "}
          <Link href="/register" className="text-amber-400 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
