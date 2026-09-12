import { NextRequest, NextResponse } from "next/server";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const genre = searchParams.get("genre") || undefined;
    const language = searchParams.get("language") || undefined;
    const cinemaId = searchParams.get("cinemaId") || undefined;

    const moviesList = await CinemaDB.getMovies({
      query,
      genre,
      language,
      cinemaId,
    });

    return NextResponse.json({ movies: moviesList });
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
