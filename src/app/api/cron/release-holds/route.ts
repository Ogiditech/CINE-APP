import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleHoldRelease(request);
}

export async function POST(request: NextRequest) {
  return handleHoldRelease(request);
}

async function handleHoldRelease(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");

  // Verify CRON_SECRET
  const isBearerValid =
    cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isQueryValid = cronSecret && querySecret === cronSecret;

  if (cronSecret && !isBearerValid && !isQueryValid) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const result = await BookingService.releaseExpiredHolds();
    return NextResponse.json({
      success: true,
      message: "Expired seat holds and bookings processed successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Error in release-holds cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to release expired holds",
      },
      { status: 500 }
    );
  }
}
