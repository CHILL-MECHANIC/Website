import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { verifySession } from '../services/sessionService';

const router = Router();

/**
 * Check if user is admin
 * GET /api/admin/check
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization required', 
        isAdmin: false 
      });
    }

    const token = authHeader.split(' ')[1];
    const session = verifySession(token);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token', 
        isAdmin: false 
      });
    }

    const userId = session.userId;

    // Check admin status from user_roles table
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (roleData) {
        console.log('[Admin Check] User is admin:', userId);
        return res.json({ success: true, isAdmin: true, userId });
      }
    } catch (roleError) {
      console.error('[Admin Check] Role lookup error:', roleError);
    }

    // Fallback: try has_role RPC function
    try {
      const { data: hasRole } = await (supabase as any)
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      if (hasRole === true) {
        console.log('[Admin Check] User is admin (via RPC):', userId);
        return res.json({ success: true, isAdmin: true, userId });
      }
    } catch {
      // Ignore RPC errors - function may not exist
    }

    console.log('[Admin Check] User is not admin:', userId);
    return res.json({ 
      success: true, 
      isAdmin: false,
      userId
    });
  } catch (error: any) {
    console.error('[Admin Check] Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error', 
      isAdmin: false 
    });
  }
});

export default router;
