import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Trash2 } from "lucide-react";

export default function AdminSettings() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAdminRoles();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchAdminRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq("role", "admin");

    if (!error && data) {
      setAdminRoles(data);
    }
  };

  const handleMakeAdmin = async () => {
    if (!searchEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const user = users.find((u) => u.email === searchEmail);
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: user.user_id,
      role: "admin",
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Error",
          description: "User is already an admin",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add admin role",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: `${searchEmail} is now an admin`,
      });
      setSearchEmail("");
      fetchAdminRoles();
    }
  };

  const handleRemoveAdmin = async (roleId: string, email: string) => {
    if (!confirm(`Remove admin access from ${email}?`)) return;

    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Admin role removed successfully",
      });
      fetchAdminRoles();
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
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage admin access and system settings</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="email">User Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter user email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleMakeAdmin}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Make Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminRoles.map((adminRole) => (
                      <TableRow key={adminRole.id}>
                        <TableCell className="font-medium">
                          {adminRole.profiles?.full_name || "N/A"}
                        </TableCell>
                        <TableCell>{adminRole.profiles?.email}</TableCell>
                        <TableCell>
                          <Badge>Admin</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleRemoveAdmin(adminRole.id, adminRole.profiles?.email)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
