import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Fetch all stats in parallel
    const [
      totalBookingsResult,
      todayBookingsResult,
      pendingBookingsResult,
      completedBookingsResult,
      totalCustomersResult,
      activeTechniciansResult,
      revenueResult,
      recentBookingsResult
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending', 'assigned']),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('technicians').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bookings').select('final_amount').eq('payment_status', 'paid'),
      supabase.from('bookings')
        .select(`
          id, booking_date, booking_time, status, final_amount, created_at,
          profiles:user_id (full_name, phone),
          booking_items (service_name),
          technicians:technician_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalBookings: totalBookingsResult.count || 0,
        todayBookings: todayBookingsResult.count || 0,
        pendingBookings: pendingBookingsResult.count || 0,
        completedBookings: completedBookingsResult.count || 0,
        totalCustomers: totalCustomersResult.count || 0,
        activeTechnicians: activeTechniciansResult.count || 0,
        totalRevenue
      },
      recentBookings: recentBookingsResult.data || []
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch stats' });
  }
}

