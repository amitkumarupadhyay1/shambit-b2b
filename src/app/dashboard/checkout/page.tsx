'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';


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
  hotel_name: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  total_rooms: number;
  booking_mode: string;
  lines: OrderLine[];
  pricing_snapshot: {
    b2c_total: string;
    hotel_net_total: string;
    agent_tac_total: string;
    net_rate: string;
  };
}

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
  const [paymentMode, setPaymentMode] = useState('LEDGER_HOLD');
  const [customAmount, setCustomAmount] = useState<string>('');
  


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

    let amountToPay = 0;
    if (paymentMode === 'PARTIAL_PAYMENT' && pricing) {
      amountToPay = Number(customAmount);
      const minRequired = Number(pricing.hotel_net_total) * 0.25;
      if (amountToPay < minRequired) {
        setError(`Minimum payment required is 25% (₹${minRequired.toFixed(2)})`);
        setLoading(false);
        return;
      }
      if (amountToPay > Number(pricing.hotel_net_total)) {
        setError(`Payment cannot exceed total amount (₹${pricing.hotel_net_total})`);
        setLoading(false);
        return;
      }
    } else if (paymentMode === 'FULL_PAYMENT' && pricing) {
      amountToPay = Number(pricing.hotel_net_total);
    }
    
    try {
      const payload: CheckoutPayload = {
        primary_guest_name: primaryGuest,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        special_requests: specialRequests,
        floor_preference: preferredFloor === "high",
        kitchen_dining_requested: false,
        payment_mode: paymentMode === 'LEDGER_HOLD' ? 'LEDGER_HOLD' : 'PARTIAL_PAYMENT',
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

      const response = await api.post(`/b2b/reservations/${reference}/checkout/`, payload);
      
      if (response.data.status === 'success') {
        if (paymentMode === 'LEDGER_HOLD') {
          setSuccess(`Booking confirmed. Reference: ${response.data.booking_reference}`);
          setTimeout(() => {
            router.push('/dashboard/bookings');
          }, 3000);
        } else {
           setError('Online payment flow is not fully implemented in the new phase yet. Please use Ledger Hold.');
           setLoading(false);
           // Fallback to Razorpay if it was integrated properly with parent order.
        }
      } else {
        setError(response.data.error || 'Checkout failed');
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'An error occurred during checkout.');
    } finally {
      if (paymentMode === 'LEDGER_HOLD') {
        setLoading(false);
      }
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
                  <label className="flex items-start p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors bg-white">
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="payment_mode"
                        value="LEDGER_HOLD"
                        checked={paymentMode === 'LEDGER_HOLD'}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-slate-800 block">Ledger Hold</span>
                      <span className="text-sm text-slate-500">Deduct ₹{parseFloat(pricing.hotel_net_total).toLocaleString()} from your B2B credit limit.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors bg-white">
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="payment_mode"
                        value="FULL_PAYMENT"
                        checked={paymentMode === 'FULL_PAYMENT'}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-slate-800 block">Online Payment (Full)</span>
                      <span className="text-sm text-slate-500">Pay the full amount (₹{parseFloat(pricing.hotel_net_total).toLocaleString()}) securely via Razorpay.</span>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors bg-white">
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="payment_mode"
                        value="PARTIAL_PAYMENT"
                        checked={paymentMode === 'PARTIAL_PAYMENT'}
                        onChange={(e) => {
                          setPaymentMode(e.target.value);
                          setCustomAmount((Number(pricing.net_rate) * 0.25).toFixed(2));
                        }}
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 w-full">
                      <span className="font-medium text-slate-800 block">Online Payment (Partial)</span>
                      <span className="text-sm text-slate-500 block mb-3">Pay a minimum 25% (₹{(Number(pricing.hotel_net_total) * 0.25).toFixed(2)}) now to confirm, balance later.</span>
                      {paymentMode === 'PARTIAL_PAYMENT' && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium text-slate-600">₹</span>
                          <input 
                            type="number"
                            min={Number(pricing.hotel_net_total) * 0.25}
                            max={Number(pricing.hotel_net_total)}
                            step="0.01"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="block w-full max-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          />
                        </div>
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
                disabled={loading || !!success || !pricing}
              >
                {loading ? 'Processing...' : 'Confirm Booking via Ledger'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-4 text-lg border-b border-slate-100 pb-2">Booking Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Hotel</span>
                <strong className="text-slate-800">{orderData?.hotel_name}</strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Check In</span>
                <strong className="text-slate-800">{orderData?.check_in}</strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Check Out</span>
                <strong className="text-slate-800">{orderData?.check_out}</strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Guests & Rooms</span>
                <strong className="text-slate-800">{orderData?.total_guests} Guests, {orderData?.total_rooms} Rooms</strong>
              </div>
              
              {orderData?.lines.map((line) => (
                <div key={line.id} className="flex justify-between items-center text-xs text-slate-600 pl-2 border-l-2 border-slate-200">
                  <span>{line.quantity}x {line.room_type_name || (line.line_type === 'GLOBAL' ? 'Global Plan' : 'Allocation')}</span>
                  <span>₹{parseFloat(line.total_amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            {pricing ? (
              <div className="mb-6 space-y-4">
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-600 font-medium">Retail Price (B2C)</span>
                    <span className="text-slate-800 font-bold line-through">₹{parseFloat(pricing.b2c_total).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-lg mb-4">
                    <span className="text-slate-800 font-black">Amount to Debit</span>
                    <span className="text-slate-900 font-black">
                      ₹{parseFloat(pricing.hotel_net_total).toLocaleString()}
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
                        <span className="text-slate-900 font-bold">₹{parseFloat(pricing.hotel_net_total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-end text-sm">
                        <span className="text-green-600 font-medium">Your Commission (TAC)</span>
                        <span className="text-green-700 font-bold">₹{parseFloat(pricing.agent_tac_total).toLocaleString()}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-end bg-red-50 p-2 rounded-lg mt-4">
                        <span className="text-slate-800 font-black text-sm">Amount to Debit</span>
                        <span className="text-red-600 font-black text-lg">₹{parseFloat(pricing.hotel_net_total).toLocaleString()}</span>
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
                Payment will be automatically held against your B2B Ledger credit limit.
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
