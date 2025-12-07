import { z } from 'zod';
import type { SMSRequest, SMSResponse, RetryConfig } from '../types/sms';

/**
 * SMS Service for Unique Digital Outreach API
 * Handles all SMS operations with validation, retry logic, and error handling
 */

// Validation schemas
const phoneNumberSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Must be E.164 format (e.g., +911234567890)')
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits');

const messageSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(1600, 'Message cannot exceed 1600 characters');

// Unused - kept for potential future use
// const smsTypeSchema = z.enum(['TRANS', 'PROMO', 'OTP']).optional();

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  try {
    phoneNumberSchema.parse(phone);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid phone number format' };
  }
}

/**
 * Validates message content and length
 */
export function validateMessage(message: string, unicode?: boolean): { valid: boolean; error?: string; length?: number } {
  try {
    messageSchema.parse(message);
    const length = unicode ? message.length : getGSM7Length(message);
    return { valid: true, length };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid message format' };
  }
}

/**
 * Calculates GSM-7 character length (handles multi-part SMS)
 */
function getGSM7Length(message: string): number {
  // Basic GSM-7 character set
  const gsm7Chars = /^[A-Za-z0-9\s@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#$%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà]*$/;
  
  if (gsm7Chars.test(message)) {
    return message.length;
  }
  // If contains non-GSM-7 characters, treat as Unicode
  return message.length;
}

/**
 * Detects if message contains Unicode characters
 */
function isUnicode(message: string): boolean {
  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i);
    if (charCode > 127) {
      return true;
    }
  }
  return false;
}

/**
 * Default retry configuration
 */
const defaultRetryConfig: RetryConfig = {
  maxRetries: parseInt(process.env.SMS_MAX_RETRIES || '3', 10),
  initialDelay: parseInt(process.env.SMS_RETRY_DELAY_MS || '1000', 10),
  maxDelay: 30000,
  backoffMultiplier: 2
};

/**
 * Calculates exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sends SMS via Unique Digital Outreach API
 */
export async function sendSMS(
  request: SMSRequest,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<SMSResponse> {
  // Validate input
  const phoneValidation = validatePhoneNumber(request.recipient);
  if (!phoneValidation.valid) {
    return {
      success: false,
      error: phoneValidation.error || 'Invalid phone number'
    };
  }

  const messageValidation = validateMessage(request.message, request.unicode);
  if (!messageValidation.valid) {
    return {
      success: false,
      error: messageValidation.error || 'Invalid message'
    };
  }

  // Auto-detect Unicode if not specified
  const useUnicode = request.unicode !== undefined ? request.unicode : isUnicode(request.message);

  // Prepare API request
  const apiKey = process.env.SMS_API_KEY;
  const senderId = request.senderId || process.env.SMS_SENDER_ID || 'SMS';
  const apiUrl = process.env.SMS_API_URL || 'https://api.uniquedigitaloutreach.com/v1/sms';

  if (!apiKey) {
    return {
      success: false,
      error: 'SMS API key not configured'
    };
  }

  // Build request payload - aligned with API_DOCUMENTATION.md
  const payload: Record<string, unknown> = {
    sender: senderId,
    to: request.recipient,
    text: request.message,
    type: request.type || 'TRANS'
  };

  // Add optional fields if provided
  if (useUnicode) {
    payload.unicode = useUnicode;
  }
  if (request.flash) {
    payload.flash = request.flash;
  }

  // Add template support if provided
  if (request.templateId) {
    payload.template_id = request.templateId;
    if (request.variables) {
      payload.variables = request.variables;
    }
  }

  let lastError: Error | null = null;
  let attempt = 0;

  // Retry logic with exponential backoff
  while (attempt <= retryConfig.maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), parseInt(process.env.SMS_TIMEOUT_MS || '30000', 10));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return {
            success: false,
            error: errorMessage,
            statusCode: response.status
          };
        }

        throw new Error(errorMessage);
      }

      // Parse response - aligned with API_DOCUMENTATION.md format
      // Expected: { id, data: [{ recipient, messageId }], totalCount, message, error }
      const data = await response.json() as {
        id?: string;
        data?: Array<{
          recipient?: string;
          messageId?: string;
        }>;
        totalCount?: number;
        message?: string;
        error?: string | null;
      };

      // Handle API response according to API_DOCUMENTATION.md
      if (data.message === 'Message Sent Successfully!' && data.data && data.data.length > 0) {
        // Extract messageId from data array
        const messageId = data.data[0]?.messageId || data.id || undefined;
        return {
          success: true,
          messageId: messageId,
          message: data.message || 'SMS sent successfully'
        };
      } else {
        throw new Error(data.message || data.error || 'Unknown API error');
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort (timeout) or network errors if it's the last attempt
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(attempt, retryConfig);
        console.log(`SMS send attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
          error: lastError.message,
          recipient: request.recipient
        });
        await sleep(delay);
        attempt++;
      } else {
        break;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to send SMS after all retry attempts',
    statusCode: 500
  };
}

/**
 * Sends bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string,
  options: Omit<SMSRequest, 'recipient' | 'message'> = {}
): Promise<Array<{ recipient: string; response: SMSResponse }>> {
  const results: Array<{ recipient: string; response: SMSResponse }> = [];

  // Validate all recipients first
  const validRecipients: string[] = [];
  for (const recipient of recipients) {
    const validation = validatePhoneNumber(recipient);
    if (validation.valid) {
      validRecipients.push(recipient);
    } else {
      results.push({
        recipient,
        response: {
          success: false,
          error: validation.error || 'Invalid phone number'
        }
      });
    }
  }

  // Send SMS to valid recipients
  const sendPromises = validRecipients.map(async (recipient) => {
    const response = await sendSMS({
      recipient,
      message,
      ...options
    });
    return { recipient, response };
  });

  const sendResults = await Promise.allSettled(sendPromises);
  
  sendResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      results.push({
        recipient: validRecipients[index],
        response: {
          success: false,
          error: result.reason?.message || 'Unknown error occurred'
        }
      });
    }
  });

  return results;
}

