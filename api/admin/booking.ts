import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ===== action=update: secured full edit =====
// Unlike assign/status/updateAmount below, this one checks the caller is an admin
// before it uses the service-role key. Totals are recomputed here, never trusted.

const STATUSES = ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
const money = z.number().finite().min(0).max(10_000_000);

const updateSchema = z.object({
  bookingId: z.string().uuid(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.string().trim().min(1).max(40),
  status: z.enum(STATUSES),
  payment_status: z.enum(PAYMENT_STATUSES),
  technician_id: z.string().uuid().nullable(),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().max(100).nullable().optional(),
  pincode: z.string().trim().max(10).nullable().optional(),
  landmark: z.string().trim().max(200).nullable().optional(),
  special_instructions: z.string().trim().max(1000).nullable().optional(),
  travel_charges: money,
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    service_name: z.string().trim().min(1).max(200),
    quantity: z.number().int().min(1).max(100),
    price: money,
  })).min(1).max(50),
  expectedFinalAmount: z.number().finite().optional(),
  confirmPaidChange: z.boolean().optional(),
  notifyCustomer: z.boolean().optional(),
});

const verifyAdminToken = (authHeader: string | undefined): { userId: string | null; error: string } => {
  if (!authHeader?.startsWith('Bearer ')) return { userId: null, error: 'Authorization required' };
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) return { userId: null, error: 'Server configuration error' };
  try {
    const d = jwt.verify(authHeader.split(' ')[1], secret) as any;
    if (d.role !== 'authenticated' && d.aud !== 'authenticated') return { userId: null, error: 'Invalid token role' };
    return { userId: d.sub, error: '' };
  } catch {
    return { userId: null, error: 'Invalid or expired token' };
  }
};

const cleanPhone = (raw: unknown): string | null => {
  let p = String(raw || '').replace(/\D/g, '');
  if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
  else if (p.length === 11 && p.startsWith('0')) p = p.slice(1);
  return /^\d{10}$/.test(p) ? p : null;
};

const pick = (b: any) => ({
  booking_date: b.booking_date, booking_time: b.booking_time, status: b.status, payment_status: b.payment_status,
  technician_id: b.technician_id, address: b.address, city: b.city, pincode: b.pincode, landmark: b.landmark,
  special_instructions: b.special_instructions, total_amount: b.total_amount, service_tax: b.service_tax,
  travel_charges: b.travel_charges, final_amount: b.final_amount,
});
const itemView = (i: any) => ({ service_name: i.service_name, quantity: i.quantity, price: i.price });

