-- =========================================================================
-- RO SERVICE RENEWAL ENGINE - SUPABASE LIVE CLOUD SYNC SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Create the application state sync table
CREATE TABLE IF NOT EXISTS public.ro_app_state (
  id TEXT PRIMARY KEY DEFAULT 'primary_business',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ro_app_state ENABLE ROW LEVEL SECURITY;

-- 3. Create a public read/write policy so your web & mobile devices can sync
DROP POLICY IF EXISTS "Allow public read and write for ro_app_state" ON public.ro_app_state;
CREATE POLICY "Allow public read and write for ro_app_state"
ON public.ro_app_state
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Enable Supabase Realtime broadcast for instant 0.5s updates across devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ro_app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ro_app_state;
  END IF;
END $$;
