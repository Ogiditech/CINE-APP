import { CinemaDB } from "../lib/db-client";
import { memoryStore } from "../lib/mock-store";

export async function runConcurrencyTests() {
  console.log("🧪 [QA Agent] Running Concurrency & Race Condition Seat-Booking Tests...");
  let passed = 0;
  let failed = 0;

  try {
    // 1. Setup a clean target showtime and available seat
    const testShowtimeId = "st-dune-1";
    // Find an available seat
    const targetShowtimeSeat = memoryStore.showtimeSeats.find(
      (ss) => ss.showtimeId === testShowtimeId && ss.status === "AVAILABLE"
    );

    if (!targetShowtimeSeat) {
      throw new Error("No available seat found in test showtime for concurrency test.");
    }

    const contestedSeatId = targetShowtimeSeat.seatId;

    console.log(
      `  ⚡ Simulating 2 concurrent booking requests for Seat ID: ${contestedSeatId} at the exact same millisecond...`
    );

    // Session A and Session B compete for the exact same seat simultaneously
    const sessionA = CinemaDB.createHold({
      showtimeId: testShowtimeId,
      seatIds: [contestedSeatId],
      userId: "user-session-alpha",
      idempotencyKey: `idemp-session-alpha-${Date.now()}`,
    });

    const sessionB = CinemaDB.createHold({
      showtimeId: testShowtimeId,
      seatIds: [contestedSeatId],
      userId: "user-session-beta",
      idempotencyKey: `idemp-session-beta-${Date.now()}`,
    });

    // Execute concurrently
    const results = await Promise.allSettled([sessionA, sessionB]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const rejections = results.filter((r) => r.status === "rejected");

    console.log(`  📊 Results: ${successes.length} fulfilled, ${rejections.length} rejected.`);

    if (successes.length === 1 && rejections.length === 1) {
      console.log(
        "  ✓ Concurrency Lock Test PASSED: Exactly ONE session acquired the seat; competing session was rejected."
      );
      const rejectionReason = (rejections[0] as PromiseRejectedResult).reason?.message;
      console.log(`  ✓ Competing session received expected conflict rejection: "${rejectionReason}"`);
      passed++;
    } else {
      console.error(
        `  ✗ Concurrency Lock Test FAILED: Expected 1 success and 1 conflict rejection, but got ${successes.length} successes.`
      );
      failed++;
    }

    // Verify seat status is now HELD and not available to a third session
    const seatAfter = memoryStore.showtimeSeats.find(
      (ss) => ss.showtimeId === testShowtimeId && ss.seatId === contestedSeatId
    );

    if (seatAfter?.status === "HELD") {
      console.log("  ✓ Seat status correctly updated to HELD with hold expiration.");
      passed++;
    } else {
      console.error(`  ✗ Seat status is ${seatAfter?.status}, expected HELD.`);
      failed++;
    }
  } catch (error: any) {
    console.error("  ✗ Concurrency test threw error:", error);
    failed++;
  }

  return { passed, failed };
}

if (require.main === module) {
  runConcurrencyTests().then(({ passed, failed }) => {
    if (failed > 0) process.exit(1);
  });
}
