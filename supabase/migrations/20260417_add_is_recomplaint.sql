-- Migration: Add is_recomplaint column to bookings table
-- Purpose: Track bookings that were re-opened by admin after completion within the 10-day window
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS is_recomplaint BOOLEAN DEFAULT FALSE;

-- Partial index: only index rows where is_recomplaint is true (keeps index small)
CREATE INDEX IF NOT EXISTS idx_bookings_is_recomplaint
  ON public.bookings(is_recomplaint)
  WHERE is_recomplaint = TRUE;
