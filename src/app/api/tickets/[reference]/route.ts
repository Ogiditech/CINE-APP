import { NextRequest, NextResponse } from "next/server";
import { CinemaDB } from "@/lib/db-client";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const booking = await CinemaDB.getBookingByReference(params.reference);
    if (!booking) {
      return NextResponse.json(
        { error: "Ticket or booking not found." },
        { status: 404 }
      );
    }

    // Generate QR Code data URL
    const qrPayload = JSON.stringify({
      bookingRef: booking.bookingReference,
      movie: booking.movie?.title,
      cinema: booking.cinema?.name,
      auditorium: booking.auditorium?.name,
      issuedAt: booking.createdAt,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 256,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      booking,
      qrCodeDataUrl,
    });
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}
