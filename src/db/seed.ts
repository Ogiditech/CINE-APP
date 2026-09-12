import { getDb } from "./index";
import {
  users,
  movies,
  genres,
  movieGenres,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
  auditLogs,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const db = getDb();
  console.log("🎬 Starting CineBook database seeding...");

  // 1. Create Default Users (Admin & Customer)
  console.log("👤 Seeding users...");
  const adminPasswordHash = await hashPassword("AdminPass123!");
  const viewerPasswordHash = await hashPassword("ViewerPass123!");

  const [adminUser] = await db
    .insert(users)
    .values({
      name: "Cinema Admin",
      email: "admin@cinebook.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      phone: "+1 (555) 019-2834",
    })
    .onConflictDoNothing()
    .returning();

  const [viewerUser] = await db
    .insert(users)
    .values({
      name: "Alex Johnson",
      email: "viewer@cinebook.com",
      passwordHash: viewerPasswordHash,
      role: "USER",
      phone: "+1 (555) 012-7890",
    })
    .onConflictDoNothing()
    .returning();

  // 2. Create Genres
  console.log("🏷️  Seeding genres...");
  const genreData = [
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Drama", slug: "drama" },
    { name: "Adventure", slug: "adventure" },
    { name: "Thriller", slug: "thriller" },
    { name: "Animation", slug: "animation" },
  ];

  const createdGenres = await db
    .insert(genres)
    .values(genreData)
    .onConflictDoNothing()
    .returning();

  const allGenres = await db.select().from(genres);
  const genreMap = new Map(allGenres.map((g) => [g.slug, g.id]));

  // 3. Create Movies
  console.log("🍿 Seeding movies...");
  const movieData = [
    {
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
      releaseDate: new Date("2024-03-01T00:00:00Z"),
      language: "English",
      rating: "PG-13",
      status: "NOW_SHOWING" as const,
      genreSlugs: ["sci-fi", "adventure", "drama"],
    },
    {
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
      releaseDate: new Date("2024-09-27T00:00:00Z"),
      language: "English",
      rating: "PG-13",
      status: "NOW_SHOWING" as const,
      genreSlugs: ["sci-fi", "drama"],
    },
    {
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
      releaseDate: new Date("2023-07-21T00:00:00Z"),
      language: "English",
      rating: "R",
      status: "NOW_SHOWING" as const,
      genreSlugs: ["drama", "thriller"],
    },
    {
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
      releaseDate: new Date("2025-06-15T00:00:00Z"),
      language: "English",
      rating: "PG",
      status: "COMING_SOON" as const,
      genreSlugs: ["animation", "action", "adventure"],
    },
  ];

  for (const m of movieData) {
    const { genreSlugs, ...movieFields } = m;
    const [insertedMovie] = await db
      .insert(movies)
      .values(movieFields)
      .onConflictDoNothing()
      .returning();

    let targetMovie = insertedMovie;
    if (!targetMovie) {
      const rows = await db.select().from(movies).where(eq(movies.slug, m.slug)).limit(1);
      targetMovie = rows[0];
    }

    if (targetMovie && genreSlugs) {
      for (const gSlug of genreSlugs) {
        const genreId = genreMap.get(gSlug);
        if (genreId) {
          await db
            .insert(movieGenres)
            .values({ movieId: targetMovie.id, genreId })
            .onConflictDoNothing();
        }
      }
    }
  }

  // 4. Create Cinemas
  console.log("🏛️  Seeding cinemas...");
  const cinemaData = [
    {
      name: "CineBook Grand IMAX Cinema",
      slug: "cinebook-grand-imax",
      address: "7000 Hollywood Blvd",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90028",
      phone: "+1 (323) 555-0100",
      amenities: ["IMAX Laser", "Dolby Atmos", "Luxury Recliners", "VIP Lounge", "Valet Parking"],
      imageUrl:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop",
    },
    {
      name: "The Starlight Dolby Cinema",
      slug: "starlight-dolby-cinema",
      address: "1500 Broadway",
      city: "New York",
      state: "NY",
      postalCode: "10036",
      phone: "+1 (212) 555-0199",
      amenities: ["Dolby Vision + Atmos", "In-Seat Dining", "Craft Cocktail Bar"],
      imageUrl:
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop",
    },
    {
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

  for (const c of cinemaData) {
    const [insertedCinema] = await db
      .insert(cinemas)
      .values(c)
      .onConflictDoNothing()
      .returning();

    let targetCinema = insertedCinema;
    if (!targetCinema) {
      const rows = await db.select().from(cinemas).where(eq(cinemas.slug, c.slug)).limit(1);
      targetCinema = rows[0];
    }

    if (!targetCinema) continue;

    // 5. Create Auditoriums for Cinema
    const audData = [
      {
        cinemaId: targetCinema.id,
        name: "Screen 1 - IMAX Laser",
        screenType: "IMAX" as const,
        totalSeats: 64,
      },
      {
        cinemaId: targetCinema.id,
        name: "Screen 2 - Dolby Atmos",
        screenType: "DOLBY_CINEMA" as const,
        totalSeats: 48,
      },
    ];

    for (const aud of audData) {
      const [insertedAud] = await db
        .insert(auditoriums)
        .values(aud)
        .onConflictDoNothing()
        .returning();

      let targetAud = insertedAud;
      if (!targetAud) {
        const rows = await db
          .select()
          .from(auditoriums)
          .where(eq(auditoriums.name, aud.name))
          .limit(1);
        targetAud = rows[0];
      }

      if (!targetAud) continue;

      // 6. Generate Seats Grid (Rows A to F, 8-10 seats per row)
      const rows = ["A", "B", "C", "D", "E", "F"];
      const seatsPerRow = 8;
      const seatRecords = [];

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        for (let sNum = 1; sNum <= seatsPerRow; sNum++) {
          let seatType: "STANDARD" | "PREMIUM" | "VIP" | "ACCESSIBLE" = "STANDARD";
          let priceTier = "STANDARD";

          if (row === "A") {
            seatType = sNum === 1 || sNum === seatsPerRow ? "ACCESSIBLE" : "STANDARD";
          } else if (row === "D" || row === "E") {
            seatType = "PREMIUM";
            priceTier = "PREMIUM";
          } else if (row === "F") {
            seatType = "VIP";
            priceTier = "VIP";
          }

          seatRecords.push({
            auditoriumId: targetAud.id,
            rowIdentifier: row,
            seatNumber: sNum,
            seatType,
            priceTier,
            posX: sNum,
            posY: rIdx + 1,
          });
        }
      }

      await db.insert(seats).values(seatRecords).onConflictDoNothing();
    }
  }

  // 7. Create Showtimes for Movies
  console.log("⏰ Seeding showtimes & showtime seats...");
  const allMovies = await db.select().from(movies);
  const allAuditoriums = await db.select().from(auditoriums);
  const allSeats = await db.select().from(seats);

  const today = new Date();
  const showtimeTimes = [
    { hours: 13, minutes: 0, price: 1600 }, // 1:00 PM ($16.00)
    { hours: 16, minutes: 30, price: 1850 }, // 4:30 PM ($18.50)
    { hours: 20, minutes: 0, price: 2100 }, // 8:00 PM ($21.00 - Prime IMAX)
  ];

  for (const movie of allMovies.filter((m) => m.status === "NOW_SHOWING")) {
    for (const aud of allAuditoriums.slice(0, 2)) {
      for (const st of showtimeTimes) {
        const startTime = new Date(today);
        startTime.setHours(st.hours, st.minutes, 0, 0);

        const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60 * 1000);

        const [insertedShowtime] = await db
          .insert(showtimes)
          .values({
            movieId: movie.id,
            auditoriumId: aud.id,
            startTime,
            endTime,
            basePriceCents: st.price,
            status: "SCHEDULED",
          })
          .returning();

        if (insertedShowtime) {
          // Pre-populate showtime_seats for every seat in auditorium
          const audSeats = allSeats.filter((s) => s.auditoriumId === aud.id);
          const showtimeSeatRows = audSeats.map((s, idx) => ({
            showtimeId: insertedShowtime.id,
            seatId: s.id,
            status: idx === 3 ? ("BOOKED" as const) : ("AVAILABLE" as const),
            version: 1,
          }));

          if (showtimeSeatRows.length > 0) {
            await db.insert(showtimeSeats).values(showtimeSeatRows).onConflictDoNothing();
          }
        }
      }
    }
  }

  // Record audit log
  await db.insert(auditLogs).values({
    action: "DATABASE_SEEDED",
    entityType: "SYSTEM",
    entityId: "SYSTEM_SEED",
    details: {
      moviesCount: allMovies.length,
      cinemasCount: cinemaData.length,
      timestamp: new Date().toISOString(),
    },
  });

  console.log("✅ CineBook database seeding completed successfully!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}
