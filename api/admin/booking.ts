import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

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
          booking_items (service_id, service_name, service_type, price, quantity)
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
            service_id: booking.booking_items?.[0]?.service_id,
            service_name: booking.booking_items?.[0]?.service_name,
            service_type: booking.booking_items?.[0]?.service_type,
            // Full address for technician app
            service_address: booking.service_address,
            address: booking.address,
            city: booking.city,
            pincode: booking.pincode,
            landmark: booking.landmark,
            customer_name: booking.profiles?.full_name,
            customer_phone: booking.profiles?.phone,
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
        hasPhone: !!booking.profiles?.phone,
        phone: booking.profiles?.phone,
        hasApiKey: !!process.env.SMS_API_KEY,
        senderId: process.env.SMS_SENDER_ID
      });

      if (booking.profiles?.phone && process.env.SMS_API_KEY) {
        try {
          const formattedPhone = String(booking.profiles.phone).replace(/^\+?91/, '');
          const smsMessage = `Dear Customer, A technician has been assigned to your service request. The technician will reach your address at the scheduled time. Contact details - +917943444285. Regards, Chill Mechanic Team`;

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
          missingPhone: !booking.profiles?.phone,
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
            customer: booking.profiles?.full_name,
            customer_phone: booking.profiles?.phone,
            // Payment information for technician app
            payment_status: booking.payment_status,
            final_amount: booking.final_amount,
            total_amount: booking.total_amount,
            // Service details for technician app
            services: booking.booking_items?.map((item: any) => ({
              service_id: item.service_id,
              service_name: item.service_name,
              service_type: item.service_type,
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
      message: 'Invalid action. Use ?action=assign, ?action=status, or ?action=updateAmount' 
    });

  } catch (error: any) {
    console.error('Booking admin error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An unexpected error occurred' 
    });
  }
}

