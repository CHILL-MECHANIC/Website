declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    partial_payment?: boolean;
  }

  interface Order {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    notes: Record<string, string>;
    created_at: number;
  }

  interface RefundOptions {
    amount?: number;
    speed?: 'normal' | 'optimum';
    notes?: Record<string, string>;
    receipt?: string;
  }

  interface Refund {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    payment_id: string;
    notes: Record<string, string>;
    receipt: string;
    acquirer_data: Record<string, string>;
    created_at: number;
    status: string;
    speed_processed: string;
    speed_requested: string;
  }

  interface Orders {
    create(options: OrderCreateOptions): Promise<Order>;
    fetch(orderId: string): Promise<Order>;
    fetchAll(options?: Record<string, any>): Promise<{ items: Order[] }>;
  }

  interface Payments {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency?: string): Promise<any>;
    refund(paymentId: string, options?: RefundOptions): Promise<Refund>;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: Orders;
    payments: Payments;
  }

  export = Razorpay;
}

