import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const getSupabase = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const verifyToken = (req: VercelRequest): { userId: string; phone?: string } | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.userId,
      phone: decoded.phone
    };
  } catch {
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }

  const supabase = getSupabase();

  try {
    const {
      // Booking details
      bookingDate,
      bookingTimeSlot,  // Frontend sends this
      bookingTime,      // Or this (accept both)
      specialInstructions,
      notes,
      
      // Address handling
      useProfileAddress,
      address,
      city,
      pincode,
      landmark,
      serviceAddress,   // Alternative field name
      
      // Cart items (array of services)
      items: rawItems,
      
      // Legacy single service support
      serviceName,
      serviceType,
      serviceCategory,
      serviceDescription,
      price,
      serviceId,
      
      // Payment fields
      totalAmount,
      serviceTax,
      finalAmount,
      paymentMode
    } = req.body;

    // Use whichever time field is provided - map to booking_time column
    const finalBookingTime = bookingTimeSlot || bookingTime;

    // Validate required fields
    if (!bookingDate || !finalBookingTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking date and time are required' 
      });
    }

    // Get address - either from profile or from request
    let finalAddress = address || serviceAddress;
    let finalCity = city;
    let finalPincode = pincode;
    let finalLandmark = landmark;
    let addressType = 'custom';

    if (useProfileAddress) {
      // Fetch address from user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('address, city, pincode, landmark, address_line1')
        .eq('id', user.userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Booking] Profile fetch error:', profileError);
      }

      if (!profile) {
        // Try by phone
        if (user.phone) {
          const { data: profileByPhone } = await supabase
            .from('profiles')
            .select('address, city, pincode, landmark, address_line1')
            .eq('phone', user.phone)
            .maybeSingle();
          
          if (profileByPhone && profileByPhone.address) {
            finalAddress = profileByPhone.address || profileByPhone.address_line1;
            finalCity = profileByPhone.city;
            finalPincode = profileByPhone.pincode;
            finalLandmark = profileByPhone.landmark;
            addressType = 'profile';
          }
        }
        
        if (!finalAddress) {
          return res.status(400).json({ 
            success: false, 
            message: 'No address found in profile. Please add an address or enter a custom address.' 
          });
        }
      } else {
        if (!profile.address && !profile.address_line1) {
          return res.status(400).json({ 
            success: false, 
            message: 'No address found in profile. Please add an address.' 
          });
        }
        finalAddress = profile.address || profile.address_line1;
        finalCity = profile.city;
        finalPincode = profile.pincode;
        finalLandmark = profile.landmark;
        addressType = 'profile';
      }
    } else {
      // Validate custom address
      if (!finalAddress || !finalCity || !finalPincode) {
        return res.status(400).json({ 
          success: false, 
          message: 'Complete address (address, city, pincode) is required' 
        });
      }
    }

    // Convert items to array if it's an object with numeric keys
    let items: any[] = [];
    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems && typeof rawItems === 'object') {
      // Handle case where items comes as { '0': {...}, '1': {...} }
      items = Object.values(rawItems);
    }

    // Build booking items array
    let bookingItems: any[] = [];
    let calculatedTotalAmount = 0;

    if (items && items.length > 0) {
      // Multiple items from cart
      bookingItems = items.map(item => {
        // Convert service_description to array format (database expects TEXT[])
        let serviceDescriptionArray: string[] | null = null;
        const descriptionSource = item.serviceDescription || item.description || item.notes || null;
        
        if (descriptionSource) {
          if (Array.isArray(descriptionSource)) {
            serviceDescriptionArray = descriptionSource;
          } else if (typeof descriptionSource === 'string') {
            // If it's a string, split by comma or create array with single item
            serviceDescriptionArray = descriptionSource.includes(',') 
              ? descriptionSource.split(',').map((d: string) => d.trim()).filter(Boolean)
              : [descriptionSource];
          }
        }

        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || item.unit_price || item.price || 0;
        const totalPrice = unitPrice * quantity;

        return {
          service_id: item.serviceId || item.service_id || null,
          service_name: item.serviceName || item.service_name || item.name,
          service_type: item.serviceType || item.service_type || null,
          service_category: item.serviceCategory || item.service_category || null,
          service_description: serviceDescriptionArray,  // DB has 'service_description' as TEXT[] not 'notes'
          quantity: quantity,
          price: unitPrice,
          unit_price: unitPrice,
          total_price: totalPrice
        };
      });
      calculatedTotalAmount = bookingItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    } else if (serviceName && price) {
      // Legacy single service
      let serviceDescriptionArray: string[] | null = null;
      if (serviceDescription) {
        if (Array.isArray(serviceDescription)) {
          serviceDescriptionArray = serviceDescription;
        } else if (typeof serviceDescription === 'string') {
          serviceDescriptionArray = serviceDescription.includes(',') 
            ? serviceDescription.split(',').map((d: string) => d.trim()).filter(Boolean)
            : [serviceDescription];
        }
      }

      bookingItems = [{
        service_id: serviceId || null,
        service_name: serviceName,
        service_type: serviceType || null,
        service_category: serviceCategory || null,
        service_description: serviceDescriptionArray,
        quantity: 1,
        price: price,
        unit_price: price,
        total_price: price
      }];
      calculatedTotalAmount = price;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one service item is required' 
      });
    }

    // Use provided amounts or calculate from items
    const finalTotalAmount = totalAmount || calculatedTotalAmount;
    const finalServiceTax = serviceTax || 0;
    const finalFinalAmount = finalAmount || (finalTotalAmount + finalServiceTax);

    // Determine payment status based on payment mode
    const isPayLater = paymentMode === 'pay_later';
    const paymentStatus = isPayLater ? 'pay_later' : 'pending';

    // Create booking record - using EXACT column names from your database
    const bookingData: Record<string, any> = {
      user_id: user.userId,
      booking_date: bookingDate,
      booking_time: finalBookingTime,  // DB column is 'booking_time' not 'booking_time_slot'
      address: finalAddress,
      city: finalCity,
      pincode: finalPincode,
      landmark: finalLandmark || null,
      service_address: finalAddress,  // Also populate service_address if it exists
      use_profile_address: useProfileAddress || false,
      address_type: addressType,
      total_amount: finalTotalAmount,
      service_tax: finalServiceTax,
      final_amount: finalFinalAmount,
      special_instructions: specialInstructions || notes || null,
      status: 'pending',
      payment_status: paymentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[Booking] Creating booking with data:', JSON.stringify(bookingData, null, 2));

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('[Booking] Create error:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking',
        error: bookingError.message
      });
    }

    // Create booking items - using EXACT column names from your database
    const itemsToInsert = bookingItems.map(item => ({
      booking_id: booking.id,
      service_id: item.service_id,
      service_name: item.service_name,
      service_type: item.service_type,
      service_category: item.service_category,
      service_description: item.service_description,  // DB has 'service_description' as TEXT[] not 'notes'
      quantity: item.quantity,
      price: item.price,
      unit_price: item.unit_price,
      total_price: item.total_price,
      created_at: new Date().toISOString()
    }));

    console.log('[Booking] Creating items:', JSON.stringify(itemsToInsert, null, 2));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('booking_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('[Booking] Items error:', {
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
        code: itemsError.code
      });
      // Rollback - delete the booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking items',
        error: itemsError.message
      });
    }

    console.log('[Booking] Created successfully:', booking.id, 'with', insertedItems?.length || 0, 'items');

    return res.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        address: booking.address || booking.service_address,
        city: booking.city,
        pincode: booking.pincode,
        totalAmount: booking.total_amount,
        serviceTax: booking.service_tax,
        finalAmount: booking.final_amount,
        status: booking.status,
        paymentStatus: booking.payment_status,
        serviceAddress: booking.service_address,
        paymentMode: isPayLater ? 'pay_later' : 'pay_now',
        itemCount: insertedItems?.length || bookingItems.length
      }
    });

  } catch (error: any) {
    console.error('[Booking] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
