import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, verifyAdminRequest, ADMIN_SESSION_SECRET } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const isAuthed = await verifyAdminRequest(req);
  return NextResponse.json({ authenticated: isAuthed });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || !validateAdminCredentials(password)) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrator password.' },
        { status: 401 }
      );
    }

    if (!ADMIN_SESSION_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Admin session is not configured. Set ADMIN_SESSION_SECRET.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'admin_session',
      value: ADMIN_SESSION_SECRET,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Login processing error.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  response.cookies.delete('admin_session');
  return response;
}
