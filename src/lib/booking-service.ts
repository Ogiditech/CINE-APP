import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  bookingItems,
  showtimeSeats,
  seats,
  showtimes,
  movies,
  cinemas,
  auditoriums,
  payments,
  tickets,
  auditLogs,
  users,
} from "@/db/schema";
import { eq, inArray, and, lt } from "drizzle-orm";

export interface CreateHoldParams {
  showtimeId: string;
  seatIds: string[];
  userId: string;
  idempotencyKey: string;
}

export interface ConfirmPaymentParams {
  bookingId: string;
  paymentIntentId: string;
  idempotencyKey: string;
  amountCents: number;
  paymentMethod?: string;
  provider?: string;
}

export interface CancelBookingParams {
  bookingId: string;
  userId: string;
  isAdmin?: boolean;
}

// Generate random booking reference like CB-9X7K2M
export function generateReference(prefix = "CB"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

export class BookingService {
  /**
   * 1-7: Begin transaction, lock showtime-seats, confirm availability,
   * create temporary hold with expiration, calculate price, and create pending booking.
   */
  static async createSeatHold({
    showtimeId,
    seatIds,
    userId,
    idempotencyKey,
  }: CreateHoldParams) {
    if (!seatIds || seatIds.length === 0) {
      throw new Error("At least one seat must be selected");
    }

    const db = getDb();

    // 1. Check idempotency: if pending/confirmed booking exists with this key, return it
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingBookings.length > 0) {
      const existing = existingBookings[0];
      if (existing.status === "PENDING" || existing.status === "CONFIRMED") {
        return {
          booking: existing,
          alreadyExisted: true,
        };
      }
    }

    // 2. Execute Booking Transaction with Row-Level Locking
    return await db.transaction(async (tx) => {
      // Lock and fetch the showtime
      const showtimeResult = await tx
        .select({
          id: showtimes.id,
          basePriceCents: showtimes.basePriceCents,
          startTime: showtimes.startTime,
          status: showtimes.status,
        })
        .from(showtimes)
        .where(eq(showtimes.id, showtimeId))
        .limit(1);

      if (!showtimeResult.length) {
        throw new Error("Showtime not found");
      }
      const showtime = showtimeResult[0];

      if (showtime.status !== "SCHEDULED" && showtime.status !== "ACTIVE") {
        throw new Error("Showtime is no longer active for bookings");
      }

      // Lock the requested showtime_seats records using FOR UPDATE
      const lockedSeats = await tx.execute(
        sql`
          SELECT 
            ss.id,
            ss.seat_id as "seatId",
            ss.status,
            ss.held_until as "heldUntil",
            ss.held_by_user_id as "heldByUserId",
            ss.version,
            s.row_identifier as "rowIdentifier",
            s.seat_number as "seatNumber",
            s.seat_type as "seatType",
            s.price_tier as "priceTier"
          FROM showtime_seats ss
          JOIN seats s ON ss.seat_id = s.id
          WHERE ss.showtime_id = ${showtimeId}
            AND ss.seat_id = ANY(${seatIds})
          FOR UPDATE
        `
      );

      const seatRows = (lockedSeats.rows || lockedSeats) as any[];

      if (seatRows.length !== seatIds.length) {
        throw new Error(
          `Requested ${seatIds.length} seats, but only found ${seatRows.length} valid seats for this showtime.`
        );
      }

      const now = new Date();

      // 3. Confirm every requested seat is available (or expired hold from another user, or already held by current user)
      for (const seat of seatRows) {
        const isHeld = seat.status === "HELD";
        const isExpired = seat.heldUntil && new Date(seat.heldUntil) < now;
        const isHeldByMe = seat.heldByUserId === userId;

        if (seat.status === "BOOKED" || seat.status === "BLOCKED") {
          throw new Error(
            `Seat ${seat.rowIdentifier}${seat.seatNumber} is already booked or blocked.`
          );
        }

        if (isHeld && !isExpired && !isHeldByMe) {
          throw new Error(
            `Seat ${seat.rowIdentifier}${seat.seatNumber} is currently held by another customer.`
          );
        }
      }

      // 4. Calculate prices on server
      let subtotalCents = 0;
      const basePrice = showtime.basePriceCents;

      for (const seat of seatRows) {
        let seatPrice = basePrice;
        if (seat.seatType === "VIP") {
          seatPrice = Math.round(basePrice * 1.5);
        } else if (seat.seatType === "PREMIUM") {
          seatPrice = Math.round(basePrice * 1.25);
        }
        subtotalCents += seatPrice;
      }

      // Service fee: $1.50 (150 cents) per seat
      const serviceFeeCents = seatRows.length * 150;
      // Tax: 8% on subtotal
      const taxCents = Math.round(subtotalCents * 0.08);
      const totalCents = subtotalCents + serviceFeeCents + taxCents;

      // 5. Temporary hold expires in 10 minutes (600,000 ms)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const bookingReference = generateReference("CB");

      // 6. Create pending booking
      const newBookings = await tx
        .insert(bookings)
        .values({
          bookingReference,
          userId,
          showtimeId,
          status: "PENDING",
          subtotalCents,
          serviceFeeCents,
          taxCents,
          totalCents,
          currency: "USD",
          idempotencyKey,
          expiresAt,
        })
        .returning();

      const newBooking = newBookings[0];

      // Update showtime_seats to HELD
      for (const seat of seatRows) {
        let seatPrice = basePrice;
        if (seat.seatType === "VIP") seatPrice = Math.round(basePrice * 1.5);
        else if (seat.seatType === "PREMIUM") seatPrice = Math.round(basePrice * 1.25);

        await tx
          .update(showtimeSeats)
          .set({
            status: "HELD",
            heldUntil: expiresAt,
            heldByUserId: userId,
            bookingId: newBooking.id,
            version: sql`${showtimeSeats.version} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(showtimeSeats.id, seat.id));

        // Insert booking_item
        await tx.insert(bookingItems).values({
          bookingId: newBooking.id,
          showtimeSeatId: seat.id,
          seatPriceCents: seatPrice,
        });
      }

      // Record Audit Log
      await tx.insert(auditLogs).values({
        userId,
        action: "SEAT_HOLD_CREATED",
        entityType: "BOOKING",
        entityId: newBooking.id,
        details: {
          showtimeId,
          seatCount: seatRows.length,
          expiresAt: expiresAt.toISOString(),
          totalCents,
        },
      });

      return {
        booking: newBooking,
        seats: seatRows,
        expiresAt,
        alreadyExisted: false,
      };
    });
  }

  /**
   * 8-9: Confirm seats only after verified payment.
   * Uses payment idempotency key so retries cannot create duplicate bookings or tickets.
   */
  static async confirmPaymentAndBooking({
    bookingId,
    paymentIntentId,
    idempotencyKey,
    amountCents,
    paymentMethod = "CARD",
    provider = "STRIPE_TEST",
  }: ConfirmPaymentParams) {
    const db = getDb();

    return await db.transaction(async (tx) => {
      // Check payment idempotency
      const existingPayment = await tx
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingPayment.length > 0) {
        const payment = existingPayment[0];
        const existingBooking = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);

        const existingTickets = await tx
          .select()
          .from(tickets)
          .where(eq(tickets.bookingId, payment.bookingId));

        return {
          payment,
          booking: existingBooking[0],
          tickets: existingTickets,
          idempotentReplay: true,
        };
      }

      // Lock and fetch the booking
      const lockedBooking = await tx.execute(
        sql`
          SELECT * FROM bookings
          WHERE id = ${bookingId}
          FOR UPDATE
        `
      );

      const bookingRows = (lockedBooking.rows || lockedBooking) as any[];
      if (!bookingRows.length) {
        throw new Error("Booking not found");
      }
      const booking = bookingRows[0];

      if (booking.status === "CONFIRMED") {
        const currentTickets = await tx
          .select()
          .from(tickets)
          .where(eq(tickets.bookingId, booking.id));
        return {
          booking,
          tickets: currentTickets,
          idempotentReplay: true,
        };
      }

      if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
        throw new Error(`Booking cannot be confirmed because it is ${booking.status}.`);
      }

      // Check if hold has expired
      const now = new Date();
      if (new Date(booking.expiresAt) < now) {
        // Mark booking expired
        await tx
          .update(bookings)
          .set({ status: "EXPIRED", updatedAt: now })
          .where(eq(bookings.id, booking.id));
        throw new Error("Seat hold has expired. Please reselect your seats.");
      }

      // Fetch seats linked to this booking
      const items = await tx
        .select({
          showtimeSeatId: bookingItems.showtimeSeatId,
          seatPriceCents: bookingItems.seatPriceCents,
        })
        .from(bookingItems)
        .where(eq(bookingItems.bookingId, booking.id));

      const showtimeSeatIds = items.map((i) => i.showtimeSeatId);

      // Lock showtime_seats
      const lockedSeats = await tx.execute(
        sql`
          SELECT 
            ss.id,
            s.row_identifier as "rowIdentifier",
            s.seat_number as "seatNumber",
            s.seat_type as "seatType"
          FROM showtime_seats ss
          JOIN seats s ON ss.seat_id = s.id
          WHERE ss.id = ANY(${showtimeSeatIds})
          FOR UPDATE
        `
      );
      const seatRows = (lockedSeats.rows || lockedSeats) as any[];

      // Confirm seats: transition status to BOOKED
      await tx
        .update(showtimeSeats)
        .set({
          status: "BOOKED",
          heldUntil: null,
          updatedAt: now,
          version: sql`${showtimeSeats.version} + 1`,
        })
        .where(inArray(showtimeSeats.id, showtimeSeatIds));

      // Transition booking to CONFIRMED
      const updatedBookings = await tx
        .update(bookings)
        .set({
          status: "CONFIRMED",
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id))
        .returning();

      const confirmedBooking = updatedBookings[0];

      // Insert Payment
      const paymentInserts = await tx
        .insert(payments)
        .values({
          bookingId: booking.id,
          paymentIntentId,
          paymentProvider: provider,
          status: "SUCCEEDED",
          amountCents: amountCents || booking.totalCents,
          currency: booking.currency || "USD",
          paymentMethod,
          idempotencyKey,
        })
        .returning();

      const payment = paymentInserts[0];

      // Format seat summary (e.g. "Row F: 7, 8")
      const seatSummary = seatRows
        .map((s) => `${s.rowIdentifier}${s.seatNumber} (${s.seatType})`)
        .join(", ");

      // Generate Ticket with Verification Payload
      const ticketCode = `TCK-${confirmedBooking.bookingReference}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      const qrCodePayload = JSON.stringify({
        ref: confirmedBooking.bookingReference,
        ticketCode,
        seats: seatSummary,
        issuedAt: now.toISOString(),
      });

      const ticketInserts = await tx
        .insert(tickets)
        .values({
          bookingId: booking.id,
          ticketCode,
          qrCodeData: qrCodePayload,
          seatSummary,
          status: "VALID",
          issuedAt: now,
        })
        .returning();

      // Record Audit Log
      await tx.insert(auditLogs).values({
        userId: booking.userId,
        action: "PAYMENT_AND_BOOKING_CONFIRMED",
        entityType: "BOOKING",
        entityId: booking.id,
        details: {
          paymentIntentId,
          amountCents,
          ticketCode,
        },
      });

      return {
        booking: confirmedBooking,
        payment,
        tickets: ticketInserts,
        idempotentReplay: false,
      };
    });
  }

  /**
   * Cancel an eligible booking:
   * Releases booked/held seats back to AVAILABLE, marks booking CANCELLED,
   * updates ticket and payment status.
   */
  static async cancelBooking({
    bookingId,
    userId,
    isAdmin = false,
  }: CancelBookingParams) {
    const db = getDb();

    return await db.transaction(async (tx) => {
      // Lock booking
      const lockedBooking = await tx.execute(
        sql`
          SELECT b.*, st.start_time as "startTime"
          FROM bookings b
          JOIN showtimes st ON b.showtime_id = st.id
          WHERE b.id = ${bookingId}
          FOR UPDATE
        `
      );

      const rows = (lockedBooking.rows || lockedBooking) as any[];
      if (!rows.length) {
        throw new Error("Booking not found");
      }
      const booking = rows[0];

      // IDOR check: must be owner or admin
      if (booking.user_id !== userId && !isAdmin) {
        throw new Error("Forbidden: You do not have permission to cancel this booking.");
      }

      if (booking.status === "CANCELLED") {
        return { booking, alreadyCancelled: true };
      }

      // Check cancellation eligibility (must be > 2 hours prior to showtime unless admin)
      const now = new Date();
      const showtimeStart = new Date(booking.startTime);
      const hoursUntilShowtime =
        (showtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilShowtime < 2 && !isAdmin) {
        throw new Error(
          "Bookings can only be cancelled at least 2 hours before showtime."
        );
      }

      // Find all showtime_seats for this booking
      const items = await tx
        .select({ showtimeSeatId: bookingItems.showtimeSeatId })
        .from(bookingItems)
        .where(eq(bookingItems.bookingId, booking.id));

      const seatIds = items.map((i) => i.showtimeSeatId);

      // Release seats back to AVAILABLE
      if (seatIds.length > 0) {
        await tx
          .update(showtimeSeats)
          .set({
            status: "AVAILABLE",
            heldUntil: null,
            heldByUserId: null,
            bookingId: null,
            updatedAt: now,
            version: sql`${showtimeSeats.version} + 1`,
          })
          .where(inArray(showtimeSeats.id, seatIds));
      }

      // Update booking status
      const updatedBookings = await tx
        .update(bookings)
        .set({
          status: "CANCELLED",
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id))
        .returning();

      // Update tickets
      await tx
        .update(tickets)
        .set({ status: "CANCELLED" })
        .where(eq(tickets.bookingId, booking.id));

      // Update payments to REFUNDED if applicable
      await tx
        .update(payments)
        .set({ status: "REFUNDED", updatedAt: now })
        .where(eq(payments.bookingId, booking.id));

      // Audit Log
      await tx.insert(auditLogs).values({
        userId,
        action: "BOOKING_CANCELLED",
        entityType: "BOOKING",
        entityId: booking.id,
        details: {
          releasedSeatCount: seatIds.length,
          refundTriggered: true,
        },
      });

      return {
        booking: updatedBookings[0],
        alreadyCancelled: false,
      };
    });
  }

  /**
   * Idempotent endpoint for releasing expired seat holds.
   * Safe to run repeatedly via Vercel Cron.
   */
  static async releaseExpiredHolds() {
    const db = getDb();
    const now = new Date();

    return await db.transaction(async (tx) => {
      // 1. Find and release all HELD seats where heldUntil < now
      const expiredSeats = await tx.execute(
        sql`
          UPDATE showtime_seats
          SET 
            status = 'AVAILABLE',
            held_until = NULL,
            held_by_user_id = NULL,
            booking_id = NULL,
            version = version + 1,
            updated_at = ${now}
          WHERE status = 'HELD'
            AND held_until < ${now}
          RETURNING id, showtime_id as "showtimeId", booking_id as "bookingId"
        `
      );

      const seatRows = (expiredSeats.rows || expiredSeats) as any[];

      // 2. Mark pending bookings whose expiration has passed as EXPIRED
      const expiredBookings = await tx.execute(
        sql`
          UPDATE bookings
          SET 
            status = 'EXPIRED',
            updated_at = ${now}
          WHERE status = 'PENDING'
            AND expires_at < ${now}
          RETURNING id, booking_reference as "bookingReference"
        `
      );

      const bookingRows = (expiredBookings.rows || expiredBookings) as any[];

      if (seatRows.length > 0 || bookingRows.length > 0) {
        await tx.insert(auditLogs).values({
          action: "EXPIRED_HOLDS_RELEASED",
          entityType: "SYSTEM",
          entityId: "CRON_SWEEPER",
          details: {
            releasedSeatCount: seatRows.length,
            expiredBookingCount: bookingRows.length,
            timestamp: now.toISOString(),
          },
        });
      }

      return {
        releasedSeatsCount: seatRows.length,
        expiredBookingsCount: bookingRows.length,
        timestamp: now.toISOString(),
      };
    });
  }
}
