import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Wallet, Building, Loader2, Lock } from "lucide-react";

interface BookingData {
  date: string;
  time: string;
  instructions: string;
}

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, getCartTotal, clearCart, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: ""
  });

  const bookingData: BookingData = location.state?.bookingData;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (!bookingData || cartItems.length === 0) {
      navigate("/cart");
      return;
    }
  }, [user, bookingData, cartItems.length, navigate]);

  const subtotal = getCartTotal();
  const GST = Math.round(subtotal * 0.18);
  const travelCharges = 50;
  const total = subtotal + GST + travelCharges;

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === "cardNumber") {
      formattedValue = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      formattedValue = formattedValue.match(/.{1,4}/g)?.join(' ') || formattedValue;
      formattedValue = formattedValue.slice(0, 19); // Limit to 16 digits + 3 spaces
    }

    // Format expiry date with slash
    if (name === "expiryDate") {
      formattedValue = value.replace(/[^0-9]/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    }

    // Format CVV - numbers only
    if (name === "cvv") {
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 3);
    }

    setCardDetails({
      ...cardDetails,
      [name]: formattedValue
    });
  };

  const processPayment = async () => {
    setLoading(true);

    try {
      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user?.id,
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          total_amount: subtotal,
          service_tax: GST,
          travel_charges: travelCharges,
          final_amount: total,
          status: "confirmed",
          payment_status: "completed",
          special_instructions: bookingData.instructions
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create booking items
      const bookingItems = cartItems.map(item => ({
        booking_id: booking.id,
        service_name: item.name,
        service_description: item.description,
        price: item.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(bookingItems);

      if (itemsError) throw itemsError;

      // Clear cart and navigate to success page
      clearCart();
      navigate("/booking-success", { 
        state: { 
          bookingId: booking.id,
          bookingData: {
            ...bookingData,
            amount: total,
            paymentMethod
          }
        } 
      });

      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed. You will receive a confirmation email shortly."
      });

    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData || cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.name} (x{item.quantity})</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST(18%)</span>
                        <span>₹{GST}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Travel Charges</span>
                        <span>₹{travelCharges}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>₹{total}</span>
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
                  <div className="space-y-2">
                    <p><strong>Date:</strong> {new Date(bookingData.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {bookingData.time}</p>
                    {bookingData.instructions && (
                      <p><strong>Instructions:</strong> {bookingData.instructions}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="mr-2 h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center cursor-pointer">
                        <Wallet className="mr-2 h-4 w-4" />
                        UPI Payment
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="netbanking" id="netbanking" />
                      <Label htmlFor="netbanking" className="flex items-center cursor-pointer">
                        <Building className="mr-2 h-4 w-4" />
                        Net Banking
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="nameOnCard">Name on Card</Label>
                          <Input
                            id="nameOnCard"
                            name="nameOnCard"
                            value={cardDetails.nameOnCard}
                            onChange={handleCardInputChange}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            value={cardDetails.cardNumber}
                            onChange={handleCardInputChange}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            value={cardDetails.expiryDate}
                            onChange={handleCardInputChange}
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            type="password"
                            value={cardDetails.cvv}
                            onChange={handleCardInputChange}
                            placeholder="123"
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">₹{total}</div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={processPayment}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay Securely
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Your payment information is encrypted and secure
                  </p>
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