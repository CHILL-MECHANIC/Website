import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export interface JWTPayload {
  userId: string;
  phone: string;
  authMethod: 'phone' | 'email';
  isProfileComplete: boolean;
  iat?: number;
  exp?: number;
}

export interface UserProfile {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isProfileComplete: boolean;
  authMethod: 'phone' | 'email';
  isNewUser: boolean;
}

export interface SessionInfo {
  token: string;
  user: UserProfile;
}

/**
 * Find existing user in Supabase Auth by phone
 */
async function findAuthUserByPhone(phone: string): Promise<string | null> {
  const normalizedPhone = phone.replace(/^\+/, '');
  const phoneWithPlus = `+${normalizedPhone}`;
  
  try {
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('[Session] Error listing auth users:', error);
      return null;
    }

    const existingUser = authUsers.users.find(
      u => u.phone === phoneWithPlus || u.phone === normalizedPhone || u.phone === `+91${normalizedPhone.replace(/^91/, '')}`
    );

    return existingUser?.id || null;
  } catch (error) {
    console.error('[Session] Error in findAuthUserByPhone:', error);
    return null;
  }
}

/**
 * Get user ID from profile - handles both 'id' and 'user_id' schemas
 */
function getProfileUserId(profile: any): string {
  return profile.user_id || profile.id;
}

/**
 * SIGN UP - Create new user and session
 * Only called for NEW users (phone not registered)
 */
export async function createSessionForSignUp(phone: string): Promise<SessionInfo> {
  const normalizedPhone = phone.replace(/^\+/, '');
  const phoneWithPlus = `+${normalizedPhone}`;

  console.log('[Session] SIGN UP - Creating new user for phone:', normalizedPhone);

  // Step 1: Create user in Supabase Auth
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    phone: phoneWithPlus,
    phone_confirm: true,
    user_metadata: {
      phone: normalizedPhone,
      phone_verified: true,
      auth_method: 'phone'
    }
  });

  if (createError) {
    console.error('[Session] Error creating auth user:', createError);
    
    // If user already exists, this is a race condition - handle gracefully
    if (createError.message.includes('already registered') || createError.code === 'phone_exists') {
      throw new Error('Phone number already registered. Please Sign In instead.');
    }
    
    throw new Error(createError.message);
  }

  if (!newUser.user) {
    throw new Error('Failed to create user');
  }

  const userId = newUser.user.id;
  console.log('[Session] Auth user created:', userId);

  // Step 2: Create profile - use user_id for original schema compatibility
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      phone: normalizedPhone,
      email: newUser.user.email || null,
      full_name: null
    } as any)
    .select()
    .single();

  if (profileError) {
    console.error('[Session] Error creating profile:', profileError);
    // User was created but profile failed - try to clean up or continue
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  console.log('[Session] Profile created for user:', userId);

  // Step 3: Create JWT
  const payload: JWTPayload = {
    userId,
    phone: normalizedPhone,
    authMethod: 'phone',
    isProfileComplete: false
  };

  const token = jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);

  return {
    token,
    user: {
      id: userId,
      phone: normalizedPhone,
      email: null,
      fullName: null,
      avatarUrl: null,
      isProfileComplete: false,
      authMethod: 'phone',
      isNewUser: true
    }
  };
}

/**
 * SIGN IN - Login existing user
 * Only for EXISTING users (phone already registered)
 */
