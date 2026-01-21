/**
 * Script to verify that all old bookings have been deleted
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

async function verifyDeletion() {
  const env = loadEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 Verifying deletion of bookings before:', CUTOFF_DATE);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check bookings before cutoff date
  const { data: oldBookings, error: oldBookingsError } = await supabase
    .from('bookings')
    .select('id, booking_date')
    .lt('booking_date', CUTOFF_DATE);

  if (oldBookingsError) {
    console.error('❌ Error checking old bookings:', oldBookingsError.message);
  } else {
    console.log(`📋 Old bookings (before ${CUTOFF_DATE}): ${oldBookings?.length || 0} remaining`);
    if (oldBookings && oldBookings.length > 0) {
      console.log('   ⚠️  WARNING: Old bookings still exist!');
      oldBookings.forEach(b => console.log(`      - ${b.id} (${b.booking_date})`));
    } else {
      console.log('   ✅ All old bookings deleted');
    }
  }

  // Check bookings on or after cutoff date (should still exist)
  const { data: newBookings, error: newBookingsError } = await supabase
    .from('bookings')
    .select('id, booking_date')
    .gte('booking_date', CUTOFF_DATE)
    .order('booking_date', { ascending: true })
    .limit(5);

  if (newBookingsError) {
    console.error('❌ Error checking new bookings:', newBookingsError.message);
  } else {
    console.log(`\n📋 Recent bookings (from ${CUTOFF_DATE} onwards): ${newBookings?.length || 0} found`);
    if (newBookings && newBookings.length > 0) {
      console.log('   ✅ Recent bookings preserved (showing first 5):');
      newBookings.forEach(b => console.log(`      - ${b.id} (${b.booking_date})`));
    } else {
      console.log('   ⚠️  No recent bookings found');
    }
  }

  // Get overall booking count
  const { count: totalBookings, error: countError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting total bookings:', countError.message);
  } else {
    console.log(`\n📊 Total bookings remaining in database: ${totalBookings || 0}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');

  if (!oldBookings || oldBookings.length === 0) {
    console.log('✅ VERIFICATION PASSED: All old bookings successfully deleted!');
  } else {
    console.log('⚠️  VERIFICATION FAILED: Some old bookings still remain!');
  }
}

verifyDeletion();
