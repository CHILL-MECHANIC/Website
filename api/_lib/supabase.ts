import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Types
export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
}

export interface TokenVerifyResult {
  user: AuthUser | null;
  error: string | null;
}

// Create admin client (service role - full access)
export const createSupabaseAdmin = (): SupabaseClient => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

// Lazy-loaded supabase client (for backward compatibility)
let _supabaseClient: SupabaseClient | null = null;
export const getSupabase = (): SupabaseClient => {
  if (!_supabaseClient) {
    _supabaseClient = createSupabaseAdmin();
  }
  return _supabaseClient;
};

// Verify Supabase access token
export const verifySupabaseToken = async (authHeader: string | undefined): Promise<TokenVerifyResult> => {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization required' };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const supabase = createSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }
    
    return {
      user: { id: user.id, phone: user.phone, email: user.email },
      error: null
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    return { user: null, error: message };
  }
};

// Safe logger - redacts PII in production
export const safeLog = (prefix: string, data: Record<string, unknown>, level: 'log' | 'error' | 'warn' = 'log') => {
  if (process.env.NODE_ENV === 'production') {
    // Only log non-sensitive fields
    const safeData: Record<string, unknown> = {};
    const safeFields = ['id', 'status', 'type', 'action', 'count', 'success'];
    
    for (const key of safeFields) {
      if (key in data) safeData[key] = data[key];
    }
    
    console[level](`${prefix}`, JSON.stringify(safeData));
  } else {
    console[level](`${prefix}`, JSON.stringify(data, null, 2));
  }
};

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
