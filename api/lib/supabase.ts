import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

export function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.startsWith('91') && digits.length === 12) digits = digits.substring(2);
  
  if (digits.length !== 10) {
    throw new Error(`Invalid phone number. Expected 10 digits, got ${digits.length}`);
  }
  
  if (!/^[6-9]/.test(digits)) {
    throw new Error('Invalid phone number. Must start with 6, 7, 8, or 9');
  }
  
  return '91' + digits;
}

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function setCorsHeaders(res: any, origin?: string) {
  // Allow specific origins in production, all in development
  const allowedOrigins = [
    'https://chillmechanic.com',
    'https://www.chillmechanic.com',
    'http://localhost:8080',
    'http://localhost:5173'
  ];
  
  const requestOrigin = origin || '*';
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
