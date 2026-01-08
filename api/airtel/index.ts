import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Support number fallback
const SUPPORT_NUMBER = '7943444285';
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
function normalizePhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading 91 if 12 digits (Indian country code)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
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

  console.log('[Airtel Inbound] Request:', { callingParticipant, callerId });

  // Validate required fields
  if (!callingParticipant) {
    console.log('[Airtel Inbound] Missing callingParticipant');
    return res.status(400).json({ error: 'Missing callingParticipant' });
  }

  // Normalize the customer phone number
  const customerPhone = normalizePhone(String(callingParticipant));
  console.log('[Airtel Inbound] Normalized phone:', customerPhone);

  // Default to support number
  let participantName = SUPPORT_NAME;
  let participantAddress = SUPPORT_NUMBER;

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Airtel Inbound] Missing Supabase configuration');
      // Return support number on config error
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] Returning support (config error):', response);
      return res.status(200).json(response);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query for active booking by customer phone
    // Try multiple phone formats
    const phoneVariants = [
      customerPhone,
      `91${customerPhone}`,
      `+91${customerPhone}`,
    ];

    console.log('[Airtel Inbound] Searching for phone variants:', phoneVariants);

    // First, find the user profile with this phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .or(phoneVariants.map(p => `phone.ilike.%${p}`).join(','))
      .limit(1)
      .single();

    if (profileError || !profile) {
      console.log('[Airtel Inbound] No profile found for phone:', customerPhone);
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] Returning support (no profile):', response);
      return res.status(200).json(response);
    }

    console.log('[Airtel Inbound] Found profile:', profile.id);

    // Find active booking for this user with assigned technician
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_date,
        booking_time,
        technician_id
      `)
      .eq('user_id', profile.id)
      .in('status', ['confirmed', 'assigned', 'accepted', 'in_progress'])
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (bookingError || !booking) {
      console.log('[Airtel Inbound] No active booking found for user:', profile.id);
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] Returning support (no booking):', response);
      return res.status(200).json(response);
    }

    console.log('[Airtel Inbound] Found booking:', booking.id, 'Status:', booking.status);

    // Check if technician is assigned
    if (!booking.technician_id) {
      console.log('[Airtel Inbound] Booking has no technician assigned');
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] Returning support (no technician):', response);
      return res.status(200).json(response);
    }

    // Fetch technician details
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select('id, name, phone')
      .eq('id', booking.technician_id)
      .single();

    if (techError || !technician || !technician.phone) {
      console.log('[Airtel Inbound] Technician not found or no phone:', booking.technician_id);
      const response = buildAirtelResponse(participantName, participantAddress, callerId);
      console.log('[Airtel Inbound] Returning support (technician error):', response);
      return res.status(200).json(response);
    }

    // Success - route to technician
    participantName = sanitizeParticipantName(technician.name);
    participantAddress = normalizePhone(String(technician.phone));

    console.log('[Airtel Inbound] Routing to technician:', {
      name: participantName,
      phone: participantAddress,
      bookingId: booking.id
    });

  } catch (error) {
    console.error('[Airtel Inbound] Error:', error);
    // On any error, fall back to support number
  }

  const response = buildAirtelResponse(participantName, participantAddress, callerId);
  console.log('[Airtel Inbound] Final response:', JSON.stringify(response));
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
