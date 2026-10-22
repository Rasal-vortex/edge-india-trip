'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { TripConfig } from '@/lib/types';

interface TripHeroProps {
  trip: TripConfig;
}

export default function TripHero({ trip }: TripHeroProps) {
  const scrollToBooking = () => {
    const el = document.getElementById('trip-payment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative aspect-[941/1672] min-h-[460px] w-full flex items-start text-white sm:aspect-auto sm:min-h-[520px]">
      {/* Full-bleed mountain background */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/Misty Mountain Road at Golden Hour (1).png"
          alt="Scenic mountain road for the upcoming trip"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center sm:object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />
      </div>

      {/* Edge India community logo over the hero background */}
      <div className="absolute left-1/2 top-3 z-10 h-56 w-56 -translate-x-1/2 before:absolute before:inset-0 before:rounded-full before:bg-white/25 before:blur-2xl before:content-[''] sm:top-4 sm:h-64 sm:w-64">
        <Image
          src="/edege-india-logo-png-file.png"
          alt="Edge India community logo"
          width={300}
          height={300}
          priority
          className="relative h-full w-full object-contain drop-shadow-lg"
        />
      </div>

      {/* Hero Content directly overlaid */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-64 pb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-white/90 sm:text-base">
          Edge India Community Trip
        </p>
        {/* Simple clear trip info - NO pills */}
        <p className="text-amber-400 font-bold text-lg sm:text-xl tracking-wide uppercase mb-1">
          {trip.duration} Trip • {trip.startDate} – {trip.endDate}, {trip.year}
        </p>

        {/* Big Bold Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-3">
          {trip.destination}
        </h1>

       

        {/* Single prominent button */}
        <button
          onClick={scrollToBooking}
          type="button"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#b45309] hover:bg-[#92400e] active:bg-[#78350f] text-white font-extrabold text-xl rounded-xl shadow-xl transition-all cursor-pointer touch-target-btn"
          aria-label="Confirm Your Trip"
        >
          <span>Confirm Your Trip</span>
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
