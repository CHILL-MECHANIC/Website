import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Bulk SMS Send Handler
 * POST /api/sms/send-bulk
 * 
 * Sends SMS to multiple recipients via UniqueDigitalOutreach API
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
    const { recipients, message, type = 'OTP', senderId = 'CHLMEH', templateId } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid recipients (must be an array with at least one recipient)'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: message'
      });
    }

    if (recipients.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 recipients allowed per request'
      });
    }

    const smsApiKey = process.env.SMS_API_KEY;

    if (!smsApiKey) {
      console.warn('[SMS] SMS_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'SMS service not configured'
      });
    }

    console.log('[SMS] Sending bulk SMS to', recipients.length, 'recipients');

    // Send SMS to each recipient
    const results = await Promise.all(
      recipients.map(async (recipient) => {
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
          return {
            recipient: String(recipient),
            success: false,
            error: `Invalid phone number. Expected 10-digit number, got ${cleanedRecipient.length} digits after cleaning.`
          };
        }
        
        // Add country code for API
        cleanedRecipient = '91' + cleanedRecipient;

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

          return {
            recipient: cleanedRecipient,
            success: true,
            messageId: smsResponse.data?.MessageId || smsResponse.data?.id,
            status: 'sent'
          };
        } catch (error: any) {
          console.error('[SMS] Failed to send to', cleanedRecipient, ':', error.message);
          return {
            recipient: cleanedRecipient,
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send SMS'
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log('[SMS] Bulk SMS completed:', {
      total: results.length,
      success: successCount,
      failed: failureCount
    });

    return res.status(200).json({
      success: true,
      message: `Bulk SMS completed: ${successCount} sent, ${failureCount} failed`,
      data: {
        total: results.length,
        success: successCount,
        failed: failureCount,
        results
      }
    });
  } catch (error: any) {
    console.error('[SMS] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
