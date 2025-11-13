/**
 * SMS-related type definitions
 */

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
  messageId?: string;
  message?: string;
  error?: string;
  statusCode?: number;
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

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

