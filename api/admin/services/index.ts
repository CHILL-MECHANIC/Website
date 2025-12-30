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
    // GET - List all services
    if (req.method === 'GET') {
      const { service_type } = req.query;
      
      let query = supabase
        .from('services')
        .select('*')
        .order('service_type')
        .order('name');

      if (service_type) {
        query = query.eq('service_type', service_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return res.status(200).json({ success: true, services: data });
    }

    // POST - Create new service
    if (req.method === 'POST') {
      const { name, description, price, service_type } = req.body;

      if (!name || !price || !service_type) {
        return res.status(400).json({ success: false, message: 'Name, price, and service type are required' });
      }

      const { data, error } = await supabase
        .from('services')
        .insert({
          name,
          description: description ? [description] : [],
          price: parseInt(price),
          service_type
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, service: data });
    }

    // PUT - Update service
    if (req.method === 'PUT') {
      const { id, name, description, price, service_type } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Service ID required' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = Array.isArray(description) ? description : [description];
      if (price !== undefined) updateData.price = parseInt(price);
      if (service_type !== undefined) updateData.service_type = service_type;

      const { data, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, service: data });
    }

    // DELETE - Remove service
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Service ID required' });
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Service deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Services API error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Operation failed' });
  }
}

