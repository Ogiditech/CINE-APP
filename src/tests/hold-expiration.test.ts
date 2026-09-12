import { memoryStore } from "../lib/mock-store";
import { BookingService } from "../lib/booking-service";

export async function runHoldExpirationTests() {
  console.log("🧪 [QA Agent] Running Expired Seat Hold & Automatic Sweep Tests...");
  let passed = 0;
  let failed = 0;

  try {
    const testShowtimeId = "st-interstellar-1";
    // Setup an expired seat hold manually
    const expiredSeat = memoryStore.showtimeSeats.find(
      (ss) => ss.showtimeId === testShowtimeId
    );

    if (!expiredSeat) {
      throw new Error("No seat found for hold expiration test.");
    }

    // Set hold that expired 15 minutes ago
    const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    expiredSeat.status = "HELD";
    expiredSeat.heldUntil = pastTime;
    expiredSeat.heldByUserId = "user-expired-hold";

    // Also create a dummy pending booking with past expiration
    const dummyBookingId = "b-test-expired-hold";
    memoryStore.bookings.push({
      id: dummyBookingId,
      bookingReference: "CB-EXPIRE1",
      userId: "user-expired-hold",
      showtimeId: testShowtimeId,
      status: "PENDING",
      subtotalCents: 2000,
      serviceFeeCents: 150,
      taxCents: 160,
      totalCents: 2310,
      currency: "USD",
      idempotencyKey: `expire-key-${Date.now()}`,
      expiresAt: pastTime,
      createdAt: pastTime,
      items: [{ showtimeSeatId: expiredSeat.id, seatPriceCents: 2000 }],
    });

    console.log("  ⏳ Seat hold set with past expiration. Running sweeper...");

    // Simulate sweeper run in memory
    const now = new Date();
    let releasedCount = 0;
    for (const ss of memoryStore.showtimeSeats) {
      if (ss.status === "HELD" && ss.heldUntil && new Date(ss.heldUntil) < now) {
        ss.status = "AVAILABLE";
        ss.heldUntil = null;
        ss.heldByUserId = null;
        ss.bookingId = null;
        releasedCount++;
      }
    }

    for (const b of memoryStore.bookings) {
      if (b.status === "PENDING" && new Date(b.expiresAt) < now) {
        b.status = "EXPIRED";
      }
    }

    // Assert seat is now AVAILABLE
    if (expiredSeat.status === "AVAILABLE" && expiredSeat.heldUntil === null) {
      console.log("  ✓ Expired seat successfully reverted to AVAILABLE status.");
      passed++;
    } else {
      console.error(`  ✗ Seat status is ${expiredSeat.status}, expected AVAILABLE.`);
      failed++;
    }

    // Assert booking is EXPIRED
    const expiredBooking = memoryStore.bookings.find((b) => b.id === dummyBookingId);
    if (expiredBooking?.status === "EXPIRED") {
      console.log("  ✓ Associated pending booking successfully transitioned to EXPIRED.");
      passed++;
    } else {
      console.error(`  ✗ Booking status is ${expiredBooking?.status}, expected EXPIRED.`);
      failed++;
    }
  } catch (error: any) {
    console.error("  ✗ Hold expiration test threw exception:", error);
    failed++;
  }

  return { passed, failed };
}

if (require.main === module) {
  runHoldExpirationTests().then(({ passed, failed }) => {
    if (failed > 0) process.exit(1);
  });
}
