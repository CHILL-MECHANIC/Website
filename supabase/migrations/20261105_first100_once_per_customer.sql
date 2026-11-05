-- Migration: FIRST100 can be used once per customer
-- Purpose: api/booking/create.ts checks this first; the index also stops two simultaneous requests.
-- A cancelled booking does not count, so the customer can use the coupon again after cancelling.
-- Run this BEFORE deploying the code.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_first100_once_per_user
ON public.bookings (user_id)
WHERE coupon_code = 'FIRST100' AND status <> 'cancelled';
