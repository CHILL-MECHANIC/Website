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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminTechnicians() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    specialization: "",
    status: "available",
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTechnicians();
    }
  }, [isAdmin]);

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTechnicians(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const technicianData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      specialization: formData.specialization.split(",").map((s) => s.trim()),
      status: formData.status,
    };

    if (editingTechnician) {
      const { error } = await supabase
        .from("technicians")
        .update(technicianData)
        .eq("id", editingTechnician.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update technician",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Technician updated successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchTechnicians();
      }
    } else {
      const { error } = await supabase.from("technicians").insert(technicianData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create technician",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Technician created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchTechnicians();
      }
    }
  };

  const handleEdit = (technician: any) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      phone: technician.phone,
      email: technician.email || "",
      specialization: technician.specialization.join(", "),
      status: technician.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this technician?")) return;

    const { error } = await supabase.from("technicians").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete technician",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Technician deleted successfully",
      });
      fetchTechnicians();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      specialization: "",
      status: "available",
    });
    setEditingTechnician(null);
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
              <h1 className="text-3xl font-bold mb-2">Technicians Management</h1>
              <p className="text-muted-foreground">Manage technicians and their assignments</p>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Technician
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTechnician ? "Edit Technician" : "Add New Technician"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTechnician ? "Update technician details" : "Add a new technician to the team"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Specialization (comma-separated)</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({ ...formData, specialization: e.target.value })
                      }
                      placeholder="AC, Refrigerator, RO"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingTechnician ? "Update Technician" : "Create Technician"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Technicians</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium">{tech.name}</TableCell>
                      <TableCell>{tech.phone}</TableCell>
                      <TableCell>{tech.email || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tech.specialization.map((spec: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tech.status === "available"
                              ? "default"
                              : tech.status === "busy"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {tech.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(tech)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(tech.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
