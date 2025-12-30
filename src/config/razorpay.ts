// src/config/razorpay.ts

/**
 * Razorpay Configuration for Frontend
 */

// Razorpay Checkout Script URL (loaded in index.html)
export const RAZORPAY_CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

// Default Razorpay options
export const RAZORPAY_DEFAULT_OPTIONS = {
  currency: 'INR',
  name: 'ChillMechanic',
  description: 'Service Payment',
  image: '/Logo.webp',
  theme: {
    color: '#1277BD'  // ChillMechanic brand color
  }
};

/**
 * Get Razorpay key from environment or API response
 * Priority: API response > Environment variable > Fallback test key
 */
export function getRazorpayKey(apiKey?: string): string {
  // 1. Use key from API response if provided
  if (apiKey) {
    return apiKey;
  }

  // 2. Use environment variable
  if (import.meta.env.VITE_RAZORPAY_KEY_ID) {
    return import.meta.env.VITE_RAZORPAY_KEY_ID;
  }

  // 3. Fallback to test key (development only)
  console.warn('[Razorpay] Using fallback test key - set VITE_RAZORPAY_KEY_ID for production');
  return 'rzp_test_RsJ0DFQfeip9UY';
}

/**
 * Check if using test mode
 */
export function isRazorpayTestMode(key?: string): boolean {
  const razorpayKey = key || getRazorpayKey();
  return razorpayKey.startsWith('rzp_test_');
}

/**
 * Check if Razorpay SDK is loaded
 */
export function isRazorpayLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
}

/**
 * Load Razorpay script dynamically (if not already in index.html)
 */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isRazorpayLoaded()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

