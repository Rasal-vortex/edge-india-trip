import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { getAdminBookings, updateBookingStatus } from '@/lib/supabase/db';
import { BookingStatus, PaymentStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const isAuthed = await verifyAdminRequest(req);
  if (!isAuthed) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const paymentStatus = (searchParams.get('paymentStatus') as PaymentStatus) || undefined;
  const bookingStatus = (searchParams.get('bookingStatus') as BookingStatus) || undefined;

  const bookings = await getAdminBookings({
    search,
    paymentStatus,
    bookingStatus,
  });

  return NextResponse.json({
    success: true,
    bookings,
  });
}

export async function PATCH(req: NextRequest) {
  const isAuthed = await verifyAdminRequest(req);
  if (!isAuthed) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, payment_status, booking_status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required.' },
        { status: 400 }
      );
    }

    const result = await updateBookingStatus(id, {
      payment_status,
      booking_status,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update booking.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully.',
    });
  } catch (error: unknown) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error updating status.' },
      { status: 500 }
    );
  }
}
