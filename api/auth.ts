import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

const getSupabase = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate 4-digit OTP
const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Format phone number to E.164 format (91XXXXXXXXXX)
const formatPhoneNumber = (phone: string): string => {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  }
  if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
    throw new Error('Invalid phone number. Must be a 10-digit Indian mobile number starting with 6-9.');
  }
  return '91' + digits;
};

// Send OTP via SMS API
const sendSMS = async (phone: string, otp: string): Promise<{ success: boolean; messageId?: string; requestId?: string }> => {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'CHLMEH';
  const apiUrl = process.env.SMS_API_URL || 'https://api.uniquedigitaloutreach.com/v1/sms';
  
  if (!apiKey) {
    console.error('[Auth] SMS_API_KEY not configured');
    return { success: false };
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
      return {
        success: true,
        messageId: response.data.data[0].messageId || response.data.id,
        requestId: response.data.id
      };
    }

    return { success: false };
  } catch (error: any) {
    console.error('[Auth] SMS send error:', error.message);
    return { success: false };
  }
};

// Check rate limiting
const canRequestOTP = async (phone: string): Promise<{ canRequest: boolean; waitTime?: number }> => {
  const supabase = getSupabase();
  const now = new Date();
  const cooldownTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Check 5-minute cooldown
    const { data: recentLogs } = await supabase
      .from('otp_logs')
      .select('created_at')
      .eq('phone', phone)
      .gte('created_at', cooldownTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentLogs && recentLogs.length > 0) {
      const lastRequest = new Date(recentLogs[0].created_at);
      const waitTime = Math.ceil((5 * 60 * 1000 - (now.getTime() - lastRequest.getTime())) / 1000);
      return { canRequest: false, waitTime: Math.max(0, waitTime) };
    }

    // Check hourly limit (max 3 requests)
    const { data: hourlyLogs } = await supabase
      .from('otp_logs')
      .select('id')
      .eq('phone', phone)
      .gte('created_at', hourAgo.toISOString());

    if (hourlyLogs && hourlyLogs.length >= 3) {
      return { canRequest: false, waitTime: 3600 };
    }

    return { canRequest: true };
  } catch (error) {
    console.error('[Auth] Rate limit check error:', error);
    return { canRequest: true }; // Fail open
  }
};

// Log OTP to database
const logOTP = async (phone: string, otp: string, status: 'pending' | 'sent' | 'failed' | 'verified', messageId?: string, requestId?: string) => {
  const supabase = getSupabase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { data, error } = await supabase
    .from('otp_logs')
    .insert({
      phone,
      otp,
      status,
      message_id: messageId || null,
      request_id: requestId || null,
      expires_at: expiresAt.toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Auth] OTP log error:', error);
    throw new Error('Failed to log OTP');
  }

  return data?.id;
};

// Update OTP log status
const updateOTPLog = async (id: number, status: 'pending' | 'sent' | 'failed' | 'verified', apiResponse?: any) => {
  const supabase = getSupabase();
  await supabase
    .from('otp_logs')
    .update({
      status,
      updated_at: new Date().toISOString(),
      api_response: apiResponse || null
    })
    .eq('id', id);
};

// Verify OTP
const verifyOTPCode = async (phone: string, inputOTP: string): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabase();

  if (!/^\d{4}$/.test(inputOTP)) {
    return { success: false, error: 'Invalid OTP format. Must be 4 digits.' };
  }

  const { data: otpLogs, error } = await supabase
    .from('otp_logs')
    .select('*')
    .eq('phone', phone)
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otpLogs) {
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  const expiresAt = new Date(otpLogs.expires_at);
  if (new Date() > expiresAt) {
    await updateOTPLog(otpLogs.id, 'failed', { reason: 'expired' });
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  if (otpLogs.otp !== inputOTP) {
    return { success: false, error: 'Invalid OTP. Please check and try again.' };
  }

  await updateOTPLog(otpLogs.id, 'verified', { verified_at: new Date().toISOString() });
  return { success: true };
};

// Create session for signup
const createSessionForSignUp = async (phone: string) => {
  const supabase = getSupabase();
  const phoneWithPlus = `+${phone}`;

  // Create user in Supabase Auth
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    phone: phoneWithPlus,
    phone_confirm: true,
    user_metadata: {
      phone,
      phone_verified: true,
      auth_method: 'phone'
    }
  });

  if (createError) {
    if (createError.message.includes('already registered') || createError.code === 'phone_exists') {
      throw new Error('Phone number already registered. Please Sign In instead.');
    }
    throw new Error(createError.message);
  }

  if (!newUser.user) {
    throw new Error('Failed to create user');
  }

  const userId = newUser.user.id;

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      phone,
      email: newUser.user.email || null,
      full_name: null
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  // Create JWT
  const token = jwt.sign(
    {
      userId,
      phone,
      authMethod: 'phone',
      isProfileComplete: false
    },
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRY || '30d' } as jwt.SignOptions
  );

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    token,
    user: {
      id: userId,
      phone,
      email: profile?.email || null,
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
      isProfileComplete: profile?.is_profile_complete || false,
      authMethod: 'phone' as const,
      isNewUser: true
    }
  };
};

