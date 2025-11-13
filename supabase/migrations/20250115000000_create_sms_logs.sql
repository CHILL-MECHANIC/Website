-- Create sms_logs table for SMS tracking
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id BIGSERIAL PRIMARY KEY,
  recipient VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  message_id VARCHAR(255),
  api_response JSONB,
  sender_id VARCHAR(50),
  type VARCHAR(20) CHECK (type IN ('TRANS', 'PROMO', 'OTP')),
  retry_count INT DEFAULT 0 NOT NULL,
  max_retries INT DEFAULT 3 NOT NULL,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_sms_recipient ON public.sms_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_sms_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_created_at ON public.sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_type ON public.sms_logs(type);
CREATE INDEX IF NOT EXISTS idx_sms_retry ON public.sms_logs(status, retry_count, next_retry_at) WHERE status = 'failed';

-- Enable Row Level Security
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role full access"
ON public.sms_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy: Authenticated users can view their own SMS logs
CREATE POLICY "Users can view own SMS logs"
ON public.sms_logs
FOR SELECT
TO authenticated
USING (
  recipient IN (
    SELECT phone FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create policy: Admins can view all SMS logs
CREATE POLICY "Admins can view all SMS logs"
ON public.sms_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sms_logs_timestamp
BEFORE UPDATE ON public.sms_logs
FOR EACH ROW
EXECUTE FUNCTION update_sms_logs_updated_at();

-- Add comment to table
COMMENT ON TABLE public.sms_logs IS 'Stores SMS sending logs and status tracking';
COMMENT ON COLUMN public.sms_logs.status IS 'SMS status: pending, sent, failed, or delivered';
COMMENT ON COLUMN public.sms_logs.type IS 'SMS type: TRANS (transactional), PROMO (promotional), or OTP (one-time password)';
COMMENT ON COLUMN public.sms_logs.api_response IS 'Full API response from SMS provider for debugging';

