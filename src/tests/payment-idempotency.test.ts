import { CinemaDB } from "../lib/db-client";
import { memoryStore } from "../lib/mock-store";

export async function runPaymentIdempotencyTests() {
  console.log("🧪 [QA Agent] Running Payment Idempotency & Duplicate Prevention Tests...");
  let passed = 0;
  let failed = 0;

  try {
    // 1. Create a hold to test payment against
    const testShowtimeId = "st-oppenheimer-1";
    const availableSeat = memoryStore.showtimeSeats.find(
      (ss) => ss.showtimeId === testShowtimeId && ss.status === "AVAILABLE"
    );

    if (!availableSeat) {
      throw new Error("No available seat found for payment test.");
    }

    const holdResult = await CinemaDB.createHold({
      showtimeId: testShowtimeId,
      seatIds: [availableSeat.seatId],
      userId: "user-idempotency-test",
      idempotencyKey: `hold-test-idemp-${Date.now()}`,
    });

    const bookingId = holdResult.booking.id;
    const paymentIdempotencyKey = `pay-idemp-unique-token-${Date.now()}`;

    console.log("  💳 Submitting initial payment transaction...");
    const firstPayment = await CinemaDB.confirmPayment({
      bookingId,
      paymentIntentId: `pi_test_idemp_1_${Date.now()}`,
      idempotencyKey: paymentIdempotencyKey,
      amountCents: holdResult.booking.totalCents,
      paymentMethod: "CARD",
    });

    if (
      firstPayment.booking.status === "CONFIRMED" &&
      firstPayment.tickets.length > 0 &&
      !firstPayment.idempotentReplay
    ) {
      console.log("  ✓ Initial payment verified: booking confirmed and digital ticket issued.");
      passed++;
    } else {
      console.error("  ✗ Initial payment did not confirm booking properly.");
      failed++;
    }

    console.log("  🔁 Submitting duplicate payment with the exact same Idempotency-Key...");
    const duplicatePayment = await CinemaDB.confirmPayment({
      bookingId,
      paymentIntentId: `pi_test_idemp_duplicate_${Date.now()}`,
      idempotencyKey: paymentIdempotencyKey,
      amountCents: holdResult.booking.totalCents,
      paymentMethod: "CARD",
    });

    if (duplicatePayment.idempotentReplay === true) {
      console.log("  ✓ Idempotency Guard PASSED: Duplicate payment safely identified as replay.");
      passed++;
    } else {
      console.error("  ✗ Idempotency Guard FAILED: Second payment was not flagged as replay.");
      failed++;
    }

    // Assert that tickets count did not double
    const totalTicketsForBooking = memoryStore.tickets.filter(
      (t) => t.bookingId === bookingId
    );
    if (totalTicketsForBooking.length === 1) {
      console.log("  ✓ Database Integrity: No duplicate tickets were generated.");
      passed++;
    } else {
      console.error(
        `  ✗ Database Integrity FAILED: Found ${totalTicketsForBooking.length} tickets, expected exactly 1.`
      );
      failed++;
    }
  } catch (error: any) {
    console.error("  ✗ Payment idempotency test threw exception:", error);
    failed++;
  }

  return { passed, failed };
}

if (require.main === module) {
  runPaymentIdempotencyTests().then(({ passed, failed }) => {
    if (failed > 0) process.exit(1);
  });
}
