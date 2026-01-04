import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySupabaseToken, createSupabaseAdmin } from './_lib/supabase';

// Helper to find profile by userId (handles both user_id and id columns)
async function findProfile(supabase: ReturnType<typeof createSupabaseAdmin>, userId: string) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  const { user, error: authError } = await verifySupabaseToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ success: false, message: authError || 'Authorization required' });
  }

  const userId = user.id;
  const supabase = createSupabaseAdmin();

  try {
    // ===== GET PROFILE =====
    if (req.method === 'GET') {
      console.log('[Profile] GET - Fetching profile for user:', userId);

      const { data: profile, error } = await findProfile(supabase, userId);

      if (error) {
        console.error('[Profile] GET error:', error);
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      const profileData = profile as any;
      console.log('[Profile] GET - Found profile for user:', profileData.user_id || profileData.id);

      // Map database columns to API response
      return res.json({
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
    }

    // ===== UPDATE PROFILE =====
    if (req.method === 'PUT') {
      console.log('[Profile] PUT - Updating profile for user:', userId);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Profile] PUT - Request body:', JSON.stringify(req.body, null, 2));
      } else {
        console.log('[Profile] PUT - Updating profile');
      }

      const {
        fullName,
        email,
        phone,
        dateOfBirth,
        gender,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        avatarUrl
      } = req.body;

      // Build update object
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      // Full name - required for profile completion
      if (fullName && fullName.trim()) {
        updateData.full_name = fullName.trim();
        updateData.is_profile_complete = true;
      }

      // Email
      if (email && email.trim()) {
        updateData.email = email.trim();
      }
      
      // Phone (don't update if signed in with phone)
      if (phone && phone.trim()) {
        updateData.phone = phone.replace(/^\+/, '').replace(/\s/g, '').trim();
      }
      
      // Date of birth
      if (dateOfBirth && dateOfBirth.trim()) {
        updateData.date_of_birth = dateOfBirth;
      }
      
      // Gender
      if (gender && gender.trim() && ['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        updateData.gender = gender;
      }
      
      // Address fields
      if (addressLine1 && addressLine1.trim()) {
        updateData.address_line1 = addressLine1.trim();
        updateData.address = addressLine1.trim(); // Backwards compatibility
      }
      
      if (addressLine2 && addressLine2.trim()) {
        updateData.address_line2 = addressLine2.trim();
      }
      
      if (city && city.trim()) {
        updateData.city = city.trim();
      }
      
      if (state && state.trim()) {
        updateData.state = state.trim();
      }
      
      if (pincode && pincode.trim()) {
        updateData.pincode = pincode.trim();
      }
      
      if (avatarUrl && avatarUrl.trim()) {
        updateData.avatar_url = avatarUrl.trim();
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Profile] PUT - Update data:', JSON.stringify(updateData, null, 2));
      }

      // Try to update by user_id first
      let result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      // If no rows updated, try by id
      if (!result.data && !result.error) {
        console.log('[Profile] PUT - No profile found by user_id, trying id...');
        result = await supabase
          .from('profiles')
          .update(updateData)
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
          
          if (fullName) minimalUpdate.full_name = fullName.trim();
          if (email) minimalUpdate.email = email.trim();
          if (addressLine1) minimalUpdate.address = addressLine1.trim();
          if (city) minimalUpdate.city = city.trim();
          if (state) minimalUpdate.state = state.trim();
          if (pincode) minimalUpdate.pincode = pincode.trim();

          const minResult = await supabase
            .from('profiles')
            .update(minimalUpdate)
            .eq('user_id', userId)
            .select()
            .maybeSingle();

          if (minResult.error) {
            console.error('[Profile] PUT - Minimal update error:', minResult.error);
            return res.status(500).json({ 
              success: false, 
              message: `Failed to update profile: ${minResult.error.message}` 
            });
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
        
        return res.status(500).json({ 
          success: false, 
          message: `Failed to update profile: ${result.error.message}` 
        });
      }

      if (!result.data) {
        console.error('[Profile] PUT - No profile found for user:', userId);
        return res.status(404).json({ 
          success: false, message: 'Profile not found' 
        });
      }

      const profileData = result.data as any;

      console.log('[Profile] PUT - Update successful for user:', profileData.user_id || profileData.id);

      return res.json({
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
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Profile] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}

