import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Clock, Package, Camera, Upload, Ban, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/Header";
import { cancelBooking } from "@/services/paymentClient";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  avatar_url?: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  final_amount: number;
  status: string;
  created_at: string;
  payment_status?: string;
  booking_items: Array<{
    service_name: string;
    quantity: number;
  }>;
}

export default function UserProfile() {
  const { profile: authProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    avatar_url: ""
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<{ bookingId: string; hasPaidPayment: boolean } | null>(null);

  useEffect(() => {
    if (authProfile) {
      fetchProfile();
      fetchBookings();
    }
  }, [authProfile]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Use relative URL in production, localhost in development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : '';

      const response = await fetch(`${apiBase}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const result = await response.json();
      if (result.success && result.profile) {
        setProfile({
          full_name: result.profile.fullName || "",
          email: result.profile.email || "",
          phone: result.profile.phone || "",
          address: result.profile.addressLine1 || "",
          city: result.profile.city || "",
          state: result.profile.state || "",
          pincode: result.profile.pincode || "",
          avatar_url: result.profile.avatarUrl || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          booking_items (
            service_name,
            quantity
          )
        `)
        .eq("user_id", authProfile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Check if booking was created within 1 hour
  const isWithin1Hour = (createdAt: string): boolean => {
    if (!createdAt) return false;
    const msElapsed = Date.now() - new Date(createdAt).getTime();
    return msElapsed <= 60 * 60 * 1000;
  };

  // Cancel a booking
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.bookingId);
    setCancelConfirmOpen(false);

    try {
      const result = await cancelBooking(bookingToCancel.bookingId);

      if (result.success) {
        // Send cancellation SMS to customer
        if (profile.phone) {
          try {
            let cleanedPhone = String(profile.phone).replace(/\D/g, '');
            if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
              cleanedPhone = cleanedPhone.substring(2);
            } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) {
              cleanedPhone = cleanedPhone.substring(1);
            }

            if (cleanedPhone.length === 10 && /^\d{10}$/.test(cleanedPhone)) {
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              const apiBaseUrl = isLocalhost ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : '';

              await fetch(`${apiBaseUrl}/api/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: '91' + cleanedPhone,
                  message: `Dear Customer, \n\nYour booking with Chill Mechanic has been cancelled as requested. Your refund will be processed within 3-5 business days. \nWe'd love to serve you again soon! \n\nRegards, \nChill Mechanic \nHappy Appliances, Happier Homes`,
                  type: 'OTP',
                  senderId: 'CHLMEH',
                  templateId: '1007212301685342172'
                })
              });
            } else {
              console.warn('[SMS] Invalid phone number for cancellation SMS after cleaning:', cleanedPhone, 'original:', profile.phone);
            }
          } catch (smsError) {
            console.warn('[SMS] Failed to send booking cancellation SMS (non-critical):', smsError);
          }
        }

        toast({
          title: '✅ Booking Cancelled',
          description: bookingToCancel.hasPaidPayment
            ? 'Refund will be credited to your account within 5-7 business days.'
            : 'Booking has been cancelled successfully.',
        });
        fetchBookings();
      } else {
        toast({
          title: 'Cancellation Failed',
          description: result.message || 'Unable to cancel booking. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      // Use relative URL in production, localhost in development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') : '';

      const response = await fetch(`${apiBase}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          addressLine1: profile.address,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Update failed');

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authProfile) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authProfile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const updatedProfile = { ...profile, avatar_url: publicUrl };
      setProfile(updatedProfile);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: authProfile.id,
          ...updatedProfile
        } as any);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.booking_date) >= new Date() || (booking.status !== 'completed' && booking.status !== 'cancelled')
  );
  
  const pastBookings = bookings.filter(booking => 
    (new Date(booking.booking_date) < new Date() && booking.status !== 'completed') || booking.status === 'completed' || booking.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name || ''} />
                      <AvatarFallback className="text-lg">
                        {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Click the camera icon to upload a profile photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={profile.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={profile.state}
                    onChange={handleInputChange}
                    placeholder="Enter your state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={profile.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter your pincode"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button onClick={updateProfile} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Upcoming Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : upcomingBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming services scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
                    const withinCancelWindow = isWithin1Hour(booking.created_at);
                    const isPaid = booking.payment_status === 'paid';
                    return (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            {new Date(booking.booking_date).toLocaleDateString()}
                            <Clock className="ml-4 mr-2 h-4 w-4" />
                            {booking.booking_time}
                          </div>
                          <span className="text-lg font-bold">₹{booking.final_amount}</span>
                        </div>
                        <div className="space-y-1 mb-3">
                          {booking.booking_items.map((item, index) => (
                            <div key={index} className="flex items-center">
                              <Package className="mr-2 h-4 w-4" />
                              <span>{item.service_name} (x{item.quantity})</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <Badge className="capitalize">
                            {booking.status}
                          </Badge>
                          
                          {/* Cancel Button - only within 1 hour */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (!withinCancelWindow) return;
                                      setBookingToCancel({
                                        bookingId: booking.id,
                                        hasPaidPayment: isPaid
                                      });
                                      setCancelConfirmOpen(true);
                                    }}
                                    disabled={!withinCancelWindow || cancellingId === booking.id}
                                    className={`text-xs ${withinCancelWindow
                                      ? 'border-red-300 text-red-600 hover:bg-red-50'
                                      : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    {cancellingId === booking.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-3 w-3 mr-1" />
                                        Cancel
                                      </>
                                    )}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {!withinCancelWindow && (
                                <TooltipContent>
                                  <p>Cancellation window has expired (within 1 hour only)</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Service History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : pastBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No service history available.</p>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 opacity-75">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(booking.booking_date).toLocaleDateString()}
                          <Clock className="ml-4 mr-2 h-4 w-4" />
                          {booking.booking_time}
                        </div>
                        <span className="text-lg font-bold">₹{booking.final_amount}</span>
                      </div>
                      <div className="space-y-1">
                        {booking.booking_items.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <Package className="mr-2 h-4 w-4" />
                            <span>{item.service_name} (x{item.quantity})</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-green-600 capitalize">
                        Status: {booking.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancel Booking Confirmation Dialog */}
        <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? Cancellations are only allowed within 1 hour of booking.
                {bookingToCancel?.hasPaidPayment && (
                  <span className="block mt-2 text-sm">
                    A full refund will be initiated and credited to your original payment method within 5-7 business days.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancelBooking}>
                Yes, Cancel Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