// Create session for signin
const createSessionForSignIn = async (phone: string) => {
  const supabase = getSupabase();

  // Check profiles table
  const { data: profileByPhone } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (profileByPhone) {
    const userId = profileByPhone.user_id || profileByPhone.id;
    
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    const token = jwt.sign(
      {
        userId,
        phone,
        authMethod: 'phone',
        isProfileComplete: profileByPhone.is_profile_complete || false
      },
      process.env.JWT_SECRET as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRY || '30d' } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: userId,
        phone,
        email: profileByPhone.email || null,
        fullName: profileByPhone.full_name || null,
        avatarUrl: profileByPhone.avatar_url || null,
        isProfileComplete: profileByPhone.is_profile_complete || false,
        authMethod: 'phone' as const,
        isNewUser: false
      }
    };
  }

  // Check auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingUser = authUsers?.users?.find(
    (u: any) => u.phone === `+${phone}` || u.phone === phone || u.phone === `+91${phone.replace(/^91/, '')}`
  );

  if (!existingUser) {
    throw new Error('Phone number not registered. Please Sign Up first.');
  }

  const userId = existingUser.id;

  // Check if profile exists
  const { data: profileById } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileById) {
    await supabase
      .from('profiles')
      .update({
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    const token = jwt.sign(
      {
        userId,
        phone,
        authMethod: 'phone',
        isProfileComplete: profileById.is_profile_complete || false
      },
      process.env.JWT_SECRET as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRY || '30d' } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: userId,
        phone,
        email: profileById.email || null,
        fullName: profileById.full_name || null,
        avatarUrl: profileById.avatar_url || null,
        isProfileComplete: profileById.is_profile_complete || false,
        authMethod: 'phone' as const,
        isNewUser: false
      }
    };
  }

  // Create profile
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      phone
    })
    .select()
    .single();

  if (insertError && insertError.code !== '23505') {
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  const token = jwt.sign(
    {
      userId,
      phone,
      authMethod: 'phone',
      isProfileComplete: false
    },
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRY || '30d' } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: userId,
      phone,
      email: null,
      fullName: null,
      avatarUrl: null,
      isProfileComplete: false,
      authMethod: 'phone' as const,
      isNewUser: false
    }
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action as string;

  try {
    // ===== CHECK PHONE =====
    // GET /api/auth?action=check-phone&phone=9876543210
    if (action === 'check-phone' && req.method === 'GET') {
      const phone = req.query.phone as string;
      
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);
        const supabase = getSupabase();

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, is_profile_complete')
          .eq('phone', formattedPhone)
          .maybeSingle();

        return res.json({
          success: true,
          exists: !!profile,
          isProfileComplete: profile?.is_profile_complete || false,
          hasName: !!profile?.full_name
        });
      } catch (error: any) {
        return res.json({
          success: true,
          exists: false,
          isProfileComplete: false,
          hasName: false
        });
      }
    }

    // ===== SIGNUP SEND OTP =====
    // POST /api/auth?action=signup-send-otp
    if (action === 'signup-send-otp' && req.method === 'POST') {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);
        const supabase = getSupabase();

        // Check if phone already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (existingProfile) {
          return res.status(409).json({ 
            success: false, 
            message: 'Phone number already registered. Please Sign In instead.' 
          });
        }

        // Check rate limiting
        const rateLimit = await canRequestOTP(formattedPhone);
        if (!rateLimit.canRequest) {
          const waitMinutes = rateLimit.waitTime ? Math.ceil(rateLimit.waitTime / 60) : 5;
          return res.status(429).json({ 
            success: false, 
            message: `Please wait ${waitMinutes} minute(s) before requesting another OTP.` 
          });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const logId = await logOTP(formattedPhone, otp, 'pending');
        
        const smsResult = await sendSMS(formattedPhone, otp);
        
        if (smsResult.success) {
          await updateOTPLog(logId, 'sent', smsResult);
        } else {
          await updateOTPLog(logId, 'failed', { error: 'SMS send failed' });
        }

        // Return debug OTP in development
        const response: any = {
          success: true,
          message: 'OTP sent successfully. Please verify to complete registration.',
          mode: 'signup'
        };

        if (process.env.NODE_ENV === 'development' && logId) {
          const { data: otpData } = await supabase
            .from('otp_logs')
            .select('otp')
            .eq('id', logId)
            .single();
          
          if (otpData) {
            response.debug = { otp: otpData.otp };
          }
        }

        return res.json(response);
      } catch (error: any) {
        return res.status(400).json({ 
          success: false, 
          message: error.message || 'Failed to send OTP' 
        });
      }
    }

    // ===== SIGNIN SEND OTP =====
    // POST /api/auth?action=signin-send-otp
    if (action === 'signin-send-otp' && req.method === 'POST') {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);
        const supabase = getSupabase();

        // Check if phone exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (!existingProfile) {
          // Check auth.users
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const existingAuthUser = authUsers?.users?.find(
            (u: any) => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
          );

          if (!existingAuthUser) {
            return res.status(404).json({ 
              success: false, 
              message: 'Phone number not registered. Please Sign Up first.' 
            });
          }
        }

        // Check rate limiting
        const rateLimit = await canRequestOTP(formattedPhone);
        if (!rateLimit.canRequest) {
          const waitMinutes = rateLimit.waitTime ? Math.ceil(rateLimit.waitTime / 60) : 5;
          return res.status(429).json({ 
            success: false, 
            message: `Please wait ${waitMinutes} minute(s) before requesting another OTP.` 
          });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const logId = await logOTP(formattedPhone, otp, 'pending');
        
        const smsResult = await sendSMS(formattedPhone, otp);
        
        if (smsResult.success) {
          await updateOTPLog(logId, 'sent', smsResult);
        } else {
          await updateOTPLog(logId, 'failed', { error: 'SMS send failed' });
        }

        const response: any = {
          success: true,
          message: existingProfile?.full_name 
            ? `Welcome back! OTP sent to verify your identity.`
            : 'OTP sent successfully.',
          mode: 'signin',
          userName: existingProfile?.full_name || null
        };

        if (process.env.NODE_ENV === 'development' && logId) {
          const { data: otpData } = await supabase
            .from('otp_logs')
            .select('otp')
            .eq('id', logId)
            .single();
          
          if (otpData) {
            response.debug = { otp: otpData.otp };
          }
        }

        return res.json(response);
      } catch (error: any) {
        return res.status(400).json({ 
          success: false, 
          message: error.message || 'Failed to send OTP' 
        });
      }
    }

    // ===== SIGNUP VERIFY OTP =====
    // POST /api/auth?action=signup-verify-otp
    if (action === 'signup-verify-otp' && req.method === 'POST') {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);

        // Verify OTP
        const verifyResult = await verifyOTPCode(formattedPhone, otp);
        if (!verifyResult.success) {
          return res.status(401).json({
            success: false,
            verified: false,
            message: verifyResult.error || 'Invalid OTP'
          });
        }

        // Double-check user doesn't exist
        const supabase = getSupabase();
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (existingProfile) {
          return res.status(409).json({
            success: false,
            message: 'Phone number already registered. Please Sign In instead.'
          });
        }

        // Create new user session
        const session = await createSessionForSignUp(formattedPhone);
        
        return res.json({
          success: true,
          verified: true,
          message: 'Registration successful! Please complete your profile.',
          token: session.token,
          user: session.user
        });
      } catch (error: any) {
        console.error('[Auth] Signup verify error:', error);
        return res.status(500).json({ 
          success: false, 
          message: error.message || 'Failed to create account' 
        });
      }
    }

    // ===== SIGNIN VERIFY OTP =====
    // POST /api/auth?action=signin-verify-otp
    if (action === 'signin-verify-otp' && req.method === 'POST') {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);

        // Verify OTP
        const verifyResult = await verifyOTPCode(formattedPhone, otp);
        if (!verifyResult.success) {
          return res.status(401).json({
            success: false,
            verified: false,
            message: verifyResult.error || 'Invalid OTP'
          });
        }

        // Get existing user session
        const session = await createSessionForSignIn(formattedPhone);
        
        const welcomeMessage = session.user.fullName
          ? `Welcome back, ${session.user.fullName}!`
          : 'Login successful!';

        return res.json({
          success: true,
          verified: true,
          message: welcomeMessage,
          token: session.token,
          user: session.user
        });
      } catch (error: any) {
        console.error('[Auth] Signin verify error:', error);
        
        if (error.message.includes('not found') || error.message.includes('not registered')) {
          return res.status(404).json({ 
            success: false, 
            message: 'Phone number not registered. Please Sign Up first.' 
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          message: error.message || 'Login failed' 
        });
      }
    }

    // ===== RESEND OTP =====
    // POST /api/auth?action=resend-otp
    if (action === 'resend-otp' && req.method === 'POST') {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);

        // Check rate limiting
        const rateLimit = await canRequestOTP(formattedPhone);
        if (!rateLimit.canRequest) {
          const waitMinutes = rateLimit.waitTime ? Math.ceil(rateLimit.waitTime / 60) : 5;
          return res.status(429).json({ 
            success: false, 
            message: `Please wait ${waitMinutes} minute(s) before requesting another OTP.` 
          });
        }

        // Generate and send new OTP
        const otp = generateOTP();
        const logId = await logOTP(formattedPhone, otp, 'pending');
        
        const smsResult = await sendSMS(formattedPhone, otp);
        
        if (smsResult.success) {
          await updateOTPLog(logId, 'sent', smsResult);
        } else {
          await updateOTPLog(logId, 'failed', { error: 'SMS send failed' });
        }

        const response: any = {
          success: true,
          message: 'OTP resent successfully'
        };

        if (process.env.NODE_ENV === 'development' && logId) {
          const supabase = getSupabase();
          const { data: otpData } = await supabase
            .from('otp_logs')
            .select('otp')
            .eq('id', logId)
            .single();
          
          if (otpData) {
            response.debug = { otp: otpData.otp };
          }
        }

        return res.json(response);
      } catch (error: any) {
        return res.status(400).json({ 
          success: false, 
          message: error.message || 'Failed to resend OTP' 
        });
      }
    }

    // ===== LEGACY SEND OTP (auto-detect) =====
    // POST /api/auth?action=send-otp
    if (action === 'send-otp' && req.method === 'POST') {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);

        // Check rate limiting
        const rateLimit = await canRequestOTP(formattedPhone);
        if (!rateLimit.canRequest) {
          const waitMinutes = rateLimit.waitTime ? Math.ceil(rateLimit.waitTime / 60) : 5;
          return res.status(429).json({ 
            success: false, 
            message: `Please wait ${waitMinutes} minute(s) before requesting another OTP.` 
          });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const logId = await logOTP(formattedPhone, otp, 'pending');
        
        const smsResult = await sendSMS(formattedPhone, otp);
        
        if (smsResult.success) {
          await updateOTPLog(logId, 'sent', smsResult);
        } else {
          await updateOTPLog(logId, 'failed', { error: 'SMS send failed' });
        }

        const response: any = {
          success: true,
          message: 'OTP sent successfully',
          data: {
            messageId: smsResult.messageId,
            requestId: smsResult.requestId,
            logId
          }
        };

        if (process.env.NODE_ENV === 'development' && logId) {
          const supabase = getSupabase();
          const { data: otpData } = await supabase
            .from('otp_logs')
            .select('otp')
            .eq('id', logId)
            .single();
          
          if (otpData) {
            response.debug = { otp: otpData.otp };
          }
        }

        return res.json(response);
      } catch (error: any) {
        return res.status(400).json({ 
          success: false, 
          message: error.message || 'Failed to send OTP' 
        });
      }
    }

    // ===== CHECK RATE LIMIT =====
    // GET /api/auth?action=check-rate-limit&phone=9876543210
    if (action === 'check-rate-limit' && req.method === 'GET') {
      const phone = req.query.phone as string;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);
        const rateLimit = await canRequestOTP(formattedPhone);

        if (rateLimit.canRequest) {
          return res.json({
            success: true,
            canRequest: true
          });
        } else {
          const waitMinutes = rateLimit.waitTime ? Math.ceil(rateLimit.waitTime / 60) : 5;
          return res.status(429).json({
            success: false,
            canRequest: false,
            waitTime: rateLimit.waitTime,
            waitMinutes,
            message: `Please wait ${waitMinutes} minute(s) before requesting another OTP.`
          });
        }
      } catch (error: any) {
        return res.json({
          success: true,
          canRequest: true // Fail open
        });
      }
    }

    // ===== LEGACY VERIFY OTP (with mode) =====
    // POST /api/auth?action=verify-otp
    if (action === 'verify-otp' && req.method === 'POST') {
      const { phone, otp, mode = 'signin' } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP required' });
      }

      try {
        const formattedPhone = formatPhoneNumber(phone);

        // Verify OTP
        const verifyResult = await verifyOTPCode(formattedPhone, otp);
        if (!verifyResult.success) {
          return res.status(401).json({
            success: false,
            verified: false,
            message: verifyResult.error || 'Invalid OTP'
          });
        }

        // Create session based on mode
        let session;
        if (mode === 'signup') {
          session = await createSessionForSignUp(formattedPhone);
        } else {
          session = await createSessionForSignIn(formattedPhone);
        }

        return res.json({
          success: true,
          verified: true,
          message: 'OTP verified successfully',
          token: session.token,
          user: session.user
        });
      } catch (error: any) {
        console.error('[Auth] Verify OTP error:', error);
        return res.status(500).json({ 
          success: false, 
          message: error.message || 'OTP verified but failed to create session' 
        });
      }
    }

    // Invalid action
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid action. Use: check-phone, signup-send-otp, signin-send-otp, signup-verify-otp, signin-verify-otp, send-otp, verify-otp, resend-otp, check-rate-limit' 
    });

  } catch (error: any) {
    console.error('[Auth] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}

