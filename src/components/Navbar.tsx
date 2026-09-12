"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Ticket, ShieldCheck, User, LogOut, Menu, X, Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user || null);
    } catch {
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    { label: "Movies", href: "/#movies" },
    { label: "Cinemas", href: "/cinemas" },
    { label: "My Bookings", href: "/my-bookings", icon: Ticket },
    ...(currentUser?.role === "ADMIN"
      ? [{ label: "Admin Portal", href: "/admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-[2px] shadow-glow transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-cinema-900 rounded-[10px] flex items-center justify-center">
                <Film className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                CINE<span className="text-amber-400">BOOK</span>
              </span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-semibold block -mt-1">
                Luxury Cinema
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 py-1 px-2 rounded-lg ${
                    isActive
                      ? "text-amber-400 bg-amber-400/10 font-semibold"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-cinema-800/80 border border-white/10 px-3.5 py-1.5 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                    {currentUser.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-xs font-medium text-zinc-200">
                    {currentUser.name}
                  </span>
                  {currentUser.role === "ADMIN" && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-cinema-950 px-4 py-2.5 rounded-xl shadow-glow transition-all duration-200 hover:shadow-amber-500/50 hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Join Club
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium text-zinc-200 hover:text-amber-400 hover:bg-white/5"
            >
              {link.icon && <link.icon className="w-5 h-5" />}
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-white/10">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-zinc-400">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-sm font-semibold py-2.5 rounded-xl bg-white/5 text-zinc-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-sm font-semibold py-2.5 rounded-xl bg-amber-500 text-cinema-950 shadow-glow"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
