import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ===== INLINED FROM _lib/supabase.ts =====
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

const verifySupabaseToken = async (authHeader: string | undefined): Promise<TokenVerifyResult> => {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization required' };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const supabase = createSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }
    
    return {
      user: { id: user.id, phone: user.phone, email: user.email },
      error: null
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    return { user: null, error: message };
  }
};

// ===== PARSE ADDRESS STRING =====
// Handles formats like:
// "C BLOCK, Bhopal, Madhya Pradesh, Pincode: 462003"
// "C BLOCK, Bhopal, Madhya Pradesh - 462003"
// "123 Street, City - 123456"
const parseAddressString = (addressString: string): { 
  address: string; 
  city: string | null; 
  state: string | null; 
  pincode: string | null 
} => {
  if (!addressString) {
    return { address: '', city: null, state: null, pincode: null };
  }

  let str = addressString.trim();
  let pincode: string | null = null;
  let state: string | null = null;
  let city: string | null = null;
  let address: string = str;

  // Extract pincode - various formats:
  // "Pincode: 462003" or "Pincode:462003" or "Pin: 462003"
  const pincodeWithLabel = str.match(/,?\s*(?:Pincode|Pin|PIN)[\s:]*(\d{6})\s*$/i);
  if (pincodeWithLabel) {
    pincode = pincodeWithLabel[1];
    str = str.replace(pincodeWithLabel[0], '').trim();
  } else {
    // Just 6 digits at the end: "- 462003" or ", 462003" or " 462003"
    const pincodeOnly = str.match(/[\s,\-]*(\d{6})\s*$/);
    if (pincodeOnly) {
      pincode = pincodeOnly[1];
      str = str.replace(pincodeOnly[0], '').trim();
    }
  }

  // Remove trailing comma or dash
  str = str.replace(/[,\-\s]+$/, '').trim();

  // Split remaining by comma
  const parts = str.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length >= 3) {
    // "C BLOCK, Bhopal, Madhya Pradesh"
    state = parts.pop() || null;
    city = parts.pop() || null;
    address = parts.join(', ');
  } else if (parts.length === 2) {
    // "C BLOCK, Bhopal"
    city = parts.pop() || null;
    address = parts.join(', ');
  } else if (parts.length === 1) {
    address = parts[0];
  }

  // Only log parsed address in non-production to avoid PII in logs
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Booking] Parsed address:', { original: addressString, address, city, state, pincode });
  }

  return { address, city, state, pincode };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { user, error: authError } = await verifySupabaseToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ success: false, message: authError || 'Authorization required' });
  }

  const userId = user.id;
  const supabase = createSupabaseAdmin();

  try {
    const body = req.body || {};
    // Only log non-sensitive data in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Booking] Received request:', JSON.stringify(body, null, 2));
    } else {
      console.log('[Booking] Request - date:', body.bookingDate, 'items:', body.items?.length || 0);
    }

    const {
      // Booking details
      bookingDate,
      bookingTime,
      bookingTimeSlot,
      totalAmount,
      finalAmount,
      serviceTax,
      travelCharges,
      specialInstructions,
      notes,
      paymentMode,
      
      // Address - multiple possible field names
      serviceAddress,  // "C BLOCK, Bhopal, Madhya Pradesh, Pincode: 462003"
      fullAddress,
      address,
      city,
      pincode,
      landmark,
      useProfileAddress,
      
      // Items
      items
    } = body;

    // Validate required fields
    const finalBookingTime = bookingTime || bookingTimeSlot;
    if (!bookingDate) {
      return res.status(400).json({ success: false, message: 'Booking date is required' });
    }

    // ===== ADDRESS HANDLING =====
    let finalAddress: string | null = null;
    let finalCity: string | null = null;
    let finalPincode: string | null = null;
    let finalLandmark: string | null = landmark || null;
    let addressType = 'custom';

    if (useProfileAddress) {
      // Fetch from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('address, city, pincode, landmark')
        .eq('id', userId)
        .single();

      if (profile?.address) {
        finalAddress = profile.address;
        finalCity = profile.city;
        finalPincode = profile.pincode;
        finalLandmark = profile.landmark || landmark;
        addressType = 'profile';
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'No address found in profile. Please add an address.' 
        });
      }
    } else {
      // Use provided address - check all possible field names
      const addressString = serviceAddress || fullAddress || address || '';
      
      if (addressString) {
        // Parse the address string
        const parsed = parseAddressString(addressString);
        finalAddress = parsed.address || addressString;
        finalCity = city || parsed.city;
        finalPincode = pincode || parsed.pincode;
      }
    }

    // Validate we have at least an address
    if (!finalAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address is required' 
      });
    }

    // ===== BUILD BOOKING ITEMS =====
    let bookingItems: any[] = [];
    let calculatedTotal = 0;

    if (items && Array.isArray(items) && items.length > 0) {
      // Validate items have required fields
      for (const item of items) {
        const itemName = item.name || item.serviceName || item.service_name;
        const itemPrice = item.price || item.unitPrice || item.unit_price;
        
        if (!itemName) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have a name'
          });
        }
        
        if (typeof itemPrice !== 'number' || itemPrice < 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid price for item: ${itemName}`
          });
        }
      }

      bookingItems = items.map((item: any) => {
        const qty = item.quantity || 1;
        const unitPrice = item.price || item.unitPrice || item.unit_price || 0;
        const itemTotal = unitPrice * qty;
        calculatedTotal += itemTotal;

        return {
          service_id: item.serviceId || item.service_id || item.id || null,
          service_name: item.name || item.serviceName || item.service_name,
          service_type: item.type || item.serviceType || item.service_type || null,
          service_category: item.category || item.serviceCategory || item.service_category || null,
          service_description: item.description || item.serviceDescription || null,
          quantity: qty,
          price: unitPrice,
          unit_price: unitPrice,
          total_price: itemTotal
        };
      });
    }

    if (bookingItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one service item is required' 
      });
    }

    // Use provided total or calculated
    const bookingTotal = finalAmount || totalAmount || calculatedTotal;

    // ===== CREATE BOOKING =====
    const bookingData = {
      user_id: userId,
      booking_date: bookingDate,
      booking_time: finalBookingTime || null,
      total_amount: calculatedTotal,
      service_tax: serviceTax || 0,
      travel_charges: travelCharges || 0,
      final_amount: bookingTotal,
      service_address: serviceAddress || fullAddress || finalAddress,
      address: finalAddress,
      city: finalCity,
      pincode: finalPincode,
      landmark: finalLandmark,
      use_profile_address: useProfileAddress || false,
      address_type: addressType,
      special_instructions: specialInstructions || notes || null,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Avoid logging PII in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Booking] Creating booking:', JSON.stringify(bookingData, null, 2));
    } else {
      console.log('[Booking] Creating booking for user:', userId);
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('[Booking] Create error:', bookingError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking',
        error: bookingError.message
      });
    }

    // ===== CREATE BOOKING ITEMS =====
    const itemsToInsert = bookingItems.map(item => ({
      ...item,
      booking_id: booking.id,
      created_at: new Date().toISOString()
    }));

    // Avoid logging PII in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Booking] Creating items:', JSON.stringify(itemsToInsert, null, 2));
    } else {
      console.log('[Booking] Creating', itemsToInsert.length, 'items');
    }

    const { data: insertedItems, error: itemsError } = await supabase
      .from('booking_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('[Booking] Items error:', itemsError.message);
      // Rollback
      await supabase.from('bookings').delete().eq('id', booking.id);
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking items',
        error: itemsError.message
      });
    }

    console.log('[Booking] Created successfully:', booking.id, 'with', insertedItems?.length, 'items');

    return res.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        address: booking.address,
        city: booking.city,
        pincode: booking.pincode,
        totalAmount: booking.total_amount,
        finalAmount: booking.final_amount,
        status: booking.status,
        paymentStatus: booking.payment_status,
        itemCount: insertedItems?.length || bookingItems.length
      }
    });

  } catch (error: any) {
    console.error('[Booking] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
