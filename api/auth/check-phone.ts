import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const phone = req.query.phone as string;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, is_profile_complete')
      .eq('phone', formattedPhone)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      exists: !!profile,
      isProfileComplete: profile?.is_profile_complete || false,
      hasName: !!profile?.full_name
    });
  } catch (error: any) {
    console.error('Check phone error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
