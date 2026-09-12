// In-memory data store for ultra-reliable local testing, development & offline demonstrations
export interface MockUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  phone: string | null;
  createdAt: string;
}

export interface MockMovie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  durationMinutes: number;
  releaseDate: string;
  language: string;
  rating: string;
  status: "NOW_SHOWING" | "COMING_SOON" | "ARCHIVED";
  genres: string[];
}

export interface MockCinema {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  amenities: string[];
  imageUrl: string;
}

export interface MockAuditorium {
  id: string;
  cinemaId: string;
  name: string;
  screenType: "STANDARD" | "IMAX" | "DOLBY_CINEMA" | "VIP_LOUNGE";
  totalSeats: number;
}

export interface MockSeat {
  id: string;
  auditoriumId: string;
  rowIdentifier: string;
  seatNumber: number;
  seatType: "STANDARD" | "PREMIUM" | "VIP" | "ACCESSIBLE";
  priceTier: string;
  posX: number;
  posY: number;
}

export interface MockShowtime {
  id: string;
  movieId: string;
  auditoriumId: string;
  startTime: string;
  endTime: string;
  basePriceCents: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export interface MockShowtimeSeat {
  id: string;
  showtimeId: string;
  seatId: string;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  heldUntil: string | null;
  heldByUserId: string | null;
  bookingId: string | null;
  version: number;
}

export interface MockBooking {
  id: string;
  bookingReference: string;
  userId: string;
  showtimeId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
  items: Array<{
    showtimeSeatId: string;
    seatPriceCents: number;
  }>;
}

export interface MockPayment {
  id: string;
  bookingId: string;
  paymentIntentId: string;
  paymentProvider: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  amountCents: number;
  currency: string;
  paymentMethod: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface MockTicket {
  id: string;
  bookingId: string;
  ticketCode: string;
  qrCodeData: string;
  seatSummary: string;
  status: "VALID" | "USED" | "CANCELLED";
  issuedAt: string;
}

export interface MockAuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  createdAt: string;
}

class MemoryStore {
  users: MockUser[] = [];
  movies: MockMovie[] = [];
  cinemas: MockCinema[] = [];
  auditoriums: MockAuditorium[] = [];
  seats: MockSeat[] = [];
  showtimes: MockShowtime[] = [];
  showtimeSeats: MockShowtimeSeat[] = [];
  bookings: MockBooking[] = [];
  payments: MockPayment[] = [];
  tickets: MockTicket[] = [];
  auditLogs: MockAuditLog[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Users
    this.users = [
      {
        id: "u-admin-1",
        name: "Cinema Admin",
        email: "admin@cinebook.com",
        passwordHash:
          "$2a$10$w09b4rX9bY37L7wN8rF2QOz8n0Lz.k/qCjM8d.f1Hh7jHh.ZqjG6e", // AdminPass123!
        role: "ADMIN",
        phone: "+1 (555) 019-2834",
        createdAt: new Date().toISOString(),
      },
      {
        id: "u-viewer-1",
        name: "Alex Johnson",
        email: "viewer@cinebook.com",
        passwordHash:
          "$2a$10$w09b4rX9bY37L7wN8rF2QOz8n0Lz.k/qCjM8d.f1Hh7jHh.ZqjG6e", // ViewerPass123!
        role: "USER",
        phone: "+1 (555) 012-7890",
        createdAt: new Date().toISOString(),
      },
    ];

    // 2. Movies
    this.movies = [
      {
        id: "m-dune-2",
        title: "Dune: Part Two",
        slug: "dune-part-two",
        synopsis:
          "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
        posterUrl:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        durationMinutes: 166,
        releaseDate: "2024-03-01T00:00:00Z",
        language: "English",
        rating: "PG-13",
        status: "NOW_SHOWING",
        genres: ["Sci-Fi", "Adventure", "Drama"],
      },
      {
        id: "m-interstellar",
        title: "Interstellar: 10th Anniversary IMAX",
        slug: "interstellar-10th-anniversary",
        synopsis:
          "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        posterUrl:
          "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        durationMinutes: 169,
        releaseDate: "2024-09-27T00:00:00Z",
        language: "English",
        rating: "PG-13",
        status: "NOW_SHOWING",
        genres: ["Sci-Fi", "Drama"],
      },
      {
        id: "m-oppenheimer",
        title: "Oppenheimer",
        slug: "oppenheimer",
        synopsis:
          "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
        posterUrl:
          "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        durationMinutes: 180,
        releaseDate: "2023-07-21T00:00:00Z",
        language: "English",
        rating: "R",
        status: "NOW_SHOWING",
        genres: ["Drama", "Thriller"],
      },
      {
        id: "m-spiderman",
        title: "Spider-Man: Beyond the Spider-Verse",
        slug: "spider-man-beyond-spider-verse",
        synopsis:
          "Miles Morales journeys across the Multiverse to unite with Gwen Stacy and an elite team of Spider-Heroes to face a villain more powerful than anything they have ever encountered.",
        posterUrl:
          "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
        durationMinutes: 140,
        releaseDate: "2025-06-15T00:00:00Z",
        language: "English",
        rating: "PG",
        status: "COMING_SOON",
        genres: ["Animation", "Action", "Adventure"],
      },
    ];

    // 3. Cinemas
    this.cinemas = [
      {
        id: "c-la-imax",
        name: "CineBook Grand IMAX Cinema",
        slug: "cinebook-grand-imax",
        address: "7000 Hollywood Blvd",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90028",
        phone: "+1 (323) 555-0100",
        amenities: [
          "IMAX Laser",
          "Dolby Atmos",
          "Luxury Recliners",
          "VIP Lounge",
          "Valet Parking",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop",
      },
      {
        id: "c-ny-starlight",
        name: "The Starlight Dolby Cinema",
        slug: "starlight-dolby-cinema",
        address: "1500 Broadway",
        city: "New York",
        state: "NY",
        postalCode: "10036",
        phone: "+1 (212) 555-0199",
        amenities: [
          "Dolby Vision + Atmos",
          "In-Seat Dining",
          "Craft Cocktail Bar",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop",
      },
      {
        id: "c-chi-velvet",
        name: "Velvet Royale VIP Lounge",
        slug: "velvet-royale-vip",
        address: "600 N Michigan Ave",
        city: "Chicago",
        state: "IL",
        postalCode: "60611",
        phone: "+1 (312) 555-0145",
        amenities: ["VIP Butler Service", "Private Pods", "Heated Recliners"],
        imageUrl:
          "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=1000&auto=format&fit=crop",
      },
    ];

    // 4. Auditoriums
    this.auditoriums = [
      {
        id: "aud-imax-1",
        cinemaId: "c-la-imax",
        name: "Screen 1 - IMAX Laser",
        screenType: "IMAX",
        totalSeats: 48,
      },
      {
        id: "aud-dolby-1",
        cinemaId: "c-ny-starlight",
        name: "Screen 1 - Dolby Vision",
        screenType: "DOLBY_CINEMA",
        totalSeats: 48,
      },
    ];

    // 5. Seats for aud-imax-1 and aud-dolby-1
    const rows = ["A", "B", "C", "D", "E", "F"];
    const seatsPerRow = 8;

    this.seats = [];
    for (const aud of this.auditoriums) {
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        for (let sNum = 1; sNum <= seatsPerRow; sNum++) {
          let seatType: "STANDARD" | "PREMIUM" | "VIP" | "ACCESSIBLE" =
            "STANDARD";
          let priceTier = "STANDARD";

          if (row === "A") {
            seatType =
              sNum === 1 || sNum === seatsPerRow ? "ACCESSIBLE" : "STANDARD";
          } else if (row === "D" || row === "E") {
            seatType = "PREMIUM";
            priceTier = "PREMIUM";
          } else if (row === "F") {
            seatType = "VIP";
            priceTier = "VIP";
          }

          this.seats.push({
            id: `seat-${aud.id}-${row}${sNum}`,
            auditoriumId: aud.id,
            rowIdentifier: row,
            seatNumber: sNum,
            seatType,
            priceTier,
            posX: sNum,
            posY: rIdx + 1,
          });
        }
      }
    }

    // 6. Showtimes
    const now = new Date();
    const today1300 = new Date(now);
    today1300.setHours(13, 0, 0, 0);

    const today1630 = new Date(now);
    today1630.setHours(16, 30, 0, 0);

    const today2000 = new Date(now);
    today2000.setHours(20, 0, 0, 0);

    this.showtimes = [
      {
        id: "st-dune-1",
        movieId: "m-dune-2",
        auditoriumId: "aud-imax-1",
        startTime: today1630.toISOString(),
        endTime: new Date(today1630.getTime() + 166 * 60000).toISOString(),
        basePriceCents: 1850,
        status: "SCHEDULED",
      },
      {
        id: "st-dune-2",
        movieId: "m-dune-2",
        auditoriumId: "aud-imax-1",
        startTime: today2000.toISOString(),
        endTime: new Date(today2000.getTime() + 166 * 60000).toISOString(),
        basePriceCents: 2200,
        status: "SCHEDULED",
      },
      {
        id: "st-interstellar-1",
        movieId: "m-interstellar",
        auditoriumId: "aud-dolby-1",
        startTime: today1300.toISOString(),
        endTime: new Date(today1300.getTime() + 169 * 60000).toISOString(),
        basePriceCents: 1600,
        status: "SCHEDULED",
      },
      {
        id: "st-oppenheimer-1",
        movieId: "m-oppenheimer",
        auditoriumId: "aud-dolby-1",
        startTime: today2000.toISOString(),
        endTime: new Date(today2000.getTime() + 180 * 60000).toISOString(),
        basePriceCents: 2000,
        status: "SCHEDULED",
      },
    ];

    // 7. Showtime Seats
    this.showtimeSeats = [];
    for (const st of this.showtimes) {
      const audSeats = this.seats.filter(
        (s) => s.auditoriumId === st.auditoriumId
      );
      for (let i = 0; i < audSeats.length; i++) {
        const s = audSeats[i];
        // Mark 2 sample seats as booked to show realistic map
        const status = i === 4 || i === 5 ? "BOOKED" : "AVAILABLE";
        this.showtimeSeats.push({
          id: `ss-${st.id}-${s.id}`,
          showtimeId: st.id,
          seatId: s.id,
          status,
          heldUntil: null,
          heldByUserId: null,
          bookingId: null,
          version: 1,
        });
      }
    }
  }
}

// Global memory store singleton
declare global {
  var __cinebook_memory_store: MemoryStore | undefined;
}

export const memoryStore: MemoryStore =
  global.__cinebook_memory_store || new MemoryStore();
if (process.env.NODE_ENV !== "production") {
  global.__cinebook_memory_store = memoryStore;
}
