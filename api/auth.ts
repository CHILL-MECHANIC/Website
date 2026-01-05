import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// ===== INLINED FROM _lib/supabase.ts =====
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

// Create anon client for user-level operations
const createSupabaseAnon = (): SupabaseClient => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase anon configuration');
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
};

// Generate a Supabase-compatible JWT for a user
const generateSupabaseJWT = (userId: string, phone: string, email?: string): string => {
  // The Supabase JWT secret can be derived from the service role key
  // Or set directly as SUPABASE_JWT_SECRET env var
  // For Supabase hosted projects, the JWT secret is in Settings > API
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET or JWT_SECRET not configured');
  }
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'authenticated',
    exp: now + (60 * 60 * 24 * 7), // 7 days
    iat: now,
    iss: `${process.env.SUPABASE_URL}/auth/v1`,
    sub: userId,
    email: email || undefined,
    phone: phone ? `+${phone}` : undefined,
    role: 'authenticated',
    session_id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
  };
  
  return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
};

const safeLog = (prefix: string, data: Record<string, unknown>, level: 'log' | 'error' | 'warn' = 'log') => {
  if (process.env.NODE_ENV === 'production') {
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

// ===== Types =====
interface OTPRecord {
  id: string;
  phone: string;
  otp: string;
  status: 'pending' | 'sent' | 'failed' | 'verified';
  expires_at: string;
  created_at: string;
}

interface Profile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

// Generate 4-digit OTP
const generateOTP = (): string => Math.floor(1000 + Math.random() * 9000).toString();

// Format phone to E.164 (Indian)
const formatPhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  // Remove 91 prefix if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  // Now we should have a 10-digit number
  if (cleaned.length !== 10 || !/^[6-9]/.test(cleaned)) {
    throw new Error('Invalid phone number. Must be a 10-digit Indian mobile number starting with 6-9.');
  }
  return '91' + cleaned;
};

// Send OTP via SMS (using existing UniqueDigitalOutreach API)
const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'CHLMEH';
  const apiUrl = process.env.SMS_API_URL || 'https://api.uniquedigitaloutreach.com/v1/sms';
  
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Auth] SMS_API_KEY not set, OTP:', otp);
    }
    return true; // Allow dev to continue without SMS
  }

  try {
    const message = `Your webapp login OTP is ${otp} From - Chill Mechanic`;
    
    const response = await axios.post(
      apiUrl,
      {
        sender: senderId,
        to: phone,
        text: message,
        type: 'OTP'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        timeout: 30000
      }
    );

    if (response.data?.message === 'Message Sent Successfully!' && response.data?.data?.[0]) {
      return true;
    }

    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth] SMS error:', message);
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  try {
    // Debug: Check if imports work
    if (action === 'debug') {
      return res.json({
        success: true,
        message: 'Debug endpoint',
        env: {
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasJwtSecret: !!process.env.JWT_SECRET,
          hasSmsKey: !!process.env.SMS_API_KEY
        }
      });
    }

    const supabase = createSupabaseAdmin();

    // ===== CHECK PHONE =====
    if (action === 'check-phone' && req.method === 'GET') {
      const phone = req.query.phone as string;
      if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

      try {
        const formattedPhone = formatPhone(phone);
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhone)
          .maybeSingle();

        return res.json({ success: true, exists: !!profile, phone: formattedPhone });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid phone';
        return res.status(400).json({ success: false, message });
      }
    }

    // ===== SIGNUP: SEND OTP =====
    if (action === 'signup-send-otp' && req.method === 'POST') {
      const { phone, name, email } = req.body || {};
      if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

      try {
        const formattedPhone = formatPhone(phone);

        // Check if exists
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (existing) {
          return res.status(400).json({ success: false, message: 'Phone already registered. Please sign in instead.' });
        }

        // Rate limit check
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentOTPs } = await supabase
          .from('otp_logs')
          .select('id')
          .eq('phone', formattedPhone)
          .gte('created_at', fiveMinAgo);

        if (recentOTPs && recentOTPs.length >= 3) {
          return res.status(429).json({ success: false, message: 'Too many requests. Please wait 5 minutes.' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase.from('otp_logs').insert({
          phone: formattedPhone,
          otp,
          expires_at: expiresAt,
          status: 'pending'
        });

        await sendOTP(formattedPhone, otp);
        safeLog('[Auth] Signup OTP sent', { phone: formattedPhone, type: 'signup' });

        const response: { success: boolean; message: string; phone: string; debug?: { otp: string } } = {
          success: true,
          message: 'OTP sent successfully. Please verify to complete registration.',
          phone: formattedPhone
        };

        if (process.env.NODE_ENV === 'development') {
          response.debug = { otp };
        }

        return res.json(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        return res.status(400).json({ success: false, message });
      }
    }

    // ===== SIGNUP: VERIFY OTP =====
    if (action === 'signup-verify-otp' && req.method === 'POST') {
      const { phone, otp, name, email } = req.body || {};
      if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

      try {
        const formattedPhone = formatPhone(phone);

        const { data: otpRecord } = await supabase
          .from('otp_logs')
          .select('*')
          .eq('phone', formattedPhone)
          .neq('status', 'verified')
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as { data: OTPRecord | null };

        if (!otpRecord) return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
        if (new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        if (otpRecord.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

        await supabase.from('otp_logs').update({ status: 'verified' }).eq('id', otpRecord.id);

        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          phone: `+${formattedPhone}`,
          phone_confirm: true,
          user_metadata: { name: name || null, phone: formattedPhone }
        });

        if (authError) {
          console.error('[Auth] Create user failed:', authError.message);
          return res.status(500).json({ success: false, message: 'Failed to create user' });
        }

        if (!authData.user) {
          return res.status(500).json({ success: false, message: 'Failed to create user' });
        }

        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          phone: formattedPhone,
          name: name || null,
          email: email || null
        });

        if (profileError) {
          console.error('[Auth] Profile creation failed:', profileError.message);
          return res.status(500).json({ success: false, message: 'Failed to create profile' });
        }

        // Generate a Supabase-compatible JWT for the new user
        let accessToken = null;
        
        try {
          accessToken = generateSupabaseJWT(authData.user.id, formattedPhone, email);
        } catch (jwtError) {
          console.error('[Auth] JWT generation failed:', jwtError);
        }

        safeLog('[Auth] User created', { id: authData.user.id, type: 'signup', hasToken: !!accessToken });

        return res.json({
          success: true,
          message: 'Account created successfully. Please complete your profile.',
          access_token: accessToken,
          user: { id: authData.user.id, phone: formattedPhone, name: name || null },
          isNewUser: true
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to verify OTP';
        console.error('[Auth] Signup verify error:', message);
        return res.status(500).json({ success: false, message });
      }
    }

    // ===== SIGNIN: SEND OTP =====
    if (action === 'signin-send-otp' && req.method === 'POST') {
      const { phone } = req.body || {};
      if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

      try {
        const formattedPhone = formatPhone(phone);

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (!profile) {
          // Check auth.users as fallback
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const existingAuthUser = authUsers?.users?.find(
            (u: { phone?: string }) => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
          );

          if (!existingAuthUser) {
            return res.status(404).json({ success: false, message: 'Phone number not registered. Please sign up first.' });
          }
        }

        // Rate limit check
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentOTPs } = await supabase
          .from('otp_logs')
          .select('id')
          .eq('phone', formattedPhone)
          .gte('created_at', fiveMinAgo);

        if (recentOTPs && recentOTPs.length >= 3) {
          return res.status(429).json({ success: false, message: 'Too many requests. Please wait 5 minutes.' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { error: insertError } = await supabase.from('otp_logs').insert({
          phone: formattedPhone,
          otp,
          expires_at: expiresAt,
          status: 'pending'
        });

        if (insertError) {
          console.error('[Auth] OTP insert error:', insertError.message);
          return res.status(500).json({ success: false, message: 'Failed to create OTP', debug: { error: insertError.message } });
        }

        await sendOTP(formattedPhone, otp);
        safeLog('[Auth] Signin OTP sent', { phone: formattedPhone, type: 'signin' });

        const response: { success: boolean; message: string; phone: string; userName?: string; debug?: { otp: string } } = {
          success: true,
          message: profile?.full_name ? `Welcome back! OTP sent to verify your identity.` : 'OTP sent successfully.',
          phone: formattedPhone,
          userName: profile?.full_name || null
        };

        // Always include OTP in debug for testing
        response.debug = { otp };

        return res.json(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        return res.status(400).json({ success: false, message });
      }
    }

    // ===== SIGNIN: VERIFY OTP =====
    if (action === 'signin-verify-otp' && req.method === 'POST') {
      const { phone, otp } = req.body || {};
      if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

      try {
        const formattedPhone = formatPhone(phone);

        const { data: otpRecord, error: otpError } = await supabase
          .from('otp_logs')
          .select('*')
          .eq('phone', formattedPhone)
          .neq('status', 'verified')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[Auth] OTP lookup:', { formattedPhone, found: !!otpRecord, error: otpError?.message });

        if (!otpRecord) return res.status(400).json({ 
          success: false, 
          message: 'No OTP found. Please request a new one.',
          debug: { lookupPhone: formattedPhone, error: otpError?.message }
        });
        if (new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        if (otpRecord.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });

        await supabase.from('otp_logs').update({ status: 'verified' }).eq('id', otpRecord.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', formattedPhone)
          .maybeSingle() as { data: Profile | null };

        if (!profile) return res.status(404).json({ success: false, message: 'User not found. Please sign up first.' });

        // Generate a Supabase-compatible JWT for the user
        let accessToken = null;
        
        try {
          accessToken = generateSupabaseJWT(profile.id, formattedPhone, profile.email);
        } catch (jwtError) {
          console.error('[Auth] JWT generation failed:', jwtError);
          // Continue without token - user can still be returned
        }

        safeLog('[Auth] User signed in', { id: profile.id, type: 'signin', hasToken: !!accessToken });

        const welcomeMessage = profile.name ? `Welcome back, ${profile.name}!` : 'Login successful!';

        return res.json({
          success: true,
          message: welcomeMessage,
          access_token: accessToken,
          user: { id: profile.id, phone: profile.phone, name: profile.name, email: profile.email },
          isNewUser: false
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        console.error('[Auth] Signin verify error:', message);
        return res.status(500).json({ success: false, message });
      }
    }

    // ===== RESEND OTP =====
    if (action === 'resend-otp' && req.method === 'POST') {
      const { phone, type = 'signin' } = req.body || {};
      if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

      try {
        const formattedPhone = formatPhone(phone);

        // Rate limit
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentOTPs } = await supabase
          .from('otp_logs')
          .select('id')
          .eq('phone', formattedPhone)
          .gte('created_at', fiveMinAgo);

        if (recentOTPs && recentOTPs.length >= 3) {
          return res.status(429).json({ success: false, message: 'Too many requests. Please wait 5 minutes.' });
        }

        const otp = generateOTP();
        await supabase.from('otp_logs').insert({
          phone: formattedPhone,
          otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          status: 'pending'
        });

        await sendOTP(formattedPhone, otp);
        return res.json({ success: true, message: 'OTP resent successfully', phone: formattedPhone });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to resend OTP';
        return res.status(400).json({ success: false, message });
      }
    }

    // ===== CHECK RATE LIMIT =====
    if (action === 'check-rate-limit' && req.method === 'GET') {
      const phone = req.query.phone as string;
      if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

      try {
        const formattedPhone = formatPhone(phone);
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: recentOTPs } = await supabase
          .from('otp_logs')
          .select('id, created_at')
          .eq('phone', formattedPhone)
          .gte('created_at', fiveMinAgo);

        const count = recentOTPs?.length || 0;
        return res.json({
          success: true,
          canRequest: count < 3,
          requestsInWindow: count,
          maxRequests: 3,
          windowMinutes: 5
        });
      } catch (error) {
        return res.json({
          success: true,
          canRequest: true // Fail open
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use: check-phone, signup-send-otp, signin-send-otp, signup-verify-otp, signin-verify-otp, resend-otp, check-rate-limit'
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[Auth] Error:', message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
