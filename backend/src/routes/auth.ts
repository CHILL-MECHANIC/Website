import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sendOTP, verifyOTP, resendOTP, formatPhoneNumber } from '../services/otpService';
import { createSessionForSignUp, createSessionForSignIn } from '../services/sessionService';
import { supabase } from '../config/supabase';
import { APIError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Schemas
const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15)
});

const verifySchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(4, 'OTP must be 4 digits').regex(/^\d{4}$/, 'OTP must be numeric'),
  mode: z.enum(['signin', 'signup']).default('signin')
});

/**
 * Check if phone is registered
 * GET /api/auth/check-phone?phone=9876543210
 */
router.get('/check-phone', asyncHandler(async (req: Request, res: Response) => {
  const phone = req.query.phone as string;
  
  if (!phone) {
    throw new APIError(400, 'Phone number is required');
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    // Check in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, is_profile_complete')
      .eq('phone', formattedPhone)
      .maybeSingle();
    
    type ProfileData = { id: string; full_name: string | null; is_profile_complete: boolean | null } | null;
    const profileData: ProfileData = profile;

    // Also check auth.users (user might exist in auth but not profiles)
    let existsInAuth = false;
    if (!profile) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find(
        u => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
      );
      existsInAuth = !!existingAuthUser;
    }

    res.json({
      success: true,
      exists: !!profileData || existsInAuth,
      isProfileComplete: (profileData as any)?.is_profile_complete || false,
      hasName: !!(profileData as any)?.full_name
    });
  } catch (error: any) {
    console.error('[AUTH] Check phone error:', error);
    res.json({
      success: true,
      exists: false,
      isProfileComplete: false,
      hasName: false
    });
  }
}));

/**
 * SIGN UP - Send OTP for new user registration
 * POST /api/auth/signup/send-otp
 */
router.post('/signup/send-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = phoneSchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone } = validation.data;
  const formattedPhone = formatPhoneNumber(phone);

  // Check if phone already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', formattedPhone)
    .maybeSingle();

  if (existingProfile) {
    throw new APIError(409, 'Phone number already registered. Please Sign In instead.');
  }

  // Also check auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = authUsers?.users?.find(
    u => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
  );

  if (existingAuthUser) {
    // User exists in auth but not in profiles - clean up needed
    // Create profile for this user
    await supabase.from('profiles').insert({
      user_id: existingAuthUser.id,
      phone: formattedPhone
    } as any);
    
    throw new APIError(409, 'Phone number already registered. Please Sign In instead.');
  }

  // Send OTP
  const result = await sendOTP(phone);

  if (!result.success) {
    throw new APIError(400, result.error || 'Failed to send OTP');
  }

  res.json({
    success: true,
    message: 'OTP sent successfully. Please verify to complete registration.',
    mode: 'signup'
  });
}));

/**
 * SIGN IN - Send OTP for existing user login
 * POST /api/auth/signin/send-otp
 */
router.post('/signin/send-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = phoneSchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone } = validation.data;
  const formattedPhone = formatPhoneNumber(phone);

  // Check if phone exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('phone', formattedPhone)
    .maybeSingle();

  if (!existingProfile) {
    // Also check auth.users (user might exist in auth but not profiles)
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(
      u => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
    );

    if (!existingAuthUser) {
      throw new APIError(404, 'Phone number not registered. Please Sign Up first.');
    }

    // User exists in auth but not profiles - create profile
    await supabase.from('profiles').insert({
      user_id: existingAuthUser.id,
      phone: formattedPhone
    } as any);
  }

  // Send OTP
  const result = await sendOTP(phone);

  if (!result.success) {
    throw new APIError(400, result.error || 'Failed to send OTP');
  }

  const profileData = existingProfile as { id: string; full_name: string | null } | null;
  
  res.json({
    success: true,
    message: (profileData as any)?.full_name 
      ? `Welcome back! OTP sent to verify your identity.`
      : 'OTP sent successfully.',
    mode: 'signin',
    userName: (profileData as any)?.full_name || null
  });
}));

/**
 * LEGACY - Send OTP (auto-detect mode)
 * POST /api/auth/send-otp
 */
