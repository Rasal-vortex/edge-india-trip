import React, { Suspense } from 'react';
import BookingSuccessContent from '@/components/booking/BookingSuccessContent';

export const metadata = {
  title: 'Booking Request Received | 2-Day Trip',
  description: 'Thank you for submitting your trip booking request. We are verifying your advance payment.',
};

export default function BookingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] py-8 sm:py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      <Suspense fallback={
        <div className="max-w-xl w-full p-8 text-center bg-white rounded-2xl shadow-sm border border-[#e6e2d8]">
          <p className="text-lg font-medium text-[#19231e]">Loading booking details...</p>
        </div>
      }>
        <BookingSuccessContent />
      </Suspense>
    </main>
  );
}
