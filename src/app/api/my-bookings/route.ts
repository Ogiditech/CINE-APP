import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    // Allow viewing viewer demo or authenticated user
    const userId = user?.userId || "u-viewer-1";

    const bookingsList = await CinemaDB.getUserBookings(userId);

    return NextResponse.json({ bookings: bookingsList });
  } catch (error: any) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
