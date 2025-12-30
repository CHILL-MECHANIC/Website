import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    // Verify auth
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
      return res.status(400).json({ success: false, message: 'Missing required booking details' });
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
      return res.status(500).json({ success: false, message: 'Failed to create booking' });
    }

    // Create booking items
    const bookingItems = items.map((item: any) => ({
      booking_id: booking.id,
      service_name: item.name,
      service_description: item.description || null,
      price: item.price,
      quantity: item.quantity || 1
    }));

    const { error: itemsError } = await supabase
      .from('booking_items')
      .insert(bookingItems);

    if (itemsError) {
      console.error('Booking items error:', itemsError);
      // Rollback booking if items fail
      await supabase.from('bookings').delete().eq('id', booking.id);
      return res.status(500).json({ success: false, message: 'Failed to create booking items' });
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
  } catch (error: any) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create booking' });
  }
}

