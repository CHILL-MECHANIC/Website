import axios from 'axios';
import { supabase } from '../config/supabase';
import type { Database, Json } from '../types/database';

type OTPLogRow = Database['public']['Tables']['otp_logs']['Row'];
type OTPLogInsert = Database['public']['Tables']['otp_logs']['Insert'];
type OTPLogUpdate = Database['public']['Tables']['otp_logs']['Update'];

/**
 * OTP Service for phone-based authentication
 * Handles OTP generation, sending, verification, and rate limiting
 */

// OTP configuration
const OTP_VALIDITY_MINUTES = 10;
const RATE_LIMIT_COOLDOWN_MINUTES = 5;
const MAX_REQUESTS_PER_HOUR = 3;

/**
 * Generates a 4-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Formats phone number to E.164 format (91XXXXXXXXXX)
 * Accepts: +919876543210, 919876543210, 9876543210, 09876543210, +91 98765 43210
 * Returns: 919876543210 (12 digits for India)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Remove leading 0 if present
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If it already has country code 91, extract the 10-digit number
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2); // Remove 91 prefix to get 10 digits
  }

  // Validate: must be 10 digits (Indian mobile number)
  if (digits.length !== 10) {
    throw new Error(`Invalid phone number. Expected 10 digits, got ${digits.length}. Must be a 10-digit Indian mobile number.`);
  }

  // Validate: must start with 6-9 (Indian mobile number range)
  if (!/^[6-9]/.test(digits)) {
    throw new Error('Invalid phone number. Must start with 6, 7, 8, or 9.');
  }

  // Add country code 91 (always add it for consistency)
  return '91' + digits;
}

/**
 * Checks if OTP can be requested for a phone number (rate limiting)
 * Returns: { canRequest: boolean, waitTime?: number (in seconds) }
 */
export async function canRequestOTP(phone: string): Promise<{ canRequest: boolean; waitTime?: number }> {
  const formattedPhone = formatPhoneNumber(phone);
  const now = new Date();
  const cooldownTime = new Date(now.getTime() - RATE_LIMIT_COOLDOWN_MINUTES * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Check for recent requests (5-minute cooldown)
    const { data: recentLogs, error: recentError } = await supabase
      .from('otp_logs')
      .select('created_at')
      .eq('phone', formattedPhone)
      .gte('created_at', cooldownTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentError) {
      console.error('[OTP] Error checking rate limit:', recentError);
      // Allow request if DB check fails (fail open)
      return { canRequest: true };
    }

    if (recentLogs && recentLogs.length > 0) {
      const lastRequest = new Date((recentLogs[0] as OTPLogRow).created_at);
      const waitTime = Math.ceil((RATE_LIMIT_COOLDOWN_MINUTES * 60 * 1000 - (now.getTime() - lastRequest.getTime())) / 1000);
      return { canRequest: false, waitTime: Math.max(0, waitTime) };
    }

    // Check for hourly limit (max 3 requests per hour)
    const { data: hourlyLogs, error: hourlyError } = await supabase
      .from('otp_logs')
      .select('id')
      .eq('phone', formattedPhone)
      .gte('created_at', hourAgo.toISOString());

    if (hourlyError) {
      console.error('[OTP] Error checking hourly limit:', hourlyError);
      return { canRequest: true };
    }

    if (hourlyLogs && hourlyLogs.length >= MAX_REQUESTS_PER_HOUR) {
      return { canRequest: false, waitTime: 3600 }; // Wait 1 hour
    }

    return { canRequest: true };
  } catch (error) {
    console.error('[OTP] Error in canRequestOTP:', error);
    // Fail open - allow request if check fails
    return { canRequest: true };
  }
}

/**
 * Logs OTP to database
 */
