import { createClient } from '@supabase/supabase-js';

// Server-only administrative Supabase client using Service Role Key.
// NEVER expose this client or its credentials to the browser.
// In production, SUPABASE_SERVICE_ROLE_KEY must be set.
// In development/sandbox, it falls back to anon key for convenience.

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yqvbyuywzuyvrbaezxww.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey && process.env.NODE_ENV === 'production') {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required in production');
}

/**
 * Server-only administrative Supabase client using Service Role Key.
 * NEVER expose this client or its credentials to the browser.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_h_Sgu_7-dTTU3SrJ2RQikQ_REnx0h1X',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);