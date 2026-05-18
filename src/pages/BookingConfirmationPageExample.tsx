import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingConfirmationCard from "@/components/BookingConfirmationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

interface BookingData {
  date: string;
  time: string;
  instructions?: string;
  serviceAddress?: string;
  amount?: number;
  paymentMethod?: string;
  serviceType?: string;
  bookingId?: string;
}

/**
 * Example of integrating BookingConfirmationCard into a booking success page
 * or dashboard. This demonstrates the unique CSS element for booking confirmation.
 * 
 * Usage:
 * 1. Place this component after payment confirmation
 * 2. Pass booking details from your state/context
 * 3. The component handles animations and styling automatically
 */
export default function BookingConfirmationPageExample() {
  const location = useLocation();
  const { getCartItemsCount } = useCart();
  const { profile } = useAuth();

  const bookingData: BookingData | undefined = location.state?.bookingData;
  const bookingId = location.state?.bookingId || `BK${Date.now()}`;

  const [showConfirmation, setShowConfirmation] = useState(true);

  useEffect(() => {
    if (!bookingData && !bookingId) {
      // Redirect if no booking data
      window.location.href = "/";
    }
  }, [bookingData, bookingId]);

  const handleViewDetails = () => {
    // Navigate to booking details or perform other actions
    console.log("View booking details for:", bookingId);
  };

  if (!showConfirmation) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={getCartItemsCount()} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Redirecting to dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />

      <div className="container mx-auto px-4 py-12">
        {/* Booking Confirmation Card - The Unique CSS Element */}
        <BookingConfirmationCard
          bookingId={bookingId}
          date={bookingData?.date || "Not specified"}
          time={bookingData?.time || "Not specified"}
          address={bookingData?.serviceAddress || "Fetching address..."}
          serviceType={bookingData?.serviceType || "General Service"}
          amount={bookingData?.amount || 0}
          estimatedDuration="45-60 mins"
          onAction={handleViewDetails}
        />

        {/* Additional Info Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* What Happens Next */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Confirmation Call</h3>
              <p className="text-sm text-gray-700">
                Our team will call within 30 minutes to confirm your booking details.
              </p>
            </div>

            {/* Technician Assignment */}
            <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-2">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Technician Assignment</h3>
              <p className="text-sm text-gray-700">
                A qualified technician will be assigned based on your location.
              </p>
            </div>

            {/* Service Completion */}
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Completion</h3>
              <p className="text-sm text-gray-700">
                Technician arrives at scheduled time and completes the service.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 max-w-2xl mx-auto p-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-700">
            Contact us at <span className="font-semibold text-blue-600">+91-2902-1835</span> or{" "}
            <span className="font-semibold text-blue-600">info@chillmechanic.com</span>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/*
 * INTEGRATION GUIDE
 * ================
 * 
 * 1. Import the component:
 *    import BookingConfirmationCard from "@/components/BookingConfirmationCard";
 * 
 * 2. Pass the required props:
 *    <BookingConfirmationCard
 *      bookingId="BK123456"
 *      date="March 20, 2026"
 *      time="2:00 PM - 3:00 PM"
 *      address="123 Main St, City, State 12345"
 *      serviceType="AC Service"
 *      amount={1500}
 *      estimatedDuration="45-60 mins"
 *      onAction={() => handleViewDetails()}
 *    />
 * 
 * 3. The component automatically handles:
 *    - Smooth animations on mount
 *    - Gradient backgrounds
 *    - Icon animations
 *    - Responsive design
 *    - Hover effects
 *    - Success particles
 * 
 * 4. CSS Features:
 *    - Unique gradient header with animated background
 *    - Detail cards with individual animation delays
 *    - Backdrop blur effects
 *    - Smooth transitions and hover states
 *    - Responsive grid layout
 *    - Success particle animations
 *    - Print-friendly styles
 */
