import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, setCorsHeaders } from '../lib/supabase';
import { verifyToken } from '../lib/jwt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const { userId } = decoded;

  if (req.method === 'GET') {
    // Get profile
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
        addressLine1: profile.address_line1 || profile.address,
        addressLine2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        country: profile.country || 'India',
        isProfileComplete: profile.is_profile_complete || false,
        authMethod: profile.auth_method || 'phone'
      }
    });
  }

  if (req.method === 'PUT') {
    // Update profile
    const data = req.body;
    
    const isProfileComplete = !!(data.fullName && data.fullName.length >= 2);

    const updateData: Record<string, any> = {
      is_profile_complete: isProfileComplete,
      updated_at: new Date().toISOString()
    };

    if (data.fullName !== undefined && data.fullName) updateData.full_name = data.fullName;
    if (data.email !== undefined && data.email) updateData.email = data.email;
    if (data.phone !== undefined && data.phone) updateData.phone = data.phone?.replace(/^\+/, '');
    if (data.dateOfBirth !== undefined && data.dateOfBirth) updateData.date_of_birth = data.dateOfBirth;
    if (data.gender !== undefined && data.gender) updateData.gender = data.gender;
    if (data.addressLine1 !== undefined && data.addressLine1) {
      updateData.address_line1 = data.addressLine1;
      updateData.address = data.addressLine1; // Backward compatibility
    }
    if (data.addressLine2 !== undefined && data.addressLine2) updateData.address_line2 = data.addressLine2;
    if (data.city !== undefined && data.city) updateData.city = data.city;
    if (data.state !== undefined && data.state) updateData.state = data.state;
    if (data.pincode !== undefined && data.pincode) updateData.pincode = data.pincode;

    console.log('[Profile API] Updating profile for user:', userId);
    console.log('[Profile API] Update data:', updateData);

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Profile API] Update error:', error);
      return res.status(500).json({ success: false, message: `Failed to update: ${error.message}` });
    }

    console.log('[Profile API] Update successful');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: profile.user_id,
        phone: profile.phone,
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        addressLine1: profile.address_line1 || profile.address,
        addressLine2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        isProfileComplete: profile.is_profile_complete || false,
        authMethod: profile.auth_method || 'phone'
      }
    });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

