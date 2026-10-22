import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY if available, or falls back to anon key.
 * WARNING: Never export or use this on client side!
 */
export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key || key.includes('your-supabase-service-role')) {
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  if (
    !supabaseUrl ||
    !key ||
    supabaseUrl.includes('your-project-id') ||
    key.includes('your-supabase-anon')
  ) {
    return null;
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
