import { NextResponse } from "next/server";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cinemasList = await CinemaDB.getCinemas();
    return NextResponse.json({ cinemas: cinemasList });
  } catch (error: any) {
    console.error("Error fetching cinemas:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cinemas" },
      { status: 500 }
    );
  }
}
