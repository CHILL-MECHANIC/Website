-- Migration: Add created_by_admin column to bookings table
-- Purpose: Differentiate bookings created by admin vs customers on the dashboard
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;

-- Partial index: only index rows where created_by_admin is true (keeps index small)
CREATE INDEX IF NOT EXISTS idx_bookings_created_by_admin
  ON public.bookings(created_by_admin)
  WHERE created_by_admin = TRUE;
