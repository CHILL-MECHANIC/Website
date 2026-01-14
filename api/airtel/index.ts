import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Support number fallback
const SUPPORT_NUMBER = '9211970032';
const SUPPORT_NAME = 'Support_Team';

// ===== BASIC AUTH VALIDATION =====
function validateAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    console.log('[Airtel] Missing or invalid Authorization header');
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.AIRTEL_WEBHOOK_USERNAME;
  const expectedPassword = process.env.AIRTEL_WEBHOOK_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    console.error('[Airtel] Missing AIRTEL_WEBHOOK_USERNAME or AIRTEL_WEBHOOK_PASSWORD env vars');
    return false;
  }

  const isValid = username === expectedUsername && password === expectedPassword;

  if (!isValid) {
    console.log('[Airtel] Invalid credentials provided');
  }

  return isValid;
}

// ===== NORMALIZE PHONE NUMBER =====
// Converts any phone format to 10-digit format (without country code)
function normalizePhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 91 if 12 digits (Indian country code)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading 0 if present (sometimes used in local format)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

// ===== GENERATE ALL PHONE VARIANTS =====
// Creates all possible formats that might be stored in the database
function generatePhoneVariants(normalizedPhone: string): string[] {
  // normalizedPhone is 10-digit format (e.g., "7987376613")
  return [
    normalizedPhone,              // "7987376613"
    `0${normalizedPhone}`,        // "07987376613" (local format with leading 0)
    `91${normalizedPhone}`,       // "917987376613" (with country code)
    `+91${normalizedPhone}`,      // "+917987376613" (international format)
  ];
}

// ===== SANITIZE PARTICIPANT NAME =====
function sanitizeParticipantName(name: string | null | undefined): string {
  if (!name) return SUPPORT_NAME;

  // Remove special characters, keep alphanumeric and spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  // Get first name only and prefix with "Tech_"
  const firstName = cleaned.split(' ')[0] || 'Technician';

  return `Tech_${firstName}`;
}

// ===== BUILD AIRTEL RESPONSE =====
function buildAirtelResponse(
  participantName: string,
  participantAddress: string,
  callerId: string
) {
  return {
    client_add_participant: {
      participants: [{
        participantName,
        participantAddress,
        callerId: callerId || '7943444284',
        maxRetries: 2,
        audioId: 0,
        maxTime: 60,
        enableEarlyMedia: 'false'
      }],
      mergingStrategy: 'SEQUENTIAL',
      maxTime: 120
    }
  };
}

