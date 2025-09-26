import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Minus, Plus, ShoppingBag, Calendar, Clock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemsCount 
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={getCartItemsCount()} />
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some services to get started with your booking.
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              Browse Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const [bookingDetails, setBookingDetails] = useState({
    date: "",
    time: "",
    instructions: ""
  });
  const [showScheduling, setShowScheduling] = useState(false);

  const handleScheduleBooking = () => {
    if (!bookingDetails.date || !bookingDetails.time) {
      return; // Basic validation
    }
    navigate("/payment", { 
      state: { 
        bookingData: bookingDetails 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              Clear Cart
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {item.description.map((desc, index) => (
                            <div key={index}>{desc}</div>
                          ))}
                        </div>
                        <div className="text-lg font-bold text-primary mt-2">
                          ${item.price}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-bold text-primary">${item.price * item.quantity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({getCartItemsCount()} items)</span>
                    <span>${getCartTotal()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Service Tax</span>
                    <span>${(getCartTotal() * 0.18).toFixed(0)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Travel Charges</span>
                    <span>$50</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ${(getCartTotal() + getCartTotal() * 0.18 + 50).toFixed(0)}
                    </span>
                  </div>
                  
                  {!showScheduling ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => {
                        if (!user) {
                          navigate("/auth");
                          return;
                        }
                        setShowScheduling(true);
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Booking
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Preferred Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={bookingDetails.date}
                            onChange={(e) => setBookingDetails({
                              ...bookingDetails,
                              date: e.target.value
                            })}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Preferred Time</Label>
                          <select
                            id="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={bookingDetails.time}
                            onChange={(e) => setBookingDetails({
                              ...bookingDetails,
                              time: e.target.value
                            })}
                          >
                            <option value="">Select Time</option>
                            <option value="09:00">9:00 AM</option>
                            <option value="10:00">10:00 AM</option>
                            <option value="11:00">11:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="14:00">2:00 PM</option>
                            <option value="15:00">3:00 PM</option>
                            <option value="16:00">4:00 PM</option>
                            <option value="17:00">5:00 PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Any special instructions for the technician..."
                          value={bookingDetails.instructions}
                          onChange={(e) => setBookingDetails({
                            ...bookingDetails,
                            instructions: e.target.value
                          })}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1" 
                          onClick={handleScheduleBooking}
                          disabled={!bookingDetails.date || !bookingDetails.time}
                        >
                          Proceed to Payment
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowScheduling(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
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