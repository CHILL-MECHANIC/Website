import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createOrder, verifyPayment, openRazorpayCheckout } from '@/services/paymentClient';
import { Loader2, CreditCard, CheckCircle2 } from 'lucide-react';

interface PaymentButtonProps {
  serviceName: string;
  serviceCategory: string;
  amount: number;
  bookingDate?: string;
  bookingTimeSlot?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  onSuccess?: (payment: any) => void;
  onFailure?: (error: any) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export default function PaymentButton({
  serviceName,
  serviceCategory,
  amount,
  bookingDate,
  bookingTimeSlot,
  address,
  city,
  pincode,
  notes,
  onSuccess,
  onFailure,
  className,
  disabled,
  variant = 'default',
  size = 'default',
  children
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to continue with payment',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Payment amount must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // Create order
      const orderResult = await createOrder({
        serviceName,
        serviceType: serviceCategory, // Map serviceCategory to serviceType
        amount,
        bookingId: bookingDate ? undefined : undefined // bookingId is optional
      });

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.message || 'Failed to create order');
      }

      // Open Razorpay checkout - USE KEY FROM API RESPONSE
      openRazorpayCheckout(
        {
          key: orderResult.key,  // IMPORTANT: Pass key from API
          orderId: orderResult.order.id,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency,
          name: 'ChillMechanic',
          description: serviceName,
          prefill: {
            name: profile?.fullName || '',
            contact: profile?.phone ? `+91${profile.phone.replace(/^91/, '')}` : ''
          },
          theme: {
            color: '#1277BD'
          }
        },
        async (response) => {
          // Verify payment
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResult.success) {
              setSuccess(true);
              toast({
                title: 'Payment Successful!',
                description: `Your booking for ${serviceName} is confirmed. You will receive an SMS confirmation shortly.`,
              });
              onSuccess?.(verifyResult.payment);
              
              // Reset success state after animation
              setTimeout(() => setSuccess(false), 3000);
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (verifyError: any) {
            console.error('Verification error:', verifyError);
            toast({
              title: 'Payment Verification Failed',
              description: verifyError.message || 'Please contact support if amount was deducted.',
              variant: 'destructive'
            });
            onFailure?.(verifyError);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Payment failed:', error);
          setLoading(false);
          
          // Don't show error toast for user cancellation
          if (error.code !== 'MODAL_CLOSED') {
            toast({
              title: 'Payment Failed',
              description: error.description || 'Payment was not completed. Please try again.',
              variant: 'destructive'
            });
          }
          onFailure?.(error);
        }
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
      onFailure?.(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      variant={success ? 'default' : variant}
      size={size}
      className={`${className} ${success ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : success ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Payment Successful!
        </>
      ) : children ? (
        children
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ₹{amount.toLocaleString('en-IN')}
        </>
      )}
    </Button>
  );
}

// Export as named export as well
export { PaymentButton };

