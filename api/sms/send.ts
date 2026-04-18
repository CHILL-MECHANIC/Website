import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * SMS Send Handler
 * POST /api/sms/send
 * 
 * Sends SMS via UniqueDigitalOutreach API
 * Used for booking confirmations, technician assignments, etc.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { recipient, message, type = 'OTP', senderId = 'CHLMEH', templateId } = req.body;

    // Validation
    if (!recipient || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recipient, message'
      });
    }

    // Clean recipient - remove all non-digits
    let cleanedRecipient = String(recipient).replace(/\D/g, '');
    
    // Handle different phone formats:
    // 1. If 12 digits starting with 91 → remove country code (91XXXXXXXXXX → XXXXXXXXXX)
    // 2. If 11 digits starting with 0 → remove leading 0 (0XXXXXXXXXX → XXXXXXXXXX)
    // 3. If already 10 digits → use as-is
    if (cleanedRecipient.length === 12 && cleanedRecipient.startsWith('91')) {
      cleanedRecipient = cleanedRecipient.substring(2);
    } else if (cleanedRecipient.length === 11 && cleanedRecipient.startsWith('0')) {
      cleanedRecipient = cleanedRecipient.substring(1);
    }
    
    // Validate: must be exactly 10 digits
    if (cleanedRecipient.length !== 10 || !/^\d{10}$/.test(cleanedRecipient)) {
      return res.status(400).json({
        success: false,
        error: `Invalid phone number: ${recipient}. Expected 10-digit number, got ${cleanedRecipient.length} digits after cleaning.`
      });
    }
    
    // Add country code for API
    cleanedRecipient = '91' + cleanedRecipient;

    const smsApiKey = process.env.SMS_API_KEY;

    if (!smsApiKey) {
      console.warn('[SMS] SMS_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'SMS service not configured'
      });
    }

    console.log('[SMS] Sending SMS:', {
      to: cleanedRecipient,
      type,
      senderId,
      templateId,
      messageLength: message.length
    });

    try {
      const smsResponse = await axios.post(
        'https://api.uniquedigitaloutreach.com/v1/sms',
        {
          sender: senderId,
          to: cleanedRecipient,
          text: message,
          type,
          ...(templateId && { template_id: templateId })
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': smsApiKey
          },
          timeout: 30000
        }
      );

      console.log('[SMS] API Response:', {
        status: smsResponse.status,
        data: smsResponse.data
      });

      return res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: {
          messageId: smsResponse.data?.MessageId || smsResponse.data?.id,
          status: 'sent'
        }
      });
    } catch (apiError: any) {
      console.error('[SMS] API Error:', {
        message: apiError.message,
        status: apiError.response?.status,
        data: apiError.response?.data
      });

      return res.status(400).json({
        success: false,
        error: apiError.response?.data?.message || apiError.message || 'Failed to send SMS'
      });
    }
  } catch (error: any) {
    console.error('[SMS] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