router.post('/send-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = phoneSchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone } = validation.data;
  const result = await sendOTP(phone);

  if (!result.success) {
    throw new APIError(400, result.error || 'Failed to send OTP');
  }

  // Build response according to API documentation template
  const response: any = {
    success: true,
    message: 'OTP sent successfully',
    data: {
      messageId: result.messageId,
      requestId: result.requestId,
      logId: result.logId
    }
  };

  // Add debug OTP in development mode
  if (process.env.NODE_ENV === 'development' && result.logId) {
    try {
      const { data: otpData } = await supabase
        .from('otp_logs')
        .select('otp')
        .eq('id', result.logId)
        .single();
      
      if (otpData) {
        response.debug = { otp: (otpData as any).otp };
      }
    } catch (error) {
      console.warn('[AUTH] Failed to fetch OTP for debug:', error);
    }
  }

  res.json(response);
}));

/**
 * SIGN UP - Verify OTP and create new user
 * POST /api/auth/signup/verify-otp
 */
router.post('/signup/verify-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = verifySchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone, otp } = validation.data;
  const formattedPhone = formatPhoneNumber(phone);

  // Verify OTP
  const verifyResult = await verifyOTP(phone, otp);

  if (!verifyResult.success) {
    return res.status(401).json({
      success: false,
      verified: false,
      message: verifyResult.error || 'Invalid OTP'
    });
  }

  // Double-check user doesn't exist (race condition protection)
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
  try {
    const session = await createSessionForSignUp(formattedPhone);
    
    res.json({
      success: true,
      verified: true,
      message: 'Registration successful! Please complete your profile.',
      token: session.token,
      user: session.user
    });
  } catch (error: any) {
    console.error('[AUTH] Sign Up session error:', error);
    throw new APIError(500, error.message || 'Failed to create account');
  }
}));

/**
 * SIGN IN - Verify OTP and login existing user
 * POST /api/auth/signin/verify-otp
 */
router.post('/signin/verify-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = verifySchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone, otp } = validation.data;
  const formattedPhone = formatPhoneNumber(phone);

  // Verify OTP
  const verifyResult = await verifyOTP(phone, otp);

  if (!verifyResult.success) {
    return res.status(401).json({
      success: false,
      verified: false,
      message: verifyResult.error || 'Invalid OTP'
    });
  }

  // Get existing user
  try {
    const session = await createSessionForSignIn(formattedPhone);
    
    const welcomeMessage = session.user.fullName
      ? `Welcome back, ${session.user.fullName}!`
      : 'Login successful!';

    res.json({
      success: true,
      verified: true,
      message: welcomeMessage,
      token: session.token,
      user: session.user
    });
  } catch (error: any) {
    console.error('[AUTH] Sign In session error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not registered')) {
      throw new APIError(404, 'Phone number not registered. Please Sign Up first.');
    }
    
    throw new APIError(500, error.message || 'Login failed');
  }
}));

/**
 * LEGACY - Verify OTP (auto-detect mode)
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = verifySchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone, otp, mode } = validation.data;

  // Verify OTP first
  const verifyResult = await verifyOTP(phone, otp);

  if (!verifyResult.success) {
    return res.status(401).json({
      success: false,
      verified: false,
      message: verifyResult.error || 'Invalid OTP'
    });
  }

  // Route to appropriate handler based on mode
  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    let session;
    
    if (mode === 'signup') {
      session = await createSessionForSignUp(formattedPhone);
    } else {
      session = await createSessionForSignIn(formattedPhone);
    }

    res.json({
      success: true,
      verified: true,
      message: 'OTP verified successfully',
      token: session.token,
      user: session.user
    });
  } catch (error: any) {
    console.error('[AUTH] Session creation error:', error);
    throw new APIError(500, `OTP verified but failed to create session: ${error.message}`);
  }
}));

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
router.post('/resend-otp', asyncHandler(async (req: Request, res: Response) => {
  const validation = phoneSchema.safeParse(req.body);
  if (!validation.success) {
    throw new APIError(400, validation.error.errors[0].message);
  }

  const { phone } = validation.data;
  const result = await resendOTP(phone);

  if (!result.success) {
    throw new APIError(400, result.error || 'Failed to resend OTP');
  }

  res.json({
    success: true,
    message: 'OTP resent successfully'
  });
}));

export default router;
