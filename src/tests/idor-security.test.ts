import { CinemaDB } from "../lib/db-client";
import { memoryStore } from "../lib/mock-store";

export async function runIdorSecurityTests() {
  console.log("🧪 [QA Agent] Running IDOR Security & Authorization Barrier Tests...");
  let passed = 0;
  let failed = 0;

  try {
    // 1. Create a future showtime (>2 hours away) to test valid cancellation
    const futureShowtimeId = "st-future-test-1";
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    memoryStore.showtimes.push({
      id: futureShowtimeId,
      movieId: "m-dune-2",
      auditoriumId: "aud-imax-1",
      startTime: futureDate,
      endTime: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      basePriceCents: 1850,
      status: "SCHEDULED",
    });

    // Create a seat for this showtime
    const futureSeatId = "seat-future-1";
    memoryStore.seats.push({
      id: futureSeatId,
      auditoriumId: "aud-imax-1",
      rowIdentifier: "G",
      seatNumber: 1,
      seatType: "STANDARD",
      priceTier: "STANDARD",
      posX: 1,
      posY: 7,
    });

    memoryStore.showtimeSeats.push({
      id: `ss-${futureShowtimeId}-${futureSeatId}`,
      showtimeId: futureShowtimeId,
      seatId: futureSeatId,
      status: "AVAILABLE",
      heldUntil: null,
      heldByUserId: null,
      bookingId: null,
      version: 1,
    });

    const holdResult = await CinemaDB.createHold({
      showtimeId: futureShowtimeId,
      seatIds: [futureSeatId],
      userId: "user-alpha-legitimate-owner",
      idempotencyKey: `hold-idor-${Date.now()}`,
    });

    const bookingId = holdResult.booking.id;

    console.log(
      "  🛡️ Attempting unauthorized cancellation of User Alpha's booking by Malicious User Beta..."
    );

    // Malicious User Beta tries to cancel User Alpha's booking
    try {
      await CinemaDB.cancelBooking({
        bookingId,
        userId: "user-beta-malicious-attacker",
        isAdmin: false,
      });

      console.error("  ✗ IDOR Security FAILED: Unauthorized user was able to cancel another user's booking!");
      failed++;
    } catch (err: any) {
      if (err.message.includes("Forbidden") || err.message.includes("cannot cancel another user")) {
        console.log(
          `  ✓ IDOR Barrier PASSED: Cross-user cancellation blocked with forbidden error: "${err.message}"`
        );
        passed++;
      } else {
        console.error("  ✗ Unexpected error during IDOR test:", err.message);
        failed++;
      }
    }

    // Now test that the legitimate owner CAN cancel it when > 2 hours prior to showtime
    console.log("  🛡️ Verifying legitimate owner can cancel their own booking (eligible window)...");
    const ownerCancel = await CinemaDB.cancelBooking({
      bookingId,
      userId: "user-alpha-legitimate-owner",
      isAdmin: false,
    });

    if (ownerCancel.booking.status === "CANCELLED") {
      console.log("  ✓ Owner Authorization PASSED: Legitimate owner successfully cancelled booking.");
      passed++;
    } else {
      console.error("  ✗ Owner was unable to cancel their own booking.");
      failed++;
    }
  } catch (error: any) {
    console.error("  ✗ IDOR security test threw error:", error);
    failed++;
  }

  return { passed, failed };
}

if (require.main === module) {
  runIdorSecurityTests().then(({ passed, failed }) => {
    if (failed > 0) process.exit(1);
  });
}
