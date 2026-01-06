import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// ===== Auth Helpers =====
interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
}

interface TokenVerifyResult {
  user: AuthUser | null;
  error: string | null;
}

const createSupabaseAdmin = (): SupabaseClient => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

interface JWTPayload {
  sub: string;
  phone?: string;
  email?: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}

const verifyAuthToken = (authHeader: string | undefined): TokenVerifyResult => {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization required' };
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    return { user: null, error: 'Server configuration error' };
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    if (decoded.role !== 'authenticated' && decoded.aud !== 'authenticated') {
      return { user: null, error: 'Invalid token role' };
    }
    
    return {
      user: { 
        id: decoded.sub, 
        phone: decoded.phone?.replace('+', ''), 
        email: decoded.email 
      },
      error: null
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    return { user: null, error: message };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Verify auth token
  const { user, error: authError } = verifyAuthToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ success: false, message: authError || 'Authorization required', isAdmin: false });
  }

  try {
    const supabase = createSupabaseAdmin();
    
    console.log('[Admin Check] Checking admin status for user:', user.id);
    
    // Check admin status from user_roles table
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      console.log('[Admin Check] Role lookup result:', { userId: user.id, roleData, error: roleError?.message });
      
      if (roleData) {
        return res.status(200).json({ success: true, isAdmin: true, userId: user.id });
      }
    } catch (roleError) {
      console.error('[Admin Check] Role lookup error:', roleError);
    }
    
    // Fallback: try has_role RPC function
    try {
      const { data: hasRole } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (hasRole === true) {
        return res.status(200).json({ success: true, isAdmin: true, userId: user.id });
      }
    } catch {
      // Ignore RPC errors - function may not exist
    }

    return res.status(200).json({ 
      success: true, 
      isAdmin: false,
      userId: user.id
    });
  } catch (error: any) {
    console.error('Admin check error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error', isAdmin: false });
  }
}
