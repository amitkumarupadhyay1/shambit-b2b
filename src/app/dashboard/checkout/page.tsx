'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { Info } from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelId = searchParams.get('hotel_id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [primaryGuest, setPrimaryGuest] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [vipDarshan, setVipDarshan] = useState(false);
  const [localTransport, setLocalTransport] = useState(false);
  const [preferredFloor, setPreferredFloor] = useState('any');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        hotel_id: parseInt(hotelId as string),
        check_in: searchParams.get('check_in'),
        check_out: searchParams.get('check_out'),
        adults: parseInt(searchParams.get('adults') as string) || 2,
        room_id: parseInt(searchParams.get('room_id') as string) || 1, // Assumes room_id is passed, falls back to 1
        num_rooms: 1,
        primary_guest_name: primaryGuest,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        special_requests: specialRequests,
        floor_preference: preferredFloor === "high",
        kitchen_dining_requested: false,
        vip_requests: vipDarshan ? [{
          temple_name: "Local Temple",
          darshan_date: searchParams.get('check_in'),
          time_slot: "Morning",
          needs_guide: false
        }] : [],
        transport_requests: localTransport ? [{
          request_type: "BOTH",
          vehicle_preference: "Standard",
          remarks: "Local transport requested"
        }] : []
      };

      const response = await api.post('/b2b/checkout/', payload);
      
      if (response.data.status === 'success') {
        setSuccess(`Booking confirmed! Ledger has been debited. Booking ID: ${response.data.booking_id}`);
        setTimeout(() => {
          router.push('/dashboard/bookings');
        }, 3000);
      } else {
        setError(response.data.message || 'Checkout failed');
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'An error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  if (!hotelId) {
    return <div className="p-4 rounded-xl bg-red-50 text-red-700">No hotel selected for checkout.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 font-playfair">Complete B2B Booking</h1>
      
      {success && <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-100">{success}</div>}
      {error && <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">{error}</div>}
      
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

            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5" 
                disabled={loading || !!success}
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
                <span className="text-slate-500">Check In</span>
                <strong className="text-slate-800">{searchParams.get('check_in')}</strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Check Out</span>
                <strong className="text-slate-800">{searchParams.get('check_out')}</strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Guests</span>
                <strong className="text-slate-800">{searchParams.get('adults')} Adults</strong>
              </div>
            </div>
            
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
