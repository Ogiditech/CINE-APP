"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  DollarSign,
  Ticket,
  Film,
  Users,
  Clock,
  RefreshCw,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaningHolds, setCleaningHolds] = useState(false);
  const [cleanStatus, setCleanStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/metrics");
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setRecentBookings(data.recentBookings || []);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerHoldCleanup = async () => {
    try {
      setCleaningHolds(true);
      setCleanStatus(null);
      const res = await fetch("/api/cron/release-holds", {
        method: "POST",
        headers: {
          Authorization: `Bearer cinebook_cron_secret_auth_token_9921`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setCleanStatus(
          `Success: Swept ${data.releasedSeatsCount || 0} expired seat holds.`
        );
        fetchMetrics();
      } else {
        setCleanStatus(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setCleanStatus(`Error: ${err.message}`);
    } finally {
      setCleaningHolds(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Operations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Cinema Operations & Analytics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerHoldCleanup}
            disabled={cleaningHolds}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {cleaningHolds ? "Releasing Holds..." : "Trigger Hold Cleanup Cron"}
          </button>
          <button
            onClick={fetchMetrics}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {cleanStatus && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>{cleanStatus}</span>
        </div>
      )}

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Total Revenue
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            ${((metrics?.totalRevenueCents || 0) / 100).toFixed(2)}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">
            Live Verified Transactions
          </span>
        </div>

        {/* Total Bookings */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Bookings
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {metrics?.totalBookingsCount || 0}
          </p>
          <span className="text-[11px] text-zinc-400">
            {metrics?.confirmedBookingsCount || 0} confirmed passes
          </span>
        </div>

        {/* Active Showtimes */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Active Showtimes
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {metrics?.activeShowtimesCount || 0}
          </p>
          <span className="text-[11px] text-zinc-400">Scheduled across halls</span>
        </div>

        {/* Total Users */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Registered Patrons
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {metrics?.totalUsersCount || 2}
          </p>
          <span className="text-[11px] text-zinc-400">Admin & Customer accounts</span>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE & RECENT AUDIT LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-bold text-white">
              Recent Booking Transactions
            </h3>
            <span className="text-xs text-zinc-400">Auto-updating</span>
          </div>

          {recentBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No recent bookings recorded in this session.
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-amber-400 block">
                      {b.bookingReference}
                    </span>
                    <span className="text-zinc-400">
                      Amount: ${(b.totalCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {new Date(b.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Deployment & System Diagnostics */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-white/10 pb-4">
            Deployment Diagnostics
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Server Environment</span>
              <span className="font-bold text-white">Vercel Edge / Node.js</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Database Engine</span>
              <span className="font-bold text-amber-400">Neon Serverless PG</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">ORM & Migrations</span>
              <span className="font-bold text-white">Drizzle ORM v0.39</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Hold Expiration Cron</span>
              <span className="font-bold text-emerald-400">Active (*/2 min)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Payment Gateway</span>
              <span className="font-bold text-blue-400">Stripe Test Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
