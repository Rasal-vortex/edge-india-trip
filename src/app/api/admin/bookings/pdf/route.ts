import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.type !== 'application/pdf' || file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'Invalid PDF file.' }, { status: 400 });
  }

  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="edge-india-trip-bookings.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}
