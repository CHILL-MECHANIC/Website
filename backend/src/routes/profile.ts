import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { verifySession, JWTPayload } from '../services/sessionService';
import { APIError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Auth middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError(401, 'Authorization required');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifySession(token);

  if (!decoded) {
    throw new APIError(401, 'Invalid or expired token');
  }

  (req as any).user = decoded;
  next();
};

// Flexible validation schema - accepts empty strings and nulls
const updateProfileSchema = z.object({
  fullName: z.string().max(255).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(15).optional().nullable(),
  dateOfBirth: z.string().optional().nullable().or(z.literal('')),
  gender: z.string().optional().nullable().or(z.literal('')),
  addressLine1: z.string().max(255).optional().nullable().or(z.literal('')),
  addressLine2: z.string().max(255).optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable().or(z.literal('')),
  state: z.string().max(100).optional().nullable().or(z.literal('')),
  pincode: z.string().max(10).optional().nullable().or(z.literal('')),
  avatarUrl: z.string().optional().nullable().or(z.literal(''))
});

// Helper to find profile by userId
async function findProfile(userId: string) {
  // Try user_id first
  let result = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (result.data) return result;

  // Try id as fallback
  result = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return result;
}

// GET /api/profile
router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as any).user as JWTPayload;

  console.log('[Profile] GET - Fetching profile for user:', userId);

  const { data: profile, error } = await findProfile(userId);

  if (error) {
    console.error('[Profile] GET error:', error);
    throw new APIError(404, 'Profile not found');
  }

  if (!profile) {
    throw new APIError(404, 'Profile not found');
  }

  const profileAny = profile as any;
  console.log('[Profile] GET - Found profile for user:', profileAny.user_id || profileAny.id);

  // Map database columns to API response
  const profileData = profile as any;
  
  res.json({
    success: true,
    profile: {
      id: profileData.user_id || profileData.id,
      phone: profileData.phone || null,
      email: profileData.email || null,
      fullName: profileData.full_name || null,
      avatarUrl: profileData.avatar_url || null,
      dateOfBirth: profileData.date_of_birth || null,
      gender: profileData.gender || null,
      addressLine1: profileData.address_line1 || profileData.address || null,
      addressLine2: profileData.address_line2 || null,
      city: profileData.city || null,
      state: profileData.state || null,
      pincode: profileData.pincode || null,
      country: profileData.country || 'India',
      isProfileComplete: profileData.is_profile_complete || !!(profileData.full_name),
      authMethod: profileData.auth_method || 'phone',
      createdAt: profileData.created_at
    }
  });
}));

// PUT /api/profile
router.put('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as any).user as JWTPayload;

  console.log('[Profile] PUT - Updating profile for user:', userId);
  console.log('[Profile] PUT - Request body:', JSON.stringify(req.body, null, 2));

  const validation = updateProfileSchema.safeParse(req.body);
  if (!validation.success) {
    console.error('[Profile] PUT - Validation error:', validation.error.errors);
    throw new APIError(400, validation.error.errors[0].message);
  }

  const data = validation.data;
  
  // Build update object
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  // Full name - required for profile completion
  if (data.fullName && data.fullName.trim()) {
    updateData.full_name = data.fullName.trim();
    updateData.is_profile_complete = true;
  }

  // Email
  if (data.email && data.email.trim()) {
    updateData.email = data.email.trim();
  }
  
  // Phone (don't update if signed in with phone)
  if (data.phone && data.phone.trim()) {
    updateData.phone = data.phone.replace(/^\+/, '').replace(/\s/g, '').trim();
  }
  
  // Date of birth
  if (data.dateOfBirth && data.dateOfBirth.trim()) {
    updateData.date_of_birth = data.dateOfBirth;
  }
  
  // Gender
  if (data.gender && data.gender.trim() && ['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
    updateData.gender = data.gender;
  }
  
  // Address fields
  if (data.addressLine1 && data.addressLine1.trim()) {
    updateData.address_line1 = data.addressLine1.trim();
    updateData.address = data.addressLine1.trim(); // Backwards compatibility
  }
  
  if (data.addressLine2 && data.addressLine2.trim()) {
    updateData.address_line2 = data.addressLine2.trim();
  }
  
  if (data.city && data.city.trim()) {
    updateData.city = data.city.trim();
  }
  
  if (data.state && data.state.trim()) {
    updateData.state = data.state.trim();
  }
  
  if (data.pincode && data.pincode.trim()) {
    updateData.pincode = data.pincode.trim();
  }
  
  if (data.avatarUrl && data.avatarUrl.trim()) {
    updateData.avatar_url = data.avatarUrl.trim();
  }

  console.log('[Profile] PUT - Update data:', JSON.stringify(updateData, null, 2));

  // Try to update by user_id first
  let result = await supabase
    .from('profiles')
    .update(updateData as never)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  // If no rows updated, try by id
  if (!result.data && !result.error) {
    console.log('[Profile] PUT - No profile found by user_id, trying id...');
    result = await supabase
      .from('profiles')
      .update(updateData as never)
      .eq('id', userId)
      .select()
      .maybeSingle();
  }

  if (result.error) {
    console.error('[Profile] PUT - Update error:', result.error);
    
    // If column doesn't exist, try with minimal fields
    if (result.error.message.includes('column') || result.error.code === '42703') {
      console.log('[Profile] PUT - Column error, trying minimal update...');
      
      const minimalUpdate: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (data.fullName) minimalUpdate.full_name = data.fullName.trim();
      if (data.email) minimalUpdate.email = data.email.trim();
      if (data.addressLine1) minimalUpdate.address = data.addressLine1.trim();
      if (data.city) minimalUpdate.city = data.city.trim();
      if (data.state) minimalUpdate.state = data.state.trim();
      if (data.pincode) minimalUpdate.pincode = data.pincode.trim();

      const minResult = await supabase
        .from('profiles')
        .update(minimalUpdate as never)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (minResult.error) {
        console.error('[Profile] PUT - Minimal update error:', minResult.error);
        throw new APIError(500, `Failed to update profile: ${minResult.error.message}`);
      }

      if (minResult.data) {
        const minProfileData = minResult.data as any;
        return res.json({
          success: true,
          message: 'Profile updated successfully',
          profile: {
            id: minProfileData.user_id || minProfileData.id,
            phone: minProfileData.phone || null,
            email: minProfileData.email || null,
            fullName: minProfileData.full_name || null,
            avatarUrl: minProfileData.avatar_url || null,
            isProfileComplete: !!(minProfileData.full_name),
            authMethod: minProfileData.auth_method || 'phone'
          }
        });
      }
    }
    
    throw new APIError(500, `Failed to update profile: ${result.error.message}`);
  }

  if (!result.data) {
    console.error('[Profile] PUT - No profile found for user:', userId);
    throw new APIError(404, 'Profile not found');
  }

  const profileData = result.data as any;

  console.log('[Profile] PUT - Update successful for user:', profileData.user_id || profileData.id);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    profile: {
      id: profileData.user_id || profileData.id,
      phone: profileData.phone || null,
      email: profileData.email || null,
      fullName: profileData.full_name || null,
      avatarUrl: profileData.avatar_url || null,
      dateOfBirth: profileData.date_of_birth || null,
      gender: profileData.gender || null,
      addressLine1: profileData.address_line1 || profileData.address || null,
      addressLine2: profileData.address_line2 || null,
      city: profileData.city || null,
      state: profileData.state || null,
      pincode: profileData.pincode || null,
      isProfileComplete: profileData.is_profile_complete || !!(profileData.full_name),
      authMethod: profileData.auth_method || 'phone'
    }
  });
}));

export default router;
