/**
 * Payment Client Service
 * Handles all API communication with the Razorpay payment backend
 */

import { 
  getRazorpayKey, 
  isRazorpayTestMode, 
  isRazorpayLoaded,
  RAZORPAY_DEFAULT_OPTIONS 
} from '@/config/razorpay';

const getApiBaseUrl = (): string => {
  // In development: use Express backend on localhost:3001
  // In production: use relative URLs for Vercel serverless functions
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  return ''; // Production: relative URLs for Vercel
};

const API_BASE_URL = getApiBaseUrl();

// Detect environment: local (Express) vs production (Vercel)
// If API_BASE_URL is set, we're using Express backend (localhost)
// If empty, we're using Vercel serverless functions (production)
const isLocalExpress = !!API_BASE_URL;

// Log the API base URL in development for debugging
if (import.meta.env.DEV) {
  console.log('[Payment Client] API Base URL:', API_BASE_URL || '(relative)');
  console.log('[Payment Client] Environment:', isLocalExpress ? 'Local Express' : 'Production Vercel');
}

/**
 * Build payment API URL based on environment
 * - Local (Express): /api/payment/{action}
 * - Production (Vercel): /api/payment?action={action}
 */
function getPaymentUrl(action: string, queryParams?: Record<string, string | number>): string {
  const apiUrl = API_BASE_URL || '';
  
  if (isLocalExpress) {
    // Local Express backend: separate endpoints
    const query = queryParams 
      ? '?' + new URLSearchParams(
          Object.entries(queryParams).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    return `${apiUrl}/api/payment/${action}${query}`;
  } else {
    // Production Vercel: consolidated endpoint with action query param
    const params = new URLSearchParams();
    params.set('action', action);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        params.set(key, String(value));
      });
    }
    return `${apiUrl}/api/payment?${params.toString()}`;
  }
}

// Types
interface Service {
  id: string;
  name: string;
  price: number;
  description: string[];
  serviceType: string;
}

interface ServicesResponse {
  success: boolean;
  services?: Record<string, Service[]>;
  serviceTypes?: string[];
  total?: number;
  message?: string;
}

interface CreateOrderResponse {
  success: boolean;
  order?: {
    id: string;
    amount: number;
    currency: string;
  };
  paymentId?: string;
  key?: string;
  message?: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  payment?: {
    id: string;
    orderId: string;
    paymentId: string;
    amount: number;
    status: string;
    serviceName: string;
  };
}

interface Payment {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency?: string;
  status: string;
  serviceName?: string;
  serviceType?: string;
  bookingId?: string;
  bookingDate?: string;
  bookingTimeSlot?: string;
  createdAt: string;
  paidAt?: string;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundedAt?: string;
}

interface PaymentHistoryResponse {
  success: boolean;
  payments?: Payment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

interface RefundResponse {
  success: boolean;
  message?: string;
  refund?: {
    id: string;
    amount: number;
    status: string;
  };
}

/**
 * Get all services from the database
 */
export async function getServices(serviceType?: string): Promise<ServicesResponse> {
  try {
    const url = serviceType 
      ? `${API_BASE_URL}/api/services?type=${encodeURIComponent(serviceType)}`
      : `${API_BASE_URL}/api/services`;

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Fetching services:', url);
    }

    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.error('Get services error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Create a new payment order
 */
export async function createOrder(data: {
  serviceId?: string;
  serviceName: string;
  serviceType: string;
  amount: number;
  bookingId?: string;
  bookingDate?: string;
  bookingTimeSlot?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;
}): Promise<CreateOrderResponse> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { success: false, message: 'Please login to continue' };
    }

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Creating order:', data);
    }

    // Use environment-appropriate URL format
    const response = await fetch(getPaymentUrl('create-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Create order response:', result);
    }

