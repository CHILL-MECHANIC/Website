import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { APIError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Create a new booking
 * POST /api/booking/create
 */
router.post('/create', asyncHandler(async (req: Request, res: Response) => {
  // Verify auth
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

  const {
    bookingDate,
    bookingTime,
    totalAmount,
    serviceTax,
    finalAmount,
    specialInstructions,
    serviceAddress,
    paymentMode,
    items: rawItems
  } = req.body || {};

  // Convert items to array if it's an object with numeric keys
  let items: any[] = [];
  if (Array.isArray(rawItems)) {
    items = rawItems;
  } else if (rawItems && typeof rawItems === 'object') {
    // Handle case where items comes as { '0': {...}, '1': {...} }
    items = Object.values(rawItems);
  }

  if (!bookingDate || !bookingTime || !finalAmount || items.length === 0) {
    throw new APIError(400, 'Missing required booking details');
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Determine payment status based on payment mode
  const isPayLater = paymentMode === 'pay_later';
  const paymentStatus = isPayLater ? 'pay_later' : 'pending';

  // Check if user is admin to skip GST
  let isAdmin = false;
  try {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    isAdmin = !!roleData;
  } catch (e) {
    isAdmin = false;
  }

  const effectiveServiceTax = isAdmin ? 0 : (serviceTax || 0);
  const effectiveFinalAmount = isAdmin ? (finalAmount - (serviceTax || 0)) : finalAmount;

  // Create booking record
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      total_amount: totalAmount,
      service_tax: effectiveServiceTax,
      final_amount: effectiveFinalAmount,
      status: 'pending',
      payment_status: paymentStatus,
      special_instructions: specialInstructions || null,
      service_address: serviceAddress || null
    })
    .select()
    .single();

  if (bookingError) {
    console.error('Booking error:', bookingError);
    throw new APIError(500, 'Failed to create booking');
  }

  // Create booking items
  const bookingItems = items.map((item: any) => {
    // Convert description to array format (database expects TEXT[])
    let serviceDescription: string[] | null = null;
    if (item.description) {
      if (Array.isArray(item.description)) {
        serviceDescription = item.description;
      } else if (typeof item.description === 'string') {
        // If it's a string, split by comma or create array with single item
        serviceDescription = item.description.includes(',') 
          ? item.description.split(',').map((d: string) => d.trim()).filter(Boolean)
          : [item.description];
      }
    }

    return {
      booking_id: booking.id,
      service_name: item.name,
      service_description: serviceDescription,
      price: item.price,
      quantity: item.quantity || 1
    };
  });

  const { error: itemsError, data: insertedItems } = await supabase
    .from('booking_items')
    .insert(bookingItems)
    .select();

  if (itemsError) {
    console.error('Booking items error:', {
      message: itemsError.message,
      details: itemsError.details,
      hint: itemsError.hint,
      code: itemsError.code,
      bookingItems: bookingItems
    });
    // Rollback booking if items fail
    await supabase.from('bookings').delete().eq('id', booking.id);
    throw new APIError(500, `Failed to create booking items: ${itemsError.message}`);
  }

  console.log('Booking items created successfully:', insertedItems?.length || 0);

  // ===== SEND BOOKING CONFIRMATION SMS =====
  try {
    console.log('[SMS] Starting booking confirmation SMS...');
    
    // First try to get phone from profile, fallback to decoded token
    let customerPhone: string | null = null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('user_id', userId)
      .single();

    if (profile?.phone) {
      customerPhone = String(profile.phone).replace(/^\+?91/, '');
      console.log('[SMS] Phone from profile:', customerPhone);
    } else if (decoded.phone) {
      customerPhone = String(decoded.phone).replace(/^\+?91/, '');
      console.log('[SMS] Phone from token:', customerPhone);
    }

    console.log('[SMS] Final customer phone:', customerPhone);

    if (customerPhone && customerPhone.length >= 10) {
      const smsMessage = `Dear Customer,\n\nYour booking with Chill Mechanic has been confirmed successfully. Our team will assign a technician shortly and keep you informed.\n\nRegards,\nChill Mechanic\nHappy Appliances, Happier Homes`;

      const smsApiKey = process.env.SMS_API_KEY;
      const smsSenderId = process.env.SMS_SENDER_ID || 'CHLMEH';

      console.log('[SMS] API Key exists:', !!smsApiKey);
      console.log('[SMS] Sender ID:', smsSenderId);
      console.log('[SMS] Customer phone (cleaned):', customerPhone);

      if (smsApiKey) {
        console.log('[SMS] Sending to API using axios...');
        try {
          const smsResponse = await axios.post(
            'https://api.uniquedigitaloutreach.com/v1/sms',
            {
              sender: smsSenderId,
              to: '91' + customerPhone,
              text: smsMessage,
              type: 'OTP',
              templateId: '1007913640137046123'
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'apikey': smsApiKey
              },
              timeout: 30000
            }
          );
          console.log('[SMS] Response status:', smsResponse.status);
          console.log('[SMS] Response data:', JSON.stringify(smsResponse.data));
          console.log('[SMS] Confirmation SMS sent to customer:', customerPhone);
        } catch (axiosError: any) {
          console.error('[SMS] Axios error:', axiosError.message);
          if (axiosError.response) {
            console.error('[SMS] Response status:', axiosError.response.status);
            console.error('[SMS] Response data:', axiosError.response.data);
          }
        }
      } else {
        console.log('[SMS] No API key configured - SMS_API_KEY environment variable is missing');
      }
    } else {
      console.log('[SMS] No valid phone found - profile phone:', profile?.phone, 'token phone:', decoded.phone);
    }
  } catch (smsError) {
    console.error('[SMS] Notification error:', smsError);
    // Don't fail the booking if SMS fails
  }

  return res.status(200).json({
    success: true,
    booking: {
      id: booking.id,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      totalAmount: booking.total_amount,
      serviceTax: booking.service_tax,
      finalAmount: booking.final_amount,
      status: booking.status,
      paymentStatus: booking.payment_status,
      serviceAddress: booking.service_address,
      paymentMode: isPayLater ? 'pay_later' : 'pay_now'
    }
  });
}));

export default router;

