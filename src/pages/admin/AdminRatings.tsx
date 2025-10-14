import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";

export default function AdminRatings() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchRatings();
    }
  }, [isAdmin]);

  const fetchRatings = async () => {
    const { data, error } = await supabase
      .from("ratings")
      .select(`
        *,
        bookings(
          id,
          booking_date,
          profiles(full_name),
          booking_items(service_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRatings(data);
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ratings & Feedback</h1>
            <p className="text-muted-foreground">View all customer ratings and feedback</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell className="font-medium">
                        {rating.bookings?.profiles?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {rating.bookings?.booking_items?.[0]?.service_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm">{rating.rating}/5</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {rating.feedback || "No feedback provided"}
                      </TableCell>
                      <TableCell>
                        {new Date(rating.created_at).toLocaleDateString()}
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