async function handleUpdate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 1. Who is calling? Nothing below runs for anyone who is not an admin.
  const { userId, error: authError } = verifyAdminToken(req.headers.authorization);
  if (!userId) return res.status(401).json({ success: false, message: authError });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ success: false, message: 'Server configuration error' });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  if (!role) return res.status(403).json({ success: false, message: 'Admin access required' });

  // 2. Validate the payload
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return res.status(400).json({ success: false, message: `${first.path.join('.') || 'payload'}: ${first.message}` });
  }
  const input = parsed.data;

  // 3. Load the current booking and items
  const { data: before } = await supabase.from('bookings').select('*').eq('id', input.bookingId).maybeSingle();
  if (!before) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (before.status === 'cancelled') {
    return res.status(409).json({ success: false, code: 'CANCELLED', message: 'Cancelled bookings cannot be edited.' });
  }
  const { data: oldItems, error: itemsLoadError } = await supabase.from('booking_items').select('*').eq('booking_id', input.bookingId);
  if (itemsLoadError) return res.status(500).json({ success: false, message: 'Could not load booking items' });

  if (input.technician_id) {
    const { data: tech } = await supabase.from('technicians').select('id').eq('id', input.technician_id).maybeSingle();
    if (!tech) return res.status(400).json({ success: false, message: 'Technician not found' });
  }
  const oldById = new Map((oldItems || []).map((i: any) => [i.id, i]));
  if (input.items.some(i => i.id && !oldById.has(i.id))) {
    return res.status(400).json({ success: false, message: 'An item does not belong to this booking' });
  }

  // 4. Recompute money. Admin-created bookings never carry GST. Otherwise the stored tax is kept,
  // because the site has no tax rule to recompute it from (customer bookings are created with 0).
  const total = input.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = before.created_by_admin ? 0 : Number(before.service_tax || 0);
  // A bundle discount set when the booking was created stays, but can't exceed the new items total.
  const bundleDiscount = Math.min(Number(before.bundle_discount || 0), total);
  const couponSaving = Math.min(Number(before.coupon_discount || 0), total - bundleDiscount);
  const final = total - bundleDiscount - couponSaving + tax + input.travel_charges;
  const totals = { total_amount: total, service_tax: tax, travel_charges: input.travel_charges, final_amount: final };

  const amountsChanged =
    Object.entries(totals).some(([k, v]) => Number((before as any)[k] || 0) !== v) ||
    input.items.length !== (oldItems || []).length ||
    input.items.some(i => {
      const o: any = i.id ? oldById.get(i.id) : null;
      return !o || Number(o.price) !== i.price || Number(o.quantity) !== i.quantity;
    });
  const paidOverride = before.payment_status === 'paid' && (amountsChanged || before.payment_status !== input.payment_status);
  if (paidOverride && !input.confirmPaidChange) {
    return res.status(409).json({
      success: false,
      code: 'PAID_CONFIRM_REQUIRED',
      message: 'This booking is already paid. Tick the confirmation box to change its amounts or payment status.',
    });
  }

  // 5. Replace items safely: insert the new set, update the booking, then delete the old rows.
  // supabase-js has no transaction, so each step undoes the earlier ones if it fails.
  const now = new Date().toISOString();
  const newRows = input.items.map(i => {
    const o: any = i.id ? oldById.get(i.id) : null;
    return {
      booking_id: input.bookingId,
      service_id: o?.service_id ?? null,
      service_name: i.service_name,
      service_type: o?.service_type ?? null,
      service_category: o?.service_category ?? null,
      service_description: o?.service_description ?? null,
      quantity: i.quantity,
      price: i.price,
      unit_price: i.price,
      total_price: i.price * i.quantity,
      created_at: o?.created_at ?? now,
    };
  });
  const { data: inserted, error: insertError } = await supabase.from('booking_items').insert(newRows).select('id');
  if (insertError || !inserted) {
    console.error('[Admin edit] item insert failed:', insertError?.message);
    return res.status(500).json({ success: false, message: 'Could not save the service items. Nothing was changed.' });
  }
  const insertedIds = inserted.map((r: any) => r.id);
  const undoInserts = () => supabase.from('booking_items').delete().in('id', insertedIds);

  const technicianChanged = (before.technician_id || null) !== input.technician_id;
  const scheduleChanged = before.booking_date !== input.booking_date || before.booking_time !== input.booking_time;
  const patch: Record<string, unknown> = {
    booking_date: input.booking_date,
    booking_time: input.booking_time,
    status: input.status,
    payment_status: input.payment_status,
    technician_id: input.technician_id,
    address: input.address,
    city: input.city || null,
    pincode: input.pincode || null,
    landmark: input.landmark || null,
    service_address: [input.address, input.city, input.pincode].filter(Boolean).join(', '),
    special_instructions: input.special_instructions || null,
    ...totals,
    updated_at: now,
  };
  if (technicianChanged && input.technician_id) patch.assigned_at = now;
  if (input.status !== before.status) {
    const stamp: Record<string, string> = { assigned: 'assigned_at', accepted: 'accepted_at', in_progress: 'started_at', completed: 'completed_at', cancelled: 'cancelled_at' };
    if (stamp[input.status]) patch[stamp[input.status]] = now;
  }

  const { data: after, error: updateError } = await supabase.from('bookings').update(patch).eq('id', input.bookingId).select().single();
  if (updateError || !after) {
    console.error('[Admin edit] booking update failed:', updateError?.message);
    await undoInserts();
    return res.status(500).json({ success: false, message: 'Could not save the booking. Nothing was changed.' });
  }

  const oldIds = (oldItems || []).map((i: any) => i.id);
  if (oldIds.length) {
    const { error: deleteError } = await supabase.from('booking_items').delete().in('id', oldIds);
    if (deleteError) {
      console.error('[Admin edit] old item delete failed:', deleteError.message);
      await undoInserts();
      await supabase.from('bookings').update({ ...pick(before), service_address: before.service_address, updated_at: before.updated_at }).eq('id', input.bookingId);
      return res.status(500).json({ success: false, message: 'Could not replace the service items. Nothing was changed.' });
    }
  }

  // 6. Audit trail
  let warning: string | undefined;
  const { error: logError } = await supabase.from('activity_logs').insert({
    user_type: 'admin',
    user_id: userId,
    action: paidOverride ? 'booking_edit_paid_override' : 'booking_edit',
    entity_type: 'booking',
    entity_id: input.bookingId,
    details: {
      admin_user_id: userId,
      paid_override: paidOverride,
      before: { ...pick(before), items: (oldItems || []).map(itemView) },
      after: { ...pick(after), items: newRows.map(itemView) },
    },
  });
  if (logError) {
    console.error('[Admin edit] activity log failed:', logError.message);
    warning = 'Saved, but the audit log entry could not be written.';
  }

  // 7. Optional SMS. Needs a DLT template: text sent outside a registered template is dropped by the carrier.
  let sms: 'sent' | 'skipped' | 'failed' | 'not_requested' = 'not_requested';
  let smsNote: string | undefined;
  if (input.notifyCustomer && (scheduleChanged || technicianChanged)) {
    const templateId = process.env.SMS_TEMPLATE_BOOKING_UPDATED;
    const { data: profile } = await supabase.from('profiles').select('phone').eq('user_id', before.user_id).maybeSingle();
    const phone = cleanPhone(profile?.phone);
    if (!templateId || !process.env.SMS_API_KEY || !phone) {
      sms = 'skipped';
      smsNote = !phone ? 'Customer has no valid phone number.' : 'SMS template is not configured on the server (SMS_TEMPLATE_BOOKING_UPDATED).';
    } else {
      try {
        const text = `Dear Customer,\n\nYour Chill Mechanic booking has been updated. Your visit is now on ${input.booking_date} at ${input.booking_time}. Questions? Call +919211970031.\n\nRegards,\nChill Mechanic Team`;
        await axios.post('https://api.uniquedigitaloutreach.com/v1/sms',
          { sender: process.env.SMS_SENDER_ID || 'CHLMEH', to: '91' + phone, text, type: 'OTP', templateId },
          { headers: { 'Content-Type': 'application/json', apikey: process.env.SMS_API_KEY }, timeout: 15000 });
        sms = 'sent';
      } catch (e: any) {
        console.error('[Admin edit] SMS failed:', e.message);
        sms = 'failed';
        smsNote = 'The booking was saved but the SMS could not be sent.';
      }
    }
  }

  const submitted = input.expectedFinalAmount;
  return res.status(200).json({
    success: true,
    message: 'Booking updated',
    booking: after,
    serverTotals: totals,
    totalsAdjusted: submitted !== undefined && Math.abs(submitted - final) > 0.009,
    sms, smsNote, warning,
  });
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.query.action === 'update') return await handleUpdate(req, res);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const action = req.query.action as string;

    // ACTION: assign - Assign technician to booking
    if (req.method === 'POST' && action === 'assign') {
      const { bookingId, technicianId } = req.body || {};

      if (!bookingId || !technicianId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Booking ID and Technician ID are required' 
        });
      }

      // Get technician details
      const { data: technician, error: techError } = await supabase
        .from('technicians')
        .select('id, name, phone, email, specialization, status')
        .eq('id', technicianId)
        .single();

      if (techError || !technician) {
        console.error('Technician fetch error:', techError);
        return res.status(404).json({ 
          success: false, 
          message: 'Technician not found' 
        });
      }

      // Update booking with technician assignment
      const updateData: any = {
        technician_id: technicianId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select(`
          id,
          user_id,
          booking_date,
          booking_time,
          total_amount,
          service_tax,
          travel_charges,
          final_amount,
          status,
          payment_status,
          special_instructions,
          service_address,
          address,
          city,
          pincode,
          landmark,
          assigned_at,
          updated_at
        `)
        .single();

      if (bookingError) {
        console.error('Booking update error:', bookingError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to assign technician to booking' 
        });
      }

      // Fetch profiles and booking items separately to avoid join issues
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, email, address')
        .eq('user_id', booking.user_id)
        .maybeSingle();

      const { data: items } = await supabase
        .from('booking_items')
        .select('id, service_name, service_description, price, quantity')
        .eq('booking_id', bookingId);

      // Log the assignment activity
      try {
        await supabase.from('activity_logs').insert({
          user_type: 'admin',
          user_id: technicianId,
          action: 'assign_technician',
          entity_type: 'booking',
          entity_id: bookingId,
          details: {
            technician_name: technician.name,
            technician_phone: technician.phone,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            service_name: items?.[0]?.service_name,
            // Full address for technician app
            service_address: booking.service_address,
            address: booking.address,
            city: booking.city,
            pincode: booking.pincode,
            landmark: booking.landmark,
            customer_name: profile?.full_name,
            customer_phone: profile?.phone,
            payment_status: booking.payment_status,
            final_amount: booking.final_amount,
          },
        });
      } catch (logError) {
        // Activity logging is optional, don't fail the request
        console.log('Activity log insert skipped (table may not exist):', logError);
      }

      // Send SMS notification to customer about technician assignment
      console.log('[SMS] Checking SMS conditions:', {
        hasPhone: !!profile?.phone,
        phone: profile?.phone,
        hasApiKey: !!process.env.SMS_API_KEY,
        senderId: process.env.SMS_SENDER_ID
      });

      if (profile?.phone && process.env.SMS_API_KEY) {
        try {
          // Clean phone: remove all non-digits, then handle format
          let formattedPhone = String(profile.phone).replace(/\D/g, '');
          if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
            formattedPhone = formattedPhone.substring(2);
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
          }
          
          // Skip if invalid
          if (formattedPhone.length !== 10 || !/^\d{10}$/.test(formattedPhone)) {
            console.warn('[SMS] Invalid phone after cleaning:', formattedPhone, 'original:', profile.phone);
          } else {
            const smsMessage = `Dear Customer,\n\nA technician has been assigned to your service request. The technician will reach your address at the scheduled time. Contact details - +917943444285.\n\nRegards,\nChill Mechanic Team`;

            console.log('[SMS] Sending technician assignment SMS:', {
              to: '91' + formattedPhone,
              templateId: '1007074801259726162'
            });

            const smsResponse = await axios.post(
              'https://api.uniquedigitaloutreach.com/v1/sms',
              {
                sender: process.env.SMS_SENDER_ID || 'CHLMEH',
                to: '91' + formattedPhone,
                text: smsMessage,
                type: 'OTP',
                templateId: '1007074801259726162'
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': process.env.SMS_API_KEY
                },
                timeout: 30000
              }
            );
            console.log('[SMS] Technician assignment SMS sent successfully:', {
              phone: formattedPhone,
              status: smsResponse.status,
              data: smsResponse.data
            });
          }
        } catch (smsError: any) {
          console.error('[SMS] Failed to send technician assignment SMS:', {
            error: smsError.message,
            response: smsError.response?.data,
            status: smsError.response?.status
          });
          // Don't fail the request if SMS fails
        }
      } else {
        console.log('[SMS] SMS not sent - missing requirements:', {
          missingPhone: !profile?.phone,
          missingApiKey: !process.env.SMS_API_KEY
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Technician assigned successfully',
        data: {
          booking: {
            id: booking.id,
            status: booking.status,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            customer: profile?.full_name,
            customer_phone: profile?.phone,
            // Payment information for technician app
            payment_status: booking.payment_status,
            final_amount: booking.final_amount,
            total_amount: booking.total_amount,
            // Service details for technician app
            services: items?.map((item: any) => ({
              service_name: item.service_name,
              service_description: item.service_description,
              price: item.price,
              quantity: item.quantity,
            })) || [],
            // Full address details for technician app (Google Maps)
            service_address: booking.service_address,
            address: booking.address,
            city: booking.city,
            pincode: booking.pincode,
            landmark: booking.landmark,
            special_instructions: booking.special_instructions,
          },
          technician: {
            id: technician.id,
            name: technician.name,
            phone: technician.phone,
          },
        },
      });
    }

    // ACTION: status - Update booking status
    if ((req.method === 'POST' || req.method === 'PUT') && action === 'status') {
      const { bookingId, status, reason } = req.body;

      if (!bookingId || !status) {
        return res.status(400).json({ success: false, message: 'Booking ID and status are required' });
      }

      const validStatuses = ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp based on status
      switch (status) {
        case 'assigned': 
          updateData.assigned_at = new Date().toISOString(); 
          break;
        case 'accepted': 
          updateData.accepted_at = new Date().toISOString(); 
          break;
        case 'in_progress': 
          updateData.started_at = new Date().toISOString(); 
          break;
        case 'completed': 
          updateData.completed_at = new Date().toISOString(); 
          break;
        case 'cancelled': 
          updateData.cancelled_at = new Date().toISOString();
          if (reason) updateData.notes = reason;
          break;
      }

      // Get the booking first to access technician_id
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('technician_id')
        .eq('id', bookingId)
        .single();

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // If completed or cancelled, update technician availability
      if ((status === 'completed' || status === 'cancelled') && existingBooking?.technician_id) {
        await supabase
          .from('technicians')
          .update({ 
            is_available: true,
            status: 'available',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBooking.technician_id);
      }

      // Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_type: 'admin',
          user_id: bookingId,
          action: `booking_status_${status}`,
          entity_type: 'booking',
          entity_id: bookingId,
          details: { 
            new_status: status,
            reason: reason || null
          }
        });
      } catch (logError) {
        console.log('Activity log skipped:', logError);
      }

      return res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        booking: data
      });
    }

    // ACTION: updateAmount - Update final amount (typically by technician based on service changes)
    if ((req.method === 'POST' || req.method === 'PUT') && action === 'updateAmount') {
      const { bookingId, finalAmount } = req.body;

      if (!bookingId || finalAmount === undefined || finalAmount === null) {
        return res.status(400).json({ 
          success: false, 
          message: 'Booking ID and final amount are required' 
        });
      }

      // Validate amount is a number
      const amount = Number(finalAmount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Final amount must be a valid positive number' 
        });
      }

      // Get current booking to log the change
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('final_amount, total_amount, technician_id')
        .eq('id', bookingId)
        .single();

      if (fetchError || !currentBooking) {
        return res.status(404).json({ 
          success: false, 
          message: 'Booking not found' 
        });
      }

      // Update the final amount
      const { data, error } = await supabase
        .from('bookings')
        .update({
          final_amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Final amount update error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update final amount' 
        });
      }

      // Log the amount change
      try {
        await supabase.from('activity_logs').insert({
          user_type: 'technician',
          user_id: currentBooking.technician_id || 'unknown',
          action: 'final_amount_updated',
          entity_type: 'booking',
          entity_id: bookingId,
          details: {
            previous_amount: currentBooking.final_amount,
            new_amount: amount,
            difference: amount - currentBooking.final_amount,
            total_amount: currentBooking.total_amount,
            reason: 'Service modification by technician'
          }
        });
      } catch (logError) {
        console.log('Activity log insert skipped:', logError);
      }

      return res.status(200).json({
        success: true,
        message: 'Final amount updated successfully',
        data: {
          booking: {
            id: data.id,
            total_amount: data.total_amount,
            final_amount: data.final_amount,
            difference: data.final_amount - data.total_amount,
            payment_status: data.payment_status,
            updated_at: data.updated_at
          }
        }
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Invalid action. Use ?action=assign, ?action=status, ?action=updateAmount, or ?action=update' 
    });

  } catch (error: any) {
    console.error('Booking admin error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An unexpected error occurred' 
    });
  }
}

