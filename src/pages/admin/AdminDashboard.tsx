import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Star, Bell, RefreshCw, Users, Calendar, IndianRupee, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newBookingAlert, setNewBookingAlert] = useState(false);
  const [paymentAlert, setPaymentAlert] = useState(false);
  const [techniciansCount, setTechniciansCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
      fetchRatings();
      fetchTechniciansCount();
      fetchRevenue();

      // Real-time subscription for bookings and payments
      const channel = supabase
        .channel('dashboard-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bookings'
          },
          (payload) => {
            console.log('🔔 New booking received on dashboard:', payload);
            setNewBookingAlert(true);
            toast({
              title: '🔔 New Booking Received!',
              description: 'A customer just made a new booking.',
            });
            fetchBookings();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings'
          },
          (payload: any) => {
            console.log('📝 Booking updated on dashboard:', payload);
            // Check if payment status changed to paid
            if (payload.new?.payment_status === 'paid' && payload.old?.payment_status !== 'paid') {
              setPaymentAlert(true);
              toast({
                title: '💰 Payment Received!',
                description: `Payment of ₹${payload.new.final_amount} received for booking.`,
              });
              fetchRevenue();
            }
            fetchBookings();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments'
          },
          (payload: any) => {
            console.log('💳 Payment event:', payload);
            if (payload.eventType === 'INSERT' || (payload.new?.status === 'paid')) {
              setPaymentAlert(true);
              toast({
                title: '💰 Payment Update!',
                description: 'A payment has been processed.',
              });
              fetchRevenue();
              fetchBookings();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const fetchBookings = async () => {
    try {
      // Step 1: Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);

      if (bookingsError || !bookingsData) {
        console.error("Bookings fetch error:", bookingsError);
        return;
      }

      if (bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Step 2: Fetch related data separately
      const userIds = [...new Set(bookingsData.map(b => b.user_id).filter(Boolean))];
      const technicianIds = [...new Set(bookingsData.map(b => b.technician_id).filter(Boolean))] as string[];
      const bookingIds = bookingsData.map(b => b.id);

      // Fetch profiles
      const { data: profilesData } = userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, email, phone')
            .in('user_id', userIds)
        : { data: [] };

      // Fetch booking items
      const { data: itemsData } = await supabase
        .from('booking_items')
        .select('booking_id, service_name')
        .in('booking_id', bookingIds);

      // Fetch technicians
      let techniciansData: any[] = [];
      if (technicianIds.length > 0) {
        const { data } = await supabase
          .from('technicians')
          .select('id, name')
          .in('id', technicianIds);
        techniciansData = data || [];
      }

      // Step 3: Combine data
      const profilesMap = new Map((profilesData || []).map(p => [p.user_id, p]));
      const techniciansMap = new Map(techniciansData.map(t => [t.id, t]));
      const itemsMap = new Map<string, any[]>();
      
      (itemsData || []).forEach(item => {
        const existing = itemsMap.get(item.booking_id) || [];
        existing.push(item);
        itemsMap.set(item.booking_id, existing);
      });

      const enrichedBookings = bookingsData.map(booking => ({
        ...booking,
        profiles: profilesMap.get(booking.user_id) || null,
        booking_items: itemsMap.get(booking.id) || [],
        technicians: booking.technician_id ? techniciansMap.get(booking.technician_id) : null
      }));

      setBookings(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchRatings = async () => {
    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .limit(150);

    if (!error && data) {
      setRatings(data);
    }
  };

  const fetchTechniciansCount = async () => {
    const { count, error } = await supabase
      .from("technicians")
      .select("*", { count: 'exact', head: true });

    if (!error && count !== null) {
      setTechniciansCount(count);
    }
  };

  const fetchRevenue = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("final_amount")
      .eq("payment_status", "paid");

    if (!error && data) {
      const total = data.reduce((sum, b) => sum + (b.final_amount || 0), 0);
      setTotalRevenue(total);
    }
  };

  const refreshData = () => {
    fetchBookings();
    fetchRatings();
    fetchTechniciansCount();
    fetchRevenue();
    setNewBookingAlert(false);
    setPaymentAlert(false);
  };

  const calculateRatingStats = () => {
    if (ratings.length === 0) return { average: 0, distribution: {} };

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    const distribution = ratings.reduce((acc: any, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

    return { average, distribution };
  };

  const { average, distribution } = calculateRatingStats();

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      booking.id.toLowerCase().includes(searchLower) ||
      booking.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      booking.booking_items?.some((item: any) =>
        item.service_name?.toLowerCase().includes(searchLower)
      )
    );
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Welcome to the admin dashboard</p>
              </div>
              {newBookingAlert && (
                <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  New Booking!
                </Badge>
              )}
              {paymentAlert && (
                <Badge className="bg-green-500 text-white animate-pulse flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Payment Received!
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => navigate("/admin/services")}>
                Add New Service
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bookings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                <Bell className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {bookings.filter((b) => b.status === "pending").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{average.toFixed(1)}</div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(average)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ratings.length} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground mt-1">From paid bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{booking.profiles?.full_name || "N/A"}</TableCell>
                      <TableCell>
                        {booking.booking_items?.[0]?.service_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{booking.final_amount || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            booking.payment_status === "paid"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-orange-100 text-orange-800 border-orange-300"
                          }
                        >
                          {booking.payment_status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "completed"
                              ? "default"
                              : booking.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Ratings Distribution */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Feedback & Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] || 0;
                  const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-4">{star}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
