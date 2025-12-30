import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { APIError, asyncHandler } from '../middleware/errorHandler';
import { createRazorpayInstance, validateRazorpayConfig, getRazorpayMode } from '../config/razorpay';

const router = Router();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str);
}

/**
 * Create Razorpay payment order
 * POST /api/payment/create-order
 */
router.post('/create-order', asyncHandler(async (req: Request, res: Response) => {
  // Validate configuration
  const razorpayValidation = validateRazorpayConfig();
  if (!razorpayValidation.valid) {
    console.error('Razorpay configuration errors:', razorpayValidation.errors);
    throw new APIError(500, 'Payment gateway not configured properly');
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase configuration');
    throw new APIError(500, 'Database not configured properly');
  }

  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET');
    throw new APIError(500, 'Authentication not configured properly');
  }

  // Verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError(401, 'Authorization required');
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new APIError(401, 'Invalid or expired token');
  }

  const { userId, phone } = decoded;

  // Validate userId is a valid UUID
  if (!isValidUUID(userId)) {
    console.error('[Payment] Invalid user ID format:', userId);
    throw new APIError(400, 'Invalid user ID format');
  }

  // Validate request body
  const {
    amount,
    serviceName,
    serviceType,
    bookingId,
    bookingDate,
    bookingTimeSlot,
    address,
    city,
    pincode,
    notes
  } = req.body || {};

  if (!amount || amount < 1) {
    throw new APIError(400, 'Valid amount required (minimum ₹1)');
  }

  // Create Razorpay order
  const razorpay = createRazorpayInstance();
  const mode = getRazorpayMode();

  // Generate unique receipt ID
  const receipt = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  console.log(`[Payment] Creating order: ₹${amount} for ${serviceName || 'service'} (${mode} mode)`);

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: receipt,
    notes: {
      userId: userId || '',
      phone: phone || '',
      serviceName: serviceName || '',
      serviceType: serviceType || '',
      bookingId: bookingId || ''
    }
  });

  console.log(`[Payment] Order created: ${order.id}`);

  // Save to database
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Prepare insert data with detailed logging
  // Validate bookingId is UUID if provided
  let validatedBookingId: string | null = null;
  if (bookingId) {
    if (isValidUUID(bookingId)) {
      validatedBookingId = bookingId;
    } else {
      console.warn('[Payment] Invalid booking ID format, setting to null:', bookingId);
      validatedBookingId = null;
    }
  }

  const insertData = {
    user_id: userId,
    user_phone: phone || null,
    razorpay_order_id: order.id,
    amount: amount,
    currency: 'INR',
    service_type: serviceType || null,
    service_name: serviceName || null,
    booking_id: validatedBookingId,
    booking_date: bookingDate || null,
    booking_time_slot: bookingTimeSlot || null,
    address: address || null,
    city: city || null,
    pincode: pincode || null,
    notes: notes || null,
    status: 'created'
  };

  console.log('[Payment] Attempting to insert payment:', JSON.stringify(insertData, null, 2));
  console.log('[Payment] User ID type:', typeof userId, 'Value:', userId);
  console.log('[Payment] Booking ID type:', typeof bookingId, 'Value:', bookingId);

  const { data: payment, error: dbError } = await supabase
    .from('payments')
    .insert(insertData)
    .select()
    .single();

  if (dbError) {
    console.error('[Payment] DATABASE ERROR DETAILS:', {
      code: dbError.code,
      message: dbError.message,
      details: dbError.details,
      hint: dbError.hint,
      fullError: JSON.stringify(dbError, null, 2)
    });
    
    // Return detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to create order record: ${dbError.message}${dbError.hint ? ` (Hint: ${dbError.hint})` : ''}`
      : 'Failed to create order record';
    
    throw new APIError(500, errorMessage);
  }

  console.log('[Payment] Payment record created successfully:', payment?.id);

  return res.status(200).json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    },
    paymentId: payment.id,
    key: process.env.RAZORPAY_KEY_ID,
    mode: mode
  });
}));