export async function createSessionForSignIn(phone: string): Promise<SessionInfo> {
  const normalizedPhone = phone.replace(/^\+/, '');

  console.log('[Session] SIGN IN - Looking up user:', normalizedPhone);

  // STEP 1: Check profiles table by phone
  const { data: profileByPhone, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (profileError) {
    console.error('[Session] Error fetching profile by phone:', profileError);
  }

  if (profileByPhone) {
    // Profile found - update last login and return session
    const profileUserId = getProfileUserId(profileByPhone);
    console.log('[Session] Profile found by phone, user_id:', profileUserId);

    await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      } as never)
      .eq('user_id', profileUserId);

    const payload: JWTPayload = {
      userId: profileUserId,
      phone: normalizedPhone,
      authMethod: 'phone',
      isProfileComplete: (profileByPhone as any).is_profile_complete || false
    };

    const token = jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);

    return {
      token,
      user: {
        id: profileUserId,
        phone: normalizedPhone,
        email: (profileByPhone as any).email || null,
        fullName: (profileByPhone as any).full_name || null,
        avatarUrl: (profileByPhone as any).avatar_url || null,
        isProfileComplete: (profileByPhone as any).is_profile_complete || false,
        authMethod: 'phone',
        isNewUser: false
      }
    };
  }

  // STEP 2: Profile not found by phone - check auth.users
  console.log('[Session] Profile not found by phone, checking auth.users...');
  
  const existingUserId = await findAuthUserByPhone(normalizedPhone);

  if (!existingUserId) {
    throw new Error('Phone number not registered. Please Sign Up first.');
  }

  console.log('[Session] Found auth user:', existingUserId);

  // STEP 3: Check if profile exists by user_id (might have different phone format)
  const { data: profileById } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', existingUserId)
    .maybeSingle();

  if (profileById) {
    // Profile exists but with different phone format - update phone and return
    console.log('[Session] Profile found by user_id, updating phone...');

    await supabase
      .from('profiles')
      .update({
        phone: normalizedPhone,
        updated_at: new Date().toISOString()
      } as never)
      .eq('user_id', existingUserId);

    const payload: JWTPayload = {
      userId: existingUserId,
      phone: normalizedPhone,
      authMethod: 'phone',
      isProfileComplete: (profileById as any).is_profile_complete || false
    };

    const token = jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);

    return {
      token,
      user: {
        id: existingUserId,
        phone: normalizedPhone,
        email: (profileById as any).email || null,
        fullName: (profileById as any).full_name || null,
        avatarUrl: (profileById as any).avatar_url || null,
        isProfileComplete: (profileById as any).is_profile_complete || false,
        authMethod: 'phone',
        isNewUser: false
      }
    };
  }

  // STEP 4: No profile exists - create one
  console.log('[Session] No profile found, creating new profile for auth user...');

  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: existingUserId,
      phone: normalizedPhone
    } as any)
    .select()
    .single();

  if (insertError) {
    console.error('[Session] Error creating profile:', insertError);
    
    // If duplicate key error, try to fetch existing profile
    if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
      console.log('[Session] Duplicate profile detected, fetching existing...');
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', existingUserId)
        .single();

      if (existingProfile) {
        const payload: JWTPayload = {
          userId: existingUserId,
          phone: normalizedPhone,
          authMethod: 'phone',
          isProfileComplete: (existingProfile as any).is_profile_complete || false
        };

        const token = jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);

        return {
          token,
          user: {
            id: existingUserId,
            phone: normalizedPhone,
            email: (existingProfile as any).email || null,
            fullName: (existingProfile as any).full_name || null,
            avatarUrl: (existingProfile as any).avatar_url || null,
            isProfileComplete: (existingProfile as any).is_profile_complete || false,
            authMethod: 'phone',
            isNewUser: false
          }
        };
      }
    }

    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  console.log('[Session] Profile created successfully');

  const payload: JWTPayload = {
    userId: existingUserId,
    phone: normalizedPhone,
    authMethod: 'phone',
    isProfileComplete: false
  };

  const token = jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);

  return {
    token,
    user: {
      id: existingUserId,
      phone: normalizedPhone,
      email: null,
      fullName: null,
      avatarUrl: null,
      isProfileComplete: false,
      authMethod: 'phone',
      isNewUser: false
    }
  };
}

/**
 * LEGACY - Auto-detect sign in or sign up
 * Kept for backward compatibility
 */
export async function createSession(phone: string): Promise<SessionInfo> {
  const normalizedPhone = phone.replace(/^\+/, '');

  // Check if user exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (profile) {
    return createSessionForSignIn(normalizedPhone);
  } else {
    return createSessionForSignUp(normalizedPhone);
  }
}

/**
 * Verify JWT token
 */
export function verifySession(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