// ===== HANDLE INBOUND CALL =====
async function handleInbound(req: VercelRequest, res: VercelResponse) {
  const { callingParticipant, callerId } = req.body || {};

  console.log('========================================');
  console.log('[Airtel Inbound] NEW INBOUND CALL');
  console.log('[Airtel Inbound] Raw Request:', JSON.stringify({ callingParticipant, callerId }));

  // Validate required fields
  if (!callingParticipant) {
    console.log('[Airtel Inbound] ERROR: Missing callingParticipant in request body');
    return res.status(400).json({ error: 'Missing callingParticipant' });
  }

  // ===== STEP 1: NORMALIZE INCOMING PHONE =====
  const rawPhone = String(callingParticipant);
  const customerPhone = normalizePhone(rawPhone);
  console.log('[Airtel Inbound] STEP 1 - Phone Normalization:');
  console.log('  - Raw phone:', rawPhone);
  console.log('  - Normalized phone:', customerPhone);

  // Generate all possible variants to search for in database
  const phoneVariants = generatePhoneVariants(customerPhone);
  console.log('  - Phone variants to search:', phoneVariants);

  // Default to support number
  let participantName = SUPPORT_NAME;
  let participantAddress = SUPPORT_NUMBER;

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Airtel Inbound] ERROR: Missing Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (config error)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===== STEP 2: FIND CUSTOMER PROFILE =====
    console.log('[Airtel Inbound] STEP 2 - Profile Lookup:');
    console.log('  - Querying profiles table with phone variants...');

    // Build OR condition properly for Supabase
    // We need to check if the phone column exactly matches any of our variants
    // Using .in() for exact matching across multiple values
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .in('phone', phoneVariants);

    // Log the query result
    if (profileError) {
      console.log('  - Profile query ERROR:', JSON.stringify(profileError, null, 2));
      console.log('  - Error message:', profileError.message);
      console.log('  - Error details:', profileError.details);
      console.log('  - Error hint:', profileError.hint);
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (profile query error)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    if (!profiles || profiles.length === 0) {
      console.log('  - Profile query SUCCESS but NO MATCH found');
      console.log('  - Searched for variants:', phoneVariants);
      console.log('  - This means the customer phone is not in the profiles table');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (no profile found)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    // If multiple profiles found, use the first one
    const profile = profiles[0];
    console.log('  - Profile query SUCCESS');
    console.log('  - Found profile ID:', profile.id);
    console.log('  - Profile phone format in DB:', profile.phone);
    if (profiles.length > 1) {
      console.log('  - WARNING: Multiple profiles found for this phone (', profiles.length, ')');
      console.log('  - Using first profile:', profile.id);
    }

    // ===== STEP 3: FIND ACTIVE BOOKING =====
    console.log('[Airtel Inbound] STEP 3 - Booking Lookup:');
    console.log('  - Querying bookings table for user_id:', profile.id);
    console.log('  - Looking for status in: [confirmed, assigned, accepted, in_progress]');

    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_date,
        booking_time,
        technician_id,
        created_at
      `)
      .eq('user_id', profile.id)
      .in('status', ['confirmed', 'assigned', 'accepted', 'in_progress'])
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Log the query result
    if (bookingError) {
      console.log('  - Booking query ERROR:', JSON.stringify(bookingError, null, 2));
      console.log('  - Error message:', bookingError.message);
      console.log('  - Error details:', bookingError.details);
      console.log('  - Error hint:', bookingError.hint);
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (booking query error)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    if (!bookings || bookings.length === 0) {
      console.log('  - Booking query SUCCESS but NO ACTIVE BOOKING found');
      console.log('  - User has no bookings with status: confirmed, assigned, accepted, or in_progress');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (no active booking)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    // Use the most recent booking
    const booking = bookings[0];
    console.log('  - Booking query SUCCESS');
    console.log('  - Found', bookings.length, 'active booking(s)');
    console.log('  - Using most recent booking ID:', booking.id);
    console.log('  - Booking status:', booking.status);
    console.log('  - Booking date:', booking.booking_date);
    console.log('  - Booking time:', booking.booking_time);
    console.log('  - Technician ID:', booking.technician_id || 'NULL');

    // ===== STEP 4: CHECK TECHNICIAN ASSIGNMENT =====
    console.log('[Airtel Inbound] STEP 4 - Technician Assignment Check:');

    if (!booking.technician_id) {
      console.log('  - Booking has NO TECHNICIAN ASSIGNED (technician_id is null)');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (no technician assigned)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    console.log('  - Booking HAS technician assigned, ID:', booking.technician_id);

    // ===== STEP 5: FETCH TECHNICIAN DETAILS =====
    console.log('[Airtel Inbound] STEP 5 - Technician Lookup:');
    console.log('  - Querying technicians table for ID:', booking.technician_id);

    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select('id, name, phone')
      .eq('id', booking.technician_id)
      .single();

    // Log the query result
    if (techError) {
      console.log('  - Technician query ERROR:', JSON.stringify(techError, null, 2));
      console.log('  - Error message:', techError.message);
      console.log('  - Error details:', techError.details);
      console.log('  - Error hint:', techError.hint);
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (technician query error)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    if (!technician) {
      console.log('  - Technician query SUCCESS but TECHNICIAN NOT FOUND');
      console.log('  - Technician ID', booking.technician_id, 'does not exist in technicians table');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (technician not found)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    console.log('  - Technician query SUCCESS');
    console.log('  - Technician ID:', technician.id);
    console.log('  - Technician name:', technician.name);
    console.log('  - Technician phone (raw):', technician.phone);

    // ===== STEP 6: VALIDATE TECHNICIAN PHONE =====
    console.log('[Airtel Inbound] STEP 6 - Technician Phone Validation:');

    if (!technician.phone) {
      console.log('  - ERROR: Technician phone is NULL or EMPTY');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (technician has no phone)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    const techPhone = normalizePhone(String(technician.phone));

    if (techPhone.length !== 10) {
      console.log('  - ERROR: Technician phone is invalid after normalization');
      console.log('  - Raw:', technician.phone);
      console.log('  - Normalized:', techPhone);
      console.log('  - Length:', techPhone.length, '(expected 10)');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] RESULT: Returning support (technician phone invalid)');
      console.log('========================================');
      return res.status(200).json(response);
    }

    console.log('  - Technician phone is VALID');
    console.log('  - Normalized phone:', techPhone);

    // ===== SUCCESS: ROUTE TO TECHNICIAN =====
    participantName = sanitizeParticipantName(technician.name);
    participantAddress = techPhone;

    console.log('[Airtel Inbound] ✓ SUCCESS - ROUTING TO TECHNICIAN');
    console.log('  - Technician name (sanitized):', participantName);
    console.log('  - Technician phone:', participantAddress);
    console.log('  - Booking ID:', booking.id);
    console.log('  - Customer profile ID:', profile.id);

  } catch (error) {
    console.error('[Airtel Inbound] UNEXPECTED ERROR in try-catch block:');
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('  - Error message:', error instanceof Error ? error.message : String(error));
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.log('[Airtel Inbound] RESULT: Returning support (unexpected error)');
    // On any unexpected error, fall back to support number
  }

  // ===== FINAL RESPONSE =====
  const response = buildAirtelResponse(participantName, participantAddress, callerId);
  console.log('[Airtel Inbound] FINAL RESPONSE:', JSON.stringify(response, null, 2));
  console.log('========================================');
  return res.status(200).json(response);
}

// ===== HANDLE CALLBACK (CDR) =====
async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const callbackData = req.body || {};

  console.log('[Airtel Callback] Received:', JSON.stringify(callbackData, null, 2));

  // Extract key fields for logging
  const {
    eventType,
    vmSessionId,
    clientCorrelationId,
    callerId,
    callingParticipant,
    callType,
    startTime,
    endTime,
    duration,
    recordingUrl,
    status,
    participants
  } = callbackData;

  console.log('[Airtel Callback] Summary:', {
    eventType,
    vmSessionId,
    callerId,
    callingParticipant,
    callType,
    duration,
    status,
    recordingUrl: recordingUrl ? 'present' : 'none'
  });

  // Optionally store in call_logs table
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try to insert into call_logs table (if it exists)
      const { error } = await supabase
        .from('call_logs')
        .insert({
          event_type: eventType,
          session_id: vmSessionId,
          correlation_id: clientCorrelationId,
          caller_id: callerId,
          calling_participant: callingParticipant,
          call_type: callType,
          start_time: startTime ? new Date(startTime).toISOString() : null,
          end_time: endTime ? new Date(endTime).toISOString() : null,
          duration: duration,
          recording_url: recordingUrl,
          status: status,
          participants: participants,
          raw_data: callbackData,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Table might not exist, that's okay
        console.log('[Airtel Callback] Could not store in call_logs:', error.message);
      } else {
        console.log('[Airtel Callback] Stored in call_logs');
      }
    }
  } catch (error) {
    console.log('[Airtel Callback] Error storing callback:', error);
    // Don't fail the response
  }

  // Always acknowledge receipt
  return res.status(200).json({ success: true });
}

// ===== MAIN HANDLER =====
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    console.log('[Airtel] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate Basic Auth (temporarily disabled for testing)
  // if (!validateAuth(req)) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  // Get action from query param
  const action = req.query.action as string;
  console.log('[Airtel] Action:', action);

  // Route based on action
  switch (action) {
    case 'inbound':
      return handleInbound(req, res);
    case 'callback':
      return handleCallback(req, res);
    default:
      console.log('[Airtel] Invalid action:', action);
      return res.status(400).json({ error: 'Invalid action. Use ?action=inbound or ?action=callback' });
  }
}