/**
 * Verify payment signature
 * POST /api/payment/verify
 */
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  // Validate environment variables
  if (!process.env.RAZORPAY_KEY_SECRET) {
    console.error('Missing RAZORPAY_KEY_SECRET');
    throw new APIError(500, 'Server configuration error');
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase configuration');
    throw new APIError(500, 'Server configuration error');
  }

  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET');
    throw new APIError(500, 'Server configuration error');
  }

  // Verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError(401, 'Authorization required');
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new APIError(401, 'Invalid or expired token');
  }

  const { phone } = decoded;

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new APIError(400, 'Missing payment details');
  }

  // Verify signature using HMAC SHA256
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpay_signature;

  if (!isValid) {
    throw new APIError(400, 'Invalid payment signature');
  }

  // Update payment in database
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: payment, error: updateError } = await supabase
    .from('payments')
    .update({
      razorpay_payment_id,
      razorpay_signature,
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('razorpay_order_id', razorpay_order_id)
    .select()
    .single();

  if (updateError) {
    console.error('Database update error:', updateError);
    throw new APIError(500, 'Failed to update payment record');
  }

  // Update booking status if booking_id exists
  if (payment.booking_id) {
    await supabase
      .from('bookings')
      .update({ 
        payment_status: 'paid'
      })
      .eq('id', payment.booking_id);
  }

  // Send SMS confirmation
  if (phone && process.env.SMS_API_KEY) {
    try {
      const formattedPhone = phone.replace(/^\+?91/, '');
      const smsMessage = `Payment of Rs.${payment.amount} received for ${payment.service_name || 'your booking'}. Thank you for choosing ChillMechanic!`;
      
      await axios.post(
        'https://api.uniquedigitaloutreach.com/v1/sms',
        {
          sender: process.env.SMS_SENDER_ID || 'CHLMEH',
          to: '91' + formattedPhone,
          text: smsMessage,
          type: 'TXN'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SMS_API_KEY
          },
          timeout: 30000
        }
      );
      console.log('Payment confirmation SMS sent');
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Don't fail the payment verification if SMS fails
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    payment: {
      id: payment.id,
      orderId: payment.razorpay_order_id,
      paymentId: payment.razorpay_payment_id,
      amount: payment.amount,
      status: payment.status,
      serviceName: payment.service_name,
      paidAt: payment.paid_at
    }
  });
}));

