import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function AdminBookings() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
      fetchTechnicians();
    }
  }, [isAdmin]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles(full_name, email, phone),
        booking_items(service_name, quantity, price),
        technicians(name, phone)
      `)
      .order("booking_date", { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
  };

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .eq("status", "available");

    if (!error && data) {
      setTechnicians(data);
    }
  };

  const handleAssignTechnician = async (bookingId: string, technicianId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ technician_id: technicianId })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign technician",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Technician assigned successfully",
      });
      fetchBookings();
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Booking status updated",
      });
      fetchBookings();
    }
  };

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
            <div>
              <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
              <p className="text-muted-foreground">Manage and assign technicians to bookings</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {booking.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.profiles?.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.profiles?.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.booking_items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {item.service_name}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.booking_time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={booking.technician_id || ""}
                          onValueChange={(value) => handleAssignTechnician(booking.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Assign technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {technicians.map((tech) => (
                              <SelectItem key={tech.id} value={tech.id}>
                                {tech.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={booking.status}
                          onValueChange={(value) => handleUpdateStatus(booking.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
