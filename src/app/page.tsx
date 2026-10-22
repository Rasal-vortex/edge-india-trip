import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TripHero from '@/components/trip/TripHero';
import PaymentSection from '@/components/booking/PaymentSection';
import BookingForm from '@/components/booking/BookingForm';
import { DEFAULT_TRIP } from '@/lib/config';

export const metadata = {
  title: '2-Day Trip Booking',
  description: 'Book your 2-day trip. The location will be announced soon. Total trip ₹2,200, reserve with ₹1,100 advance.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col justify-between">
      
      {/* Full-bleed Hero Area with image background and overlaid details - NOT card type */}
      <TripHero trip={DEFAULT_TRIP} />

      {/* Main Content Area */}
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1">
        
        {/* UPI Payment / QR Section */}
        <PaymentSection trip={DEFAULT_TRIP} />

        {/* Booking Form with Screenshot Upload */}
        <BookingForm />

      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-stone-200 bg-stone-100 px-4 py-4 text-stone-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-1">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-semibold">Form powered by</span>
            <div className="relative h-16 w-48">
              <Image
                src="/Untitled-3-01.png"
                alt="Vortex Global Technologies"
                fill
                sizes="192px"
                className="object-contain"
              />
            </div>
          </div>
          <Link href="/admin" className="rounded border border-stone-300 px-2 py-0.5 text-[10px] text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-600">
            /admin
          </Link>
        </div>
      </footer>

    </div>
  );
}
