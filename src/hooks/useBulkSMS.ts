import { useState, useCallback } from 'react';
import { sendBulkSMS, type BulkSMSRequest, type BulkSMSResponse } from '@/services/smsClient';

interface UseBulkSMSReturn {
  sendBulkSMS: (request: BulkSMSRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
  response: BulkSMSResponse | null;
  reset: () => void;
}

/**
 * Custom hook for sending bulk SMS
 * Provides loading state, error handling, and response data with success/failure counts
 */
export function useBulkSMS(): UseBulkSMSReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<BulkSMSResponse | null>(null);

  const handleSendBulkSMS = useCallback(async (request: BulkSMSRequest) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await sendBulkSMS(request);
      setResponse(result);

      if (!result.success) {
        setError(result.error || 'Failed to send bulk SMS');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setResponse({
        success: false,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResponse(null);
  }, []);

  return {
    sendBulkSMS: handleSendBulkSMS,
    loading,
    error,
    response,
    reset
  };
}

