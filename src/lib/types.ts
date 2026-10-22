export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface TripConfig {
  id: string;
  name: string;
  destination: string;
  duration: string;
  startDate: string;
  endDate: string;
  year: number;
  totalAmount: number;
  advanceAmount: number;
  advancePercentage: number;
  heroImage: string;
  upiId: string;
  upiPhoneNumber: string;
  payeeName: string;
  qrCodeImage: string;
  description: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  booking_reference: string;
  full_name: string;
  company_name?: string | null;
  phone: string;
  trip_id: string;
  total_amount: number;
  advance_amount: number;
  payment_screenshot_path: string;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  created_at: string;
  updated_at?: string;
  // Optional signed URL computed for admin views
  signed_screenshot_url?: string | null;
}

export interface BookingSubmissionResult {
  success: boolean;
  bookingReference?: string;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}
