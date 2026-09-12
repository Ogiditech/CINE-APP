import { NextRequest, NextResponse } from "next/server";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, paymentMethod = "CARD", idempotencyKey, amountCents } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required." },
        { status: 400 }
      );
    }

    const key =
      idempotencyKey ||
      req.headers.get("Idempotency-Key") ||
      `pay-${bookingId}-${Date.now()}`;

    const paymentIntentId = `pi_test_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const result = await CinemaDB.confirmPayment({
      bookingId,
      paymentIntentId,
      idempotencyKey: key,
      amountCents: amountCents || 0,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      payment: result.payment,
      tickets: result.tickets,
      idempotentReplay: result.idempotentReplay,
    });
  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment." },
      { status: 400 }
    );
  }
}
