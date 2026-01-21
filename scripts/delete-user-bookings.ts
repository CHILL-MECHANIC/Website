/**
 * Script to delete all bookings for a specific phone number
 * Usage: node --env-file=.env scripts/delete-user-bookings.ts
 */

import { createClient } from '@supabase/supabase-js';

const PHONE_NUMBER = '7987376613';

async function deleteUserBookings() {
  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 Starting deletion process for phone number:', PHONE_NUMBER);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Find user by phone number
    console.log('📞 Step 1: Looking up user with phone number:', PHONE_NUMBER);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, phone, name')
      .eq('phone', PHONE_NUMBER);

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No user found with phone number:', PHONE_NUMBER);
      console.log('✅ Nothing to delete.');
      process.exit(0);
    }

    const profile = profiles[0];
    console.log('✅ Found user:');
    console.log('   - User ID:', profile.user_id);
    console.log('   - Phone:', profile.phone);
    console.log('   - Name:', profile.name || 'N/A');
    console.log('');

    // Step 2: Find all bookings for this user
    console.log('📋 Step 2: Finding all bookings for user:', profile.user_id);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, final_amount, status, payment_status')
      .eq('user_id', profile.user_id);

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError.message);
      process.exit(1);
    }

    if (!bookings || bookings.length === 0) {
      console.log('⚠️  No bookings found for this user.');
      console.log('✅ Nothing to delete.');
      process.exit(0);
    }

    console.log(`✅ Found ${bookings.length} booking(s):\n`);
    bookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ID: ${booking.id}`);
      console.log(`      Date: ${booking.booking_date} ${booking.booking_time || ''}`);
      console.log(`      Amount: ₹${booking.final_amount}`);
      console.log(`      Status: ${booking.status}`);
      console.log(`      Payment: ${booking.payment_status}`);
      console.log('');
    });

    // Step 3: Count related booking items
    const bookingIds = bookings.map(b => b.id);
    const { count: itemsCount, error: itemsCountError } = await supabase
      .from('booking_items')
      .select('*', { count: 'exact', head: true })
      .in('booking_id', bookingIds);

    if (itemsCountError) {
      console.error('⚠️  Warning: Could not count booking items:', itemsCountError.message);
    } else {
      console.log(`📦 Found ${itemsCount || 0} related booking item(s)\n`);
    }

    // Step 4: Delete all bookings (booking_items will cascade delete)
    console.log('🗑️  Step 3: Deleting all bookings...');

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', profile.user_id);

    if (deleteError) {
      console.error('❌ Error deleting bookings:', deleteError.message);
      process.exit(1);
    }

    console.log('✅ Successfully deleted all bookings!');
    console.log(`   - ${bookings.length} booking(s) deleted`);
    console.log(`   - ${itemsCount || 0} booking item(s) deleted (cascaded)`);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ Deletion completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteUserBookings();
