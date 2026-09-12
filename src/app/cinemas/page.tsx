"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Sparkles,
  Layers,
  ChevronRight,
  Film,
  Compass,
} from "lucide-react";

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cinemas");
      const data = await res.json();
      setCinemas(data.cinemas || []);
    } catch (err) {
      console.error("Failed to load cinemas:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Premier Destinations</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          CineBook Luxury Theatres
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Discover our state-of-the-art cinematic locations engineered with
          industry-leading projection, immersive acoustics, and bespoke guest services.
        </p>
      </div>

      {/* Cinemas Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group hover:shadow-glow"
            >
              <div>
                {/* Photo */}
                <div className="relative h-48 w-full overflow-hidden bg-cinema-900">
                  <img
                    src={cinema.imageUrl}
                    alt={cinema.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cinema-900/80 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {cinema.city}, {cinema.state}
                  </span>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {cinema.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {cinema.address}, {cinema.postalCode}
                    </p>
                  </div>

                  {/* Amenities */}
                  {cinema.amenities && cinema.amenities.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                        Featured Amenities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cinema.amenities.map((item: string) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 text-zinc-300 border border-white/5"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cinema.phone && (
                    <div className="text-xs text-zinc-400 flex items-center gap-2 pt-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{cinema.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="p-6 pt-0">
                <Link
                  href="/#movies"
                  className="w-full py-3 rounded-xl bg-amber-500 text-cinema-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors shadow-glow"
                >
                  <Film className="w-4 h-4" />
                  View Screenings & Showtimes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
