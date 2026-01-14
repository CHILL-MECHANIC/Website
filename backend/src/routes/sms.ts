import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { sendSMS, sendBulkSMS } from '../services/smsService';
import {
  createSMSLog,
  updateSMSLog,
  getSMSLogs,
  getSMSLogById,
  getFailedSMSLogsForRetry
} from '../services/supabaseService';
import { APIError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const sendSMSSchema = z.object({
  recipient: z.string().min(10).max(15),
  message: z.string().min(1).max(1600),
  type: z.enum(['TRANS', 'PROMO', 'OTP']).optional(),
  senderId: z.string().optional(),
  unicode: z.boolean().optional(),
  flash: z.boolean().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional()
});

const sendBulkSMSSchema = z.object({
  recipients: z.array(z.string().min(10).max(15)).min(1).max(100),
  message: z.string().min(1).max(1600),
  type: z.enum(['TRANS', 'PROMO', 'OTP']).optional(),
  senderId: z.string().optional(),
  unicode: z.boolean().optional(),
  flash: z.boolean().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional()
});

const logsQuerySchema = z.object({
  recipient: z.string().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'delivered']).optional(),
  type: z.enum(['TRANS', 'PROMO', 'OTP']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const resendSMSSchema = z.object({
  id: z.number().int().positive()
});

/**
 * POST /api/sms/send
 * Send a single SMS
 */
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = sendSMSSchema.parse(req.body);

    // Try to create log entry (but don't fail if table doesn't exist)
    let logId: number | null = null;
    try {
      const log = await createSMSLog(
        validatedData.recipient,
        validatedData.message,
        {
          status: 'pending',
          senderId: validatedData.senderId,
          type: validatedData.type
        }
      );
      logId = log.id;
    } catch (logError) {
      console.warn('[SMS] Could not create SMS log (table may not exist):', logError);
      // Continue without logging
    }

    // Send SMS regardless of log creation
    const result = await sendSMS({
      recipient: validatedData.recipient,
      message: validatedData.message,
      type: validatedData.type,
      senderId: validatedData.senderId,
      unicode: validatedData.unicode,
      flash: validatedData.flash,
      templateId: validatedData.templateId,
      variables: validatedData.variables
    });

    // Try to update log if it was created
    if (logId) {
      try {
        await updateSMSLog(logId, {
          status: result.success ? 'sent' : 'failed',
          messageId: result.messageId,
          apiResponse: result
        });
      } catch (updateError) {
        console.warn('[SMS] Could not update SMS log:', updateError);
      }
    }

    if (result.success) {
      console.log('[SMS] Sent successfully to:', validatedData.recipient);
      res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: {
          logId: logId,
          messageId: result.messageId,
          status: 'sent'
        }
      });
    } else {
      console.error('[SMS] Failed to send:', result.error);
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to send SMS',
        data: {
          logId: logId,
          status: 'failed'
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new APIError(400, error.errors[0].message, true));
    }
    next(error);
  }
});

/**
 * POST /api/sms/send-bulk
 * Send bulk SMS to multiple recipients
 */
router.post('/send-bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = sendBulkSMSSchema.parse(req.body);

    // Create log entries for all recipients
    const logs = await Promise.all(
      validatedData.recipients.map(recipient =>
        createSMSLog(recipient, validatedData.message, {
          status: 'pending',
          senderId: validatedData.senderId,
          type: validatedData.type
        })
      )
    );

    // Send bulk SMS
    const results = await sendBulkSMS(
      validatedData.recipients,
      validatedData.message,
      {
        type: validatedData.type,
        senderId: validatedData.senderId,
        unicode: validatedData.unicode,
        flash: validatedData.flash,
        templateId: validatedData.templateId,
        variables: validatedData.variables
      }
    );

    // Update logs with results
    await Promise.all(
      results.map(async (result, index) => {
        const log = logs[index];
        if (log) {
          await updateSMSLog(log.id, {
            status: result.response.success ? 'sent' : 'failed',
            messageId: result.response.messageId,
            apiResponse: result.response
          });
        }
      })
    );

    const successCount = results.filter(r => r.response.success).length;
    const failureCount = results.length - successCount;

    res.status(200).json({
      success: true,
      message: `Bulk SMS completed: ${successCount} sent, ${failureCount} failed`,
      data: {
        total: results.length,
        success: successCount,
        failed: failureCount,
        results: results.map((r, index) => ({
          recipient: r.recipient,
          logId: logs[index]?.id,
          success: r.response.success,
          messageId: r.response.messageId,
          error: r.response.error
        }))
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new APIError(400, error.errors[0].message, true));
    }
    next(error);
  }
});

/**
 * GET /api/sms/logs
 * Retrieve SMS logs with optional filtering
 */
router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = logsQuerySchema.parse(req.query);

    const filters: Parameters<typeof getSMSLogs>[0] = {
      recipient: query.recipient,
      status: query.status,
      type: query.type,
      limit: query.limit || 50,
      offset: query.offset || 0
    };

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    const { logs, total } = await getSMSLogs(filters);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          hasMore: (filters.offset || 0) + (filters.limit || 50) < total
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new APIError(400, error.errors[0].message, true));
    }
    next(error);
  }
});

/**
 * GET /api/sms/logs/:id
 * Get specific SMS log details
 */
router.get('/logs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return next(new APIError(400, 'Invalid log ID', true));
    }

    const log = await getSMSLogById(id);

    if (!log) {
      return next(new APIError(404, 'SMS log not found', true));
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sms/resend
 * Resend a failed SMS
 */
router.post('/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = resendSMSSchema.parse(req.body);

    // Get the log
    const log = await getSMSLogById(id);

    if (!log) {
      return next(new APIError(404, 'SMS log not found', true));
    }

    if (log.status !== 'failed') {
      return next(new APIError(400, 'Can only resend failed SMS', true));
    }

    if (log.retryCount >= log.maxRetries) {
      return next(new APIError(400, 'Maximum retry attempts reached', true));
    }

    // Update retry count
    await updateSMSLog(log.id, {
      retryCount: log.retryCount + 1,
      status: 'pending'
    });

    // Resend SMS
    const result = await sendSMS({
      recipient: log.recipient,
      message: log.message,
      type: log.type,
      senderId: log.senderId
    });

    // Update log with result
    await updateSMSLog(log.id, {
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      apiResponse: result
    });

    res.status(200).json({
      success: result.success,
      message: result.success ? 'SMS resent successfully' : result.error,
      data: {
        logId: log.id,
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        retryCount: log.retryCount + 1
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new APIError(400, error.errors[0].message, true));
    }
    next(error);
  }
});

export default router;

