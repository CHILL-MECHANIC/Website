-- ============================================
-- Payments Table Diagnostic Queries
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Show all columns in payments table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'payments';

-- 3. Show all RLS policies on payments table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payments';

-- 4. Check foreign key constraints
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'payments'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 5. Check table constraints (including CHECK constraints)
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'payments';

-- 6. Check if payments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'payments'
) AS table_exists;

-- 7. Show recent payments (if any exist)
SELECT 
  id,
  user_id,
  razorpay_order_id,
  amount,
  status,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;

-- 8. Check for any NOT NULL constraints that might be missing defaults
SELECT
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payments'
  AND is_nullable = 'NO'
  AND column_default IS NULL;

