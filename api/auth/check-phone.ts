import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, formatPhoneNumber, setCorsHeaders } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const phone = req.query.phone as string;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, is_profile_complete')
      .eq('phone', formattedPhone)
      .maybeSingle();

    // Also check auth.users
    let existsInAuth = false;
    if (!profile) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find(
        u => (u as any).phone === `+${formattedPhone}` || (u as any).phone === formattedPhone
      );
      existsInAuth = !!existingAuthUser;
    }

    res.status(200).json({
      success: true,
      exists: !!profile || existsInAuth,
      isProfileComplete: profile?.is_profile_complete || false,
      hasName: !!profile?.full_name
    });
  } catch (error: any) {
    console.error('Check phone error:', error);
    res.status(200).json({
      success: true,
      exists: false,
      isProfileComplete: false,
      hasName: false
    });
  }
}

