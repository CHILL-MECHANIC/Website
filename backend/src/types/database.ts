/**
 * Database type definitions for Supabase
 * This should match your Supabase database schema
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sms_logs: {
        Row: {
          id: number;
          recipient: string;
          message: string;
          status: 'pending' | 'sent' | 'failed' | 'delivered';
          message_id: string | null;
          api_response: Json | null;
          sender_id: string | null;
          type: 'TRANS' | 'PROMO' | 'OTP' | null;
          retry_count: number;
          max_retries: number;
          next_retry_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          recipient: string;
          message: string;
          status?: 'pending' | 'sent' | 'failed' | 'delivered';
          message_id?: string | null;
          api_response?: Json | null;
          sender_id?: string | null;
          type?: 'TRANS' | 'PROMO' | 'OTP' | null;
          retry_count?: number;
          max_retries?: number;
          next_retry_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          recipient?: string;
          message?: string;
          status?: 'pending' | 'sent' | 'failed' | 'delivered';
          message_id?: string | null;
          api_response?: Json | null;
          sender_id?: string | null;
          type?: 'TRANS' | 'PROMO' | 'OTP' | null;
          retry_count?: number;
          max_retries?: number;
          next_retry_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

