import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // GET - List all customers with booking stats
    if (req.method === 'GET') {
      const { page = '1', limit = '50', search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Get booking stats for each customer
      const customersWithStats = await Promise.all(
        (data || []).map(async (customer) => {
          const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', customer.user_id);

          const { count: completedBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', customer.user_id)
            .eq('status', 'completed');

          const { data: revenueData } = await supabase
            .from('bookings')
            .select('final_amount')
            .eq('user_id', customer.user_id)
            .eq('payment_status', 'paid');

          const totalSpent = revenueData?.reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;

          return {
            ...customer,
            totalBookings: totalBookings || 0,
            completedBookings: completedBookings || 0,
            totalSpent
          };
        })
      );

      return res.status(200).json({
        success: true,
        customers: customersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      });
    }

    // PUT - Update customer
    if (req.method === 'PUT') {
      const { userId, ...updates } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID required' });
      }

      const cleanUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.full_name !== undefined) cleanUpdates.full_name = updates.full_name;
      if (updates.email !== undefined) cleanUpdates.email = updates.email;
      if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
      if (updates.address !== undefined) cleanUpdates.address = updates.address;
      if (updates.city !== undefined) cleanUpdates.city = updates.city;
      if (updates.state !== undefined) cleanUpdates.state = updates.state;
      if (updates.pincode !== undefined) cleanUpdates.pincode = updates.pincode;

      const { data, error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, customer: data });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Customers API error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Operation failed' });
  }
}

