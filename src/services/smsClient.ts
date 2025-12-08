/**
 * SMS Client Service
 * Handles all API communication with the SMS backend
 */

/**
 * Gets the SMS API base URL
 * - In production (Vercel): Use relative URL for serverless functions
 * - In development: Use VITE_API_URL or default to localhost:3001
 */
const getSmsApiBaseUrl = (): string => {
  // In production, always use relative URLs for Vercel serverless functions
  if (import.meta.env.PROD) {
    return '/api/sms';
  }
  
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // If URL ends with /api/sms, use as-is; otherwise append it
    return envUrl.includes('/api/sms') ? envUrl : `${envUrl}/api/sms`;
  }
  
  return 'http://localhost:3001/api/sms';
};

const API_BASE_URL = getSmsApiBaseUrl();

export type SMSType = 'TRANS' | 'PROMO' | 'OTP';
export type SMSStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface SMSRequest {
  recipient: string;
  message: string;
  type?: SMSType;
  senderId?: string;
  unicode?: boolean;
  flash?: boolean;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface BulkSMSRequest {
  recipients: string[];
  message: string;
  type?: SMSType;
  senderId?: string;
  unicode?: boolean;
  flash?: boolean;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SMSResponse {
  success: boolean;
  message?: string;
  data?: {
    logId?: number;
    messageId?: string;
    status?: SMSStatus;
    [key: string]: unknown;
  };
  error?: string;
}

export interface BulkSMSResponse {
  success: boolean;
  message?: string;
  data?: {
    total: number;
    success: number;
    failed: number;
    results: Array<{
      recipient: string;
      logId?: number;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  };
  error?: string;
}

export interface SMSLog {
  id: number;
  recipient: string;
  message: string;
  status: SMSStatus;
  messageId?: string;
  apiResponse?: unknown;
  senderId?: string;
  type?: SMSType;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SMSLogsResponse {
  success: boolean;
  data?: {
    logs: SMSLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

export interface SMSLogsFilters {
  recipient?: string;
  status?: SMSStatus;
  type?: SMSType;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Retry configuration for API requests
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Calculates exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Makes an API request with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<Response> {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      const response = await fetch(url, options);

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on server errors (5xx) and rate limits (429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(attempt, retryConfig);
          console.log(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
          await sleep(delay);
          attempt++;
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(attempt, retryConfig);
        console.log(`Request error, retrying in ${delay}ms... (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        await sleep(delay);
        attempt++;
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('Request failed after all retry attempts');
}

/**
 * Sends a single SMS
 */
export async function sendSMS(request: SMSRequest): Promise<SMSResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Sends bulk SMS to multiple recipients
 */
export async function sendBulkSMS(request: BulkSMSRequest): Promise<BulkSMSResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send bulk SMS'
    };
  }
}

/**
 * Retrieves SMS logs with optional filtering
 */
export async function getSMSLogs(filters: SMSLogsFilters = {}): Promise<SMSLogsResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (filters.recipient) queryParams.append('recipient', filters.recipient);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.offset) queryParams.append('offset', filters.offset.toString());
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const url = `${API_BASE_URL}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SMS logs'
    };
  }
}

/**
 * Retrieves a specific SMS log by ID
 */
export async function getSMSLogById(id: number): Promise<{ success: boolean; data?: SMSLog; error?: string }> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/logs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SMS log'
    };
  }
}

/**
 * Resends a failed SMS
 */
export async function resendSMS(id: number): Promise<SMSResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend SMS'
    };
  }
}

