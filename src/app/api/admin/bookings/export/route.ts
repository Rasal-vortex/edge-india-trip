import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { getBookingExportRows } from '@/lib/supabase/db';

function escapeCsvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const rows = await getBookingExportRows();
    if (req.nextUrl.searchParams.get('format') === 'json') {
      return NextResponse.json({ bookings: rows }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const csvRows = [
      ['Name', 'Phone', 'Company', 'Paid Amount (INR)'].map(escapeCsvCell).join(','),
      ...rows.map((row) => [
        row.full_name,
        row.phone,
        row.company_name,
        row.advance_amount,
      ].map(escapeCsvCell).join(',')),
    ];

    return new NextResponse(`\uFEFF${csvRows.join('\r\n')}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="edge-india-trip-bookings.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Booking export failed:', error);
    return NextResponse.json({ error: 'Could not export booking data.' }, { status: 500 });
  }
}
