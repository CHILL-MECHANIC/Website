-- Migration: Add Foreign Key Constraints for Data Integrity
-- Date: 2026-01-19
-- Description: Adds foreign key constraints to ensure referential integrity between tables

-- ============================================================
-- BOOKINGS TABLE - Add foreign key to profiles.user_id
-- ============================================================

-- Add foreign key constraint for bookings.user_id -> profiles.user_id
-- This ensures that every booking must have a valid user in the profiles table
-- ON DELETE CASCADE: If a profile is deleted, all their bookings are also deleted
ALTER TABLE public.bookings
ADD CONSTRAINT fk_bookings_user_id
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Add index on user_id for better join performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT fk_bookings_user_id ON public.bookings IS
'Foreign key to profiles.user_id ensuring every booking belongs to a valid user profile';

-- ============================================================
-- BOOKINGS TABLE - Add foreign key to technicians.id
-- ============================================================

-- Add foreign key constraint for bookings.technician_id -> technicians.id
-- This ensures that assigned technicians must exist in the technicians table
-- ON DELETE SET NULL: If a technician is deleted, set technician_id to NULL (don't delete the booking)
ALTER TABLE public.bookings
ADD CONSTRAINT fk_bookings_technician_id
FOREIGN KEY (technician_id)
REFERENCES public.technicians(id)
ON DELETE SET NULL;

-- Add index on technician_id for better join performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_bookings_technician_id ON public.bookings(technician_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT fk_bookings_technician_id ON public.bookings IS
'Foreign key to technicians.id ensuring assigned technicians exist in the system';

-- ============================================================
-- BOOKING_ITEMS TABLE - Verify CASCADE constraint exists
-- ============================================================

-- The booking_items table already has ON DELETE CASCADE (defined in initial migration)
-- This comment just documents the existing constraint for reference
COMMENT ON CONSTRAINT booking_items_booking_id_fkey ON public.booking_items IS
'Foreign key to bookings.id with CASCADE delete - when booking is deleted, all items are deleted';