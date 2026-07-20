'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import api from '../../../lib/api';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import B2BBookingSummary from '../../../components/b2b/B2BBookingSummary';
import type {
  RazorpayErrorResponse,
  RazorpayResponse,
} from '../../../components/common/RazorpayPaymentHandler';


interface VipRequest {
  temple_name: string;
  darshan_date: string;
  time_slot: string;
  needs_guide: boolean;
}

interface TransportRequest {
  request_type: string;
  vehicle_preference: string;
  remarks: string;
}

interface CheckoutPayload {
  primary_guest_name: string;
  contact_email: string;
  contact_phone: string;
  special_requests: string;
  floor_preference: boolean;
  kitchen_dining_requested: boolean;
  payment_mode: string;
  vip_requests: VipRequest[];
  transport_requests: TransportRequest[];
}

interface OrderLine {
  id: number;
  quantity: number;
  room_type_name: string;
  line_type: string;
  total_amount: string;
}

interface OrderData {
  status: string;
  hotel_name: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  total_rooms: number;
  booking_mode: string;
  expires_at?: string | null;
  lines: OrderLine[];
  pricing_snapshot: {
    b2c_total: string;
    b2b_selling_total: string;
    agent_tac_total: string;
  };
}

interface OnlinePaymentOrder {
  razorpay_key_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
}

