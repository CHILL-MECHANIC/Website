/**
 * Booking Client Service
 * Central service for all booking API communication.
 * Using this instead of inline fetch calls in pages ensures consistency.
 */

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  return ''; // Production: relative URLs for Vercel serverless functions
};

export interface BookingItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export interface CreateBookingParams {
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  serviceTax: number;
  finalAmount: number;
  specialInstructions?: string;
  serviceAddress?: string;
  paymentMode: 'pay_now' | 'pay_later';
  items: BookingItem[];
}

export interface BookingResult {
  id: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  serviceTax: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  serviceAddress?: string;
  paymentMode: string;
}

export async function createBooking(params: CreateBookingParams): Promise<BookingResult> {
  if (typeof window === 'undefined') {
    throw new Error('Booking API cannot be called during server-side rendering');
  }

  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/api/booking/create`;

  if (import.meta.env.DEV) {
    console.log('[Booking] Creating booking:', url);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Booking] API error:', response.status, errorText);

    let errorMessage = `Failed to create booking (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  let result: any;
  try {
    result = await response.json();
  } catch (parseError) {
    let rawBody = '';
    try {
      rawBody = await response.text();
    } catch {
      rawBody = '<unavailable>';
    }
    const parseMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parse error';
    throw new Error(`Failed to parse booking API response (status ${response.status}): ${parseMessage}. Body: ${rawBody}`);
  }

  if (!result.success) {
    throw new Error(result.message || 'Failed to create booking');
  }

  return result.booking;
}
