import React from 'react';
import TripHero from '@/components/trip/TripHero';
import PaymentSection from '@/components/booking/PaymentSection';
import BookingForm from '@/components/booking/BookingForm';
import { DEFAULT_TRIP } from '@/lib/config';
import Link from 'next/link';

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
      <footer className="w-full bg-stone-900 text-stone-400 py-6 px-4 text-center text-sm border-t border-stone-800">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-stone-300">
            2-Day Trip • Helpline: +91 {DEFAULT_TRIP.upiPhoneNumber}
          </p>
          <Link
            href="/admin"
            className="text-xs text-stone-400 hover:text-stone-200 underline"
          >
            Admin Login
          </Link>
        </div>
      </footer>

    </div>
  );
}