type PaymentMode = 'LEDGER_HOLD' | 'PREPAID';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  
  const [primaryGuest, setPrimaryGuest] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [vipDarshan, setVipDarshan] = useState(false);
  const [localTransport, setLocalTransport] = useState(false);
  const [preferredFloor, setPreferredFloor] = useState('any');
  
  const [showLedgerDetails, setShowLedgerDetails] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('LEDGER_HOLD');
  const [razorpayReady, setRazorpayReady] = useState(
    () => typeof window !== 'undefined' && !!window.Razorpay,
  );
  


  useEffect(() => {
    if (!reference) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('No booking reference provided.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/b2b/orders/${reference}/`);
        setOrderData(res.data);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [reference]);

  const pricing = orderData?.pricing_snapshot;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: CheckoutPayload = {
        primary_guest_name: primaryGuest,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        special_requests: specialRequests,
        floor_preference: preferredFloor === "high",
        kitchen_dining_requested: false,
        payment_mode: paymentMode,
        vip_requests: vipDarshan ? [{
          temple_name: "Local Temple",
          darshan_date: orderData?.check_in || "",
          time_slot: "Morning",
          needs_guide: false
        }] : [],
        transport_requests: localTransport ? [{
          request_type: "BOTH",
          vehicle_preference: "Standard",
          remarks: "Local transport requested"
        }] : []
      };

      if (paymentMode === 'PREPAID') {
        if (!razorpayReady || !window.Razorpay) {
          throw new Error('Secure payment window is still loading. Please try again.');
        }
        const initiation = await api.post<OnlinePaymentOrder>(
          `/b2b/orders/${reference}/payments/initiate/`,
          payload,
        );
        const paymentOrder = initiation.data;
        const razorpay = new window.Razorpay({
          key: paymentOrder.razorpay_key_id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: paymentOrder.name,
          description: paymentOrder.description,
          order_id: paymentOrder.razorpay_order_id,
          prefill: {
            name: primaryGuest,
            email: contactEmail,
            contact: contactPhone,
          },
          handler: async (paymentResponse: RazorpayResponse) => {
            setLoading(true);
            setError('');
            try {
              const verification = await api.post(
                `/b2b/orders/${reference}/payments/verify/`,
                paymentResponse,
              );
              const isPending = verification.status === 202;
              setSuccess(
                isPending
                  ? 'Payment received and awaiting final gateway confirmation.'
                  : verification.data.requires_confirmation
                    ? `Payment successful. Request submitted for hotel allocation. Reference: ${verification.data.booking_reference}`
                    : `Payment successful. Booking confirmed. Reference: ${verification.data.booking_reference}`,
              );
              setTimeout(() => {
                router.push(`/dashboard/bookings/${reference}`);
              }, 1500);
            } catch (verifyError: unknown) {
              const typedError = verifyError as { response?: { data?: { error?: string } } };
              setError(
                typedError.response?.data?.error
                  || 'Payment was received but confirmation is still processing. Check booking status before retrying.',
              );
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setError('Payment window closed. Your room hold remains active until its expiry time.');
            },
          },
        });
        razorpay.on('payment.failed', (failure: RazorpayErrorResponse) => {
          setLoading(false);
          setError(failure.error.description || 'Online payment failed. Please try again.');
        });
        razorpay.open();
        setLoading(false);
        return;
      }

      const response = await api.post(`/b2b/reservations/${reference}/checkout/`, payload);
      
        if (response.data.status === 'success') {
          setSuccess(
            response.data.requires_confirmation
              ? `Request submitted for hotel allocation. Reference: ${response.data.booking_reference}`
              : `Booking confirmed. Reference: ${response.data.booking_reference}`,
          );
        setTimeout(() => {
          router.push(`/dashboard/bookings/${response.data.booking_reference}`);
        }, 1500);
      } else {
        setError(response.data.error || 'Checkout failed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(
        error.response?.data?.error
          || (err instanceof Error ? err.message : 'An error occurred during checkout.'),
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !orderData) {
    return <div className="p-8 text-center text-slate-500">Loading checkout details...</div>;
  }

  if (!reference) {
    return <div className="p-4 rounded-xl bg-red-50 text-red-700">No booking reference provided for checkout.</div>;
  }

  return (
    <div className="space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setRazorpayReady(true)}
        onError={() => {
          setRazorpayReady(false);
          setError('Secure online payment could not be loaded. Ledger payment remains available.');
        }}
      />
      {orderData?.expires_at && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Inventory is held until {new Date(orderData.expires_at).toLocaleString()}. Complete checkout before this deadline.
        </div>
      )}
      <h1 className="text-2xl font-bold text-slate-900 font-playfair">Complete B2B Booking</h1>
      
      {success && <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-100">{success}</div>}
      {error && <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">{error}</div>}
      {!pricing && <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">Live B2B pricing is unavailable. Return to search and select a hotel with an available rate before booking.</div>}
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <form onSubmit={handleCheckout} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Guest Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Guest Name</label>
                <input 
                  type="text" 
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none" 
                  value={primaryGuest}
                  onChange={e => setPrimaryGuest(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input 
                  type="tel" 
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none" 
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                <input 
                  type="email" 
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none" 
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 mt-8">Agent Preferences & Value Adds</h2>
            <div className="space-y-4 mb-6">
              <label className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                    checked={vipDarshan}
                    onChange={e => setVipDarshan(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="font-medium text-slate-700 block">VIP Darshan Arrangement</span>
                  <span className="text-slate-500">Request priority access for the guests at key religious sites.</span>
                </div>
              </label>

              <label className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                    checked={localTransport}
                    onChange={e => setLocalTransport(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="font-medium text-slate-700 block">Local Transport Required</span>
                  <span className="text-slate-500">Add local cab services to this package.</span>
                </div>
              </label>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Floor Mapping</label>
                <select 
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none" 
                  value={preferredFloor}
                  onChange={e => setPreferredFloor(e.target.value)}
                >
                  <option value="any">No Preference</option>
                  <option value="ground">Ground Floor (Elderly/Accessible)</option>
                  <option value="high">High Floor (Better Views)</option>
                </select>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 mt-8">Additional Requests</h2>
            <div className="mb-8">
              <textarea 
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none resize-none" 
                rows={4}
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="Dietary requirements, extra beds, etc."
              />
            </div>
            
            {pricing && (
              <>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 mt-8">Payment Method</h2>
                <div className="space-y-4 mb-8">
                  <label className={`flex items-start p-4 border rounded-xl cursor-pointer ${paymentMode === 'LEDGER_HOLD' ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="payment_mode"
                        value="LEDGER_HOLD"
                        checked={paymentMode === 'LEDGER_HOLD'}
                        onChange={() => setPaymentMode('LEDGER_HOLD')}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-slate-800 block">Ledger Hold</span>
                      <span className="text-sm text-slate-500">Hold ₹{parseFloat(pricing.b2b_selling_total).toLocaleString()} against your B2B credit limit.</span>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 border rounded-xl cursor-pointer ${paymentMode === 'PREPAID' ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        name="payment_mode"
                        value="PREPAID"
                        checked={paymentMode === 'PREPAID'}
                        onChange={() => setPaymentMode('PREPAID')}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-slate-800 block">Pay Online</span>
                      <span className="text-sm text-slate-500">
                        Pay ₹{parseFloat(pricing.b2b_selling_total).toLocaleString()} securely using Razorpay.
                      </span>
                      {!razorpayReady && (
                        <span className="text-xs text-amber-700 block mt-1">Secure payment window is loading…</span>
                      )}
                    </div>
                  </label>
                </div>
              </>
            )}

            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5" 
                disabled={
                  loading
                  || !!success
                  || !pricing
                  || (paymentMode === 'PREPAID' && !razorpayReady)
                }
              >
                {loading
                  ? 'Processing...'
                  : paymentMode === 'PREPAID'
                    ? 'Pay Securely & Confirm'
                    : 'Confirm Booking via Ledger'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-6">
            <B2BBookingSummary orderData={orderData} />
            
            {pricing ? (
              <div className="mb-6 space-y-4">
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-600 font-medium">Retail Price (B2C)</span>
                    <span className="text-slate-800 font-bold line-through">₹{parseFloat(pricing.b2c_total).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-lg mb-4">
                    <span className="text-slate-800 font-black">
                      {paymentMode === 'PREPAID' ? 'Amount Payable' : 'Amount to Debit'}
                    </span>
                    <span className="text-slate-900 font-black">
                      ₹{parseFloat(pricing.b2b_selling_total).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setShowLedgerDetails(!showLedgerDetails)}
                    className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                      Ledger Details <Info className="w-3 h-3 ml-1" />
                    </span>
                    {showLedgerDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  
                  {showLedgerDetails && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                      <div className="flex justify-between items-end text-sm">
                        <span className="text-slate-600 font-medium">B2B Net Rate</span>
                        <span className="text-slate-900 font-bold">₹{parseFloat(pricing.b2b_selling_total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-end text-sm">
                        <span className="text-green-600 font-medium">Your Commission (TAC)</span>
                        <span className="text-green-700 font-bold">₹{parseFloat(pricing.agent_tac_total).toLocaleString()}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-end bg-red-50 p-2 rounded-lg mt-4">
                        <span className="text-slate-800 font-black text-sm">
                          {paymentMode === 'PREPAID' ? 'Amount Payable' : 'Amount to Debit'}
                        </span>
                        <span className="text-red-600 font-black text-lg">₹{parseFloat(pricing.b2b_selling_total).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-pulse mb-6 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-10 bg-slate-200 rounded w-full"></div>
                <div className="h-16 bg-slate-200 rounded w-full"></div>
              </div>
            )}
            
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
              <Info className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                {paymentMode === 'PREPAID'
                  ? 'The amount is calculated by the server. Your booking is confirmed only after payment verification.'
                  : 'Payment will be automatically held against your B2B Ledger credit limit.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-500">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
