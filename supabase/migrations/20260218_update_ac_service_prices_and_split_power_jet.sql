-- Migration: Update AC service prices and separate Foam Power Jet / Power Jet services
-- Date: 2026-02-18
-- Description:
--   1. Update Foam Power Jet Service prices (1-5 AC)
--   2. Add separate Power Jet Service entries (1-4 AC)
--   3. Update Gas Refill & Check Up price to 2499
--   4. Update Split AC Installation to 1499, Uninstallation to 799
--   5. Update Window AC Installation to 599, Uninstallation to 499

-- ============================================================
-- Step 1: Update Foam Power Jet Service prices
-- ============================================================
UPDATE public.services SET price = 799
WHERE name ILIKE '%Foam Power Jet Service%1 AC%' AND service_type = 'ac';

UPDATE public.services SET price = 1499
WHERE name ILIKE '%Foam Power Jet Service%2 AC%' AND service_type = 'ac';

UPDATE public.services SET price = 2249
WHERE name ILIKE '%Foam Power Jet Service%3 AC%' AND service_type = 'ac';

UPDATE public.services SET price = 2999
WHERE name ILIKE '%Foam Power Jet Service%4 AC%' AND service_type = 'ac';

UPDATE public.services SET price = 3749
WHERE name ILIKE '%Foam Power Jet Service%5 AC%' AND service_type = 'ac';

-- ============================================================
-- Step 2: Insert new separate Power Jet Service entries
-- ============================================================
INSERT INTO public.services (name, description, price, service_type) VALUES
('Power Jet Service - 1 AC', ARRAY['Power jet cleaning of indoor unit', 'Filter cleaning', 'Outdoor unit cleaning', 'Cooling performance check', '30 days warranty'], 599, 'ac'),
('Power Jet Service - 2 AC', ARRAY['Power jet cleaning of 2 indoor units', 'Filter cleaning for both units', 'Outdoor unit cleaning for both', 'Cooling performance check', '30 days warranty'], 1099, 'ac'),
('Power Jet Service - 3 AC', ARRAY['Power jet cleaning of 3 indoor units', 'Filter cleaning for all units', 'Outdoor unit cleaning for all', 'Cooling performance check', '30 days warranty'], 1649, 'ac'),
('Power Jet Service - 4 AC', ARRAY['Power jet cleaning of 4 indoor units', 'Filter cleaning for all units', 'Outdoor unit cleaning for all', 'Cooling performance check', '30 days warranty'], 2199, 'ac')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 3: Update Gas Refill & Check Up price
-- ============================================================
UPDATE public.services SET price = 2499
WHERE name ILIKE '%Gas Refill%Check Up%' AND service_type = 'ac';

-- Also handle the old "AC Gas Refill" name from legacy migration
UPDATE public.services SET price = 2499
WHERE name ILIKE 'AC Gas Refill' AND service_type = 'ac';

-- ============================================================
-- Step 4: Update Split AC Installation / Uninstallation prices
-- ============================================================
UPDATE public.services SET price = 1499
WHERE name ILIKE '%Split AC Installation%' AND service_type = 'ac';

UPDATE public.services SET price = 799
WHERE name ILIKE '%Split AC Uninstallation%' AND service_type = 'ac';

-- ============================================================
-- Step 5: Update Window AC Installation / Uninstallation prices
-- ============================================================
UPDATE public.services SET price = 599
WHERE name ILIKE '%Window AC Installation%' AND service_type = 'ac';

UPDATE public.services SET price = 499
WHERE name ILIKE '%Window AC Uninstallation%' AND service_type = 'ac';

-- ============================================================
-- Step 6: Insert missing services that may not exist yet
-- (Gas Refill, Split/Window install/uninstall in old schema)
-- ============================================================
INSERT INTO public.services (name, description, price, service_type) VALUES
('Gas Refill & Check Up', ARRAY['Gas leak detection', 'Complete gas refill', 'Pressure testing', 'System performance check', '60 days warranty'], 2499, 'ac'),
('Split AC Installation', ARRAY['Indoor and outdoor unit mounting', 'Copper pipe connection (up to 3 meters)', 'Electrical wiring and connection', 'Vacuum testing', 'Complete commissioning', '30 days warranty'], 1499, 'ac'),
('Split AC Uninstallation', ARRAY['Gas recovery and storage', 'Pipe disconnection', 'Indoor and outdoor unit removal', 'Electrical disconnection', '15 days warranty'], 799, 'ac'),
('Window AC Installation', ARRAY['Window bracket installation', 'AC unit mounting and leveling', 'Weatherproofing and sealing', 'Electrical connection', 'Performance testing', '30 days warranty'], 599, 'ac'),
('Window AC Uninstallation', ARRAY['Electrical disconnection', 'Careful unit removal', 'Bracket removal', 'Basic window cleaning', '15 days warranty'], 499, 'ac')
ON CONFLICT DO NOTHING;
