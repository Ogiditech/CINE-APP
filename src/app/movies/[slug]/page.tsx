"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Clock,
  Calendar,
  Sparkles,
  Play,
  MapPin,
  ChevronRight,
  Ticket,
  Film,
  ArrowLeft,
} from "lucide-react";

export default function MovieDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [movie, setMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);

  // Generate next 7 days for the date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dateFormatted: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  useEffect(() => {
    if (slug) {
      fetchMovieDetails();
    }
  }, [slug]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/movies/${slug}`);
      const data = await res.json();
      if (res.ok) {
        setMovie(data.movie);
        setShowtimes(data.showtimes || []);
      }
    } catch (err) {
      console.error("Failed to fetch movie details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse space-y-8">
        <div className="h-80 bg-white/5 rounded-3xl" />
        <div className="h-40 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <Film className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-sm text-zinc-400 mt-2">
          The requested movie could not be found or has concluded its screening window.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-cinema-950 font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Catalog
        </Link>
      </div>
    );
  }

  // Group showtimes by cinema
  const showtimesByCinema = showtimes.reduce((acc: any, st: any) => {
    const cName = st.cinemaName || "CineBook Complex";
    if (!acc[cName]) {
      acc[cName] = {
        cinemaName: cName,
        cinemaSlug: st.cinemaSlug,
        items: [],
      };
    }
    acc[cName].items.push(st);
    return acc;
  }, {});

  return (
    <div className="space-y-12 pb-24">
      {/* HERO SECTION */}
      <div className="relative min-h-[480px] lg:min-h-[580px] flex items-end overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-950 via-cinema-950/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Movies
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Card */}
            <div className="w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-cinema-900 hidden sm:block">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie Info */}
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-cinema-950">
                  {movie.status === "NOW_SHOWING" ? "Now Showing" : "Coming Soon"}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white border border-white/10">
                  {movie.rating || "PG-13"}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-zinc-300 border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> {movie.durationMinutes} min
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-zinc-300 border border-white/10">
                  {movie.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                {movie.synopsis}
              </p>

              {movie.trailerUrl && (
                <div className="pt-2">
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/10 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Watch Official Trailer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SHOWTIMES SCHEDULER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-400" />
            Select Date & Showtime
          </h2>
          <p className="text-xs text-zinc-400">
            Pick your preferred screening time to open the live auditorium seat selector.
          </p>
        </div>

        {/* Date Selector Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {dates.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDateIdx(idx)}
              className={`flex flex-col items-center justify-center min-w-[100px] py-3.5 px-4 rounded-2xl border transition-all duration-200 ${
                selectedDateIdx === idx
                  ? "bg-amber-500 text-cinema-950 border-amber-500 shadow-glow font-bold scale-105"
                  : "glass-card text-zinc-300 border-white/10 hover:border-amber-500/40 hover:text-white"
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider">{item.dayName}</span>
              <span className="text-base font-extrabold mt-0.5">{item.dateFormatted}</span>
            </button>
          ))}
        </div>

        {/* Showtimes by Cinema */}
        {Object.keys(showtimesByCinema).length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">
              No Showtimes Scheduled for this Date
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Please choose another date or check back shortly as new showtime allocations are posted daily.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(showtimesByCinema).map((cinemaGroup: any) => (
              <div
                key={cinemaGroup.cinemaName}
                className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {cinemaGroup.cinemaName}
                      </h3>
                      <span className="text-[11px] text-zinc-400">
                        Reserved Seating • IMAX Laser • Dolby Atmos
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/cinemas`}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    Cinema Info <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Showtimes List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {cinemaGroup.items.map((st: any) => {
                    const timeStr = new Date(st.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const priceFormatted = `$${(st.basePriceCents / 100).toFixed(2)}`;

                    return (
                      <Link
                        key={st.id}
                        href={`/booking/${st.id}/seats`}
                        className="group relative glass-card p-3.5 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-200 text-center flex flex-col items-center justify-between gap-1.5 hover:shadow-glow"
                      >
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 text-zinc-300 group-hover:text-amber-300">
                          {st.screenType || "IMAX"}
                        </span>
                        <span className="text-lg font-black text-white group-hover:text-amber-400">
                          {timeStr}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400/90">
                          From {priceFormatted}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
