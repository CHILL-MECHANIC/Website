import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, MapPin, Phone } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface BookingData {
  date: string;
  time: string;
  instructions?: string;
  serviceAddress?: string;
  amount?: number;
  paymentMethod?: string;
}

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartItemsCount } = useCart();
  const { profile } = useAuth();

  const bookingData: BookingData | undefined = location.state?.bookingData;
  const bookingId = location.state?.bookingId;

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData && !bookingId) {
      navigate("/");
    }
  }, [bookingData, bookingId, navigate]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  // Format time
  const formatTime = (timeString: string) => {
    // If time is in format "HH:MM" or "HH:MM-HH:MM", format it
    if (timeString.includes("-")) {
      return timeString;
    }
    // Try to parse and format
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || "00"} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Your request has been submitted
            </h1>
            <p className="text-muted-foreground text-lg">
              Our technician will be contacting you soon.
            </p>
          </div>

          {/* Booking Details */}
          <Card className="mb-8 text-left">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
              
              <div className="space-y-4">
                {bookingData?.date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{formatDate(bookingData.date)}</div>
                      <div className="text-sm text-muted-foreground">Preferred Date</div>
                    </div>
                  </div>
                )}
                
                {bookingData?.time && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{formatTime(bookingData.time)}</div>
                      <div className="text-sm text-muted-foreground">Time Slot</div>
                    </div>
                  </div>
                )}
                
                {bookingData?.serviceAddress && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{bookingData.serviceAddress}</div>
                      <div className="text-sm text-muted-foreground">Service Location</div>
                    </div>
                  </div>
                )}
                
                {profile?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{profile.phone}</div>
                      <div className="text-sm text-muted-foreground">Contact Number</div>
                    </div>
                  </div>
                )}

                {bookingData?.amount && (
                  <div className="flex items-center space-x-3 pt-2 border-t">
                    <div className="h-5 w-5 text-primary flex items-center justify-center font-bold">₹</div>
                    <div>
                      <div className="font-medium">₹{bookingData.amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {bookingData.paymentMethod === 'pay_later' ? 'Pay After Service' : 'Amount Paid'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-8 text-left">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">What happens next?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <div className="font-medium">Confirmation Call</div>
                    <div className="text-muted-foreground">Our team will call you within 30 minutes to confirm your booking details.</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <div className="font-medium">Technician Assignment</div>
                    <div className="text-muted-foreground">A qualified technician will be assigned based on your location and service type.</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <div className="font-medium">Service Completion</div>
                    <div className="text-muted-foreground">Our expert will arrive at your scheduled time and complete the service.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button size="lg" className="w-full md:w-auto px-8" onClick={() => navigate("/")}>
              Explore More Services
            </Button>
            
            <div className="text-center">
              <Button variant="link" onClick={() => navigate("/")}>
                Go Back to Home
              </Button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-12 p-4 bg-muted/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Need help with your booking? Call us at{" "}
              <span className="font-medium text-primary">+91-2902-1835</span>{" "}
              or email{" "}
              <span className="font-medium text-primary">info@chillmechanic.com</span>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}