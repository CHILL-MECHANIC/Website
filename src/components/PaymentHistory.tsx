import React, { useEffect, useState } from 'react';
import { getPaymentHistory, requestRefund, Payment } from '@/services/paymentClient';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PaymentHistory: React.FC = () => {
  const { profile } = useAuth();
  const isAuthenticated = !!profile;
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    const result = await getPaymentHistory(page, 10, statusFilter);
    
    if (result.success && result.payments) {
      setPayments(result.payments);
      setTotalPages(result.pagination?.totalPages || 1);
    } else {
      setError(result.message || 'Failed to load payments');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, isAuthenticated]);

  const handleRefund = async (paymentId: string, amount: number) => {
    if (!confirm(`Are you sure you want to request a refund of ₹${amount}?`)) {
      return;
    }

    setRefundingId(paymentId);
    
    const result = await requestRefund(paymentId, 'Customer requested refund');

    if (result.success) {
      toast({
        title: 'Refund Initiated',
        description: 'Amount will be credited in 5-7 business days.',
      });
      fetchPayments(); // Refresh list
    } else {
      toast({
        title: 'Refund Failed',
        description: result.message || 'Refund request failed',
        variant: 'destructive',
      });
    }

    setRefundingId(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      created: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
      partially_refunded: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.created}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please login to view payment history</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payment History</h2>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          
          <Button
            onClick={fetchPayments}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Loading payments...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No payments found
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {payment.serviceName || 'Service Payment'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {payment.createdAt && format(new Date(payment.createdAt), 'PPp')}
                    </p>
                    {payment.bookingDate && (
                      <p className="text-gray-500 text-sm">
                        Booking: {payment.bookingDate} {payment.bookingTimeSlot}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold">₹{payment.amount}</p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Order: {payment.orderId?.slice(0, 20)}...
                  </div>
                  
                  {payment.status === 'paid' && !payment.refundStatus && (
                    <Button
                      onClick={() => handleRefund(payment.id, payment.amount)}
                      disabled={refundingId === payment.id}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {refundingId === payment.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Request Refund'
                      )}
                    </Button>
                  )}
                  
                  {payment.refundStatus && (
                    <span className="text-sm text-blue-600">
                      Refunded: ₹{payment.refundAmount || 0}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="px-4 py-2 flex items-center">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentHistory;

