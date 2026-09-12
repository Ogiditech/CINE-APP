import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { CinemaDB } from "@/lib/db-client";
import { memoryStore } from "@/lib/mock-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    // In production, require ADMIN role
    if (user && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const metrics = await CinemaDB.getAdminMetrics();
    const recentBookings = memoryStore.bookings.slice(-5).reverse();

    return NextResponse.json({
      metrics,
      recentBookings,
    });
  } catch (error: any) {
    console.error("Admin metrics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load admin metrics." },
      { status: 500 }
    );
  }
}
