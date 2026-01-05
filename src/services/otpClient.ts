/**
 * OTP Client Service
 * Handles all API communication with the OTP authentication backend
 * 
 * Supports both:
 * - Local development with Express backend (VITE_API_URL=http://localhost:3001)
 * - Production Vercel deployment (uses relative URLs)
 */

/**
 * Checks if we're running on localhost (development)
 */
const isLocalhost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

/**
 * Gets the base API URL
 * - In production (any non-localhost domain): Use empty string for relative URLs
 * - In development (localhost): Use VITE_API_URL or default to localhost:3001
 */
const getApiBaseUrl = (): string => {
  // RUNTIME CHECK: If not on localhost, ALWAYS use relative URLs
  // This ensures production deployments work correctly
  if (!isLocalhost()) {
    return '';
  }
  
  // We're on localhost - check for explicit environment URL
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If explicitly set to empty or 'relative', use empty base (relative URLs)
  if (envUrl === '' || envUrl === 'relative') {
    return '';
  }
  
  // If set to a URL, use it
  if (envUrl) {
    return envUrl.replace(/\/api\/(sms|auth)\/?$/, '').replace(/\/$/, '');
  }
  
  // Default: localhost:3001 for local development only
  return 'http://localhost:3001';
};

const API_BASE = getApiBaseUrl();

// Detect environment: local (Express) vs production (Vercel)
// If API_BASE is set, we're using Express backend (localhost)
// If empty, we're using Vercel serverless functions (production)
const isLocalExpress = !!API_BASE;

/**
 * Builds a full URL for an auth endpoint
 * @param path - The endpoint path (e.g., 'send-otp', 'verify-otp', 'signup/send-otp')
 * @returns Full URL to the endpoint
 */
const buildUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (isLocalExpress) {
    // Local Express backend: separate endpoints
    return `${API_BASE}/api/auth/${cleanPath}`;
  } else {
    // Production Vercel: consolidated endpoint with action query param
    // Map path to action
    const actionMap: Record<string, string> = {
      'check-phone': 'check-phone',
      'send-otp': 'send-otp',
      'verify-otp': 'verify-otp',
      'resend-otp': 'resend-otp',
      'signup/send-otp': 'signup-send-otp',
      'signin/send-otp': 'signin-send-otp',
      'signup/verify-otp': 'signup-verify-otp',
      'signin/verify-otp': 'signin-verify-otp'
    };
    
    const action = actionMap[cleanPath] || cleanPath.replace(/\//g, '-');
    return `${API_BASE}/api/auth?action=${action}`;
  }
};

/**
 * Builds a full URL for a profile endpoint
 */
const buildProfileUrl = (): string => {
  return `${API_BASE}/api/profile`;
};

// Log the API base URL in development for debugging
// Using a function wrapper to ensure proper tree-shaking in production
const logDebugInfo = () => {
  if (import.meta.env.DEV) {
    console.log('[OTP Client] API Base URL:', API_BASE || '(relative)');
    console.log('[OTP Client] Environment:', isLocalExpress ? 'Local Express' : 'Production Vercel');
    console.log('[OTP Client] Auth Base URL:', `${API_BASE}/api/auth`);
  }
};
logDebugInfo();

// Types
export interface BaseResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export interface CheckPhoneResponse extends BaseResponse {
  exists: boolean;
  isProfileComplete: boolean;
  hasName: boolean;
}

export interface SendOTPResponse extends BaseResponse {
  mode?: 'signin' | 'signup';
  userName?: string | null;
  data?: {
    messageId?: string;
    requestId?: string;
    logId?: number;
  };
  debug?: {
    otp?: string;
  };
}

export interface VerifyOTPResponse extends BaseResponse {
  verified?: boolean;
  token?: string;
  user?: {
    id: string;
    phone: string | null;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    isProfileComplete: boolean;
    authMethod: 'phone' | 'email';
    isNewUser: boolean;
  };
}

export interface ResendOTPResponse extends BaseResponse {
  data?: {
    messageId?: string;
    requestId?: string;
  };
  debug?: {
    otp?: string;
  };
}

export interface CheckRateLimitResponse extends BaseResponse {
  canRequest: boolean;
  waitTime?: number;
  waitMinutes?: number;
}

/**
 * Check if phone number is already registered
 */
