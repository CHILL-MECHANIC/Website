import { supabase } from '../config/supabase';
import type { SMSLog, SMSStatus, SMSType } from '../types/sms';
import type { Database, Json } from '../types/database';

type SMSLogRow = Database['public']['Tables']['sms_logs']['Row'];
type SMSLogInsert = Database['public']['Tables']['sms_logs']['Insert'];
type SMSLogUpdate = Database['public']['Tables']['sms_logs']['Update'];

/**
 * Supabase service for SMS logging operations
 * Handles all database interactions for SMS logs
 */

/**
 * Creates a new SMS log entry
 */
export async function createSMSLog(
  recipient: string,
  message: string,
  options: {
    status?: SMSStatus;
    messageId?: string;
    apiResponse?: unknown;
    senderId?: string;
    type?: SMSType;
    maxRetries?: number;
  } = {}
): Promise<SMSLog> {
  const insertData: SMSLogInsert = {
    recipient,
    message,
    status: options.status || 'pending',
    message_id: options.messageId || null,
    api_response: options.apiResponse ? (options.apiResponse as Json) : null,
    sender_id: options.senderId || null,
    type: options.type || null,
    retry_count: 0,
    max_retries: options.maxRetries || 3,
    next_retry_at: null
  };

  const { data, error } = await supabase
    .from('sms_logs')
    // @ts-ignore - Supabase type inference issue with Database type
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating SMS log:', error);
    throw new Error(`Failed to create SMS log: ${error.message}`);
  }

  return mapRowToSMSLog(data);
}

/**
 * Updates an existing SMS log
 */
export async function updateSMSLog(
  id: number,
  updates: {
    status?: SMSStatus;
    messageId?: string;
    apiResponse?: unknown;
    retryCount?: number;
    nextRetryAt?: Date | null;
  }
): Promise<SMSLog> {
  const updateData: SMSLogUpdate = {};

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }
  if (updates.messageId !== undefined) {
    updateData.message_id = updates.messageId;
  }
  if (updates.apiResponse !== undefined) {
    updateData.api_response = updates.apiResponse as Json;
  }
  if (updates.retryCount !== undefined) {
    updateData.retry_count = updates.retryCount;
  }
  if (updates.nextRetryAt !== undefined) {
    updateData.next_retry_at = updates.nextRetryAt ? updates.nextRetryAt.toISOString() : null;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('sms_logs')
    // @ts-ignore - Supabase type inference issue with Database type
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating SMS log:', error);
    throw new Error(`Failed to update SMS log: ${error.message}`);
  }

  return mapRowToSMSLog(data);
}

/**
 * Retrieves SMS logs with optional filtering
 */
export async function getSMSLogs(filters: {
  recipient?: string;
  status?: SMSStatus;
  type?: SMSType;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<{ logs: SMSLog[]; total: number }> {
  let query = supabase
    .from('sms_logs')
    .select('*', { count: 'exact' });

  if (filters.recipient) {
    query = query.eq('recipient', filters.recipient);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  query = query.order('created_at', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching SMS logs:', error);
    throw new Error(`Failed to fetch SMS logs: ${error.message}`);
  }

  return {
    logs: data ? data.map(mapRowToSMSLog) : [],
    total: count || 0
  };
}

/**
 * Retrieves a specific SMS log by ID
 */
export async function getSMSLogById(id: number): Promise<SMSLog | null> {
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching SMS log:', error);
    throw new Error(`Failed to fetch SMS log: ${error.message}`);
  }

  return data ? mapRowToSMSLog(data) : null;
}

/**
 * Retrieves failed SMS logs that are eligible for retry
 */
export async function getFailedSMSLogsForRetry(): Promise<SMSLog[]> {
  const now = new Date().toISOString();

  // Note: Supabase doesn't support comparing two columns directly
  // We'll filter by retry_count < 10 (assuming max_retries is typically 3)
  // and then filter in memory for retry_count < max_retries
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 10) // Pre-filter to reduce results
    .or(`next_retry_at.is.null,next_retry_at.lt.${now}`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching failed SMS logs:', error);
    throw new Error(`Failed to fetch failed SMS logs: ${error.message}`);
  }

  // Filter in memory for retry_count < max_retries
  const filtered = data ? data.filter((row: SMSLogRow) => row.retry_count < row.max_retries) : [];
  return filtered.map(mapRowToSMSLog);
}

/**
 * Maps database row to SMSLog type
 */
function mapRowToSMSLog(row: SMSLogRow): SMSLog {
  return {
    id: row.id,
    recipient: row.recipient,
    message: row.message,
    status: row.status as SMSStatus,
    messageId: row.message_id || undefined,
    apiResponse: row.api_response || undefined,
    senderId: row.sender_id || undefined,
    type: row.type || undefined,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    nextRetryAt: row.next_retry_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

