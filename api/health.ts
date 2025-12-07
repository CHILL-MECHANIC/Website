import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check environment variables
  const envStatus = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SMS_API_KEY: !!process.env.SMS_API_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET
  };

  const allEnvSet = Object.values(envStatus).every(v => v);

  res.status(200).json({ 
    status: allEnvSet ? 'ok' : 'warning',
    timestamp: new Date().toISOString(),
    service: 'ChillMechanic API',
    environment: process.env.NODE_ENV || 'production',
    envCheck: envStatus
  });
}
