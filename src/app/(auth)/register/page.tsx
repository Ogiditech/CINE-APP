"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, Mail, User, Phone, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-[2px] mx-auto shadow-glow">
            <div className="w-full h-full bg-cinema-900 rounded-[14px] flex items-center justify-center">
              <Film className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Create CineBook Account</h1>
          <p className="text-xs text-zinc-400">
            Enjoy priority seat booking, fast digital ticketing, and exclusive rewards.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

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
                placeholder="alex@cinebook.com"
                className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Mobile Phone (for ticket SMS alerts)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 012-3456"
                className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-cinema-950 font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
