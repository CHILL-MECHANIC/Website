import { useState, useCallback } from 'react';
import { sendSMS, type SMSRequest, type SMSResponse } from '@/services/smsClient';

interface UseSMSReturn {
  sendSMS: (request: SMSRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
  response: SMSResponse | null;
  reset: () => void;
}

/**
 * Custom hook for sending single SMS
 * Provides loading state, error handling, and response data
 */
export function useSMS(): UseSMSReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SMSResponse | null>(null);

  const handleSendSMS = useCallback(async (request: SMSRequest) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await sendSMS(request);
      setResponse(result);

      if (!result.success) {
        setError(result.error || 'Failed to send SMS');
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
    sendSMS: handleSendSMS,
    loading,
    error,
    response,
    reset
  };
}

