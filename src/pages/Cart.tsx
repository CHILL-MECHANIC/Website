import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Minus, Plus, ShoppingBag, CalendarIcon, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper to get API base URL
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '';
    }
  }
  return 'http://localhost:3001';
};

interface ProfileAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemsCount
  } = useCart();

  const [bookingDetails, setBookingDetails] = useState({
    date: null as Date | null,
    time: "",
    instructions: ""
  });
  
  // Address state
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState({
    flatNo: "",
    buildingName: "",
    streetArea: "",
    landmark: "",
    pincode: ""
  });
  const [profileAddress, setProfileAddress] = useState<ProfileAddress | null>(null);
  
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Fetch profile address when authenticated
  useEffect(() => {
    const fetchProfileAddress = async () => {
      if (!isAuthenticated) return;
      
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.profile) {
            setProfileAddress({
              address: result.profile.addressLine1 || "",
              city: result.profile.city || "",
              state: result.profile.state || "",
              pincode: result.profile.pincode || ""
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile address:', error);
      }
    };

    fetchProfileAddress();
  }, [isAuthenticated]);

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

  // Build the service address string
  const buildServiceAddressString = (): string => {
    if (useProfileAddress && profileAddress) {
      const parts = [
        profileAddress.address,
        profileAddress.city,
        profileAddress.state,
        profileAddress.pincode ? `Pincode: ${profileAddress.pincode}` : ''
      ].filter(Boolean);
      return parts.join(', ');
    } else {
      const parts = [
        serviceAddress.flatNo ? `Flat/Apt: ${serviceAddress.flatNo}` : '',
        serviceAddress.buildingName,
        serviceAddress.streetArea,
        serviceAddress.landmark ? `Landmark: ${serviceAddress.landmark}` : '',
        serviceAddress.pincode ? `Pincode: ${serviceAddress.pincode}` : ''
      ].filter(Boolean);
      return parts.join(', ');
    }
  };

  const handleScheduleBooking = () => {
    if (!bookingDetails.date || !bookingDetails.time) {
      return; // Basic validation
    }
    
    if (!profile) {
      setShowSchedulingModal(false);
      setShowAuthPrompt(true);
      return;
    }

    // Validate address
    if (!useProfileAddress) {
      if (!serviceAddress.streetArea || !serviceAddress.pincode) {
        return; // Need at least street and pincode
      }
    }
    
    navigate("/payment", { 
      state: { 
        bookingData: {
          date: bookingDetails.date.toISOString().split('T')[0],
          time: bookingDetails.time,
          instructions: bookingDetails.instructions,
          serviceAddress: buildServiceAddressString()
        }
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Your Cart</h1>
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
                          ₹{item.price}
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
                      <span className="font-bold text-primary">₹{item.price * item.quantity}</span>
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
                  {/* Order Summary */}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total ({getCartItemsCount()} items)</span>
                    <span className="text-primary">
                      ₹{getCartTotal()}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowSchedulingModal(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule Booking
                  </Button>
                  
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
      
      {/* Schedule Booking Modal */}
      <Dialog open={showSchedulingModal} onOpenChange={setShowSchedulingModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Your Service</DialogTitle>
            <DialogDescription>Choose your preferred date, time slot and service address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !bookingDetails.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bookingDetails.date ? format(bookingDetails.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={bookingDetails.date}
                    onSelect={(date) => setBookingDetails({...bookingDetails, date})}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={bookingDetails.time}
                onChange={(e) => setBookingDetails({...bookingDetails, time: e.target.value})}
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

            {/* Service Address Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Service Address</Label>
              </div>
              
              {/* Same as profile checkbox */}
              {profileAddress && (profileAddress.address || profileAddress.pincode) && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useProfileAddress"
                    checked={useProfileAddress}
                    onCheckedChange={(checked) => setUseProfileAddress(checked as boolean)}
                  />
                  <label
                    htmlFor="useProfileAddress"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Same as my profile address
                  </label>
                </div>
              )}

              {useProfileAddress && profileAddress && (profileAddress.address || profileAddress.pincode) ? (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {profileAddress.address && <span>{profileAddress.address}</span>}
                    {profileAddress.city && <span>, {profileAddress.city}</span>}
                    {profileAddress.state && <span>, {profileAddress.state}</span>}
                    {profileAddress.pincode && <span> - {profileAddress.pincode}</span>}
                  </p>
                  {!profileAddress.address && !profileAddress.pincode && (
                    <p className="text-sm text-amber-600">No address found in profile. Please add a different address below.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="flatNo" className="text-xs">Flat/Apt No.</Label>
                      <Input
                        id="flatNo"
                        placeholder="e.g. A-101"
                        value={serviceAddress.flatNo}
                        onChange={(e) => setServiceAddress({...serviceAddress, flatNo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="buildingName" className="text-xs">Building Name</Label>
                      <Input
                        id="buildingName"
                        placeholder="e.g. Sunshine Towers"
                        value={serviceAddress.buildingName}
                        onChange={(e) => setServiceAddress({...serviceAddress, buildingName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="streetArea" className="text-xs">Street/Area *</Label>
                    <Input
                      id="streetArea"
                      placeholder="e.g. MG Road, Koramangala"
                      value={serviceAddress.streetArea}
                      onChange={(e) => setServiceAddress({...serviceAddress, streetArea: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="landmark" className="text-xs">Landmark</Label>
                      <Input
                        id="landmark"
                        placeholder="e.g. Near XYZ Mall"
                        value={serviceAddress.landmark}
                        onChange={(e) => setServiceAddress({...serviceAddress, landmark: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pincode" className="text-xs">Pincode *</Label>
                      <Input
                        id="pincode"
                        placeholder="e.g. 560001"
                        value={serviceAddress.pincode}
                        onChange={(e) => setServiceAddress({...serviceAddress, pincode: e.target.value})}
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special instructions for the technician..."
                value={bookingDetails.instructions}
                onChange={(e) => setBookingDetails({...bookingDetails, instructions: e.target.value})}
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button 
                className="flex-1" 
                onClick={handleScheduleBooking}
                disabled={
                  !bookingDetails.date || 
                  !bookingDetails.time || 
                  (!useProfileAddress && (!serviceAddress.streetArea || !serviceAddress.pincode))
                }
              >
                Continue
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSchedulingModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Prompt Modal */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>Please sign in to continue with your booking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Please sign in or create an account to continue with your booking.
            </p>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate("/auth");
                }}
              >
                Sign In / Sign Up
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAuthPrompt(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}