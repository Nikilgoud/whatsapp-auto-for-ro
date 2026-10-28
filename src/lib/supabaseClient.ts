import { createClient } from '@supabase/supabase-js';

// Safe check: determine if running in a local isolated sandbox (localhost, 127.0.0.1, dev mode)
export const isLocalSandbox = (): boolean => {
  if (process.env.NEXT_PUBLIC_LOCAL_SANDBOX === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      port === '3000' ||
      port === '3001'
    ) {
      return true;
    }
  }
  return process.env.NODE_ENV === 'development';
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yqvbyuywzuyvrbaezxww.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_h_Sgu_7-dTTU3SrJ2RQikQ_REnx0h1X';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