export async function checkPhone(phone: string): Promise<CheckPhoneResponse> {
  // Build URL based on environment
  let url: string;
  if (isLocalExpress) {
    url = `${API_BASE}/api/auth/check-phone?phone=${encodeURIComponent(phone)}`;
  } else {
    url = `${API_BASE}/api/auth?action=check-phone&phone=${encodeURIComponent(phone)}`;
  }
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Checking phone:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      success: data.success ?? true,
      exists: data.exists ?? false,
      isProfileComplete: data.isProfileComplete ?? false,
      hasName: data.hasName ?? false,
      message: data.message,
      error: data.error
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Check phone error:', error);
    }
    return { 
      success: false, 
      exists: false, 
      isProfileComplete: false, 
      hasName: false, 
      error: 'Network error' 
    };
  }
}

/**
 * SIGN UP - Send OTP for new user
 */
export async function sendSignUpOTP(phone: string): Promise<SendOTPResponse> {
  const url = buildUrl('signup/send-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Sending Sign Up OTP:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message,
        error: data.error || data.message || `Request failed with status ${response.status}`,
        mode: 'signup'
      };
    }
    
    return {
      success: true,
      message: data.message,
      mode: 'signup',
      data: data.data,
      debug: data.debug
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Sign Up OTP error:', error);
    }
    return { success: false, error: 'Network error', mode: 'signup' };
  }
}

/**
 * SIGN IN - Send OTP for existing user
 */
export async function sendSignInOTP(phone: string): Promise<SendOTPResponse> {
  const url = buildUrl('signin/send-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Sending Sign In OTP:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message,
        error: data.error || data.message || `Request failed with status ${response.status}`,
        mode: 'signin'
      };
    }
    
    return {
      success: true,
      message: data.message,
      mode: 'signin',
      userName: data.userName,
      data: data.data,
      debug: data.debug
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Sign In OTP error:', error);
    }
    return { success: false, error: 'Network error', mode: 'signin' };
  }
}

/**
 * SIGN UP - Verify OTP for new user
 */
export async function verifySignUpOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
  const url = buildUrl('signup/verify-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Verifying Sign Up OTP:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        verified: false,
        message: data.message,
        error: data.error || data.message || `Request failed with status ${response.status}`
      };
    }
    
    return {
      success: true,
      verified: data.verified,
      message: data.message,
      token: data.access_token || data.token,
      user: data.user
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Sign Up verify error:', error);
    }
    return { success: false, verified: false, error: 'Network error' };
  }
}

/**
 * SIGN IN - Verify OTP for existing user
 */
export async function verifySignInOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
  const url = buildUrl('signin/verify-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Verifying Sign In OTP:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        verified: false,
        message: data.message,
        error: data.error || data.message || `Request failed with status ${response.status}`
      };
    }
    
    return {
      success: true,
      verified: data.verified,
      message: data.message,
      token: data.access_token || data.token,
      user: data.user
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Sign In verify error:', error);
    }
    return { success: false, verified: false, error: 'Network error' };
  }
}

/**
 * LEGACY - Send OTP (auto-detect)
 */
export async function sendOTP(phone: string): Promise<SendOTPResponse> {
  const url = buildUrl('send-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Sending OTP request:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });

    if (import.meta.env.DEV) {
      console.log('[OTP Client] Response status:', response.status, response.statusText);
    }

    // Check if response has JSON content
    const contentType = response.headers.get('content-type');
    let data: SendOTPResponse;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json() as SendOTPResponse;
    } else {
      const text = await response.text();
      console.error('[OTP Client] Non-JSON response:', text);
      return {
        success: false,
        message: undefined,
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`
      };
    }

    // Handle both success and error responses
    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.error('[OTP Client] Error response:', data);
      }
      return {
        success: false,
        message: data.message,
        error: data.error || `Request failed with status ${response.status}`,
        code: data.code
      };
    }

    if (import.meta.env.DEV) {
      console.log('[OTP Client] Success response:', data);
    }

    return {
      success: true,
      message: data.message || 'OTP sent successfully',
      data: data.data,
      debug: data.debug,
      error: undefined,
      code: data.code
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Fetch error:', error);
    }
    return {
      success: false,
      message: undefined,
      error: error instanceof Error ? error.message : 'Failed to send OTP'
    };
  }
}

/**
 * LEGACY - Verify OTP (with mode)
 */
export async function verifyOTP(phone: string, otp: string, mode: 'signin' | 'signup' = 'signin'): Promise<VerifyOTPResponse> {
  const url = buildUrl('verify-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Verifying OTP:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*'), mode });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, otp, mode })
    });

    if (import.meta.env.DEV) {
      console.log('[OTP Client] Verify response status:', response.status);
    }

    const contentType = response.headers.get('content-type');
    let data: VerifyOTPResponse;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json() as VerifyOTPResponse;
    } else {
      const text = await response.text();
      console.error('[OTP Client] Non-JSON response:', text);
      return {
        success: false,
        message: undefined,
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`
      };
    }

    // Handle both success and error responses
    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.error('[OTP Client] Verify error response:', data);
      }
      return {
        success: false,
        message: data.message,
        error: data.error || `Request failed with status ${response.status}`,
        code: data.code
      };
    }

    return {
      success: true,
      verified: data.verified,
      message: data.message || 'OTP verified successfully',
      token: data.token,
      user: data.user ? {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email || null,
        fullName: data.user.fullName || null,
        avatarUrl: data.user.avatarUrl || null,
        isProfileComplete: data.user.isProfileComplete || false,
        authMethod: data.user.authMethod || 'phone',
        isNewUser: data.user.isNewUser || false
      } : undefined,
      error: undefined,
      code: data.code
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Verify fetch error:', error);
    }
    return {
      success: false,
      message: undefined,
      error: error instanceof Error ? error.message : 'Failed to verify OTP'
    };
  }
}

