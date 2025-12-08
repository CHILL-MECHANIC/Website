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

    // Find profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (!profile) {
      // Check auth.users and create profile if missing
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const users = authUsers?.users || [];
      const existingAuthUser = users.find(
        (u: any) => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
      );

      if (!existingAuthUser) {
        return res.status(404).json({ success: false, message: 'User not found. Please Sign Up first.' });
      }

      // Create missing profile
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          user_id: existingAuthUser.id,
          phone: formattedPhone,
          auth_method: 'phone',
          is_profile_complete: false,
          login_count: 1,
          last_login_at: new Date().toISOString()
        })
        .select()
        .single();

      profile = newProfile;
    } else {
      // Update login count
      await supabase
        .from('profiles')
        .update({
          login_count: (profile.login_count || 0) + 1,
          last_login_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: profile.user_id,
        phone: formattedPhone,
        authMethod: 'phone',
        isProfileComplete: profile.is_profile_complete || false
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      verified: true,
      message: profile.full_name ? `Welcome back, ${profile.full_name}!` : 'Login successful!',
      token,
      user: {
        id: profile.user_id,
        phone: formattedPhone,
        email: profile.email || null,
        fullName: profile.full_name || null,
        avatarUrl: profile.avatar_url || null,
        isProfileComplete: profile.is_profile_complete || false,
        authMethod: 'phone',
        isNewUser: false
      }
    });
  } catch (error: any) {
    console.error('Sign In Verify OTP error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
}
