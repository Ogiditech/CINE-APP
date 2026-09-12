import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// ENUMS
// ==========================================
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const movieStatusEnum = pgEnum("movie_status", [
  "NOW_SHOWING",
  "COMING_SOON",
  "ARCHIVED",
]);
export const screenTypeEnum = pgEnum("screen_type", [
  "STANDARD",
  "IMAX",
  "DOLBY_CINEMA",
  "VIP_LOUNGE",
]);
export const seatTypeEnum = pgEnum("seat_type", [
  "STANDARD",
  "PREMIUM",
  "VIP",
  "ACCESSIBLE",
]);
export const seatStatusEnum = pgEnum("seat_status", [
  "AVAILABLE",
  "HELD",
  "BOOKED",
  "BLOCKED",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "VALID",
  "USED",
  "CANCELLED",
]);
export const showtimeStatusEnum = pgEnum("showtime_status", [
  "SCHEDULED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

// ==========================================
// 1. USERS TABLE
// ==========================================
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("USER").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

// ==========================================
// 2. MOVIES TABLE
// ==========================================
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    synopsis: text("synopsis").notNull(),
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url"),
    trailerUrl: text("trailer_url"),
    durationMinutes: integer("duration_minutes").notNull(),
    releaseDate: timestamp("release_date", { withTimezone: true }).notNull(),
    language: text("language").default("English").notNull(),
    rating: text("rating").default("PG-13").notNull(),
    status: movieStatusEnum("status").default("NOW_SHOWING").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("movies_status_idx").on(table.status),
    index("movies_slug_idx").on(table.slug),
  ]
);

// ==========================================
// 3. GENRES TABLE
// ==========================================
export const genres = pgTable("genres", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

// ==========================================
// 4. MOVIE_GENRES (JOIN TABLE)
// ==========================================
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .references(() => movies.id, { onDelete: "cascade" })
      .notNull(),
    genreId: uuid("genre_id")
      .references(() => genres.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
    index("movie_genres_movie_idx").on(table.movieId),
    index("movie_genres_genre_idx").on(table.genreId),
  ]
);

// ==========================================
// 5. CINEMAS TABLE
// ==========================================
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    phone: text("phone"),
    amenities: jsonb("amenities").default([]).notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cinemas_city_idx").on(table.city),
    index("cinemas_slug_idx").on(table.slug),
  ]
);

// ==========================================
// 6. AUDITORIUMS TABLE
// ==========================================
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cinemaId: uuid("cinema_id")
      .references(() => cinemas.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    screenType: screenTypeEnum("screen_type").default("STANDARD").notNull(),
    totalSeats: integer("total_seats").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auditorium_cinema_name_unique").on(
      table.cinemaId,
      table.name
    ),
    index("auditoriums_cinema_idx").on(table.cinemaId),
  ]
);

// ==========================================
// 7. SEATS TABLE
// ==========================================
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .references(() => auditoriums.id, { onDelete: "cascade" })
      .notNull(),
    rowIdentifier: text("row_identifier").notNull(),
    seatNumber: integer("seat_number").notNull(),
    seatType: seatTypeEnum("seat_type").default("STANDARD").notNull(),
    priceTier: text("price_tier").default("STANDARD").notNull(),
    posX: integer("pos_x").default(0).notNull(),
    posY: integer("pos_y").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("seat_auditorium_position_unique").on(
      table.auditoriumId,
      table.rowIdentifier,
      table.seatNumber
    ),
    index("seats_auditorium_idx").on(table.auditoriumId),
  ]
);

// ==========================================
// 8. SHOWTIMES TABLE
// ==========================================
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .references(() => movies.id, { onDelete: "cascade" })
      .notNull(),
    auditoriumId: uuid("auditorium_id")
      .references(() => auditoriums.id, { onDelete: "cascade" })
      .notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    basePriceCents: integer("base_price_cents").notNull(), // Minor units (e.g. 1500 = $15.00)
    status: showtimeStatusEnum("status").default("SCHEDULED").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("showtimes_movie_idx").on(table.movieId),
    index("showtimes_auditorium_idx").on(table.auditoriumId),
    index("showtimes_start_time_idx").on(table.startTime),
  ]
);

// ==========================================
// 9. SHOWTIME_SEATS TABLE
// ==========================================
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showtimeId: uuid("showtime_id")
      .references(() => showtimes.id, { onDelete: "cascade" })
      .notNull(),
    seatId: uuid("seat_id")
      .references(() => seats.id, { onDelete: "cascade" })
      .notNull(),
    status: seatStatusEnum("status").default("AVAILABLE").notNull(),
    heldUntil: timestamp("held_until", { withTimezone: true }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    bookingId: uuid("booking_id"), // linked to bookings table
    version: integer("version").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("showtime_seat_unique_idx").on(table.showtimeId, table.seatId),
    index("showtime_seats_showtime_status_idx").on(
      table.showtimeId,
      table.status
    ),
    index("showtime_seats_held_until_idx").on(table.heldUntil),
  ]
);

// ==========================================
// 10. BOOKINGS TABLE
// ==========================================
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingReference: text("booking_reference").notNull().unique(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    showtimeId: uuid("showtime_id")
      .references(() => showtimes.id, { onDelete: "cascade" })
      .notNull(),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    serviceFeeCents: integer("service_fee_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("bookings_user_idx").on(table.userId),
    index("bookings_showtime_idx").on(table.showtimeId),
    index("bookings_status_idx").on(table.status),
    index("bookings_reference_idx").on(table.bookingReference),
    index("bookings_idempotency_idx").on(table.idempotencyKey),
  ]
);

// ==========================================
// 11. BOOKING_ITEMS TABLE
// ==========================================
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    showtimeSeatId: uuid("showtime_seat_id")
      .references(() => showtimeSeats.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    seatPriceCents: integer("seat_price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("booking_items_booking_idx").on(table.bookingId)]
);

// ==========================================
// 12. PAYMENTS TABLE
// ==========================================
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    paymentIntentId: text("payment_intent_id").notNull().unique(),
    paymentProvider: text("payment_provider").default("STRIPE_TEST").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    paymentMethod: text("payment_method").default("CARD").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_booking_idx").on(table.bookingId),
    index("payments_status_idx").on(table.status),
    index("payments_intent_idx").on(table.paymentIntentId),
  ]
);

// ==========================================
// 13. TICKETS TABLE
// ==========================================
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    ticketCode: text("ticket_code").notNull().unique(),
    qrCodeData: text("qr_code_data").notNull(),
    seatSummary: text("seat_summary").notNull(),
    status: ticketStatusEnum("status").default("VALID").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tickets_booking_idx").on(table.bookingId),
    index("tickets_code_idx").on(table.ticketCode),
  ]
);

// ==========================================
// 14. AUDIT_LOGS TABLE
// ==========================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_idx").on(table.createdAt),
  ]
);

// ==========================================
// DRIZZLE RELATIONS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(
  showtimeSeats,
  ({ one, many }) => ({
    showtime: one(showtimes, {
      fields: [showtimeSeats.showtimeId],
      references: [showtimes.id],
    }),
    seat: one(seats, {
      fields: [showtimeSeats.seatId],
      references: [seats.id],
    }),
    heldByUser: one(users, {
      fields: [showtimeSeats.heldByUserId],
      references: [users.id],
    }),
    bookingItems: many(bookingItems),
  })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  bookingItems: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));
