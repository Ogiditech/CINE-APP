import { getDb } from "@/db";
import {
  movies,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
  users,
  bookings,
  bookingItems,
  tickets,
  payments,
  auditLogs,
} from "@/db/schema";
import {
  memoryStore,
  MockBooking,
  MockPayment,
  MockTicket,
} from "./mock-store";
import { eq, desc, and, sql } from "drizzle-orm";
import { BookingService } from "./booking-service";

export class CinemaDB {
  private static useMockFallback = false;

  private static async tryDb<T = any>(
    dbFn: () => Promise<any>,
    fallbackFn: () => any
  ): Promise<T> {
    if (this.useMockFallback) {
      return (await fallbackFn()) as T;
    }
    try {
      return (await dbFn()) as T;
    } catch (err: any) {
      console.warn(
        "⚡ DB query failed, falling back to local store:",
        err.message || err
      );
      this.useMockFallback = true;
      return (await fallbackFn()) as T;
    }
  }

  // --- MOVIES ---
  static async getMovies(filters?: {
    query?: string;
    genre?: string;
    language?: string;
    cinemaId?: string;
  }) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const results = await db.select().from(movies);
        let list = results;

        if (filters?.query) {
          const q = filters.query.toLowerCase();
          list = list.filter((m) => m.title.toLowerCase().includes(q));
        }
        if (filters?.language) {
          list = list.filter(
            (m) => m.language.toLowerCase() === filters.language?.toLowerCase()
          );
        }
        return list;
      },
      () => {
        let list = memoryStore.movies;
        if (filters?.query) {
          const q = filters.query.toLowerCase();
          list = list.filter((m) => m.title.toLowerCase().includes(q));
        }
        if (filters?.genre) {
          const g = filters.genre.toLowerCase();
          list = list.filter((m) =>
            m.genres.some((genre) => genre.toLowerCase() === g)
          );
        }
        if (filters?.language) {
          list = list.filter(
            (m) => m.language.toLowerCase() === filters.language?.toLowerCase()
          );
        }
        return list;
      }
    );
  }

  static async getMovieBySlug(slug: string) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const rows = await db
          .select()
          .from(movies)
          .where(eq(movies.slug, slug))
          .limit(1);
        return rows[0] || null;
      },
      () => {
        return memoryStore.movies.find((m) => m.slug === slug) || null;
      }
    );
  }

  // --- CINEMAS ---
  static async getCinemas() {
    return this.tryDb(
      async () => {
        const db = getDb();
        return await db.select().from(cinemas);
      },
      () => memoryStore.cinemas
    );
  }

  static async getCinemaBySlug(slug: string) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const rows = await db
          .select()
          .from(cinemas)
          .where(eq(cinemas.slug, slug))
          .limit(1);
        return rows[0] || null;
      },
      () => memoryStore.cinemas.find((c) => c.slug === slug) || null
    );
  }

  // --- SHOWTIMES ---
  static async getShowtimesForMovie(movieId: string) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const rows = await db
          .select({
            showtime: showtimes,
            auditorium: auditoriums,
            cinema: cinemas,
          })
          .from(showtimes)
          .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
          .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
          .where(eq(showtimes.movieId, movieId));

        return rows.map((r) => ({
          ...r.showtime,
          auditoriumName: r.auditorium.name,
          screenType: r.auditorium.screenType,
          cinemaName: r.cinema.name,
          cinemaSlug: r.cinema.slug,
        }));
      },
      () => {
        const matching = memoryStore.showtimes.filter(
          (st) => st.movieId === movieId
        );
        return matching.map((st) => {
          const aud = memoryStore.auditoriums.find(
            (a) => a.id === st.auditoriumId
          );
          const cin = memoryStore.cinemas.find((c) => c.id === aud?.cinemaId);
          return {
            ...st,
            auditoriumName: aud?.name || "Screen 1",
            screenType: aud?.screenType || "STANDARD",
            cinemaName: cin?.name || "CineBook Cinema",
            cinemaSlug: cin?.slug || "cinebook-cinema",
          };
        });
      }
    );
  }

  static async getShowtimeDetails(showtimeId: string) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const rows = await db
          .select({
            showtime: showtimes,
            movie: movies,
            auditorium: auditoriums,
            cinema: cinemas,
          })
          .from(showtimes)
          .innerJoin(movies, eq(showtimes.movieId, movies.id))
          .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
          .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
          .where(eq(showtimes.id, showtimeId))
          .limit(1);

        if (!rows.length) return null;
        const info = rows[0];

        // Fetch seats & showtime_seats
        const seatRecords = await db
          .select({
            showtimeSeat: showtimeSeats,
            seat: seats,
          })
          .from(showtimeSeats)
          .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
          .where(eq(showtimeSeats.showtimeId, showtimeId));

        return {
          ...info.showtime,
          movie: info.movie,
          auditorium: info.auditorium,
          cinema: info.cinema,
          seats: seatRecords.map((sr) => ({
            id: sr.showtimeSeat.id,
            seatId: sr.seat.id,
            row: sr.seat.rowIdentifier,
            number: sr.seat.seatNumber,
            type: sr.seat.seatType,
            status: sr.showtimeSeat.status,
            heldUntil: sr.showtimeSeat.heldUntil,
            heldByUserId: sr.showtimeSeat.heldByUserId,
            posX: sr.seat.posX,
            posY: sr.seat.posY,
          })),
        };
      },
      () => {
        const st = memoryStore.showtimes.find((s) => s.id === showtimeId);
        if (!st) return null;

        const movie = memoryStore.movies.find((m) => m.id === st.movieId);
        const auditorium = memoryStore.auditoriums.find(
          (a) => a.id === st.auditoriumId
        );
        const cinema = memoryStore.cinemas.find(
          (c) => c.id === auditorium?.cinemaId
        );

        const stSeats = memoryStore.showtimeSeats.filter(
          (ss) => ss.showtimeId === showtimeId
        );
        const mappedSeats = stSeats.map((ss) => {
          const seat = memoryStore.seats.find((s) => s.id === ss.seatId);
          return {
            id: ss.id,
            seatId: ss.seatId,
            row: seat?.rowIdentifier || "A",
            number: seat?.seatNumber || 1,
            type: seat?.seatType || "STANDARD",
            status: ss.status,
            heldUntil: ss.heldUntil,
            heldByUserId: ss.heldByUserId,
            posX: seat?.posX || 1,
            posY: seat?.posY || 1,
          };
        });

        return {
          ...st,
          movie,
          auditorium,
          cinema,
          seats: mappedSeats,
        };
      }
    );
  }

  // --- BOOKING OPERATIONS WITH ROW LOCKING & HOLDS ---
  static async createHold(params: {
    showtimeId: string;
    seatIds: string[];
    userId: string;
    idempotencyKey: string;
  }) {
    return this.tryDb(
      async () => {
        return await BookingService.createSeatHold(params);
      },
      () => {
        // Memory fallback implementation
        const { showtimeId, seatIds, userId, idempotencyKey } = params;
        const existing = memoryStore.bookings.find(
          (b) => b.idempotencyKey === idempotencyKey
        );
        if (existing) {
          return { booking: existing, alreadyExisted: true };
        }

        const st = memoryStore.showtimes.find((s) => s.id === showtimeId);
        if (!st) throw new Error("Showtime not found");

        const targetShowtimeSeats = memoryStore.showtimeSeats.filter(
          (ss) => ss.showtimeId === showtimeId && seatIds.includes(ss.seatId)
        );

        const now = new Date();
        for (const ss of targetShowtimeSeats) {
          const isHeld = ss.status === "HELD";
          const isExpired = ss.heldUntil && new Date(ss.heldUntil) < now;
          if (ss.status === "BOOKED" || ss.status === "BLOCKED") {
            throw new Error("One or more selected seats are already booked.");
          }
          if (isHeld && !isExpired && ss.heldByUserId !== userId) {
            throw new Error("One or more selected seats are held by another customer.");
          }
        }

        const subtotalCents = seatIds.length * st.basePriceCents;
        const serviceFeeCents = seatIds.length * 150;
        const taxCents = Math.round(subtotalCents * 0.08);
        const totalCents = subtotalCents + serviceFeeCents + taxCents;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const bookingId = `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const bookingReference = `CB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newBooking: MockBooking = {
          id: bookingId,
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
          createdAt: now.toISOString(),
          items: targetShowtimeSeats.map((ss) => ({
            showtimeSeatId: ss.id,
            seatPriceCents: st.basePriceCents,
          })),
        };

        memoryStore.bookings.push(newBooking);

        // Update showtime seats to HELD
        for (const ss of targetShowtimeSeats) {
          ss.status = "HELD";
          ss.heldUntil = expiresAt;
          ss.heldByUserId = userId;
          ss.bookingId = bookingId;
          ss.version += 1;
        }

        return {
          booking: newBooking,
          expiresAt: new Date(expiresAt),
          alreadyExisted: false,
        };
      }
    );
  }

  static async confirmPayment(params: {
    bookingId: string;
    paymentIntentId: string;
    idempotencyKey: string;
    amountCents: number;
    paymentMethod?: string;
  }) {
    return this.tryDb(
      async () => {
        return await BookingService.confirmPaymentAndBooking(params);
      },
      () => {
        const {
          bookingId,
          paymentIntentId,
          idempotencyKey,
          amountCents,
          paymentMethod = "CARD",
        } = params;

        const booking = memoryStore.bookings.find((b) => b.id === bookingId);
        if (!booking) throw new Error("Booking not found");

        if (booking.status === "CONFIRMED") {
          const tickets = memoryStore.tickets.filter(
            (t) => t.bookingId === bookingId
          );
          return { booking, tickets, idempotentReplay: true };
        }

        const now = new Date();
        if (new Date(booking.expiresAt) < now) {
          booking.status = "EXPIRED";
          throw new Error("Seat hold has expired.");
        }

        // Confirm seats
        const items = booking.items;
        const seatIds = items.map((i) => i.showtimeSeatId);
        const bookedSeatLabels: string[] = [];

        for (const ssId of seatIds) {
          const ss = memoryStore.showtimeSeats.find((s) => s.id === ssId);
          if (ss) {
            ss.status = "BOOKED";
            ss.heldUntil = null;
            ss.version += 1;
            const seat = memoryStore.seats.find((s) => s.id === ss.seatId);
            if (seat) {
              bookedSeatLabels.push(`${seat.rowIdentifier}${seat.seatNumber}`);
            }
          }
        }

        booking.status = "CONFIRMED";

        const payment: MockPayment = {
          id: `p-${Date.now()}`,
          bookingId,
          paymentIntentId,
          paymentProvider: "STRIPE_TEST",
          status: "SUCCEEDED",
          amountCents: amountCents || booking.totalCents,
          currency: "USD",
          paymentMethod,
          idempotencyKey,
          createdAt: now.toISOString(),
        };
        memoryStore.payments.push(payment);

        const ticketCode = `TCK-${booking.bookingReference}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const ticket: MockTicket = {
          id: `tck-${Date.now()}`,
          bookingId,
          ticketCode,
          qrCodeData: JSON.stringify({
            ref: booking.bookingReference,
            ticketCode,
            seats: bookedSeatLabels.join(", "),
            issuedAt: now.toISOString(),
          }),
          seatSummary: bookedSeatLabels.join(", "),
          status: "VALID",
          issuedAt: now.toISOString(),
        };
        memoryStore.tickets.push(ticket);

        return {
          booking,
          payment,
          tickets: [ticket],
          idempotentReplay: false,
        };
      }
    );
  }

  static async cancelBooking(params: {
    bookingId: string;
    userId: string;
    isAdmin?: boolean;
  }) {
    return this.tryDb(
      async () => {
        return await BookingService.cancelBooking(params);
      },
      () => {
        const { bookingId, userId, isAdmin = false } = params;
        const booking = memoryStore.bookings.find((b) => b.id === bookingId);
        if (!booking) throw new Error("Booking not found");

        if (booking.userId !== userId && !isAdmin) {
          throw new Error("Forbidden: You cannot cancel another user's booking.");
        }

        if (booking.status === "CANCELLED") {
          return { booking, alreadyCancelled: true };
        }

        const showtime = memoryStore.showtimes.find(
          (s) => s.id === booking.showtimeId
        );
        if (showtime && !isAdmin) {
          const hours =
            (new Date(showtime.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
          if (hours < 2) {
            throw new Error("Bookings can only be cancelled at least 2 hours before showtime.");
          }
        }

        booking.status = "CANCELLED";

        // Release seats
        for (const item of booking.items) {
          const ss = memoryStore.showtimeSeats.find(
            (s) => s.id === item.showtimeSeatId
          );
          if (ss) {
            ss.status = "AVAILABLE";
            ss.heldUntil = null;
            ss.heldByUserId = null;
            ss.bookingId = null;
            ss.version += 1;
          }
        }

        // Cancel tickets
        for (const t of memoryStore.tickets.filter((t) => t.bookingId === bookingId)) {
          t.status = "CANCELLED";
        }

        // Refund payment
        for (const p of memoryStore.payments.filter((p) => p.bookingId === bookingId)) {
          p.status = "REFUNDED";
        }

        return { booking, alreadyCancelled: false };
      }
    );
  }

  static async getBookingByReference(reference: string) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const rows = await db
          .select({
            booking: bookings,
            showtime: showtimes,
            movie: movies,
            auditorium: auditoriums,
            cinema: cinemas,
          })
          .from(bookings)
          .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
          .innerJoin(movies, eq(showtimes.movieId, movies.id))
          .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
          .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
          .where(eq(bookings.bookingReference, reference))
          .limit(1);

        if (!rows.length) return null;
        const b = rows[0];

        const ticketList = await db
          .select()
          .from(tickets)
          .where(eq(tickets.bookingId, b.booking.id));

        return {
          ...b.booking,
          showtime: b.showtime,
          movie: b.movie,
          auditorium: b.auditorium,
          cinema: b.cinema,
          tickets: ticketList,
        };
      },
      () => {
        const booking = memoryStore.bookings.find(
          (b) => b.bookingReference === reference
        );
        if (!booking) return null;

        const showtime = memoryStore.showtimes.find(
          (s) => s.id === booking.showtimeId
        );
        const movie = memoryStore.movies.find((m) => m.id === showtime?.movieId);
        const auditorium = memoryStore.auditoriums.find(
          (a) => a.id === showtime?.auditoriumId
        );
        const cinema = memoryStore.cinemas.find(
          (c) => c.id === auditorium?.cinemaId
        );
        const tickets = memoryStore.tickets.filter(
          (t) => t.bookingId === booking.id
        );

        return {
          ...booking,
          showtime,
          movie,
          auditorium,
          cinema,
          tickets,
        };
      }
    );
  }

  static async getUserBookings(userId: string) {
    return this.tryDb(
      async () => {
        const db = getDb();
        const userBookings = await db
          .select({
            booking: bookings,
            showtime: showtimes,
            movie: movies,
            cinema: cinemas,
            auditorium: auditoriums,
          })
          .from(bookings)
          .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
          .innerJoin(movies, eq(showtimes.movieId, movies.id))
          .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
          .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
          .where(eq(bookings.userId, userId))
          .orderBy(desc(bookings.createdAt));

        const results = [];
        for (const item of userBookings) {
          const tcks = await db
            .select()
            .from(tickets)
            .where(eq(tickets.bookingId, item.booking.id));

          results.push({
            ...item.booking,
            showtime: item.showtime,
            movie: item.movie,
            cinema: item.cinema,
            auditorium: item.auditorium,
            tickets: tcks,
          });
        }
        return results;
      },
      () => {
        const userBookings = memoryStore.bookings
          .filter((b) => b.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        return userBookings.map((b) => {
          const showtime = memoryStore.showtimes.find(
            (s) => s.id === b.showtimeId
          );
          const movie = memoryStore.movies.find(
            (m) => m.id === showtime?.movieId
          );
          const auditorium = memoryStore.auditoriums.find(
            (a) => a.id === showtime?.auditoriumId
          );
          const cinema = memoryStore.cinemas.find(
            (c) => c.id === auditorium?.cinemaId
          );
          const tcks = memoryStore.tickets.filter((t) => t.bookingId === b.id);

          return {
            ...b,
            showtime,
            movie,
            cinema,
            auditorium,
            tickets: tcks,
          };
        });
      }
    );
  }

  // --- ADMIN METRICS ---
  static async getAdminMetrics() {
    return this.tryDb(
      async () => {
        const db = getDb();
        const allBookings = await db.select().from(bookings);
        const allUsers = await db.select().from(users);
        const allShowtimes = await db.select().from(showtimes);

        const totalRevenue = allBookings
          .filter((b) => b.status === "CONFIRMED")
          .reduce((sum, b) => sum + b.totalCents, 0);

        return {
          totalRevenueCents: totalRevenue,
          totalBookingsCount: allBookings.length,
          confirmedBookingsCount: allBookings.filter(
            (b) => b.status === "CONFIRMED"
          ).length,
          totalUsersCount: allUsers.length,
          activeShowtimesCount: allShowtimes.filter(
            (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
          ).length,
        };
      },
      () => {
        const totalRevenue = memoryStore.bookings
          .filter((b) => b.status === "CONFIRMED")
          .reduce((sum, b) => sum + b.totalCents, 0);

        return {
          totalRevenueCents: totalRevenue,
          totalBookingsCount: memoryStore.bookings.length,
          confirmedBookingsCount: memoryStore.bookings.filter(
            (b) => b.status === "CONFIRMED"
          ).length,
          totalUsersCount: memoryStore.users.length,
          activeShowtimesCount: memoryStore.showtimes.length,
        };
      }
    );
  }
}