    return result;
  } catch (error) {
    console.error('Create order error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Verify payment after Razorpay checkout
 */
export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyPaymentResponse> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { success: false, message: 'Please login to continue' };
    }

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Verifying payment:', data.razorpay_order_id);
    }

    // Use environment-appropriate URL format
    const response = await fetch(getPaymentUrl('verify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Verify response:', result);
    }

    return result;
  } catch (error) {
    console.error('Verify payment error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(
  page: number = 1, 
  limit: number = 10, 
  status?: string
): Promise<PaymentHistoryResponse> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { success: false, message: 'Please login to continue' };
    }

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Fetching payment history, page:', page, 'status:', status);
    }

    // Use environment-appropriate URL format with query params
    const queryParams: Record<string, string | number> = { page, limit };
    if (status && status !== 'all') {
      queryParams.status = status;
    }
    const response = await fetch(getPaymentUrl('history', queryParams), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Payment history response:', result);
    }

    return result;
  } catch (error) {
    console.error('Payment history error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Request a refund for a payment
 */
export async function requestRefund(paymentId: string, reason?: string): Promise<RefundResponse> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { success: false, message: 'Please login to continue' };
    }

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Requesting refund for:', paymentId);
    }

    // Use environment-appropriate URL format
    const response = await fetch(getPaymentUrl('refund'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentId, reason })
    });

    const result = await response.json();

    if (import.meta.env.DEV) {
      console.log('[Payment Client] Refund response:', result);
    }

    return result;
  } catch (error) {
    console.error('Refund error:', error);
    return { success: false, message: 'Network error' };
  }
}

// Razorpay types
interface RazorpayCheckoutOptions {
  key?: string;  // Razorpay key from API (preferred) or env variable
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Open Razorpay checkout modal
 * @param options - Checkout options including the key from API
 * @param onSuccess - Success callback
 * @param onFailure - Failure callback
 */
export function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
  onSuccess: (response: RazorpaySuccessResponse) => void,
  onFailure: (error: RazorpayError) => void
): void {
  // Check if Razorpay SDK is loaded
  if (!isRazorpayLoaded()) {
    console.error('[Payment] Razorpay SDK not loaded');
    onFailure({
      code: 'SDK_NOT_LOADED',
      description: 'Payment gateway not loaded. Please refresh the page.'
    });
    return;
  }

  // Get Razorpay key (from API response or environment)
  const razorpayKey = getRazorpayKey(options.key);
  
  // Log mode for debugging
  if (isRazorpayTestMode(razorpayKey)) {
    console.log('[Payment] Running in TEST mode');
  }

  const razorpayOptions = {
    key: razorpayKey,
    amount: options.amount,
    currency: options.currency || RAZORPAY_DEFAULT_OPTIONS.currency,
    name: options.name || RAZORPAY_DEFAULT_OPTIONS.name,
    description: options.description || RAZORPAY_DEFAULT_OPTIONS.description,
    image: options.image || RAZORPAY_DEFAULT_OPTIONS.image,
    order_id: options.orderId,
    prefill: {
      name: options.prefill?.name || '',
      email: options.prefill?.email || '',
      contact: options.prefill?.contact || ''
    },
    theme: {
      color: options.theme?.color || RAZORPAY_DEFAULT_OPTIONS.theme.color
    },
    handler: function (response: RazorpaySuccessResponse) {
      console.log('[Payment] Razorpay success:', response.razorpay_payment_id);
      onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        console.log('[Payment] Checkout cancelled by user');
        onFailure({
          code: 'MODAL_CLOSED',
          description: 'Payment cancelled'
        });
      },
      escape: true,
      animation: true
    },
    notes: {
      platform: 'web'
    }
  };

  const rzp = new window.Razorpay(razorpayOptions);

  rzp.on('payment.failed', function (response: { error: RazorpayError }) {
    console.error('[Payment] Payment failed:', response.error.code, response.error.description);
    onFailure(response.error);
  });

  rzp.open();
}

// Export types
export type { 
  CreateOrderResponse, 
  VerifyPaymentResponse, 
  PaymentHistoryResponse, 
  RefundResponse,
  ServicesResponse,
  Payment,
  Service,
  RazorpaySuccessResponse,
  RazorpayError
};
