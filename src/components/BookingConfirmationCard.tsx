import { useState, useEffect } from "react";
import { CheckCircle, Calendar, Clock, MapPin, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import "../styles/BookingConfirmationCard.css";

interface BookingConfirmationProps {
  bookingId: string;
  date: string;
  time: string;
  address: string;
  serviceType: string;
  amount: number;
  estimatedDuration?: string;
  onAction?: () => void;
}

export default function BookingConfirmationCard({
  bookingId,
  date,
  time,
  address,
  serviceType,
  amount,
  estimatedDuration = "45-60 mins",
  onAction
}: BookingConfirmationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      // Backend support for receipt generation not yet implemented
      // Placeholder for future receipt PDF/CSV download functionality
      const receiptData = {
        bookingId,
        date,
        time,
        amount,
        serviceType,
      };
      
      toast({
        title: "Receipt Download Coming Soon",
        description: "This feature is currently being developed. You can download your receipt from your profile soon.",
      });
      
      console.log("Receipt download requested:", receiptData);
      // TODO: Integrate with backend receipt endpoint when ready
      // const response = await fetch('/api/receipt/download', { method: 'POST', body: JSON.stringify(receiptData) });
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `receipt-${bookingId}.pdf`;
      // a.click();
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast({
        title: "Error",
        description: "Failed to prepare receipt. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`booking-confirmation-container ${isAnimating ? 'animate-in' : ''}`}>
      {/* Background Gradient Blur Elements */}
      <div className="confirmation-blur-element confirmation-blur-1"></div>
      <div className="confirmation-blur-element confirmation-blur-2"></div>

      {/* Main Card */}
      <div className="booking-confirmation-card">
        {/* Gradient Header */}
        <div className="confirmation-header">
          <div className="confirmation-header-content">
            <div className="confirmation-icon-wrapper">
              <CheckCircle className="confirmation-icon" />
            </div>
            <h2 className="confirmation-title">Booking Confirmed!</h2>
            <p className="confirmation-subtitle">Your service is scheduled</p>
          </div>
          <div className="confirmation-badge">#{bookingId}</div>
        </div>

        {/* Booking ID Strip */}
        <div className="confirmation-id-strip">
          <span className="id-label">Booking ID:</span>
          <span className="id-value">{bookingId}</span>
        </div>

        {/* Details Grid */}
        <div className="confirmation-details-grid">
          {/* Date Card */}
          <div className="detail-card detail-card-1">
            <div className="detail-icon-wrapper calendar-icon">
              <Calendar size={20} />
            </div>
            <div className="detail-content">
              <div className="detail-label">Date</div>
              <div className="detail-value">{date}</div>
            </div>
          </div>

          {/* Time Card */}
          <div className="detail-card detail-card-2">
            <div className="detail-icon-wrapper time-icon">
              <Clock size={20} />
            </div>
            <div className="detail-content">
              <div className="detail-label">Time</div>
              <div className="detail-value">{time}</div>
            </div>
          </div>

          {/* Duration Card */}
          <div className="detail-card detail-card-3">
            <div className="detail-icon-wrapper duration-icon">
              <Zap size={20} />
            </div>
            <div className="detail-content">
              <div className="detail-label">Est. Duration</div>
              <div className="detail-value">{estimatedDuration}</div>
            </div>
          </div>

          {/* Amount Card */}
          <div className="detail-card detail-card-4">
            <div className="detail-icon-wrapper amount-icon">
              <TrendingUp size={20} />
            </div>
            <div className="detail-content">
              <div className="detail-label">Amount</div>
              <div className="detail-value">₹{amount.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="confirmation-address-section">
          <div className="address-header">
            <MapPin size={18} className="address-icon" />
            <span className="address-title">Service Location</span>
          </div>
          <p className="address-text">{address}</p>
        </div>

        {/* Service Type Section */}
        <div className="confirmation-service-section">
          <h3 className="service-title">Service Type</h3>
          <div className="service-badge">{serviceType}</div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <Button 
            className="confirmation-button confirmation-button-primary"
            onClick={onAction}
          >
            View Booking Details
          </Button>
          <Button 
            variant="outline"
            className="confirmation-button confirmation-button-secondary"
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
            title="Receipt download coming soon"
          >
            {isDownloading ? "Downloading..." : "Download Receipt"}
          </Button>
        </div>

        {/* Footer Info */}
        <div className="confirmation-footer-info">
          <p className="footer-text">
            Our technician will contact you 30 minutes before arrival
          </p>
        </div>
      </div>

      {/* Success Animation Overlay */}
      <div className="confirmation-success-overlay">
        <div className="success-particle success-particle-1"></div>
        <div className="success-particle success-particle-2"></div>
        <div className="success-particle success-particle-3"></div>
      </div>
    </div>
  );
}
