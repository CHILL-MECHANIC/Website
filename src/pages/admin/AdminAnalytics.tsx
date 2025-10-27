import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalytics() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    serviceBreakdown: [] as any[],
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        *,
        booking_items(service_name, price, quantity)
      `);

    if (bookings) {
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter((b) => b.status === "completed").length;
      const pendingBookings = bookings.filter((b) => b.status === "pending").length;
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.final_amount || 0), 0);

      const serviceCount: any = {};
      bookings.forEach((booking) => {
        booking.booking_items?.forEach((item: any) => {
          serviceCount[item.service_name] = (serviceCount[item.service_name] || 0) + 1;
        });
      });

      const serviceBreakdown = Object.entries(serviceCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => (b.count as number) - (a.count as number));

      setStats({
        totalBookings,
        completedBookings,
        pendingBookings,
        totalRevenue,
        serviceBreakdown,
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const maxCount = Math.max(...stats.serviceBreakdown.map((s) => s.count as number), 1);

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">View business insights and trends</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalBookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.completedBookings}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.pendingBookings}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.serviceBreakdown.map((service) => (
                  <div key={service.name}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">{service.count} bookings</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${((service.count as number) / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
