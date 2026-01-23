-- Migration: Clean up duplicate services and standardize schema
-- Description: Remove duplicate service entries and ensure only the new schema is used

-- Step 1: Drop the old services table if it exists (002_create_services_table created it with different schema)
-- We'll keep the new public.services table from 20250926173457_cce2afac-3c23-45e2-a0d8-79333cb4175f.sql

-- Step 2: Remove any duplicate services from public.services by keeping only the latest version
-- Using a Common Table Expression to identify and remove duplicates
WITH ranked_services AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY name, price, service_type ORDER BY created_at DESC) as rn
  FROM public.services
)
DELETE FROM public.services
WHERE id IN (
  SELECT id FROM ranked_services WHERE rn > 1
);

-- Step 3: Ensure the water-dispenser and deep-freezer services exist with correct schema
-- These will be inserted by 20260124_add_water_dispenser_deep_freezer_services.sql
-- Only delete them if they exist with wrong schema
DELETE FROM public.services
WHERE service_type IN ('water-dispenser', 'deep-freezer') 
AND (description IS NULL OR price NOT IN (249));

-- Step 4: Verify no orphaned records exist
-- Clean up any services without proper service_type classification
DELETE FROM public.services 
WHERE service_type IS NULL OR service_type = '';
