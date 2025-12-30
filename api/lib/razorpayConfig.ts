// api/lib/razorpayConfig.ts
import Razorpay from 'razorpay';

// Razorpay API Base URL (for reference)
// Note: The Razorpay SDK automatically uses https://api.razorpay.com/v1 as base URL
export const RAZORPAY_API_BASE_URL = 'https://api.razorpay.com/v1';

// Razorpay Checkout Script URL
export const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Create and return a configured Razorpay instance
 * The SDK automatically uses https://api.razorpay.com/v1 as base URL
 */
export function createRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  // Log mode for debugging (remove in production)
  const isTestMode = keyId.startsWith('rzp_test_');
  console.log(`[Razorpay] Initializing in ${isTestMode ? 'TEST' : 'LIVE'} mode`);

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

/**
 * Validate Razorpay environment configuration
 */
export function validateRazorpayConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.RAZORPAY_KEY_ID) {
    errors.push('RAZORPAY_KEY_ID is not set');
  } else if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
    errors.push('RAZORPAY_KEY_ID format is invalid (should start with rzp_)');
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    errors.push('RAZORPAY_KEY_SECRET is not set');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get Razorpay mode (test or live)
 */
export function getRazorpayMode(): 'test' | 'live' {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  return keyId.startsWith('rzp_test_') ? 'test' : 'live';
}