/**
 * Get payment history
 * GET /api/payment/history
 */
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  // Verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError(401, 'Authorization required');
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new APIError(401, 'Invalid or expired token');
  }

  const { userId } = decoded;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get query params for pagination and filtering
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;

  // Build query
  let query = supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by status if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: payments, error, count } = await query;

  if (error) {
    console.error('Database error:', error);
    throw new APIError(500, 'Failed to fetch payment history');
  }

  return res.status(200).json({
    success: true,
    payments: (payments || []).map(p => ({
      id: p.id,
      orderId: p.razorpay_order_id,
      paymentId: p.razorpay_payment_id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      serviceName: p.service_name,
      serviceType: p.service_type,
      bookingId: p.booking_id,
      bookingDate: p.booking_date,
      bookingTimeSlot: p.booking_time_slot,
      createdAt: p.created_at,
      paidAt: p.paid_at,
      refundId: p.refund_id,
      refundStatus: p.refund_status,
      refundAmount: p.refund_amount,
      refundedAt: p.refunded_at
    })),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

/**
 * Process refund
 * POST /api/payment/refund
 */
router.post('/refund', asyncHandler(async (req: Request, res: Response) => {
  // Verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError(401, 'Authorization required');
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new APIError(401, 'Invalid or expired token');
  }

  const { userId, phone } = decoded;

  const { paymentId, reason, amount } = req.body || {};

  if (!paymentId) {
    throw new APIError(400, 'Payment ID required');
  }

  // Validate Razorpay configuration
  const razorpayValidation = validateRazorpayConfig();
  if (!razorpayValidation.valid) {
    console.error('Razorpay configuration errors:', razorpayValidation.errors);
    throw new APIError(500, 'Payment gateway not configured properly');
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get payment record
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !payment) {
    throw new APIError(404, 'Payment not found');
  }

  if (payment.status !== 'paid') {
    throw new APIError(400, 'Only paid payments can be refunded');
  }

  if (payment.refund_status === 'processed') {
    throw new APIError(400, 'Payment already refunded');
  }

  if (!payment.razorpay_payment_id) {
    throw new APIError(400, 'No Razorpay payment ID found');
  }

  // Initialize Razorpay
  const razorpay = createRazorpayInstance();

  // Calculate refund amount (full or partial)
  const refundAmount = amount ? Math.min(amount, payment.amount) : payment.amount;

  // Process refund via Razorpay API
  const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
    amount: refundAmount * 100, // Convert to paise
    notes: {
      reason: reason || 'Customer requested refund',
      paymentId: payment.id
    }
  });

  // Determine new status
  const newStatus = refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';

  // Update payment record
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: newStatus,
      refund_id: refund.id,
      refund_amount: (payment.refund_amount || 0) + refundAmount,
      refund_status: 'processed',
      refund_reason: reason || 'Customer requested refund',
      refunded_at: new Date().toISOString()
    })
    .eq('id', paymentId);

  if (updateError) {
    console.error('Database update error:', updateError);
  }

  // Update booking status if exists
  if (payment.booking_id) {
    await supabase
      .from('bookings')
      .update({ 
        payment_status: newStatus,
        status: 'cancelled'
      })
      .eq('id', payment.booking_id);
  }

  // Send SMS notification
  if (phone && process.env.SMS_API_KEY) {
    try {
      const formattedPhone = phone.replace(/^\+?91/, '');
      const smsMessage = `Refund of Rs.${refundAmount} initiated for ${payment.service_name || 'your booking'}. Amount will be credited within 5-7 business days. - ChillMechanic`;
      
      await axios.post(
        'https://api.uniquedigitaloutreach.com/v1/sms',
        {
          sender: process.env.SMS_SENDER_ID || 'CHLMEH',
          to: '91' + formattedPhone,
          text: smsMessage,
          type: 'TXN'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SMS_API_KEY
          },
          timeout: 30000
        }
      );
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Refund initiated successfully',
    refund: {
      id: refund.id,
      amount: refundAmount,
      status: refund.status,
      paymentId: payment.razorpay_payment_id
    }
  });
}));

/**
 * Payment health check
 * GET /api/payment/health
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const checks = {
    razorpay: {
      configured: false,
      mode: 'unknown' as 'test' | 'live' | 'unknown',
      apiBaseUrl: 'https://api.razorpay.com/v1',
      errors: [] as string[]
    },
    supabase: {
      configured: false,
      connected: false
    },
    jwt: {
      configured: false
    },
    sms: {
      configured: false,
      senderId: process.env.SMS_SENDER_ID || 'NOT_SET'
    },
    database: {
      paymentsTableExists: false
    }
  };

  // Check Razorpay configuration
  const razorpayValidation = validateRazorpayConfig();
  checks.razorpay.configured = razorpayValidation.valid;
  checks.razorpay.errors = razorpayValidation.errors;
  if (razorpayValidation.valid) {
    checks.razorpay.mode = getRazorpayMode();
  }

  // Check Supabase configuration
  checks.supabase.configured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Check JWT configuration
  checks.jwt.configured = !!process.env.JWT_SECRET;

  // Check SMS configuration
  checks.sms.configured = !!process.env.SMS_API_KEY;

  // Test database connection
  if (checks.supabase.configured) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);

      checks.supabase.connected = !error;
      checks.database.paymentsTableExists = !error;

      if (error) {
        console.error('Database check failed:', error.message);
      }
    } catch (err: any) {
      console.error('Database connection error:', err.message);
    }
  }

  // Calculate overall status
  const criticalChecks = [
    checks.razorpay.configured,
    checks.supabase.configured,
    checks.supabase.connected,
    checks.jwt.configured,
    checks.database.paymentsTableExists
  ];

  const allPassed = criticalChecks.every(Boolean);
  const passedCount = criticalChecks.filter(Boolean).length;

  return res.status(allPassed ? 200 : 503).json({
    success: allPassed,
    status: allPassed ? 'healthy' : 'degraded',
    message: allPassed
      ? `Payment gateway operational (${checks.razorpay.mode} mode)`
      : `${criticalChecks.length - passedCount} configuration issue(s) found`,
    checks,
    timestamp: new Date().toISOString()
  });
}));

export default router;

