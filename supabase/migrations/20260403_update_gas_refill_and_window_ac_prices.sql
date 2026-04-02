-- ============================================================
-- Migration: Update AC Gas Refill and Window AC Installation prices
-- Date: 2026-04-03
-- ============================================================

-- Update Gas Refill & Check Up: 2499 -> 1999
UPDATE public.services SET price = 1999
WHERE name ILIKE '%Gas Refill%Check Up%' AND service_type = 'ac';

UPDATE public.services SET price = 1999
WHERE name ILIKE 'AC Gas Refill' AND service_type = 'ac';

-- Update Window AC Installation: 599 -> 699
UPDATE public.services SET price = 699
WHERE name ILIKE '%Window AC Installation%' AND service_type = 'ac';
