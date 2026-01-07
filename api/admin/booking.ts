import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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
          *,
          profiles:user_id (full_name, phone, email, address),
          booking_items (service_name, price, quantity)
        `)
        .single();

      if (bookingError) {
        console.error('Booking update error:', bookingError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to assign technician to booking' 
        });
      }

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
            service: booking.booking_items?.[0]?.service_name,
          },
        });
      } catch (logError) {
        // Activity logging is optional, don't fail the request
        console.log('Activity log insert skipped (table may not exist):', logError);
      }

      // Send SMS notification to customer about technician assignment
      if (booking.profiles?.phone) {
        try {
          const customerPhone = String(booking.profiles.phone).replace(/^\+?91/, '');
          const smsMessage = `Dear Customer, A technician has been assigned to your service request. The technician will reach your address at the scheduled time. Contact details - +917943444285. Regards, Chill Mechanic Team`;

          const smsApiKey = process.env.SMS_API_KEY;
          const smsSenderId = process.env.SMS_SENDER_ID || 'CHLMEH';

          if (smsApiKey) {
            const smsResponse = await fetch('https://api.uniquedigitaloutreach.com/v1/sms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': smsApiKey,
              },
              body: JSON.stringify({
                sender: smsSenderId,
                to: '91' + customerPhone,
                text: smsMessage,
                type: 'TRANS',
                template_id: '1007074801259726162',
              }),
            });

            if (smsResponse.ok) {
              console.log('SMS sent to customer:', customerPhone);
            } else {
              console.error('SMS send failed:', await smsResponse.text());
            }
          }
        } catch (smsError) {
          console.error('SMS notification error:', smsError);
          // Don't fail the request if SMS fails
        }
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
            customer: booking.profiles?.full_name,
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

    return res.status(400).json({ 
      success: false, 
      message: 'Invalid action. Use ?action=assign or ?action=status' 
    });

  } catch (error: any) {
    console.error('Booking admin error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An unexpected error occurred' 
    });
  }
}

