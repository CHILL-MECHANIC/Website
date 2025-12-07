import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, formatPhoneNumber, generateOTP, setCorsHeaders } from '../../lib/supabase';
import axios from 'axios';

const OTP_VALIDITY_MINUTES = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check if already registered in profiles
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

    // Check auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const users = authUsers?.users || [];
    const existingAuthUser = users.find(
      (u: any) => u.phone === `+${formattedPhone}` || u.phone === formattedPhone
    );

    if (existingAuthUser) {
      // Create profile for orphaned auth user
      await supabase.from('profiles').insert({
        user_id: existingAuthUser.id,
        phone: formattedPhone
      });
      
      return res.status(409).json({ 
        success: false, 
        message: 'Phone number already registered. Please Sign In instead.' 
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000).toISOString();

    await supabase.from('otp_logs').insert({
      phone: formattedPhone,
      otp,
      status: 'pending',
      expires_at: expiresAt
    });

    // Send SMS
    const message = `Your webapp login OTP is ${otp} From - Chill Mechanic`;

    const smsResponse = await axios.post(
      process.env.SMS_API_URL || 'https://api.uniquedigitaloutreach.com/v1/sms',
      {
        sender: process.env.SMS_SENDER_ID || 'CHLMEH',
        to: formattedPhone,
        text: message,
        type: 'OTP'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SMS_API_KEY
        },
        timeout: 30000
      }
    );

    if (smsResponse.data?.message === 'Message Sent Successfully!') {
      return res.status(200).json({ 
        success: true, 
        message: 'OTP sent successfully. Please verify to complete registration.',
        mode: 'signup'
      });
    } else {
      console.error('SMS API error:', smsResponse.data);
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  } catch (error: any) {
    console.error('Sign Up Send OTP error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
  }
}

