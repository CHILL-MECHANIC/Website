import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // GET - List all technicians with job stats
    if (req.method === 'GET') {
      const { data: technicians, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get job counts for each technician
      const techniciansWithStats = await Promise.all(
        (technicians || []).map(async (tech) => {
          const { count: totalJobs } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('technician_id', tech.id);

          const { count: completedJobs } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('technician_id', tech.id)
            .eq('status', 'completed');

          const { count: activeJobs } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('technician_id', tech.id)
            .in('status', ['assigned', 'accepted', 'in_progress']);

          return {
            ...tech,
            totalJobs: totalJobs || 0,
            completedJobs: completedJobs || 0,
            activeJobs: activeJobs || 0
          };
        })
      );

      return res.status(200).json({ success: true, technicians: techniciansWithStats });
    }

    // POST - Create new technician
    if (req.method === 'POST') {
      const { name, phone, email, specialization } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' });
      }

      const { data, error } = await supabase
        .from('technicians')
        .insert({
          name,
          phone,
          email: email || null,
          specialization: specialization || [],
          status: 'available',
          is_available: true,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, technician: data });
    }

    // PUT - Update technician
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Technician ID required' });
      }

      // Clean up the updates object
      const cleanUpdates: any = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
      if (updates.email !== undefined) cleanUpdates.email = updates.email;
      if (updates.specialization !== undefined) cleanUpdates.specialization = updates.specialization;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.is_available !== undefined) cleanUpdates.is_available = updates.is_available;
      if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
      cleanUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('technicians')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, technician: data });
    }

    // DELETE - Remove technician (soft delete)
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Technician ID required' });
      }

      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from('technicians')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Technician deactivated' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Technicians API error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Operation failed' });
  }
}

