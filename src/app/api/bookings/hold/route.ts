import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    // Allow guest checkout or authenticated user
    const userId = user?.userId || "u-viewer-1";

    const body = await req.json();
    const { showtimeId, seatIds, idempotencyKey } = body;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "showtimeId and non-empty seatIds array are required." },
        { status: 400 }
      );
    }

    const key =
      idempotencyKey ||
      req.headers.get("Idempotency-Key") ||
      `hold-${showtimeId}-${seatIds.sort().join("-")}-${Date.now()}`;

    const result = await CinemaDB.createHold({
      showtimeId,
      seatIds,
      userId,
      idempotencyKey: key,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      expiresAt: (result as any).expiresAt || result.booking?.expiresAt,
      alreadyExisted: result.alreadyExisted,
    });
  } catch (error: any) {
    console.error("Seat hold error:", error);
    const status =
      error.message?.includes("already booked") ||
      error.message?.includes("held by another")
        ? 409
        : 400;

    return NextResponse.json(
      { error: error.message || "Failed to reserve seats" },
      { status }
    );
  }
}
