/**
 * Script to search for a phone number in various formats
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const PHONE_NUMBER = '7987376613';

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

async function searchPhoneNumber() {
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

  console.log('🔍 Searching for phone number:', PHONE_NUMBER);
  console.log('═══════════════════════════════════════════════════════\n');

  const variations = [
    PHONE_NUMBER,
    `+91${PHONE_NUMBER}`,
    `91${PHONE_NUMBER}`,
    `0${PHONE_NUMBER}`
  ];

  for (const variant of variations) {
    console.log(`Searching for: ${variant}`);

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, phone')
      .eq('phone', variant);

    if (error) {
      console.error('  ❌ Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('  ✅ FOUND!');
      data.forEach(profile => {
        console.log(`     User ID: ${profile.user_id}`);
        console.log(`     Phone: ${profile.phone}`);
      });
    } else {
      console.log('  ❌ Not found');
    }
    console.log('');
  }

  // Also try searching with LIKE pattern
  console.log('Searching with LIKE pattern (contains)...');
  const { data: likeData, error: likeError } = await supabase
    .from('profiles')
    .select('user_id, phone')
    .like('phone', `%${PHONE_NUMBER}%`);

  if (likeError) {
    console.error('  ❌ Error:', likeError.message);
  } else if (likeData && likeData.length > 0) {
    console.log(`  ✅ Found ${likeData.length} match(es):`);
    likeData.forEach(profile => {
      console.log(`     User ID: ${profile.user_id}`);
      console.log(`     Phone: ${profile.phone}`);
    });
  } else {
    console.log('  ❌ No matches found');
  }
}

searchPhoneNumber();
