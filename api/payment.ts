import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { createRazorpayInstance, validateRazorpayConfig, getRazorpayMode, RAZORPAY_API_BASE_URL } from './_razorpayConfig';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  try {
    // ===== GET ENDPOINTS =====
    if (req.method === 'GET') {
      
      // ACTION: health - No auth required
      if (action === 'health') {
        const checks = {
          razorpay: {
            configured: false,
            mode: 'unknown' as 'test' | 'live' | 'unknown',
            apiBaseUrl: RAZORPAY_API_BASE_URL,
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
      }

      // ACTION: history - Auth required
      if (action === 'history') {
        // Verify JWT token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return res.status(401).json({ success: false, message: 'Authorization required' });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET!);
        } catch {
          return res.status(401).json({ success: false, message: 'Invalid or expired token' });
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
          return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
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
      }

      return res.status(400).json({ success: false, message: 'Invalid action. Use ?action=health or ?action=history' });
    }

    // ===== POST ENDPOINTS =====
    if (req.method === 'POST') {
      // Verify JWT token (except for health which is GET)
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
      }

      const token = authHeader.split(' ')[1];
      let decoded: any;

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }

      const { userId, phone } = decoded;

      // ACTION: create-order
      if (action === 'create-order') {
        // Validate configuration
        const razorpayValidation = validateRazorpayConfig();
        if (!razorpayValidation.valid) {
          console.error('Razorpay configuration errors:', razorpayValidation.errors);
          return res.status(500).json({
            success: false,
            message: 'Payment gateway not configured properly'
          });
        }

        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('Missing Supabase configuration');
          return res.status(500).json({
            success: false,
            message: 'Database not configured properly'
          });
        }

        const {
          amount,
          serviceName,
          serviceType,
          bookingId,
          bookingDate,
          bookingTimeSlot,
          // Address fields are OPTIONAL for payment - address is stored with the booking
          // The booking API already validated the address when the booking was created
          address,
          city,
          pincode,
          notes
        } = req.body || {};

        // Only validate amount - that's required for payment
        // Address validation is NOT needed here - it's the booking's responsibility
        if (!amount || amount < 1) {
          return res.status(400).json({ success: false, message: 'Valid amount required (minimum ₹1)' });
        }

        // Log if address is missing (for debugging) but don't fail
        if (!address && !city && !pincode && bookingId) {
          console.log('[Payment] No address provided - using booking address from booking_id:', bookingId);
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

        // Prepare insert data
        const insertData = {
          user_id: userId,
          user_phone: phone || null,
          razorpay_order_id: order.id,
          amount: amount,
          currency: 'INR',
          service_type: serviceType || null,
          service_name: serviceName || null,
          booking_id: bookingId || null,
          booking_date: bookingDate || null,
          booking_time_slot: bookingTimeSlot || null,
          address: address || null,
          city: city || null,
          pincode: pincode || null,
          notes: notes || null,
          status: 'created'
        };

        if (process.env.NODE_ENV !== 'production') {
          console.log('[Payment] Attempting to insert payment:', JSON.stringify(insertData, null, 2));
        } else {
          console.log('[Payment] Creating payment for order:', order.id);
        }

        const { data: payment, error: dbError } = await supabase
          .from('payments')
          .insert(insertData)
          .select()
          .single();

        if (dbError) {
          console.error('[Payment] Database error:', dbError.code, dbError.message);
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Payment] Error details:', dbError.hint);
          }
          
          const errorMessage = process.env.NODE_ENV === 'development'
            ? `Failed to create order record: ${dbError.message}${dbError.hint ? ` (Hint: ${dbError.hint})` : ''}`
            : 'Failed to create order record';
          
          return res.status(500).json({ success: false, message: errorMessage });
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
      }

      // ACTION: verify
      if (action === 'verify') {
        // Validate environment variables
        if (!process.env.RAZORPAY_KEY_SECRET) {
          console.error('Missing RAZORPAY_KEY_SECRET');
          return res.status(500).json({ 
            success: false, 
            message: 'Server configuration error. Please contact support.' 
          });
        }

        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('Missing Supabase configuration');
          return res.status(500).json({ 
            success: false, 
            message: 'Server configuration error. Please contact support.' 
          });
        }

        const {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        // Verify signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(body)
          .digest('hex');

        const isValid = expectedSignature === razorpay_signature;

        if (!isValid) {
          return res.status(400).json({ success: false, message: 'Invalid payment signature' });
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
          return res.status(500).json({ success: false, message: 'Failed to update payment record' });
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
      }

      // ACTION: refund
      if (action === 'refund') {
        const { paymentId, reason, amount: refundAmount } = req.body || {};

        if (!paymentId) {
          return res.status(400).json({ success: false, message: 'Payment ID required' });
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
          return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status !== 'paid') {
          return res.status(400).json({ success: false, message: 'Only paid payments can be refunded' });
        }

        if (payment.refund_status === 'processed') {
          return res.status(400).json({ success: false, message: 'Payment already refunded' });
        }

        if (!payment.razorpay_payment_id) {
          return res.status(400).json({ success: false, message: 'No Razorpay payment ID found' });
        }

        // Validate Razorpay configuration
        const razorpayValidation = validateRazorpayConfig();
        if (!razorpayValidation.valid) {
          console.error('Razorpay configuration errors:', razorpayValidation.errors);
          return res.status(500).json({
            success: false,
            message: 'Payment gateway not configured properly'
          });
        }

        // Initialize Razorpay
        const razorpay = createRazorpayInstance();

        // Calculate refund amount (full or partial)
        const refundAmountValue = refundAmount ? Math.min(refundAmount, payment.amount) : payment.amount;

        // Process refund via Razorpay API
        const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
          amount: refundAmountValue * 100, // Convert to paise
          notes: {
            reason: reason || 'Customer requested refund',
            paymentId: payment.id
          }
        });

        // Determine new status
        const newStatus = refundAmountValue >= payment.amount ? 'refunded' : 'partially_refunded';

        // Update payment record
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: newStatus,
            refund_id: refund.id,
            refund_amount: (payment.refund_amount || 0) + refundAmountValue,
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
            const smsMessage = `Refund of Rs.${refundAmountValue} initiated for ${payment.service_name || 'your booking'}. Amount will be credited within 5-7 business days. - ChillMechanic`;
            
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
            amount: refundAmountValue,
            status: refund.status,
            paymentId: payment.razorpay_payment_id
          }
        });
      }

      return res.status(400).json({ success: false, message: 'Invalid action. Use ?action=create-order, ?action=verify, or ?action=refund' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Payment] Error:', error);
    
    // Handle Razorpay specific errors
    if (error.error) {
      return res.status(400).json({
        success: false,
        message: error.error.description || 'Payment operation failed',
        code: error.error.code
      });
    }
    
    return res.status(500).json({ success: false, message: error.message || 'Payment operation failed' });
  }
}

