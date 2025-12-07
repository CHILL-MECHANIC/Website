-- Add missing columns to profiles table
-- Run this SQL in Supabase SQL Editor

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add avatar_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- Add date_of_birth column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
    END IF;

    -- Add gender column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
    END IF;

    -- Add address_line1 column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address_line1') THEN
        ALTER TABLE public.profiles ADD COLUMN address_line1 VARCHAR(255);
    END IF;

    -- Add address_line2 column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address_line2') THEN
        ALTER TABLE public.profiles ADD COLUMN address_line2 VARCHAR(255);
    END IF;

    -- Add country column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
        ALTER TABLE public.profiles ADD COLUMN country VARCHAR(100) DEFAULT 'India';
    END IF;

    -- Add is_profile_complete column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_profile_complete') THEN
        ALTER TABLE public.profiles ADD COLUMN is_profile_complete BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add auth_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_method') THEN
        ALTER TABLE public.profiles ADD COLUMN auth_method VARCHAR(20) DEFAULT 'phone';
    END IF;

    -- Add last_login_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add login_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'login_count') THEN
        ALTER TABLE public.profiles ADD COLUMN login_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Copy existing address to address_line1 if address exists and address_line1 is empty
UPDATE public.profiles 
SET address_line1 = address 
WHERE address IS NOT NULL AND address_line1 IS NULL;

-- Update is_profile_complete for existing profiles with full_name
UPDATE public.profiles 
SET is_profile_complete = TRUE 
WHERE full_name IS NOT NULL AND full_name != '';

-- Update auth_method for existing profiles
UPDATE public.profiles 
SET auth_method = 'phone' 
WHERE auth_method IS NULL;

-- Add service role policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Service role full access to profiles'
    ) THEN
        CREATE POLICY "Service role full access to profiles" ON public.profiles
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

