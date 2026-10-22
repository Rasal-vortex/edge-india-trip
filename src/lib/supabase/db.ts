import { getServiceSupabase } from './server';
import { Booking, BookingStatus, PaymentStatus } from '../types';
import { DEFAULT_TRIP } from '../config';

export const STORAGE_BUCKET = 'booking-payments';

// Fallback in-memory storage for local development / testing before Supabase env is populated
interface InMemoryStore {
  bookings: Booking[];
}

const globalForStore = global as unknown as { __edgeTripStore?: InMemoryStore };
const store: InMemoryStore = globalForStore.__edgeTripStore || {
  bookings: [],
};
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__edgeTripStore = store;
}

/**
 * Generates an accessible, human-readable booking reference like NW-2026-A8F2
 */
export function generateBookingReference(year: number = DEFAULT_TRIP.year): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters like O, 0, I, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NW-${year}-${code}`;
}

/**
 * Uploads payment screenshot to Supabase Storage private bucket
 */
export async function uploadPaymentScreenshot(
  fileBuffer: Buffer,
  mimeType: string,
  bookingReference: string
): Promise<{ path: string } | { error: string }> {
  const supabase = getServiceSupabase();

  // Determine file extension
  let ext = 'jpg';
  if (mimeType === 'image/png') ext = 'png';
  else if (mimeType === 'image/webp') ext = 'webp';

  const fileName = `payments/${bookingReference}_${Date.now()}.${ext}`;

  if (!supabase) {
    // Local / fallback mode
    const mockPath = `mock-storage/${fileName}`;
    return { path: mockPath };
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { error: `Failed to upload payment screenshot: ${error.message}` };
    }

    return { path: data.path };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown storage error';
    return { error: msg };
  }
}

/**
 * Deletes an uploaded screenshot if database insertion fails (prevents orphaned files)
 */
export async function deletePaymentScreenshot(path: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase || path.startsWith('mock-storage/')) return;

  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch (err) {
    console.error('Failed to cleanup orphaned screenshot:', err);
  }
}

/**
 * Saves a new booking in the database
 */
export async function createBooking(data: {
  fullName: string;
  companyName?: string | null;
  phone: string;
  screenshotPath: string;
  bookingReference: string;
  paidAmount?: number;
}): Promise<{ booking?: Booking; error?: string }> {
  const supabase = getServiceSupabase();

  const newBooking: Booking = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    booking_reference: data.bookingReference,
    full_name: data.fullName.trim(),
    company_name: data.companyName?.trim() || null,
    phone: data.phone.trim(),
    trip_id: DEFAULT_TRIP.id,
    total_amount: DEFAULT_TRIP.totalAmount, // Server-trusted value ₹2,200
    advance_amount: data.paidAmount && data.paidAmount > 0 ? data.paidAmount : DEFAULT_TRIP.advanceAmount,
    payment_screenshot_path: data.screenshotPath,
    payment_status: 'pending_verification',
    booking_status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    // Store in-memory fallback
    store.bookings.unshift(newBooking);
    return { booking: newBooking };
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .insert({
        booking_reference: newBooking.booking_reference,
        full_name: newBooking.full_name,
        company_name: newBooking.company_name,
        phone: newBooking.phone,
        trip_id: newBooking.trip_id,
        total_amount: newBooking.total_amount,
        advance_amount: newBooking.advance_amount,
        payment_screenshot_path: newBooking.payment_screenshot_path,
        payment_status: newBooking.payment_status,
        booking_status: newBooking.booking_status,
      });

    if (error) {
      console.error('Supabase DB insert error:', error);
      return { error: 'Failed to record booking details in database.' };
    }

    return { booking: newBooking };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return { error: msg };
  }
}

/**
 * Generates a short-lived signed URL (valid 15 minutes) for admin screenshot viewing
 */
export async function getSignedScreenshotUrl(storagePath: string): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (!supabase || storagePath.startsWith('mock-storage/')) {
    // In demo/mock mode, return sample placeholder or preview SVG
    return '/images/sample-upi-qr.svg';
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 900); // 15 minutes

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Signed URL generation exception:', err);
    return null;
  }
}

/**
 * Queries bookings for the admin dashboard with search and status filters
 */
export async function getAdminBookings(filters?: {
  search?: string;
  paymentStatus?: PaymentStatus;
  bookingStatus?: BookingStatus;
}): Promise<Booking[]> {
  const supabase = getServiceSupabase();

  if (!supabase) {
    let list = [...store.bookings];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.full_name.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.booking_reference.toLowerCase().includes(q)
      );
    }
    if (filters?.paymentStatus) {
      list = list.filter((b) => b.payment_status === filters.paymentStatus);
    }
    if (filters?.bookingStatus) {
      list = list.filter((b) => b.booking_status === filters.bookingStatus);
    }
    return list;
  }

  try {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters?.bookingStatus) {
      query = query.eq('booking_status', filters.bookingStatus);
    }
    if (filters?.search) {
      const s = filters.search.trim();
      query = query.or(
        `full_name.ilike.%${s}%,phone.ilike.%${s}%,booking_reference.ilike.%${s}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Admin bookings fetch error:', error);
      return [];
    }

    // Attach signed URLs for convenient admin display
    const bookings = (data as Booking[]) || [];
    const withUrls = await Promise.all(
      bookings.map(async (b) => {
        const url = await getSignedScreenshotUrl(b.payment_screenshot_path);
        return { ...b, signed_screenshot_url: url };
      })
    );
    return withUrls;
  } catch (err) {
    console.error('Fetch bookings exception:', err);
    return [];
  }
}

export interface BookingExportRow {
  full_name: string;
  phone: string;
  company_name: string | null;
  advance_amount: number;
}

/** Fetches every booking export row without creating screenshot URLs. */
export async function getBookingExportRows(): Promise<BookingExportRow[]> {
  const supabase = getServiceSupabase();

  if (!supabase) {
    return store.bookings.map(({ full_name, phone, company_name, advance_amount }) => ({
      full_name,
      phone,
      company_name: company_name || null,
      advance_amount,
    }));
  }

  const rows: BookingExportRow[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('bookings')
      .select('full_name, phone, company_name, advance_amount')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Could not fetch bookings for export: ${error.message}`);

    const page = (data || []) as BookingExportRow[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/**
 * Updates booking and/or payment status (Admin only)
 */
export async function updateBookingStatus(
  id: string,
  updates: {
    payment_status?: PaymentStatus;
    booking_status?: BookingStatus;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();

  if (!supabase) {
    const idx = store.bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      store.bookings[idx] = {
        ...store.bookings[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return { success: true };
    }
    return { success: false, error: 'Booking not found' };
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return { success: false, error: msg };
  }
}