/**
 * Resend OTP
 */
export async function resendOTP(phone: string): Promise<ResendOTPResponse> {
  const url = buildUrl('resend-otp');
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Resending OTP:', { url, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });

    if (import.meta.env.DEV) {
      console.log('[OTP Client] Resend response status:', response.status);
    }

    const contentType = response.headers.get('content-type');
    let data: ResendOTPResponse;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json() as ResendOTPResponse;
    } else {
      const text = await response.text();
      console.error('[OTP Client] Non-JSON response:', text);
      return {
        success: false,
        message: undefined,
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`
      };
    }

    // Handle both success and error responses
    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.error('[OTP Client] Resend error response:', data);
      }
      return {
        success: false,
        message: data.message,
        error: data.error || `Request failed with status ${response.status}`,
        code: data.code
      };
    }

    return {
      success: true,
      message: data.message || 'OTP resent successfully',
      data: data.data,
      debug: data.debug,
      error: undefined,
      code: data.code
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Resend fetch error:', error);
    }
    return {
      success: false,
      message: undefined,
      error: error instanceof Error ? error.message : 'Failed to resend OTP'
    };
  }
}

/**
 * Checks if OTP can be requested for a phone number (rate limiting status)
 * @param phone - Phone number to check rate limit for
 * @returns Promise resolving to CheckRateLimitResponse
 */
export async function checkRateLimit(phone: string): Promise<CheckRateLimitResponse> {
  // Build URL based on environment
  let fullUrl: string;
  if (isLocalExpress) {
    fullUrl = `${API_BASE}/api/auth/check-rate-limit?phone=${encodeURIComponent(phone)}`;
  } else {
    fullUrl = `${API_BASE}/api/auth?action=check-rate-limit&phone=${encodeURIComponent(phone)}`;
  }
  
  if (import.meta.env.DEV) {
    console.log('[OTP Client] Checking rate limit:', { url: fullUrl, phone: phone.replace(/\d(?=\d{4})/g, '*') });
  }

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (import.meta.env.DEV) {
      console.log('[OTP Client] Rate limit check response status:', response.status);
    }

    const contentType = response.headers.get('content-type');
    let data: CheckRateLimitResponse;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json() as CheckRateLimitResponse;
    } else {
      const text = await response.text();
      console.error('[OTP Client] Non-JSON response:', text);
      return {
        success: false,
        canRequest: false,
        message: undefined,
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`
      };
    }

    // Handle both success and error responses
    // Note: 429 status is a valid response indicating rate limit exceeded
    if (!response.ok && response.status !== 429) {
      if (import.meta.env.DEV) {
        console.error('[OTP Client] Rate limit check error response:', data);
      }
      return {
        success: false,
        canRequest: false,
        message: data.message,
        error: data.error || `Request failed with status ${response.status}`,
        code: data.code
      };
    }

    // 200 = can request, 429 = rate limited (both are valid responses)
    return {
      success: data.success ?? (response.status === 200),
      canRequest: data.canRequest ?? (response.status === 200),
      message: data.message,
      waitTime: data.waitTime,
      waitMinutes: data.waitMinutes,
      error: data.error,
      code: data.code
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[OTP Client] Rate limit check fetch error:', error);
    }
    return {
      success: false,
      canRequest: false,
      message: undefined,
      error: error instanceof Error ? error.message : 'Failed to check rate limit'
    };
  }
}
