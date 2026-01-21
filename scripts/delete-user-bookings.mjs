/**
 * Script to delete all bookings for a specific phone number
 * Usage: node scripts/delete-user-bookings.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const PHONE_NUMBER = '917987376613';

// Simple .env parser
function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf-8');
    const env = {};

    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key.trim()] = value;
      }
    });

    return env;
  } catch (error) {
    console.error('Error loading .env file:', error.message);
    return {};
  }
}

async function deleteUserBookings() {
  // Load environment variables
  const env = loadEnv();

  // Validate environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 Starting deletion process for phone number:', PHONE_NUMBER);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Find user by phone number
    console.log('📞 Step 1: Looking up user with phone number:', PHONE_NUMBER);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, phone')
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

    // Step 4: Delete related payments first
    console.log('🗑️  Step 3: Deleting related payments...');

    const { data: deletedPayments, error: paymentsDeleteError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', profile.user_id)
      .select('id');

    if (paymentsDeleteError) {
      console.error('❌ Error deleting payments:', paymentsDeleteError.message);
      process.exit(1);
    }

    console.log(`✅ Deleted ${deletedPayments?.length || 0} payment(s)\n`);

    // Step 5: Delete all bookings (booking_items will cascade delete)
    console.log('🗑️  Step 4: Deleting all bookings...');

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
    console.log(`   - ${deletedPayments?.length || 0} payment(s) deleted`);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ Deletion completed successfully!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteUserBookings();
