import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentHistory, requestRefund, cancelBooking, type Payment } from '@/services/paymentClient';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  IndianRupee,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  ChevronRight,
  Bell,
  Ban
} from 'lucide-react';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newPaymentAlert, setNewPaymentAlert] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<{ bookingId: string; hasPaidPayment: boolean } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayments();

      // Real-time subscription for payment updates
      const channel = supabase
        .channel('user-payments-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments'
          },
          (payload) => {
            console.log('💳 Payment update received:', payload);
            setNewPaymentAlert(true);
            toast({
              title: '💳 Payment Updated!',
              description: 'Your payment status has been updated.',
            });
            fetchPayments(true);
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
            // When booking payment status changes
            if (payload.new?.payment_status !== payload.old?.payment_status) {
              console.log('📝 Booking payment status changed:', payload);
              toast({
                title: payload.new?.payment_status === 'paid' 
                  ? '✅ Payment Confirmed!' 
                  : '📝 Payment Status Updated',
                description: payload.new?.payment_status === 'paid'
                  ? 'Your payment has been successfully processed.'
                  : 'Your payment status has been updated.',
              });
              fetchPayments(true);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, page]);

  const fetchPayments = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const result = await getPaymentHistory(page, 10);
      if (result.success && result.payments) {
        console.log('📊 Payments fetched:', result.payments);
        // Debug: log booking info for each payment
        result.payments.forEach((p, idx) => {
          console.log(`Payment ${idx + 1}:`, {
            serviceName: p.serviceName,
            bookingId: p.bookingId,
            bookingStatus: p.bookingStatus,
            bookingCreatedAt: p.bookingCreatedAt,
            isWithin1Hour: p.bookingCreatedAt ? Date.now() - new Date(p.bookingCreatedAt).getTime() <= 60 * 60 * 1000 : false
          });
        });
        setPayments(result.payments);
        setTotalPages(result.pagination?.totalPages || 1);
      }
      setNewPaymentAlert(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefund = async (paymentId: string, serviceName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to request a refund for "${serviceName}"?\n\nThe amount will be credited to your original payment method within 5-7 business days.`
    );
    
    if (!confirmed) return;

    setRefundingId(paymentId);
    try {
      const result = await requestRefund(paymentId, 'Customer requested refund');
      if (result.success) {
        toast({
          title: 'Refund Initiated',
          description: 'Your refund will be processed within 5-7 business days.',
        });
        fetchPayments(true);
      } else {
        toast({
          title: 'Refund Failed',
          description: result.message || 'Unable to process refund. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setRefundingId(null);
    }
  };

  // Returns true if current time is within 1 hour of the given timestamp
  const isWithin1Hour = (bookingCreatedAt?: string): boolean => {
    if (!bookingCreatedAt) return false;
    const msElapsed = Date.now() - new Date(bookingCreatedAt).getTime();
    return msElapsed <= 60 * 60 * 1000;
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.bookingId);
    setCancelConfirmOpen(false);

    try {
      const result = await cancelBooking(bookingToCancel.bookingId);
      if (result.success) {
        toast({
          title: '✅ Booking Cancelled',
          description: result.refund
            ? `Booking cancelled. Refund of ₹${result.refund.amount.toLocaleString('en-IN')} will be credited within 5-7 business days.`
            : 'Your booking has been cancelled successfully.',
        });
        fetchPayments(true);
      } else {
        toast({
          title: 'Cancellation Failed',
          description: result.message || 'Unable to cancel booking. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { 
      variant: 'default' | 'secondary' | 'destructive' | 'outline'; 
      label: string; 
      icon: React.ReactNode;
      bgColor: string;
    }> = {
      created: { 
        variant: 'secondary', 
        label: 'Pending', 
        icon: <Clock className="h-3 w-3" />,
        bgColor: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      pending: { 
        variant: 'secondary', 
        label: 'Processing', 
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        bgColor: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      paid: { 
        variant: 'default', 
        label: 'Paid', 
        icon: <CheckCircle2 className="h-3 w-3" />,
        bgColor: 'bg-green-50 text-green-700 border-green-200'
      },
      failed: { 
        variant: 'destructive', 
        label: 'Failed', 
        icon: <XCircle className="h-3 w-3" />,
        bgColor: 'bg-red-50 text-red-700 border-red-200'
      },
      refunded: { 
        variant: 'outline', 
        label: 'Refunded', 
        icon: <AlertCircle className="h-3 w-3" />,
        bgColor: 'bg-gray-50 text-gray-700 border-gray-200'
      },
      partially_refunded: { 
        variant: 'outline', 
        label: 'Partially Refunded', 
        icon: <AlertCircle className="h-3 w-3" />,
        bgColor: 'bg-orange-50 text-orange-700 border-orange-200'
      }
    };
    return configs[status] || configs.created;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Payment History</h1>
                <p className="text-sm text-muted-foreground">View all your transactions</p>
              </div>
              {newPaymentAlert && (
                <Badge className="bg-green-500 text-white animate-pulse flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Updated!
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
              className="rounded-full"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any payments yet. Book a service to get started!
              </p>
              <Button onClick={() => navigate('/')}>
                Browse Services
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{payments.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{payments
                        .filter(p => p.status === 'paid')
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking History Section */}
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Booking History</h2>
                <p className="text-sm text-muted-foreground">Manage your bookings and view payment details</p>
              </div>
              
              <div className="space-y-3">
                {payments.map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                
                return (
                  <Card 
                    key={payment.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Left side - Service info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                                {statusConfig.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {payment.serviceName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {payment.serviceType}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(payment.createdAt)}
                              </span>
                              {payment.paidAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTime(payment.paidAt)}
                                </span>
                              )}
                            </div>
                            
                            {payment.paymentId && (
                              <p className="mt-2 text-xs text-muted-foreground font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                                ID: {payment.paymentId}
                              </p>
                            )}
                          </div>

                          {/* Right side - Amount & Actions */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xl font-bold text-gray-900">
                                <IndianRupee className="h-4 w-4" />
                                {payment.amount.toLocaleString('en-IN')}
                              </div>
                              <Badge 
                                variant={statusConfig.variant}
                                className="mt-1"
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>

                            {/* Cancel Booking button — only for pending bookings within 1-hour window */}
                            {payment.bookingId && payment.bookingStatus === 'pending' && (() => {
                              const withinWindow = isWithin1Hour(payment.bookingCreatedAt);
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            if (!withinWindow) return;
                                            setBookingToCancel({
                                              bookingId: payment.bookingId!,
                                              hasPaidPayment: payment.status === 'paid'
                                            });
                                            setCancelConfirmOpen(true);
                                          }}
                                          disabled={!withinWindow || cancellingId === payment.bookingId}
                                          className={`text-xs ${withinWindow
                                            ? 'border-red-300 text-red-600 hover:bg-red-50'
                                            : 'opacity-50 cursor-not-allowed'
                                          }`}
                                        >
                                          {cancellingId === payment.bookingId ? (
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
                                    {!withinWindow && (
                                      <TooltipContent>
                                        <p>Cancellation window has expired</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}

                            {/* Refund button */}
                            {payment.status === 'paid' && !payment.refundStatus && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRefund(payment.id, payment.serviceName)}
                                disabled={refundingId === payment.id}
                                className="text-xs"
                              >
                                {refundingId === payment.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Request Refund'
                                )}
                              </Button>
                            )}
                            
                            {payment.refundStatus && (
                              <Badge variant="outline" className="text-xs">
                                Refund: {payment.refundStatus}
                                {payment.refundAmount && ` (₹${payment.refundAmount})`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}              </div>            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? Cancellations are only allowed within 1 hour of booking.
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
  );
}

