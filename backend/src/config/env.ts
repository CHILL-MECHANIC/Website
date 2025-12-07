import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
const result = dotenv.config({ 
  path: path.resolve(process.cwd(), '.env') 
});

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Debug: Log what was loaded (remove in production)
console.log('Environment loaded from:', path.resolve(process.cwd(), '.env'));
console.log('\n=== Environment Variables Status ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
console.log('SMS_API_KEY:', process.env.SMS_API_KEY ? 'SET' : 'MISSING');
console.log('SMS_SENDER_ID:', process.env.SMS_SENDER_ID || 'CHLMEH (default)');
console.log('SMS_API_URL:', process.env.SMS_API_URL || 'https://api.uniquedigitaloutreach.com/v1/sms (default)');
console.log('DLT_TEMPLATE_ID:', process.env.DLT_TEMPLATE_ID || '1007710310207740679 (default)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING (using fallback)');
console.log('JWT_EXPIRY:', process.env.JWT_EXPIRY || '7d (default)');
console.log('PORT:', process.env.PORT || '3001 (default)');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('=====================================\n');

export {};

