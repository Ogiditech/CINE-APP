"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Film,
  Sparkles,
  Ticket,
  ChevronRight,
  Play,
  Star,
  Layers,
  Volume2,
} from "lucide-react";

export default function HomePage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [selectedCinema, setSelectedCinema] = useState("ALL");
  const [selectedTab, setSelectedTab] = useState<"NOW_SHOWING" | "COMING_SOON">("NOW_SHOWING");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [moviesRes, cinemasRes] = await Promise.all([
        fetch("/api/movies"),
        fetch("/api/cinemas"),
      ]);
      const moviesData = await moviesRes.json();
      const cinemasData = await cinemasRes.json();
      setMovies(moviesData.movies || []);
      setCinemas(cinemasData.cinemas || []);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const genresList = ["ALL", "Sci-Fi", "Action", "Drama", "Thriller", "Animation"];

  // Filtered movies
  const filteredMovies = movies.filter((movie) => {
    // Status tab
    if (selectedTab === "NOW_SHOWING" && movie.status !== "NOW_SHOWING") return false;
    if (selectedTab === "COMING_SOON" && movie.status !== "COMING_SOON") return false;

    // Search query
    if (
      searchQuery &&
      !movie.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !movie.synopsis?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Genre
    if (selectedGenre !== "ALL") {
      const genresArray = Array.isArray(movie.genres) ? movie.genres : [];
      if (!genresArray.some((g: string) => g.toLowerCase() === selectedGenre.toLowerCase())) {
        return false;
      }
    }

    // Language
    if (
      selectedLanguage !== "ALL" &&
      movie.language?.toLowerCase() !== selectedLanguage.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  const featuredMovie =
    movies.find((m) => m.slug === "dune-part-two") || movies[0];

  return (
    <div className="space-y-16 pb-24">
      {/* HERO SPOTLIGHT BANNER */}
      {featuredMovie && (
        <section className="relative min-h-[600px] lg:min-h-[720px] flex items-end overflow-hidden border-b border-white/10">
          {/* Backdrop Image with Multi-Layered Gradients */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage: `url(${featuredMovie.backdropUrl || featuredMovie.posterUrl})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-950 via-cinema-950/70 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
            <div className="max-w-2xl space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-cinema-950 shadow-glow">
                  <Sparkles className="w-3 h-3" /> Premiere Spotlight
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/10">
                  {featuredMovie.rating || "PG-13"}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-amber-300 backdrop-blur-md border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {featuredMovie.durationMinutes} min
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  IMAX 70mm Laser
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none drop-shadow-lg">
                {featuredMovie.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed">
                {featuredMovie.synopsis}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={`/movies/${featuredMovie.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-cinema-950 font-bold text-sm tracking-wide transition-all duration-200 shadow-glow hover:scale-[1.03]"
                >
                  <Ticket className="w-4 h-4" />
                  Book Tickets Now
                </Link>

                {featuredMovie.trailerUrl && (
                  <a
                    href={featuredMovie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/10 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* QUICK SEARCH & ADVANCED FILTER DOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Title Search */}
            <div className="relative">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5">
                Search Movies
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Title or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-cinema-900/90 border border-white/10 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5">
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-cinema-900/90 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                {genresList.map((g) => (
                  <option key={g} value={g} className="bg-cinema-900 text-white">
                    {g === "ALL" ? "All Genres" : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-cinema-900/90 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                <option value="ALL" className="bg-cinema-900">All Languages</option>
                <option value="English" className="bg-cinema-900">English</option>
                <option value="Spanish" className="bg-cinema-900">Spanish</option>
                <option value="French" className="bg-cinema-900">French</option>
              </select>
            </div>

            {/* Cinema Complex */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5">
                Cinema Hall
              </label>
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="w-full bg-cinema-900/90 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                <option value="ALL" className="bg-cinema-900">All Cinemas</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id} className="bg-cinema-900">
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* MOVIES CATALOG SECTION */}
      <section id="movies" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTab("NOW_SHOWING")}
              className={`text-xl sm:text-2xl font-bold tracking-tight pb-1 transition-all ${
                selectedTab === "NOW_SHOWING"
                  ? "text-white border-b-2 border-amber-500 font-extrabold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Now Showing
            </button>
            <span className="text-zinc-600 text-xl font-light">|</span>
            <button
              onClick={() => setSelectedTab("COMING_SOON")}
              className={`text-xl sm:text-2xl font-bold tracking-tight pb-1 transition-all ${
                selectedTab === "COMING_SOON"
                  ? "text-white border-b-2 border-amber-500 font-extrabold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* Quick Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {genresList.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGenre === genre
                    ? "bg-amber-500 text-cinema-950"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-white/5 animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">No movies match your criteria</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, genre filter, or viewing upcoming releases.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("ALL");
                setSelectedLanguage("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="group relative glass-card rounded-2xl overflow-hidden flex flex-col border border-white/10 hover:border-amber-500/40 transition-all duration-300 hover:shadow-glow hover:-translate-y-1"
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-900">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Rating Tag */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cinema-900/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                    {movie.rating || "PG-13"}
                  </span>

                  {/* Format Pill */}
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-cinema-950 uppercase tracking-wider">
                    IMAX Laser
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500/80" />
                        {movie.durationMinutes}m
                      </span>
                      <span>•</span>
                      <span>{movie.language}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <Link
                    href={`/movies/${movie.slug}`}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-cinema-950 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 group-hover:bg-amber-500 group-hover:text-cinema-950"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    View Showtimes & Seats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AUDITORIUM EXPERIENCE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 glass-panel border border-white/10 relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              The CineBook Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              State of the Art Audiovisual Perfection
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Every screen is calibrated with custom laser illumination, 64-channel
              Dolby Atmos acoustic arrays, and ergonomic heated recliners designed for
              uncompromised immersion.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Laser IMAX</h4>
                  <p className="text-[11px] text-zinc-400">Pristine 4K clarity</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dolby Atmos</h4>
                  <p className="text-[11px] text-zinc-400">Spatial acoustic sphere</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
