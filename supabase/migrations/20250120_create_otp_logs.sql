-- Create otp_logs table for OTP-based authentication
CREATE TABLE IF NOT EXISTS otp_logs (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(4) NOT NULL,
  message_id VARCHAR(255),
  request_id VARCHAR(255),
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'verified')) DEFAULT 'pending',
  api_response JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_logs_phone_status ON otp_logs(phone, status);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON otp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires_at ON otp_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_message_id ON otp_logs(message_id);

-- Enable Row Level Security
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access"
ON otp_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: OTP logs are primarily accessed by backend service role
-- User-level access policies can be added later when user authentication is integrated

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_otp_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_otp_logs_updated_at
  BEFORE UPDATE ON otp_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_otp_logs_updated_at();

