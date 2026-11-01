-- Migration: Add bundle_discount to bookings
-- Purpose: Store the "frequently added together" bundle saving that api/booking/create.ts works out on the server.
-- final_amount = total_amount - bundle_discount + service_tax + travel_charges
-- Run this BEFORE deploying the code that writes the column.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS bundle_discount NUMERIC(10, 2) NOT NULL DEFAULT 0;
