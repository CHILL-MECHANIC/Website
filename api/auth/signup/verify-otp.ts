import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.startsWith('91') && digits.length === 12) digits = digits.substring(2);
  if (digits.length !== 10) throw new Error('Invalid phone number');
  if (!/^[6-9]/.test(digits)) throw new Error('Invalid Indian mobile number');
  return '91' + digits;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { phone, otp } = req.body || {};
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

    // Mark verified
    await supabase.from('otp_logs').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', otpLog.id);

    // Create user in Supabase Auth
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      phone: `+${formattedPhone}`,
      phone_confirm: true,
      user_metadata: { phone: formattedPhone, auth_method: 'phone' }
    });

    if (authError) {
      console.error('Auth error:', authError);
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
    const token = jwt.sign(
      {
        userId: newUser.user.id,
        phone: formattedPhone,
        authMethod: 'phone',
        isProfileComplete: false
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

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
