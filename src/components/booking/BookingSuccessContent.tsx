'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function BookingSuccessContent() {
  return (
    <div className="max-w-sm w-full bg-white rounded-3xl border-2 border-[#1b3f2e]/20 p-8 sm:p-12 shadow-xl text-center">

      {/* Success Icon */}
      <div className="w-24 h-24 mx-auto rounded-full bg-[#eef5f1] text-[#1b3f2e] flex items-center justify-center mb-6 shadow-inner">
        <CheckCircle className="w-14 h-14" />
      </div>

      {/* Message */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19231e] leading-tight mb-8">
        Your booking request has been received!
      </h1>

      {/* Back to Book Button */}
      <Link
        href="/"
        className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base text-[#1b3f2e] bg-[#eef5f1] hover:bg-[#d8e9df] active:bg-[#c2ded0] transition-colors touch-target-btn"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Book</span>
      </Link>

    </div>
  );
}
