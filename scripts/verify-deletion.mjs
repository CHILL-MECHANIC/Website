/**
 * Script to verify that all bookings have been deleted
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const PHONE_NUMBER = '917987376613';
const USER_ID = 'dc8cdf27-d05e-469f-9e89-baff7ef9cd17';

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

  console.log('🔍 Verifying deletion for user:', USER_ID);
  console.log('   Phone:', PHONE_NUMBER);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', USER_ID);

  if (bookingsError) {
    console.error('❌ Error checking bookings:', bookingsError.message);
  } else {
    console.log(`📋 Bookings: ${bookings?.length || 0} remaining`);
    if (bookings && bookings.length > 0) {
      console.log('   ⚠️  WARNING: Bookings still exist!');
      bookings.forEach(b => console.log(`      - ${b.id}`));
    } else {
      console.log('   ✅ All bookings deleted');
    }
  }

  // Check booking items
  const { data: items, error: itemsError } = await supabase
    .from('booking_items')
    .select('id, booking_id')
    .in('booking_id', bookings?.map(b => b.id) || []);

  if (itemsError) {
    console.error('❌ Error checking booking items:', itemsError.message);
  } else {
    console.log(`📦 Booking items: ${items?.length || 0} remaining`);
    if (items && items.length > 0) {
      console.log('   ⚠️  WARNING: Booking items still exist!');
    } else {
      console.log('   ✅ All booking items deleted');
    }
  }

  // Check payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', USER_ID);

  if (paymentsError) {
    console.error('❌ Error checking payments:', paymentsError.message);
  } else {
    console.log(`💳 Payments: ${payments?.length || 0} remaining`);
    if (payments && payments.length > 0) {
      console.log('   ⚠️  WARNING: Payments still exist!');
      payments.forEach(p => console.log(`      - ${p.id}`));
    } else {
      console.log('   ✅ All payments deleted');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');

  const allDeleted = (!bookings || bookings.length === 0) &&
                     (!items || items.length === 0) &&
                     (!payments || payments.length === 0);

  if (allDeleted) {
    console.log('✅ VERIFICATION PASSED: All data successfully deleted!');
  } else {
    console.log('⚠️  VERIFICATION FAILED: Some data still remains!');
  }
}

verifyDeletion();
