-- Migration: Add coupon fields to bookings
-- Purpose: Store the coupon (APP5 to APP25) and the saving that api/booking/create.ts works out on the server.
-- final_amount = total_amount - bundle_discount - coupon_discount + service_tax + travel_charges
-- Run this BEFORE deploying the code that writes these columns.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10, 2) NOT NULL DEFAULT 0;
