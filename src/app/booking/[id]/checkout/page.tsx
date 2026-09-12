"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Ticket,
  Lock,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = (params?.id || params?.bookingId) as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown timer for 10-minute hold
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins in sec

  // Simulated card inputs
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [cardHolder, setCardHolder] = useState("Alex Johnson");

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // Hold expiration countdown
  useEffect(() => {
    if (!booking?.expiresAt) return;
    const interval = setInterval(() => {
      const expTime = new Date(booking.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setErrorMsg("Your seat hold has expired. Please return to the seat map.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      // Fetch user bookings or booking details
      const res = await fetch(`/api/my-bookings`);
      const data = await res.json();
      const found = data.bookings?.find((b: any) => b.id === bookingId);
      if (found) {
        setBooking(found);
      } else {
        // Fallback: mock booking shape
        setBooking({
          id: bookingId,
          bookingReference: `CB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          subtotalCents: 3700,
          serviceFeeCents: 300,
          taxCents: 296,
          totalCents: 4296,
          expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
          movie: { title: "Dune: Part Two", posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000" },
          cinema: { name: "CineBook Grand IMAX Cinema" },
          auditorium: { name: "Screen 1 - IMAX Laser" },
        });
      }
    } catch {
      setErrorMsg("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12/28");
    setCardCvc("424");
    setCardHolder("Alex Johnson");
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setErrorMsg("Hold expired. Please reselect your seats.");
      return;
    }

    try {
      setPaying(true);
      setErrorMsg(null);

      const idempotencyKey = `pay-${bookingId}-${Date.now()}`;

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          bookingId,
          amountCents: booking?.totalCents,
          paymentMethod: "CARD",
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // Success! Route to ticket page with booking reference
      const ref = data.booking?.bookingReference || booking.bookingReference;
      router.push(`/tickets/${ref}`);
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "Payment processing error occurred.");
    } finally {
      setPaying(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">
            Step 2 of 2
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Confirm & Complete Payment
          </h1>
        </div>

        {/* Hold Countdown */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-glow">
          <Clock className="w-4 h-4" />
          <span>Seats Held for: {formatTimer(timeLeft)}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>Test Card Gateway</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoCard}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Auto-fill Test Card
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none tracking-widest font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-cinema-900 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Mode active. No real credit card will be charged.</span>
              </div>

              <button
                type="submit"
                disabled={paying || timeLeft <= 0}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-cinema-950 font-bold text-sm shadow-glow flex items-center justify-center gap-2 transition-all mt-4"
              >
                {paying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cinema-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Test Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay ${(booking?.totalCents / 100).toFixed(2)} & Issue Tickets</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary Breakdown */}
        <div className="md:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              Order Summary
            </h3>

            {/* Movie Info */}
            <div className="space-y-1">
              <span className="text-sm font-bold text-white block">
                {booking?.movie?.title || "Dune: Part Two"}
              </span>
              <p className="text-xs text-zinc-400">
                {booking?.cinema?.name} • {booking?.auditorium?.name}
              </p>
            </div>

            {/* Transparent Fees & Totals */}
            <div className="space-y-2.5 text-xs border-t border-white/10 pt-4 text-zinc-300">
              <div className="flex justify-between">
                <span>Tickets Subtotal</span>
                <span className="font-semibold text-white">
                  ${(booking?.subtotalCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Convenience / Service Fee</span>
                <span className="font-semibold text-white">
                  ${(booking?.serviceFeeCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>State & City Tax (8%)</span>
                <span className="font-semibold text-white">
                  ${(booking?.taxCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between text-sm font-black text-white">
                <span>Final Total</span>
                <span className="text-amber-400 text-lg">
                  ${(booking?.totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 text-[11px] text-zinc-400 space-y-1">
              <span className="font-bold text-zinc-300 block">Cancellation Policy</span>
              <p>
                Eligible for full refund up to 2 hours prior to showtime from your
                My Bookings dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
