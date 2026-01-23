-- Migration: Add Water Dispenser and Deep Freezer Services
-- Description: Adds two new main services to the services table

-- Insert Water Dispenser and Deep Freezer Services
INSERT INTO public.services (name, description, price, service_type) VALUES
('Water Dispenser Check Up', ARRAY['Complete inspection', 'Cooling system check', 'Heating element inspection', '1 month warranty'], 249, 'water-dispenser'),
('Deep Freezer Check Up', ARRAY['Complete inspection', 'Temperature check', 'Cooling system assessment', '1 month warranty'], 249, 'deep-freezer')
ON CONFLICT DO NOTHING;
