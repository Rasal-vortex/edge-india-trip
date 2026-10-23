import { TripConfig } from './types';

// Configurable year, defaulting to current or configured year
const TRIP_YEAR = parseInt(process.env.NEXT_PUBLIC_TRIP_YEAR || process.env.TRIP_YEAR || '2026', 10);

export const DEFAULT_TRIP: TripConfig = {
  id: 'nadukani-wayanad-2026',
  name: '2-Day Trip',
  destination: 'Location will be announced soon',
  duration: '2 Days, 1 Night',
  startDate: 'Sun, 08 Nov',
  endDate: 'Mon, 09 Nov',
  year: TRIP_YEAR,
  totalAmount: 2200,
  advanceAmount: 1100,
  advancePercentage: 50,
  heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE || '/images/hero.png',
  upiId: process.env.NEXT_PUBLIC_UPI_ID || 'iamnetworkerwdr-4@okaxis',
  upiPhoneNumber: process.env.NEXT_PUBLIC_UPI_PHONE || '7594944211',
  payeeName: process.env.NEXT_PUBLIC_PAYEE_NAME || 'IAM Networker',
  qrCodeImage: process.env.NEXT_PUBLIC_QR_IMAGE || '/qr-code.png',
  description: 'Join us for a 2-day trip. The location will be announced soon.',
  isActive: true,
};

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
