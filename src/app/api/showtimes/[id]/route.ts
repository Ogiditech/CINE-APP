import { NextRequest, NextResponse } from "next/server";
import { CinemaDB } from "@/lib/db-client";
import { BookingService } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Opportunistically release expired holds so seat maps reflect immediate availability
    try {
      await BookingService.releaseExpiredHolds();
    } catch {
      // Non-blocking in case of offline/mock mode
    }

    const showtime = await CinemaDB.getShowtimeDetails(params.id);
    if (!showtime) {
      return NextResponse.json(
        { error: "Showtime not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ showtime });
  } catch (error: any) {
    console.error("Error fetching showtime details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch showtime details" },
      { status: 500 }
    );
  }
}
