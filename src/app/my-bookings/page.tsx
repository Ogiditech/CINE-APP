"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Film,
  RefreshCw,
} from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/my-bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? All held/booked seats will be immediately released.")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setActionMsg(null);

      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking.");
      }

      setActionMsg({
        type: "success",
        text: "Booking cancelled successfully. Reserved seats have been freed and refund processed.",
      });

      // Refresh list
      fetchBookings();
    } catch (err: any) {
      setActionMsg({
        type: "error",
        text: err.message || "Cancellation could not be completed.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Pending Hold
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            Cancelled
          </span>
        );
      case "REFUNDED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
            Refunded
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            My Booking History
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your cinema reservations, view digital boarding passes, and cancel eligible screenings.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 border border-white/10 transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            actionMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {actionMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You haven't reserved any cinema seats yet. Browse now-showing blockbusters to book your first premiere experience.
          </p>
          <Link
            href="/#movies"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-cinema-950 font-bold text-xs shadow-glow hover:bg-amber-400 transition-colors"
          >
            <Ticket className="w-4 h-4" /> Explore Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isConfirmed = b.status === "CONFIRMED";
            const isPending = b.status === "PENDING";
            const canCancel = isConfirmed;

            return (
              <div
                key={b.id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Movie and Meta */}
                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                      {b.bookingReference}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {b.movie?.title || "Movie Reservation"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {b.cinema?.name || "Cinema Hall"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      {b.showtime?.startTime
                        ? new Date(b.showtime.startTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Today"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {b.showtime?.startTime
                        ? new Date(b.showtime.startTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Evening"}
                    </span>
                  </div>

                  {b.tickets?.[0]?.seatSummary && (
                    <p className="text-xs text-zinc-300 font-medium">
                      Seats: <span className="text-white">{b.tickets[0].seatSummary}</span>
                    </p>
                  )}
                </div>

                {/* Right: Actions & Total */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
                  <span className="text-lg font-black text-white">
                    ${(b.totalCents / 100).toFixed(2)}
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isConfirmed && (
                      <Link
                        href={`/tickets/${b.bookingReference}`}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-cinema-950 text-xs font-bold flex items-center gap-1.5 shadow-glow"
                      >
                        <Ticket className="w-3.5 h-3.5" /> View Pass
                      </Link>
                    )}

                    {isPending && (
                      <Link
                        href={`/booking/${b.id}/checkout`}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-cinema-950 text-xs font-bold flex items-center gap-1.5"
                      >
                        Complete Checkout
                      </Link>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        {cancellingId === b.id ? (
                          <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
