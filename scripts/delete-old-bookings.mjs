/**
 * Script to delete all bookings dated before December 31, 2025
 * Usage: node scripts/delete-old-bookings.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const CUTOFF_DATE = '2025-12-31';

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

async function deleteOldBookings() {
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

  console.log('🔍 Starting deletion process for bookings before:', CUTOFF_DATE);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Find all bookings before the cutoff date
    console.log('📋 Step 1: Finding all bookings before', CUTOFF_DATE);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, user_id, booking_date, booking_time, final_amount, status, payment_status')
      .lt('booking_date', CUTOFF_DATE)
      .order('booking_date', { ascending: true });

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError.message);
      process.exit(1);
    }

    if (!bookings || bookings.length === 0) {
      console.log('⚠️  No bookings found before this date.');
      console.log('✅ Nothing to delete.');
      process.exit(0);
    }

    console.log(`✅ Found ${bookings.length} booking(s) to delete:\n`);

    // Group bookings by date for better readability
    const bookingsByDate = {};
    bookings.forEach(booking => {
      const date = booking.booking_date;
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(booking);
    });

    // Display summary by date
    Object.keys(bookingsByDate).sort().forEach(date => {
      const count = bookingsByDate[date].length;
      const totalAmount = bookingsByDate[date].reduce((sum, b) => sum + (b.final_amount || 0), 0);
      console.log(`   📅 ${date}: ${count} booking(s), Total: ₹${totalAmount}`);
    });

    console.log('');

    // Display first 10 and last 5 bookings as sample
    const sampleCount = Math.min(10, bookings.length);
    console.log(`Sample of bookings (showing first ${sampleCount}):`);
    bookings.slice(0, sampleCount).forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.id}`);
      console.log(`      Date: ${booking.booking_date} ${booking.booking_time || ''}`);
      console.log(`      Amount: ₹${booking.final_amount}, Status: ${booking.status}, Payment: ${booking.payment_status}`);
    });

    if (bookings.length > sampleCount) {
      console.log(`   ... and ${bookings.length - sampleCount} more bookings`);
    }
    console.log('');

    // Step 2: Count related booking items
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

    // Step 3: Count related payments
    const { count: paymentsCount, error: paymentsCountError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .in('booking_id', bookingIds);

    if (paymentsCountError) {
      console.error('⚠️  Warning: Could not count payments:', paymentsCountError.message);
    } else {
      console.log(`💳 Found ${paymentsCount || 0} related payment(s)\n`);
    }

    // Calculate totals
    const totalAmount = bookings.reduce((sum, b) => sum + (b.final_amount || 0), 0);
    const uniqueUsers = new Set(bookings.map(b => b.user_id)).size;

    console.log('📊 Summary:');
    console.log(`   - ${bookings.length} bookings`);
    console.log(`   - ${itemsCount || 0} booking items`);
    console.log(`   - ${paymentsCount || 0} payments`);
    console.log(`   - ${uniqueUsers} unique user(s)`);
    console.log(`   - Total amount: ₹${totalAmount}`);
    console.log('');

    // Step 4: Delete related payments first (to avoid foreign key constraint)
    console.log('🗑️  Step 2: Deleting related payments...');

    const { data: deletedPayments, error: paymentsDeleteError } = await supabase
      .from('payments')
      .delete()
      .in('booking_id', bookingIds)
      .select('id');

    if (paymentsDeleteError) {
      console.error('❌ Error deleting payments:', paymentsDeleteError.message);
      process.exit(1);
    }

    console.log(`✅ Deleted ${deletedPayments?.length || 0} payment(s)\n`);

    // Step 5: Delete all old bookings (booking_items will cascade delete)
    console.log('🗑️  Step 3: Deleting all bookings before', CUTOFF_DATE);

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .lt('booking_date', CUTOFF_DATE);

    if (deleteError) {
      console.error('❌ Error deleting bookings:', deleteError.message);
      process.exit(1);
    }

    console.log('✅ Successfully deleted all old bookings!');
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
deleteOldBookings();
