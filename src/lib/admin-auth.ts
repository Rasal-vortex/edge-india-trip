import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

export async function verifyAdminRequest(req?: NextRequest): Promise<boolean> {
  if (!ADMIN_SESSION_SECRET) return false;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;

  if (sessionCookie && sessionCookie === ADMIN_SESSION_SECRET) {
    return true;
  }

  // Also allow Authorization header for API testing
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader === `Bearer ${ADMIN_SESSION_SECRET}`) {
      return true;
    }
  }

  return false;
}

export function validateAdminCredentials(password: string): boolean {
  return Boolean(ADMIN_PASSWORD) && password === ADMIN_PASSWORD;
}

export { ADMIN_SESSION_SECRET };
