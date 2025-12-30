-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_phone VARCHAR(20),
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(500),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  service_type VARCHAR(100),
  service_name VARCHAR(255),
  booking_id UUID,
  booking_date DATE,
  booking_time_slot VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  pincode VARCHAR(10),
  notes TEXT,
  refund_id VARCHAR(100),
  refund_amount INTEGER,
  refund_status VARCHAR(20),
  refund_reason TEXT,
  payment_method VARCHAR(50),
  bank VARCHAR(100),
  wallet VARCHAR(50),
  vpa VARCHAR(100),
  email VARCHAR(255),
  contact VARCHAR(20),
  fee INTEGER,
  tax INTEGER,
  error_code VARCHAR(50),
  error_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_phone ON payments(user_phone);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own payments
CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role can manage all payments"
ON payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

