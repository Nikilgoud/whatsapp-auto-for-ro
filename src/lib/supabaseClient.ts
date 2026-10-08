import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yqvbyuywzuyvrbaezxww.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_h_Sgu_7-dTTU3SrJ2RQikQ_REnx0h1X';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
