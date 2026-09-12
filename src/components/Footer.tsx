import React from "react";
import Link from "next/link";
import { Film, Shield, Zap, Sparkles, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-cinema-950 text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-[2px] shadow-glow">
                <div className="w-full h-full bg-cinema-900 rounded-[10px] flex items-center justify-center">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <span className="text-xl font-black text-white">
                CINE<span className="text-amber-400">BOOK</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The pinnacle of modern cinema ticket booking. Enjoy seamless seat
              reservations, laser IMAX, Dolby Atmos soundscapes, and VIP dine-in
              experiences.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-md">
                <Zap className="w-3 h-3 text-amber-400" /> Powered by Neon & Vercel
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#movies" className="hover:text-amber-400 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/#movies" className="hover:text-amber-400 transition-colors">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-amber-400 transition-colors">
                  Cinemas & IMAX Halls
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-amber-400 transition-colors">
                  Booking History
                </Link>
              </li>
            </ul>
          </div>

          {/* Cinema Technologies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Experience
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>IMAX with 4K Laser</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Dolby Vision + Atmos</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>VIP Recliner Pods</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Chef-Curated Dine-In</span>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Support & Security
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>256-bit Encrypted Checkout</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-400" />
                <span>concierge@cinebook.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-400" />
                <span>+1 (800) 555-CINE</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-300">Privacy Policy</span>
            <span className="hover:text-zinc-300">Terms of Service</span>
            <span className="hover:text-zinc-300">Ticket Refund Rules</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
