import { useEffect, useState } from 'react';

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
  };
}

export interface RazorpayInstance {
  on(event: string, handler: (response: RazorpayErrorResponse) => void): void;
  open(): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(() => typeof window !== 'undefined' && !!window.Razorpay);

  useEffect(() => {
    if (window.Razorpay) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openRazorpay = (options: Omit<RazorpayOptions, 'key'> & { key?: string }) => {
    if (!isLoaded) {
      console.error('Razorpay SDK not loaded yet.');
      return;
    }
    
    // Fallback key if not provided by backend
    const key = options.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_fallback';
    
    const rzp = new window.Razorpay({
      ...options,
      key,
    });
    
    rzp.on('payment.failed', function (response: RazorpayErrorResponse) {
      console.error('Payment failed', response.error);
      if (options.modal?.ondismiss) {
        options.modal.ondismiss();
      }
    });
    
    rzp.open();
  };

  return { isLoaded, openRazorpay };
}