async function logOTPToDatabase(
  phone: string,
  otp: string,
  status: 'pending' | 'sent' | 'failed' | 'verified' = 'pending',
  messageId?: string,
  requestId?: string,
  apiResponse?: unknown
): Promise<number> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_VALIDITY_MINUTES);

  const insertData: OTPLogInsert = {
    phone,
    otp,
    status,
    message_id: messageId || null,
    request_id: requestId || null,
    api_response: apiResponse ? (apiResponse as Json) : null,
    expires_at: expiresAt.toISOString()
  };

  const { data, error } = await supabase
    .from('otp_logs')
    .insert(insertData as never)
    .select('id')
    .single();

  if (error) {
    console.error('[OTP] Error logging OTP to database:', error);
    throw new Error(`Failed to log OTP: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to log OTP: No data returned');
  }

  return (data as { id: number }).id;
}

/**
 * Updates OTP log status
 */
async function updateOTPLogStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed' | 'verified',
  apiResponse?: unknown
): Promise<void> {
  const updateData: OTPLogUpdate = {
    status,
    updated_at: new Date().toISOString()
  };

  if (apiResponse) {
    updateData.api_response = apiResponse as Json;
  }

  const { error } = await supabase
    .from('otp_logs')
    .update(updateData as never)
    .eq('id', id);

  if (error) {
    console.error('[OTP] Error updating OTP log:', error);
    throw new Error(`Failed to update OTP log: ${error.message}`);
  }
}

/**
 * Sends OTP via UDO API using GET method with query parameters
 */
export async function sendOTP(phoneNumber: string): Promise<{
  success: boolean;
  messageId?: string;
  requestId?: string;
  error?: string;
  logId?: number;
}> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[AUTH] Sending OTP to: ${formattedPhone}`);

    // Check rate limiting
    const rateLimitCheck = await canRequestOTP(phoneNumber);
    if (!rateLimitCheck.canRequest) {
      const waitMinutes = rateLimitCheck.waitTime
        ? Math.ceil(rateLimitCheck.waitTime / 60)
        : RATE_LIMIT_COOLDOWN_MINUTES;
      return {
        success: false,
        error: `Please wait ${waitMinutes} minute(s) before requesting another OTP.`
      };
    }

    // Generate OTP
    const otp = generateOTP();

    // Log OTP to database with pending status
    const logId = await logOTPToDatabase(formattedPhone, otp, 'pending');

    // Prepare API request
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID || 'CHLMEH';
    const apiUrl = process.env.SMS_API_URL || 'https://api.uniquedigitaloutreach.com/v1/sms';
    const timeoutMs = parseInt(process.env.SMS_TIMEOUT_MS || '30000', 10);

    if (!apiKey) {
      await updateOTPLogStatus(logId, 'failed', { error: 'SMS API key not configured' });
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    // Prepare OTP message - MUST match DLT template exactly
    const message = `Your webapp login OTP is ${otp} From - Chill Mechanic`;

    console.log('OTP Request:', {
      phone: formattedPhone,
      sender: senderId,
      message: message.replace(otp, '****') // Don't log actual OTP
    });

    // Make POST request with JSON body
    try {
      const response = await axios.post(
        apiUrl,
        {
          sender: senderId,
          to: formattedPhone,
          text: message,
          type: 'OTP'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
          },
          timeout: timeoutMs
        }
      );

      console.log('UDO API Response:', response.data);

      // Parse response
      // Expected format: { id, data: [{ recipient, messageId }], message, error }
      if (response.data && response.data.message === 'Message Sent Successfully!' && response.data.data && response.data.data.length > 0) {
        // Extract messageId from data array, fallback to id if not available
        const messageId = response.data.data[0]?.messageId || response.data.id || undefined;
        // Request ID is the top-level id field
        const requestId = response.data.id || undefined;

        // Update log with success
        await updateOTPLogStatus(logId, 'sent', response.data);

        console.log('OTP sent successfully:', { messageId, requestId, logId });

        return {
          success: true,
          messageId,
          requestId,
          logId
        };
      } else {
        // API returned error
        const errorMessage = response.data?.message || response.data?.error || 'Unknown API error';
        await updateOTPLogStatus(logId, 'failed', response.data);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (axiosError: unknown) {
      if (axios.isAxiosError(axiosError)) {
        const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || 'Network error';
        await updateOTPLogStatus(logId, 'failed', {
          error: errorMessage,
          statusCode: axiosError.response?.status
        });
        return {
          success: false,
          error: errorMessage
        };
      }

      await updateOTPLogStatus(logId, 'failed', { error: 'Unknown error occurred' });
      return {
        success: false,
        error: 'Failed to send OTP'
      };
    }
  } catch (error) {
    console.error('[AUTH] Send OTP error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'Failed to send OTP'
    };
  }
}

/**
 * Verifies OTP for a phone number
 */
export async function verifyOTP(phoneNumber: string, inputOTP: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[AUTH] Verifying OTP for: ${formattedPhone}`);

    // Validate OTP format
    if (!/^\d{4}$/.test(inputOTP)) {
      return {
        success: false,
        error: 'Invalid OTP format. Must be 4 digits.'
      };
    }

    // Find the most recent unverified OTP for this phone
    const { data: otpLogs, error: fetchError } = await supabase
      .from('otp_logs')
      .select('*')
      .eq('phone', formattedPhone)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[OTP] Error fetching OTP log:', fetchError);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.'
      };
    }

    if (!otpLogs || otpLogs.length === 0) {
      return {
        success: false,
        error: 'No OTP found. Please request a new OTP.'
      };
    }

    const otpLog = otpLogs[0] as OTPLogRow;
    const expiresAt = new Date(otpLog.expires_at);
    const now = new Date();

    // Check if OTP is expired
    if (now > expiresAt) {
      await updateOTPLogStatus(otpLog.id, 'failed', { reason: 'expired' });
      return {
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Verify OTP match
    if (otpLog.otp !== inputOTP) {
      // Don't update status on wrong OTP to allow retries
      return {
        success: false,
        error: 'Invalid OTP. Please check and try again.'
      };
    }

    // OTP is valid - mark as verified
    await updateOTPLogStatus(otpLog.id, 'verified', { verified_at: now.toISOString() });

    console.log('OTP verified successfully');

    return {
      success: true
    };
  } catch (error) {
    console.error('[AUTH] Verify OTP error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'Failed to verify OTP'
    };
  }
}

/**
 * Resends OTP with rate limit check
 */
export async function resendOTP(phoneNumber: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
  requestId?: string;
  logId?: number;
}> {
  try {
    // Check rate limiting
    const rateLimitCheck = await canRequestOTP(phoneNumber);
    if (!rateLimitCheck.canRequest) {
      const waitMinutes = rateLimitCheck.waitTime
        ? Math.ceil(rateLimitCheck.waitTime / 60)
        : RATE_LIMIT_COOLDOWN_MINUTES;
      return {
        success: false,
        error: `Please wait ${waitMinutes} minute(s) before requesting another OTP.`
      };
    }

    // Send new OTP
    const result = await sendOTP(phoneNumber);

    if (result.success) {
      return {
        success: true,
        message: 'OTP resent successfully',
        messageId: result.messageId,
        requestId: result.requestId,
        logId: result.logId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to resend OTP'
      };
    }
  } catch (error) {
    console.error('[AUTH] Resend OTP error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'Failed to resend OTP'
    };
  }
}

