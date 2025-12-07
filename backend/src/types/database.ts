export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sms_logs: {
        Row: {
          id: number
          recipient: string
          message: string
          message_id: string | null
          api_response: Json | null
          sender_id: string | null
          type: 'TRANS' | 'PROMO' | 'OTP' | null
          status: 'pending' | 'sent' | 'failed' | 'delivered'
          retry_count: number
          max_retries: number
          next_retry_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          recipient: string
          message: string
          message_id?: string | null
          api_response?: Json | null
          sender_id?: string | null
          type?: 'TRANS' | 'PROMO' | 'OTP' | null
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          retry_count?: number
          max_retries?: number
          next_retry_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          recipient?: string
          message?: string
          message_id?: string | null
          api_response?: Json | null
          sender_id?: string | null
          type?: 'TRANS' | 'PROMO' | 'OTP' | null
          status?: 'pending' | 'sent' | 'failed' | 'delivered'
          retry_count?: number
          max_retries?: number
          next_retry_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      otp_logs: {
        Row: {
          id: number
          phone: string
          otp: string
          message_id: string | null
          request_id: string | null
          status: 'pending' | 'sent' | 'failed' | 'verified' | 'expired'
          api_response: Json | null
          attempts: number
          expires_at: string
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          phone: string
          otp: string
          message_id?: string | null
          request_id?: string | null
          status?: 'pending' | 'sent' | 'failed' | 'verified' | 'expired'
          api_response?: Json | null
          attempts?: number
          expires_at: string
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          phone?: string
          otp?: string
          message_id?: string | null
          request_id?: string | null
          status?: 'pending' | 'sent' | 'failed' | 'verified' | 'expired'
          api_response?: Json | null
          attempts?: number
          expires_at?: string
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          phone: string | null
          email: string | null
          full_name: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          pincode: string | null
          country: string
          is_profile_complete: boolean
          auth_method: 'phone' | 'email'
          last_login_at: string | null
          login_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          country?: string
          is_profile_complete?: boolean
          auth_method: 'phone' | 'email'
          last_login_at?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          country?: string
          is_profile_complete?: boolean
          auth_method?: 'phone' | 'email'
          last_login_at?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      update_last_login: {
        Args: { user_id: string }
        Returns: void
      }
    }
  }
}
