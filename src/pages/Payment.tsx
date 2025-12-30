import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createOrder, verifyPayment, openRazorpayCheckout } from "@/services/paymentClient";
import { Loader2, Lock, ShieldCheck, CreditCard, Smartphone, Building2, Clock, MapPin } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface BookingData {
  date: string;
  time: string;
  instructions: string;
  serviceAddress?: string;
}

// Helper to get API base URL
const getApiBaseUrl = (): string => {
  // In development: use Express backend on localhost:3001
  // In production: use relative URLs for Vercel serverless functions
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  return ''; // Production: relative URLs for Vercel
};

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, getCartTotal, clearCart, getCartItemsCount } = useCart();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'now' | 'later'>('now');

  const bookingData: BookingData = location.state?.bookingData;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    
    if (!bookingData || cartItems.length === 0) {
      navigate("/cart");
      return;
    }
  }, [isAuthenticated, bookingData, cartItems.length, navigate]);

  const subtotal = getCartTotal();
  const total = subtotal;

  // Create booking via API
  const createBooking = async (isPayLater: boolean = false) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const apiBase = getApiBaseUrl();
    const url = `${apiBase}/api/booking/create`;
    
    if (import.meta.env.DEV) {
      console.log('[Payment] Creating booking:', url);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        totalAmount: subtotal,
        serviceTax: 0,
        finalAmount: total,
        specialInstructions: bookingData.instructions || '',
        serviceAddress: bookingData.serviceAddress || '',
        paymentMode: isPayLater ? 'pay_later' : 'pay_now',
        items: Array.from(cartItems).map(item => ({
          name: item.name,
          description: Array.isArray(item.description) ? item.description.join(', ') : item.description,
          price: item.price,
          quantity: item.quantity
        }))
      })
    });

    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Payment] Booking API error:', response.status, errorText);
      
      // Try to parse as JSON if possible
      let errorMessage = `Failed to create booking (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text or status
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Parse JSON only if response is OK
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create booking');
    }
    return result.booking;
  };

  // Process Pay Later - just create booking without payment
  const processPayLater = async () => {
    setLoading(true);

    try {
      const booking = await createBooking(true);

      clearCart();
      navigate("/booking-success", { 
        state: { 
          bookingId: booking.id,
          bookingData: {
            ...bookingData,
            amount: total,
            paymentMethod: 'pay_later'
          }
        } 
      });

      toast({
        title: "Booking Confirmed!",
        description: "Your service has been scheduled. Payment will be collected after service completion."
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error creating your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    // If pay later is selected, handle it differently
    if (paymentMode === 'later') {
      return processPayLater();
    }

    setLoading(true);

    try {
      // Step 1: Create booking first
      const booking = await createBooking(false);

      // Step 2: Create Razorpay order
      const serviceName = cartItems.length === 1 
        ? cartItems[0].name 
        : `${cartItems.length} Services`;
      
      // Get service type from cart item name or default to General
      const serviceType = 'General';

      const orderResult = await createOrder({
        serviceName,
        serviceType,
        amount: total,
        bookingId: booking.id
      });

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.message || 'Failed to create payment order');
      }

      // Step 3: Open Razorpay checkout - USE KEY FROM API RESPONSE
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
          // Step 4: Verify payment
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResult.success) {
              // Clear cart and navigate to success page
              clearCart();
              navigate("/booking-success", { 
                state: { 
                  bookingId: booking.id,
                  paymentId: verifyResult.payment?.paymentId,
                  bookingData: {
                    ...bookingData,
                    amount: total,
                    paymentMethod: 'razorpay'
                  }
                } 
              });

              toast({
                title: "Payment Successful!",
                description: "Your booking has been confirmed. You will receive an SMS confirmation shortly."
              });
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (verifyError: any) {
            console.error('Verification error:', verifyError);
            toast({
              title: "Payment Verification Failed",
              description: verifyError.message || "Please contact support if amount was deducted.",
              variant: "destructive"
            });
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Payment failed:", error);
          setLoading(false);
          
          if (error.code !== 'MODAL_CLOSED') {
            toast({
              title: "Payment Failed",
              description: error.description || "There was an error processing your payment. Please try again.",
              variant: "destructive"
            });
          }
        }
      );
    } catch (error: any) {
      console.error("Payment error:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!bookingData || cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground mb-8">Secure payment powered by Razorpay</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-3 space-y-2">
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">₹{total}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(bookingData.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{bookingData.time}</p>
                    </div>
                    {bookingData.serviceAddress && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Service Address
                        </p>
                        <p className="font-medium">{bookingData.serviceAddress}</p>
                      </div>
                    )}
                    {bookingData.instructions && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Special Instructions</p>
                        <p className="font-medium">{bookingData.instructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Mode Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Choose Payment Option</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={paymentMode} 
                    onValueChange={(value) => setPaymentMode(value as 'now' | 'later')}
                    className="space-y-3"
                  >
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMode === 'now' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <RadioGroupItem value="now" id="pay-now" />
                      <Label htmlFor="pay-now" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">Pay Now</p>
                            <p className="text-sm text-muted-foreground">Pay online securely via Razorpay</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMode === 'later' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <RadioGroupItem value="later" id="pay-later" />
                      <Label htmlFor="pay-later" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="font-semibold">Pay After Service</p>
                            <p className="text-sm text-muted-foreground">Pay cash or UPI after service completion</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Payment Methods Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    Accepted Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <CreditCard className="h-8 w-8 text-blue-600 mb-2" />
                      <span className="text-sm font-medium">Cards</span>
                      <span className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <Smartphone className="h-8 w-8 text-green-600 mb-2" />
                      <span className="text-sm font-medium">UPI</span>
                      <span className="text-xs text-muted-foreground">GPay, PhonePe, Paytm</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <Building2 className="h-8 w-8 text-purple-600 mb-2" />
                      <span className="text-sm font-medium">Net Banking</span>
                      <span className="text-xs text-muted-foreground">All major banks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Button */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                    <div className="text-4xl font-bold text-primary">₹{total}</div>
                  </div>
                  
                  <Button 
                    className={`w-full h-12 text-lg ${paymentMode === 'later' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                    size="lg"
                    onClick={processPayment}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : paymentMode === 'later' ? (
                      <>
                        <Clock className="mr-2 h-5 w-5" />
                        Confirm Booking
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Pay ₹{total}
                      </>
                    )}
                  </Button>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground">
                      🔒 Secured by Razorpay
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      Your payment information is encrypted and secure
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                      By proceeding, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
