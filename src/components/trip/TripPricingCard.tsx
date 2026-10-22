import React from 'react';
import { TripConfig } from '@/lib/types';
import { formatINR } from '@/lib/config';

interface TripPricingCardProps {
  trip: TripConfig;
}

export default function TripPricingCard({ trip }: TripPricingCardProps) {
  const remainingAmount = trip.totalAmount - trip.advanceAmount;

  return (
    <section className="w-full my-6" aria-label="Trip pricing">
      <div className="bg-white rounded-2xl border-2 border-stone-300 p-5 sm:p-6 shadow-sm">
        
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-4">
          Trip Charges
        </h2>

        {/* Simple 2-column pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Advance Amount - Highlighted */}
          <div className="bg-emerald-50 border-2 border-emerald-800 rounded-xl p-5">
            <p className="text-sm font-bold text-emerald-900 uppercase">
              Advance Payment (Pay Now)
            </p>
            <p className="text-4xl sm:text-5xl font-black text-emerald-950 mt-1">
              {formatINR(trip.advanceAmount)}
            </p>
            <p className="text-sm text-emerald-800 font-semibold mt-1">
              50% advance to confirm your seat
            </p>
          </div>

          {/* Total Amount */}
          <div className="bg-stone-50 border border-stone-300 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-stone-600 uppercase">
                Total Trip Cost
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-1">
                {formatINR(trip.totalAmount)}
              </p>
            </div>
            <p className="text-sm text-stone-700 font-medium mt-3 pt-3 border-t border-stone-200">
              Remaining balance: <strong>{formatINR(remainingAmount)}</strong> payable during the trip.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
