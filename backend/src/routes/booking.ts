import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
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

  // Create booking record
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      total_amount: totalAmount,
      service_tax: serviceTax || 0,
      final_amount: finalAmount,
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

