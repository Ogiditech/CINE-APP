CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."movie_status" AS ENUM('NOW_SHOWING', 'COMING_SOON', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."screen_type" AS ENUM('STANDARD', 'IMAX', 'DOLBY_CINEMA', 'VIP_LOUNGE');--> statement-breakpoint
CREATE TYPE "public"."seat_status" AS ENUM('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."seat_type" AS ENUM('STANDARD', 'PREMIUM', 'VIP', 'ACCESSIBLE');--> statement-breakpoint
CREATE TYPE "public"."showtime_status" AS ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('VALID', 'USED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditoriums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cinema_id" uuid NOT NULL,
	"name" text NOT NULL,
	"screen_type" "screen_type" DEFAULT 'STANDARD' NOT NULL,
	"total_seats" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"showtime_seat_id" uuid NOT NULL,
	"seat_price_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_items_showtime_seat_id_unique" UNIQUE("showtime_seat_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_reference" text NOT NULL,
	"user_id" uuid NOT NULL,
	"showtime_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"service_fee_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"idempotency_key" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_reference_unique" UNIQUE("booking_reference"),
	CONSTRAINT "bookings_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "cinemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"phone" text,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cinemas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"movie_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "movie_genres_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"synopsis" text NOT NULL,
	"poster_url" text NOT NULL,
	"backdrop_url" text,
	"trailer_url" text,
	"duration_minutes" integer NOT NULL,
	"release_date" timestamp with time zone NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"rating" text DEFAULT 'PG-13' NOT NULL,
	"status" "movie_status" DEFAULT 'NOW_SHOWING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"payment_intent_id" text NOT NULL,
	"payment_provider" text DEFAULT 'STRIPE_TEST' NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_method" text DEFAULT 'CARD' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_payment_intent_id_unique" UNIQUE("payment_intent_id"),
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auditorium_id" uuid NOT NULL,
	"row_identifier" text NOT NULL,
	"seat_number" integer NOT NULL,
	"seat_type" "seat_type" DEFAULT 'STANDARD' NOT NULL,
	"price_tier" text DEFAULT 'STANDARD' NOT NULL,
	"pos_x" integer DEFAULT 0 NOT NULL,
	"pos_y" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showtime_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"showtime_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"status" "seat_status" DEFAULT 'AVAILABLE' NOT NULL,
	"held_until" timestamp with time zone,
	"held_by_user_id" uuid,
	"booking_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showtimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"auditorium_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"base_price_cents" integer NOT NULL,
	"status" "showtime_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"ticket_code" text NOT NULL,
	"qr_code_data" text NOT NULL,
	"seat_summary" text NOT NULL,
	"status" "ticket_status" DEFAULT 'VALID' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoriums" ADD CONSTRAINT "auditoriums_cinema_id_cinemas_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_showtime_seat_id_showtime_seats_id_fk" FOREIGN KEY ("showtime_seat_id") REFERENCES "public"."showtime_seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showtime_id_showtimes_id_fk" FOREIGN KEY ("showtime_id") REFERENCES "public"."showtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_auditorium_id_auditoriums_id_fk" FOREIGN KEY ("auditorium_id") REFERENCES "public"."auditoriums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_showtime_id_showtimes_id_fk" FOREIGN KEY ("showtime_id") REFERENCES "public"."showtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_held_by_user_id_users_id_fk" FOREIGN KEY ("held_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_auditorium_id_auditoriums_id_fk" FOREIGN KEY ("auditorium_id") REFERENCES "public"."auditoriums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auditorium_cinema_name_unique" ON "auditoriums" USING btree ("cinema_id","name");--> statement-breakpoint
CREATE INDEX "auditoriums_cinema_idx" ON "auditoriums" USING btree ("cinema_id");--> statement-breakpoint
CREATE INDEX "booking_items_booking_idx" ON "booking_items" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_showtime_idx" ON "bookings" USING btree ("showtime_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_reference_idx" ON "bookings" USING btree ("booking_reference");--> statement-breakpoint
CREATE INDEX "bookings_idempotency_idx" ON "bookings" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "cinemas_city_idx" ON "cinemas" USING btree ("city");--> statement-breakpoint
CREATE INDEX "cinemas_slug_idx" ON "cinemas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "movie_genres_movie_idx" ON "movie_genres" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "movie_genres_genre_idx" ON "movie_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "movies_status_idx" ON "movies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "movies_slug_idx" ON "movies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_intent_idx" ON "payments" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seat_auditorium_position_unique" ON "seats" USING btree ("auditorium_id","row_identifier","seat_number");--> statement-breakpoint
CREATE INDEX "seats_auditorium_idx" ON "seats" USING btree ("auditorium_id");--> statement-breakpoint
CREATE UNIQUE INDEX "showtime_seat_unique_idx" ON "showtime_seats" USING btree ("showtime_id","seat_id");--> statement-breakpoint
CREATE INDEX "showtime_seats_showtime_status_idx" ON "showtime_seats" USING btree ("showtime_id","status");--> statement-breakpoint
CREATE INDEX "showtime_seats_held_until_idx" ON "showtime_seats" USING btree ("held_until");--> statement-breakpoint
CREATE INDEX "showtimes_movie_idx" ON "showtimes" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "showtimes_auditorium_idx" ON "showtimes" USING btree ("auditorium_id");--> statement-breakpoint
CREATE INDEX "showtimes_start_time_idx" ON "showtimes" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "tickets_booking_idx" ON "tickets" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "tickets_code_idx" ON "tickets" USING btree ("ticket_code");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");