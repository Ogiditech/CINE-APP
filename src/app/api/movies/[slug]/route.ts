import { NextRequest, NextResponse } from "next/server";
import { CinemaDB } from "@/lib/db-client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const movie = await CinemaDB.getMovieBySlug(params.slug);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const showtimes = await CinemaDB.getShowtimesForMovie(movie.id);

    return NextResponse.json({
      movie,
      showtimes,
    });
  } catch (error: any) {
    console.error("Error fetching movie details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
