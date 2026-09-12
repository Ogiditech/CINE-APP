"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Ticket,
  AlertCircle,
  Check,
  Lock,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = (params?.id || params?.showtimeId) as string;

  const [showtime, setShowtime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (showtimeId) {
      fetchShowtimeSeats();
    }
  }, [showtimeId]);

  const fetchShowtimeSeats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/showtimes/${showtimeId}`);
      const data = await res.json();
      if (res.ok) {
        setShowtime(data.showtime);
      } else {
        setErrorMsg(data.error || "Failed to load showtime seat map");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error loading seats");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: any) => {
    if (seat.status === "BOOKED" || seat.status === "BLOCKED") {
      return;
    }

    // Toggle selection
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        setErrorMsg("Maximum 8 seats can be selected per booking.");
        return;
      }
      setErrorMsg(null);
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) {
      setErrorMsg("Please select at least one seat to proceed.");
      return;
    }

    try {
      setReserving(true);
      setErrorMsg(null);

      const seatIds = selectedSeats.map((s) => s.seatId);
      const idempotencyKey = `hold-${showtimeId}-${seatIds.sort().join("-")}-${Date.now()}`;

      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to hold seats");
      }

      // Route to checkout with booking ID
      router.push(`/booking/${data.booking.id}/checkout`);
    } catch (err: any) {
      console.error("Reservation hold error:", err);
      setErrorMsg(err.message || "Seats could not be reserved. Please reselect.");
      // Refresh seat status to reflect competition
      fetchShowtimeSeats();
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 space-y-8 animate-pulse text-center">
        <div className="h-10 w-64 bg-white/5 rounded-xl mx-auto" />
        <div className="h-96 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Showtime Unavailable</h2>
        <p className="text-xs text-zinc-400">{errorMsg || "The selected showtime is not available."}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-cinema-950 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Movies
        </Link>
      </div>
    );
  }

  const basePrice = showtime.basePriceCents || 1800;

  // Calculate prices
  const subtotalCents = selectedSeats.reduce((sum, s) => {
    let multiplier = 1.0;
    if (s.type === "VIP") multiplier = 1.5;
    else if (s.type === "PREMIUM") multiplier = 1.25;
    return sum + Math.round(basePrice * multiplier);
  }, 0);

  const serviceFeeCents = selectedSeats.length * 150;
  const taxCents = Math.round(subtotalCents * 0.08);
  const totalCents = subtotalCents + serviceFeeCents + taxCents;

  // Group seats by row
  const rowsMap: { [key: string]: any[] } = {};
  showtime.seats?.forEach((s: any) => {
    if (!rowsMap[s.row]) rowsMap[s.row] = [];
    rowsMap[s.row].push(s);
  });
  const sortedRows = Object.keys(rowsMap).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-36">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            href={`/movies/${showtime.movie?.slug || ""}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Showtime
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {showtime.movie?.title}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
            <span className="text-amber-400 font-semibold">{showtime.cinema?.name}</span>
            <span>•</span>
            <span>{showtime.auditorium?.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              {new Date(showtime.startTime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md border border-zinc-500 bg-cinema-800" />
            <span className="text-zinc-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-amber-500 shadow-glow" />
            <span className="text-amber-400 font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-zinc-800 border border-zinc-700 opacity-40" />
            <span className="text-zinc-500">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md border border-amber-500/80 bg-amber-500/20 animate-pulse" />
            <span className="text-amber-300">Held</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CINEMA AUDITORIUM SCREEN */}
      <div className="space-y-6 pt-4">
        <div className="relative text-center">
          {/* Curved Curved Screen Light Bar */}
          <div className="w-4/5 max-w-xl mx-auto h-3 bg-gradient-to-r from-amber-500/30 via-amber-400 to-amber-500/30 rounded-t-full shadow-[0_0_35px_rgba(245,158,11,0.6)]" />
          <div className="w-3/4 max-w-lg mx-auto h-12 cinema-screen-glow opacity-70" />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-zinc-400 block -mt-6">
            SCREEN THIS WAY
          </span>
        </div>

        {/* SEAT GRID */}
        <div className="py-6 overflow-x-auto flex justify-center">
          <div className="space-y-3 min-w-[340px]">
            {sortedRows.map((rowLetter) => {
              const rowSeats = rowsMap[rowLetter].sort((a, b) => a.number - b.number);
              return (
                <div key={rowLetter} className="flex items-center justify-center gap-2 sm:gap-3">
                  {/* Row Label Left */}
                  <span className="w-5 text-xs font-bold text-zinc-500 text-center">
                    {rowLetter}
                  </span>

                  {/* Seat Buttons */}
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      const isBooked = seat.status === "BOOKED" || seat.status === "BLOCKED";
                      const isHeld = seat.status === "HELD";

                      let seatStyle = "bg-cinema-800 border-zinc-600 hover:border-amber-400 text-zinc-300 hover:scale-110";
                      if (seat.type === "VIP") {
                        seatStyle = "bg-amber-950/40 border-amber-500/50 hover:border-amber-400 text-amber-200 hover:scale-110";
                      } else if (seat.type === "PREMIUM") {
                        seatStyle = "bg-purple-950/40 border-purple-500/50 hover:border-purple-400 text-purple-200 hover:scale-110";
                      }

                      if (isBooked) {
                        seatStyle = "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-30";
                      } else if (isHeld) {
                        seatStyle = "bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse cursor-not-allowed";
                      } else if (isSelected) {
                        seatStyle = "bg-amber-500 border-amber-400 text-cinema-950 shadow-glow font-bold scale-110";
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked || isHeld}
                          onClick={() => handleSeatClick(seat)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center border transition-all duration-150 relative ${seatStyle}`}
                          title={`Row ${seat.row}, Seat ${seat.number} (${seat.type})`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isHeld ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            seat.number
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Label Right */}
                  <span className="w-5 text-xs font-bold text-zinc-500 text-center">
                    {rowLetter}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seat Tiers Legend Details */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-400 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cinema-800 border border-zinc-600" />
            <span>Standard: ${(basePrice / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-950/60 border border-purple-500/50" />
            <span>Premium: ${(Math.round(basePrice * 1.25) / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-950/60 border border-amber-500/50" />
            <span>VIP Recliner: ${(Math.round(basePrice * 1.5) / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION DOCK / BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 block">
                Selected Seats ({selectedSeats.length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedSeats.length === 0 ? (
                  <span className="text-xs text-zinc-500 italic">No seats selected yet</span>
                ) : (
                  selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    >
                      {s.row}{s.number}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="sm:border-l sm:border-white/10 sm:pl-4">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 block">
                Total (incl. fees & tax)
              </span>
              <span className="text-lg sm:text-xl font-black text-white">
                ${(totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleReserveSeats}
            disabled={selectedSeats.length === 0 || reserving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-cinema-950 font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition-all"
          >
            {reserving ? (
              <>
                <div className="w-4 h-4 border-2 border-cinema-950 border-t-transparent rounded-full animate-spin" />
                <span>Locking Seats...</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                <span>Confirm Seats & Pay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
