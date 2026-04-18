import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// ===== AUTH HELPERS =====
interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
}

interface TokenVerifyResult {
  user: AuthUser | null;
  error: string | null;
}

const createSupabaseAdmin = (): SupabaseClient => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

interface JWTPayload {
  sub: string;
  phone?: string;
  email?: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}

const verifyAuthToken = (authHeader: string | undefined): TokenVerifyResult => {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization required' };
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    return { user: null, error: 'Server configuration error' };
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    if (decoded.role !== 'authenticated' && decoded.aud !== 'authenticated') {
      return { user: null, error: 'Invalid token role' };
    }
    
    return {
      user: { 
        id: decoded.sub, 
        phone: decoded.phone?.replace('+', ''), 
        email: decoded.email 
      },
      error: null
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    return { user: null, error: message };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    // Verify authentication
    const { user, error: authError } = verifyAuthToken(req.headers.authorization);
    if (authError || !user) {
      return res.status(401).json({ success: false, message: authError || 'Unauthorized' });
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    const supabase = createSupabaseAdmin();

    // ===== STEP 1: FETCH BOOKING =====
    console.log(`[Booking Cancel] User: ${user.id}, Booking: ${bookingId}`);
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      console.log(`[Booking Cancel] Booking not found or unauthorized`);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ===== STEP 2: CHECK IF CANCELLATION IS ALLOWED =====
    const bookingCreatedAt = new Date(booking.created_at);
    const msElapsed = Date.now() - bookingCreatedAt.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (msElapsed > oneHourMs) {
      console.log(`[Booking Cancel] Cancellation window expired (${(msElapsed / 1000 / 60).toFixed(1)} minutes elapsed)`);
      return res.status(400).json({ 
        success: false, 
        message: 'Cancellation is only allowed within 1 hour of booking' 
      });
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      console.log(`[Booking Cancel] Booking already cancelled`);
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // ===== STEP 3: UPDATE BOOKING STATUS =====
    console.log(`[Booking Cancel] Updating booking status to cancelled`);
    
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error(`[Booking Cancel] Database error:`, updateError);
      return res.status(500).json({ success: false, message: 'Failed to cancel booking' });
    }

    // ===== STEP 4: PROCESS REFUND IF PAID =====
    let refundInfo = null;

    if (booking.payment_status === 'paid') {
      console.log(`[Booking Cancel] Processing refund for paid booking`);
      
      // Fetch payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'paid')
        .single();

      if (payment && !paymentError) {
        console.log(`[Booking Cancel] Found payment: ${payment.id}, Amount: ₹${payment.amount}`);
        
        // Update payment status to refunded
        const { error: refundError } = await supabase
          .from('payments')
          .update({
            status: 'refunded',
            refund_status: 'requested',
            refund_amount: payment.amount,
            refund_id: `REFUND_${bookingId}_${Date.now()}`,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (!refundError) {
          refundInfo = {
            amount: payment.amount,
            refundId: `REFUND_${bookingId}_${Date.now()}`,
            status: 'initiated'
          };
          console.log(`[Booking Cancel] Refund initiated: ₹${payment.amount}`);
        } else {
          console.error(`[Booking Cancel] Refund update error:`, refundError);
        }
      }
    }

    // ===== STEP 5: UPDATE BOOKING PAYMENT STATUS =====
    if (booking.payment_status === 'paid') {
      await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded'
        })
        .eq('id', bookingId);
    }

    console.log(`[Booking Cancel] ✓ Successfully cancelled booking ${bookingId}`);

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: bookingId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      },
      refund: refundInfo,
      refundMessage: refundInfo 
        ? `Refund of ₹${refundInfo.amount} will be credited within 5-7 business days` 
        : null
    });

  } catch (error: any) {
    console.error('[Booking Cancel] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking'
    });
  }
}
