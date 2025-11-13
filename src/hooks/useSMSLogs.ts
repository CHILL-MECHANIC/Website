import { useState, useEffect, useCallback } from 'react';
import { getSMSLogs, getSMSLogById, resendSMS, type SMSLogsFilters, type SMSLog } from '@/services/smsClient';

interface UseSMSLogsReturn {
  logs: SMSLog[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  fetchLogs: (filters?: SMSLogsFilters) => Promise<void>;
  fetchLogById: (id: number) => Promise<SMSLog | null>;
  resendFailedSMS: (id: number) => Promise<boolean>;
  reset: () => void;
}

/**
 * Custom hook for managing SMS logs
 * Provides loading state, error handling, pagination, and log management
 */
export function useSMSLogs(initialFilters?: SMSLogsFilters): UseSMSLogsReturn {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SMSLogsFilters>(initialFilters || {});

  const fetchLogs = useCallback(async (filters?: SMSLogsFilters) => {
    setLoading(true);
    setError(null);

    const activeFilters = filters || currentFilters;

    try {
      const result = await getSMSLogs(activeFilters);

      if (result.success && result.data) {
        setLogs(result.data.logs);
        setTotal(result.data.pagination.total);
        setHasMore(result.data.pagination.hasMore);
        setCurrentFilters(activeFilters);
      } else {
        setError(result.error || 'Failed to fetch SMS logs');
        setLogs([]);
        setTotal(0);
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setLogs([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const fetchLogById = useCallback(async (id: number): Promise<SMSLog | null> => {
    try {
      const result = await getSMSLogById(id);

      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (err) {
      console.error('Error fetching SMS log:', err);
      return null;
    }
  }, []);

  const resendFailedSMS = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await resendSMS(id);

      if (result.success) {
        // Refresh logs after successful resend
        await fetchLogs();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error resending SMS:', err);
      return false;
    }
  }, [fetchLogs]);

  const reset = useCallback(() => {
    setLogs([]);
    setLoading(false);
    setError(null);
    setTotal(0);
    setHasMore(false);
    setCurrentFilters({});
  }, []);

  // Fetch logs on mount if initial filters are provided
  useEffect(() => {
    if (initialFilters) {
      fetchLogs(initialFilters);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    logs,
    loading,
    error,
    total,
    hasMore,
    fetchLogs,
    fetchLogById,
    resendFailedSMS,
    reset
  };
}

