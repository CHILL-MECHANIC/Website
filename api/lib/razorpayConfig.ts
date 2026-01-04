// api/lib/razorpayConfig.ts
import Razorpay from 'razorpay';

export const RAZORPAY_API_BASE_URL = 'https://api.razorpay.com/v1';

export interface RazorpayValidation {
  valid: boolean;
  errors: string[];
}

export const validateRazorpayConfig = (): RazorpayValidation => {
  const errors: string[] = [];
  
  if (!process.env.RAZORPAY_KEY_ID) {
    errors.push('RAZORPAY_KEY_ID is not set');
  } else if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
    errors.push('RAZORPAY_KEY_ID should start with "rzp_test_" or "rzp_live_"');
  }
  
  if (!process.env.RAZORPAY_KEY_SECRET) {
    errors.push('RAZORPAY_KEY_SECRET is not set');
  }
  
  return { valid: errors.length === 0, errors };
};

export const getRazorpayMode = (): 'test' | 'live' => {
  return process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'live' : 'test';
};

export const createRazorpayInstance = (): Razorpay => {
  const validation = validateRazorpayConfig();
  if (!validation.valid) {
    throw new Error(`Razorpay config invalid: ${validation.errors.join(', ')}`);
  }
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
  });
};

