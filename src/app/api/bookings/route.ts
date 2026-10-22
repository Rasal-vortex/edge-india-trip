import { NextRequest, NextResponse } from 'next/server';
import { validateBookingForm } from '@/lib/validation/booking';
import {
  createBooking,
  deletePaymentScreenshot,
  generateBookingReference,
  uploadPaymentScreenshot,
} from '@/lib/supabase/db';

// Simple in-memory sliding window rate limiting
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 12;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  validTimestamps.push(now);
  ipRequestHistory.set(ip, validTimestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Abuse prevention / Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many booking attempts from this network. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const fullName = (formData.get('fullName') as string) || '';
    const companyName = (formData.get('companyName') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const paidAmount = (formData.get('paidAmount') as string) || '';
    const screenshot = formData.get('screenshot') as File | null;

    // Server-side validation
    const validation = validateBookingForm({
      fullName,
      phone,
      companyName,
      paidAmount,
      file: screenshot,
      hasFileSelected: !!screenshot,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please correct the errors in the form.',
          fieldErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    if (!screenshot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment success screenshot is required.',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await screenshot.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Generate unique human-readable booking reference
    const bookingReference = generateBookingReference();

    // 1. Upload screenshot to private Supabase Storage
    const uploadResult = await uploadPaymentScreenshot(
      fileBuffer,
      screenshot.type,
      bookingReference
    );

    if ('error' in uploadResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not upload payment screenshot. Please check the image and try again.',
        },
        { status: 500 }
      );
    }

    // 2. Save booking in PostgreSQL with trusted server-side amounts & pending statuses
    const dbResult = await createBooking({
      fullName,
      companyName,
      phone: validation.normalizedPhone || phone,
      screenshotPath: uploadResult.path,
      bookingReference,
      paidAmount: validation.parsedAmount,
    });

    if (dbResult.error || !dbResult.booking) {
      // Clean up orphaned upload on DB failure
      await deletePaymentScreenshot(uploadResult.path);
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to save your booking at this time. Please try again in a moment.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingReference: dbResult.booking.booking_reference,
      fullName: dbResult.booking.full_name,
      advanceAmount: dbResult.booking.advance_amount,
      totalAmount: dbResult.booking.total_amount,
      message: 'Your booking request has been received! We will verify your advance payment and confirm your booking.',
    });
  } catch (error: unknown) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing your booking. Please try again.',
      },
      { status: 500 }
    );
  }
}
