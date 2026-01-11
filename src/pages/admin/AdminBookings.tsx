import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Card, CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Loader2, RefreshCw, UserPlus, Bell, Search, 
  Calendar, Clock, IndianRupee, Phone,
  CheckCircle, XCircle, Play, AlertCircle, Plus
} from 'lucide-react';

interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  total_amount: number;
  service_tax: number;
  travel_charges: number;
  final_amount: number;
  special_instructions: string | null;
  notes: string | null;
  technician_id: string | null;
  created_at: string;
  assigned_at: string | null;
  service_address: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface BookingItem {
  id: string;
  booking_id: string;
  service_name: string;
  price: number;
  quantity: number;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  specialization: string[];
  status: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  service_type: string;
  description: string[] | null;
}

interface BookingWithDetails extends Booking {
  customer?: Profile;
  items?: BookingItem[];
  technician?: Technician;
}

type StatusFilter = 'all' | 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export default function AdminBookings() {
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  
  // State
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Assign Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Create Booking Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    serviceId: '',
    serviceName: '',
    servicePrice: 0,
    bookingDate: '',
    bookingTime: '',
    technicianId: '',
    specialInstructions: '',
    paymentMode: 'pending' as string,
    // Address fields
    flatNo: '',
    buildingName: '',
    streetArea: '',
    landmark: '',
    pincode: ''
  });
  
  // Real-time state
  const [newBookingAlert, setNewBookingAlert] = useState(false);
  const [newBookingsCount, setNewBookingsCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  // Fetch bookings with separate queries to avoid join issues
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Fetch bookings
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter) {
        query = query.eq('booking_date', dateFilter);
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
        throw bookingsError;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        setStats({ total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 });
        setLoading(false);
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
            .select('user_id, full_name, phone, email, address')
            .in('user_id', userIds)
        : { data: [] };

      // Fetch booking items
      const { data: itemsData } = await supabase
        .from('booking_items')
        .select('*')
        .in('booking_id', bookingIds);

      // Fetch technicians
      let techniciansData: Technician[] = [];
      if (technicianIds.length > 0) {
        const { data } = await supabase
          .from('technicians')
          .select('*')
          .in('id', technicianIds);
        techniciansData = (data || []) as Technician[];
      }

      // Step 3: Combine data
      const profilesMap = new Map((profilesData || []).map(p => [p.user_id, p]));
      const techniciansMap = new Map(techniciansData.map(t => [t.id, t]));
      const itemsMap = new Map<string, BookingItem[]>();
      
      (itemsData || []).forEach(item => {
        const existing = itemsMap.get(item.booking_id) || [];
        existing.push(item as BookingItem);
        itemsMap.set(item.booking_id, existing);
      });

      const enrichedBookings: BookingWithDetails[] = bookingsData.map(booking => ({
        ...booking,
        notes: (booking as any).notes || null,
        assigned_at: (booking as any).assigned_at || null,
        service_address: (booking as any).service_address || null,
        customer: profilesMap.get(booking.user_id) as Profile | undefined,
        items: itemsMap.get(booking.id) || [],
        technician: booking.technician_id ? techniciansMap.get(booking.technician_id) : undefined
      }));

      // Apply search filter
      let filtered = enrichedBookings;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = enrichedBookings.filter(b => 
          b.customer?.full_name?.toLowerCase().includes(q) ||
          b.customer?.phone?.includes(q) ||
          b.items?.some(item => item.service_name?.toLowerCase().includes(q)) ||
          b.id.toLowerCase().includes(q)
        );
      }

      setBookings(filtered);
      
      // Calculate stats from all bookings (not filtered)
      setStats({
        total: bookingsData.length,
        pending: bookingsData.filter(b => b.status === 'pending').length,
        assigned: bookingsData.filter(b => b.status === 'assigned').length,
        inProgress: bookingsData.filter(b => b.status === 'in_progress' || b.status === 'accepted').length,
        completed: bookingsData.filter(b => b.status === 'completed').length,
        cancelled: bookingsData.filter(b => b.status === 'cancelled').length
      });

      setNewBookingAlert(false);
      setNewBookingsCount(0);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch bookings: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, searchQuery, toast]);

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) throw error;
      setTechnicians((data || []) as Technician[]);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('service_type')
        .order('name');

      if (error) throw error;
      setServices((data || []) as Service[]);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch customers (profiles)
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email, address')
        .order('full_name');

      if (error) throw error;
      setCustomers((data || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchBookings();
    fetchTechnicians();
    fetchServices();
    fetchCustomers();

    // Real-time subscription
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('New booking:', payload);
          setNewBookingAlert(true);
          setNewBookingsCount(prev => prev + 1);
          
          toast({
            title: '🔔 New Booking Received!',
            description: 'A new booking has been created.',
          });
          
          setTimeout(() => fetchBookings(), 1000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter, fetchBookings]);

  // Assign technician
  const assignTechnician = async () => {
    if (!selectedBooking || !selectedTechnician) {
      toast({
        title: 'Error',
        description: 'Please select a technician',
        variant: 'destructive'
      });
      return;
    }

    setAssigning(true);
    try {
      // Update booking directly via Supabase
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          technician_id: selectedTechnician,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (bookingError) throw bookingError;

      // Get technician name for toast
      const tech = technicians.find(t => t.id === selectedTechnician);

      toast({
        title: '✅ Technician Assigned',
        description: `${tech?.name || 'Technician'} has been assigned to this booking.`,
      });
      
      setAssignModalOpen(false);
      setSelectedBooking(null);
      setSelectedTechnician('');
      setAdminNotes('');
      fetchBookings();
      fetchTechnicians();
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign technician',
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  // Create new booking manually
  const createBookingManually = async () => {
    // Check custom auth (not Supabase auth - we use custom JWT)
    const authToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    if (!authToken || !storedUser) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in to create bookings.',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!newBooking.customerPhone || !newBooking.serviceId || !newBooking.bookingDate || !newBooking.bookingTime || !newBooking.pincode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields including pincode',
        variant: 'destructive'
      });
      return;
    }

    if (newBooking.pincode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit pincode',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      // Find or create customer
      let userId = newBooking.customerId;
      
      if (!userId) {
        // Check if customer exists by phone
        const { data: existingCustomer } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone', newBooking.customerPhone)
          .single();

        if (existingCustomer) {
          userId = existingCustomer.user_id;
        } else {
          // Create a placeholder user_id for walk-in customers
          userId = crypto.randomUUID();
          
          // Create profile for new customer
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              phone: newBooking.customerPhone,
              full_name: newBooking.customerName || 'Walk-in Customer'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - booking is more important
          }
        }
      }

      
      const serviceTax = 0;  
      const finalAmount = newBooking.servicePrice;  

      // Build service address
      const serviceAddress = [
        newBooking.flatNo,
        newBooking.buildingName,
        newBooking.streetArea,
        newBooking.landmark,
        `Pincode: ${newBooking.pincode}`
      ].filter(Boolean).join(', ');

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          booking_date: newBooking.bookingDate,
          booking_time: newBooking.bookingTime,
          total_amount: newBooking.servicePrice,
          service_tax: serviceTax,
          travel_charges: 0,
          final_amount: finalAmount,
          status: newBooking.technicianId ? 'assigned' : 'pending',
          payment_status: newBooking.paymentMode,
          special_instructions: newBooking.specialInstructions || null,
          technician_id: newBooking.technicianId || null,
          service_address: serviceAddress
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create booking item
      const selectedService = services.find(s => s.id === newBooking.serviceId);
      
      await supabase
        .from('booking_items')
        .insert({
          booking_id: booking.id,
          service_name: selectedService?.name || newBooking.serviceName,
          price: newBooking.servicePrice,
          quantity: 1
        });

      toast({
        title: '✅ Booking Created',
        description: `Booking created successfully for ${newBooking.customerName || newBooking.customerPhone}`,
      });

      // Reset form
      setNewBooking({
        customerId: '',
        customerName: '',
        customerPhone: '',
        serviceId: '',
        serviceName: '',
        servicePrice: 0,
        bookingDate: '',
        bookingTime: '',
        technicianId: '',
        specialInstructions: '',
        paymentMode: 'pending',
        flatNo: '',
        buildingName: '',
        streetArea: '',
        landmark: '',
        pincode: ''
      });
      setCreateModalOpen(false);
      fetchBookings();
      fetchTechnicians();
      fetchCustomers();
    } catch (error: any) {
      console.error('Create booking error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  // Update booking status directly
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Booking status changed to ${newStatus}`,
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  // Handle service selection in create modal
  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setNewBooking(prev => ({
        ...prev,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price
      }));
    }
  };

  // Handle customer selection in create modal
  const handleCustomerSelect = (customerId: string) => {
    if (customerId === 'new') {
      setNewBooking(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: ''
      }));
    } else {
      const customer = customers.find(c => c.user_id === customerId);
      if (customer) {
        setNewBooking(prev => ({
          ...prev,
          customerId: customer.user_id,
          customerName: customer.full_name || '',
          customerPhone: customer.phone || ''
        }));
      }
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { class: string; icon: any }> = {
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      assigned: { class: 'bg-blue-100 text-blue-800', icon: UserPlus },
      accepted: { class: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
      in_progress: { class: 'bg-purple-100 text-purple-800', icon: Play },
      completed: { class: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { class: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { class: className, icon: Icon } = config[status] || { class: 'bg-gray-100', icon: AlertCircle };
    
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Get payment badge
  const getPaymentBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  };

  // Show loading while checking admin
  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
            {newBookingAlert && (
              <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {newBookingsCount} New!
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setCreateModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Booking
            </Button>
            <Button onClick={fetchBookings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'pending' ? 'ring-2 ring-yellow-400' : ''}`} onClick={() => setStatusFilter('pending')}>
            <CardContent className="p-4">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'assigned' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setStatusFilter('assigned')}>
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Assigned</p>
              <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'in_progress' ? 'ring-2 ring-purple-400' : ''}`} onClick={() => setStatusFilter('in_progress')}>
            <CardContent className="p-4">
              <p className="text-sm text-purple-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'completed' ? 'ring-2 ring-green-400' : ''}`} onClick={() => setStatusFilter('completed')}>
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'cancelled' ? 'ring-2 ring-red-400' : ''}`} onClick={() => setStatusFilter('cancelled')}>
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by customer name, phone, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40"
          />
          
          {(statusFilter !== 'all' || dateFilter || searchQuery) && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.customer?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.customer?.phone || 'N/A'}
                        </p>
                        {booking.service_address && (
                          <p className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={booking.service_address}>
                            📍 {booking.service_address}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.items?.[0]?.service_name || 'N/A'}</p>
                        {booking.items && booking.items.length > 1 && (
                          <p className="text-xs text-gray-500">+{booking.items.length - 1} more</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{booking.booking_date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{booking.booking_time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <IndianRupee className="w-3 h-3" />
                        {booking.final_amount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentBadge(booking.payment_status)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell>
                      {booking.technician ? (
                        <div>
                          <p className="font-medium">{booking.technician.name}</p>
                          <p className="text-xs text-gray-500">{booking.technician.phone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setSelectedTechnician(booking.technician_id || '');
                            setAdminNotes(booking.notes || '');
                            setAssignModalOpen(true);
                          }}
                          disabled={booking.status === 'completed' || booking.status === 'cancelled'}
                          title="Assign Technician"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        
                        {booking.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {booking.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            title="Mark Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      {searchQuery || statusFilter !== 'all' || dateFilter
                        ? 'No bookings match your filters'
                        : 'No bookings found. Click "Create Booking" to add one.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Assign Technician Modal */}
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Technician</DialogTitle>
              <DialogDescription>
                Select a technician for this booking.
              </DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-4 py-4">
                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-medium">{selectedBooking.items?.[0]?.service_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-medium">{selectedBooking.customer?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span>{selectedBooking.booking_date} at {selectedBooking.booking_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">₹{selectedBooking.final_amount}</span>
                  </div>
                  {selectedBooking.service_address && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-500 block mb-1">Service Address:</span>
                      <span className="text-gray-700">{selectedBooking.service_address}</span>
                    </div>
                  )}
                </div>

                {/* Technician Selection */}
                <div>
                  <Label className="mb-2 block">Select Technician *</Label>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center gap-2">
                            <span>{tech.name}</span>
                            <Badge variant={tech.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                              {tech.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label className="mb-2 block">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any special instructions..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={assignTechnician} 
                disabled={!selectedTechnician || assigning}
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Booking Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Manually create a booking for a customer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Customer Selection */}
              <div>
                <Label className="mb-2 block">Customer *</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing or new customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ New Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.user_id} value={customer.user_id}>
                        {customer.full_name || customer.phone} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Customer Fields */}
              {!newBooking.customerId && (
                <>
                  <div>
                    <Label className="mb-2 block">Customer Name</Label>
                    <Input
                      placeholder="Enter customer name"
                      value={newBooking.customerName}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Customer Phone *</Label>
                    <Input
                      placeholder="10-digit phone number"
                      value={newBooking.customerPhone}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {/* Service Address */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Label className="mb-2 block font-semibold text-gray-700">Service Address *</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-sm text-gray-600">Flat/Apt No.</Label>
                    <Input
                      placeholder="e.g., A-101, Flat 5"
                      value={newBooking.flatNo}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, flatNo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm text-gray-600">Building Name</Label>
                    <Input
                      placeholder="e.g., Sunshine Apartments"
                      value={newBooking.buildingName}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, buildingName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-1 block text-sm text-gray-600">Street / Area</Label>
                  <Input
                    placeholder="e.g., MG Road, Sector 15"
                    value={newBooking.streetArea}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, streetArea: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-sm text-gray-600">Landmark (Optional)</Label>
                    <Input
                      placeholder="e.g., Near City Mall"
                      value={newBooking.landmark}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, landmark: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm text-gray-600">Pin Code *</Label>
                    <Input
                      placeholder="6-digit pincode"
                      value={newBooking.pincode}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <Label className="mb-2 block">Service *</Label>
                <Select onValueChange={handleServiceSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.service_type}) - ₹{service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Booking Date *</Label>
                  <Input
                    type="date"
                    value={newBooking.bookingDate}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, bookingDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Booking Time *</Label>
                  <Select onValueChange={(v) => setNewBooking(prev => ({ ...prev, bookingTime: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                      <SelectItem value="01:00 PM">01:00 PM</SelectItem>
                      <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                      <SelectItem value="03:00 PM">03:00 PM</SelectItem>
                      <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                      <SelectItem value="05:00 PM">05:00 PM</SelectItem>
                      <SelectItem value="06:00 PM">06:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Technician (Optional) */}
              <div>
                <Label className="mb-2 block">Assign Technician (Optional)</Label>
                <Select onValueChange={(v) => setNewBooking(prev => ({ ...prev, technicianId: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Assign Later</SelectItem>
                    {technicians.filter(t => t.status === 'available').map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name} (Available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div>
                <Label className="mb-2 block">Payment Status</Label>
                <Select 
                  value={newBooking.paymentMode} 
                  onValueChange={(v) => setNewBooking(prev => ({ ...prev, paymentMode: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending (Pay Later)</SelectItem>
                    <SelectItem value="paid">Paid (Received)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Instructions */}
              <div>
                <Label className="mb-2 block">Special Instructions</Label>
                <Textarea
                  placeholder="Any special instructions or notes..."
                  value={newBooking.specialInstructions}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createBookingManually} 
                disabled={creating || !newBooking.customerPhone || !newBooking.serviceId || !newBooking.bookingDate || !newBooking.bookingTime || !newBooking.pincode || newBooking.pincode.length !== 6}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Booking
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
