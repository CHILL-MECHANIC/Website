import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, formatPhoneNumber, setCorsHeaders } from '../../lib/supabase';
import { signToken } from '../../lib/jwt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Verify OTP
    const { data: otpLog } = await supabase
      .from('otp_logs')
      .select('*')
      .eq('phone', formattedPhone)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpLog) {
      return res.status(401).json({ success: false, verified: false, message: 'No OTP found. Request a new one.' });
    }

    if (new Date() > new Date(otpLog.expires_at)) {
      await supabase.from('otp_logs').update({ status: 'expired' }).eq('id', otpLog.id);
      return res.status(401).json({ success: false, verified: false, message: 'OTP expired. Request a new one.' });
    }

    if (otpLog.otp !== otp) {
      return res.status(401).json({ success: false, verified: false, message: 'Invalid OTP' });
    }

    // Mark OTP as verified
    await supabase.from('otp_logs').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', otpLog.id);

    // Double-check user doesn't exist (race condition protection)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (existingProfile) {
      return res.status(409).json({ 
        success: false, 
        message: 'Phone number already registered. Please Sign In instead.' 
      });
    }

    // Create user in Supabase Auth
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      phone: `+${formattedPhone}`,
      phone_confirm: true,
      user_metadata: { phone: formattedPhone, auth_method: 'phone' }
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ 
          success: false, 
          message: 'Phone number already registered. Please Sign In instead.' 
        });
      }
      return res.status(500).json({ success: false, message: authError.message });
    }

    // Create profile
    await supabase.from('profiles').insert({
      user_id: newUser.user.id,
      phone: formattedPhone,
      auth_method: 'phone',
      is_profile_complete: false,
      login_count: 1,
      last_login_at: new Date().toISOString()
    });

    // Create JWT
    const token = signToken({
      userId: newUser.user.id,
      phone: formattedPhone,
      authMethod: 'phone',
      isProfileComplete: false
    });

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Registration successful! Please complete your profile.',
      token,
      user: {
        id: newUser.user.id,
        phone: formattedPhone,
        email: null,
        fullName: null,
        avatarUrl: null,
        isProfileComplete: false,
        authMethod: 'phone',
        isNewUser: true
      }
    });
  } catch (error: any) {
    console.error('Sign Up Verify OTP error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
}

