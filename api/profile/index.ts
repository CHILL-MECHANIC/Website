import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Verify auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const { userId } = decoded;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (req.method === 'GET') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      return res.status(200).json({
        success: true,
        profile: {
          id: profile.user_id,
          phone: profile.phone,
          email: profile.email,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          dateOfBirth: profile.date_of_birth,
          gender: profile.gender,
          addressLine1: profile.address_line1,
          addressLine2: profile.address_line2,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          country: profile.country,
          isProfileComplete: profile.is_profile_complete,
          authMethod: profile.auth_method
        }
      });
    }

    if (req.method === 'PUT') {
      const data = req.body || {};
      const isProfileComplete = !!(data.fullName && data.fullName.length >= 2);

      const updateData: Record<string, any> = {
        is_profile_complete: isProfileComplete,
        updated_at: new Date().toISOString()
      };

      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone?.replace(/^\+/, '');
      if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1;
      if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.state !== undefined) updateData.state = data.state;
      if (data.pincode !== undefined) updateData.pincode = data.pincode;

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, message: `Failed to update: ${error.message}` });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          id: profile.user_id,
          phone: profile.phone,
          email: profile.email,
          fullName: profile.full_name,
          isProfileComplete: profile.is_profile_complete,
          authMethod: profile.auth_method
        }
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Profile error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
