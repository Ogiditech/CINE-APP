"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Ticket as TicketIcon,
  Printer,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Sparkles,
  Download,
} from "lucide-react";

export default function DigitalTicketPage() {
  const params = useParams();
  const bookingReference = params?.bookingReference as string;

  const [ticketData, setTicketData] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingReference) {
      fetchTicket();
    }
  }, [bookingReference]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${bookingReference}`);
      const data = await res.json();
      if (res.ok) {
        setTicketData(data.booking);
        setQrCodeDataUrl(data.qrCodeDataUrl);
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 space-y-6 animate-pulse text-center">
        <div className="h-96 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  const booking = ticketData;
  const ticket = booking?.tickets?.[0];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> My Bookings
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Ticket
          </button>
        </div>
      </div>

      {/* Success Notification */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white">
          Booking Confirmed!
        </h1>
        <p className="text-xs text-zinc-400">
          Your digital pass is active. Present the QR code at the theater usher station.
        </p>
      </div>

      {/* LUXURY BOARDING PASS TICKET CARD */}
      <div className="relative glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-2xl ticket-edge-left ticket-edge-right">
        {/* Top Header of Ticket */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 p-4 text-cinema-950 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-tight text-sm">
            <TicketIcon className="w-5 h-5" />
            <span>CINEBOOK DIGITAL ACCESS PASS</span>
          </div>
          <span className="text-xs font-mono font-black uppercase bg-cinema-950 text-amber-400 px-2.5 py-0.5 rounded-md">
            {booking?.bookingReference || bookingReference}
          </span>
        </div>

        {/* Main Ticket Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block mb-1">
                Feature Presentation
              </span>
              <h2 className="text-2xl font-black text-white">
                {booking?.movie?.title || "Dune: Part Two"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {booking?.cinema?.name} • {booking?.auditorium?.name}
              </p>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
                Status
              </span>
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {booking?.status || "CONFIRMED"}
              </span>
            </div>
          </div>

          {/* Screening Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Screening Date
              </span>
              <span className="font-bold text-white text-sm">
                {booking?.showtime?.startTime
                  ? new Date(booking.showtime.startTime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Today"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Showtime
              </span>
              <span className="font-bold text-amber-400 text-sm">
                {booking?.showtime?.startTime
                  ? new Date(booking.showtime.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "7:00 PM"}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Reserved Seats
              </span>
              <span className="font-bold text-white text-sm">
                {ticket?.seatSummary || "Row D: Seat 4, 5"}
              </span>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative border-b-2 border-dashed border-white/20 my-6" />

          {/* QR Code & Scan Instructions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold text-white block">
                Scan Upon Arrival
              </span>
              <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                Position this QR code under the scanner at Screen Entrance. Valid for all
                attendees registered under this reference code.
              </p>
              <p className="text-[10px] font-mono text-zinc-500 pt-1">
                Ref: {booking?.bookingReference}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Entry Ticket QR Code"
                  className="w-32 h-32"
                />
              ) : (
                <div className="w-32 h-32 bg-zinc-200 animate-pulse rounded-xl" />
              )}
            </div>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-cinema-900/90 px-6 py-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Non-transferable • CineBook Guarantee</span>
          <span className="text-amber-400 font-semibold">Enjoy the show!</span>
        </div>
      </div>
    </div>
  );
}
