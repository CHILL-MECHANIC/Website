-- Create a function to delete user account and associated data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's bookings first (this will cascade to booking_items due to foreign key)
  DELETE FROM public.bookings WHERE user_id = auth.uid();
  
  -- Delete user's profile
  DELETE FROM public.profiles WHERE user_id = auth.uid();
  
  -- Delete the user from auth.users (this requires security definer)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;