import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(req);
    const userId = user?.userId || "u-viewer-1";
    const isAdmin = user?.role === "ADMIN";

    const result = await CinemaDB.cancelBooking({
      bookingId: params.id,
      userId,
      isAdmin,
    });

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully. Refund initiated.",
      booking: result.booking,
      alreadyCancelled: result.alreadyCancelled,
    });
  } catch (error: any) {
    console.error("Cancellation error:", error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status }
    );
  }
}
