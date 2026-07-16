'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { ImageWithFallback } from './ImageWithFallback';
import { MapPin, Plus, Minus, ArrowRight, Loader2 } from 'lucide-react';

interface HotelDetails {
  id: number;
  name: string;
  description: string;
  address: string;
  images: { image_url: string }[];
  rooms: {
    id: number;
    name: string;
    description: string;
    max_adults: number;
    base_price_per_night: string;
    images: { image_url: string }[];
    b2b_pricing_matrix: { b2b_base: string; agent_tac_amount: string } | null;
  }[];
  global_rate_plans: {
    id: number;
    name: string;
    hotel_net_rate_per_room_per_night: string;
    min_rooms: number;
    max_rooms: number;
    allocation_mode: string;
  }[];
}

interface QuoteLine {
  room_type_name?: string;
  line_type?: string;
  quantity: number;
  pricing: {
    b2c_total?: string;
    final_b2b_selling_total?: string;
  };
}

interface QuoteResult {
  booking_mode: string;
  summary: {
    b2c_total: string;
    hotel_net_total: string;
    agent_tac_total: string;
    b2b_selling_total: string;
  };
  lines: QuoteLine[];
}

interface QuotePayload {
  hotel_id: number;
  check_in: string;
  check_out: string;
  booking_mode: 'ROOM_WISE' | 'GLOBAL';
  rooms?: { room_type_id: number; quantity: number; adults: number }[];
  global_rate_plan_id?: number;
  total_rooms?: number;
  total_guests?: number;
}

export default function AgentHotelDetails({ hotelId }: { hotelId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialCheckIn = searchParams.get('checkIn') || '';
  const initialCheckOut = searchParams.get('checkOut') || '';
  
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [bookingMode, setBookingMode] = useState<'ROOM_WISE' | 'GLOBAL'>('ROOM_WISE');
  
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  
  // Room-wise selection state
  const [roomSelections, setRoomSelections] = useState<Record<number, number>>({});
  
  // Global selection state
  const [selectedGlobalPlanId, setSelectedGlobalPlanId] = useState<number | null>(null);
  const [globalTotalRooms, setGlobalTotalRooms] = useState(1);
  const [globalTotalGuests, setGlobalTotalGuests] = useState(1);
  
  // Quote State
  const [quoting, setQuoting] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get(`/b2b/hotels/${hotelId}/`);
        setHotel(res.data);
      } catch {
        toast.error('Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [hotelId]);

  const handleUpdateRoomQty = (roomId: number, qty: number) => {
    setRoomSelections(prev => ({
      ...prev,
      [roomId]: Math.max(0, qty)
    }));
  };

  const getQuote = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates.');
      return;
    }

    const payload: QuotePayload = {
      hotel_id: hotelId,
      check_in: checkIn,
      check_out: checkOut,
      booking_mode: bookingMode,
    };

    if (bookingMode === 'ROOM_WISE') {
      const rooms = Object.entries(roomSelections)
        .filter(([, qty]) => qty > 0)
        .map(([roomId, qty]) => ({
          room_type_id: parseInt(roomId),
          quantity: qty,
          adults: 2 // default or we can add UI for per room adults
        }));
      
      if (rooms.length === 0) {
        toast.error('Please select at least one room.');
        return;
      }
      payload.rooms = rooms;
    } else {
      if (!selectedGlobalPlanId) {
        toast.error('Please select a global rate plan.');
        return;
      }
      payload.global_rate_plan_id = selectedGlobalPlanId;
      payload.total_rooms = globalTotalRooms;
      payload.total_guests = globalTotalGuests;
    }

    setQuoting(true);
    setQuoteResult(null);
    try {
      const res = await api.post('/b2b/quotes/', payload);
      setQuoteResult(res.data);
      toast.success('Quote generated successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to generate quote');
    } finally {
      setQuoting(false);
    }
  };

  const proceedToReservation = async () => {
    if (!checkIn || !checkOut) return;

    const payload: QuotePayload = {
      hotel_id: hotelId,
      check_in: checkIn,
      check_out: checkOut,
      booking_mode: bookingMode,
    };

    if (bookingMode === 'ROOM_WISE') {
      const rooms = Object.entries(roomSelections)
        .filter(([, qty]) => qty > 0)
        .map(([roomId, qty]) => ({
          room_type_id: parseInt(roomId),
          quantity: qty,
          adults: 2
        }));
      payload.rooms = rooms;
    } else {
      payload.global_rate_plan_id = selectedGlobalPlanId || undefined;
      payload.total_rooms = globalTotalRooms;
      payload.total_guests = globalTotalGuests;
    }

    const tid = toast.loading('Holding inventory...');
    try {
      const res = await api.post('/b2b/reservations/', payload);
      toast.success('Reservation created!', { id: tid });
      router.push(`/dashboard/checkout?reference=${res.data.booking_reference}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to reserve inventory', { id: tid });
    }
  };

  if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-orange-500" /></div>;
  if (!hotel) return <div className="p-8 text-center">Hotel not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex gap-6">
        <div className="w-1/3 h-64 relative rounded-xl overflow-hidden shrink-0">
          <ImageWithFallback src={hotel.images[0]?.image_url || '/placeholder.jpg'} alt={hotel.name} fill className="object-cover" />
        </div>
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold text-slate-900">{hotel.name}</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-2"><MapPin className="w-4 h-4"/> {hotel.address}</p>
          <p className="mt-4 text-sm text-slate-600 line-clamp-4">{hotel.description}</p>
          
          <div className="mt-auto grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Check In</label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Check Out</label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full mt-1 p-2 border rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Mode Tabs */}
      {hotel.global_rate_plans.length > 0 && (
        <div className="flex border-b border-slate-200">
          <button 
            className={`px-6 py-3 font-bold text-lg border-b-2 ${bookingMode === 'ROOM_WISE' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setBookingMode('ROOM_WISE'); setQuoteResult(null); }}
          >
            Room-Wise Booking
          </button>
          <button 
            className={`px-6 py-3 font-bold text-lg border-b-2 ${bookingMode === 'GLOBAL' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setBookingMode('GLOBAL'); setQuoteResult(null); }}
          >
            Global / Bulk Booking
          </button>
        </div>
      )}

      {/* Content based on mode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {bookingMode === 'ROOM_WISE' ? (
            <div className="space-y-4">
              {hotel.rooms.map(room => (
                <div key={room.id} className="bg-white rounded-2xl p-4 border border-slate-200 flex gap-4">
                  <div className="w-32 h-32 relative rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {room.images[0]?.image_url && <img src={room.images[0].image_url} alt={room.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{room.name}</h3>
                      <p className="text-xs text-slate-500 max-w-sm line-clamp-2">{room.description}</p>
                    </div>
                    {room.b2b_pricing_matrix ? (
                      <div className="mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">B2B Base:</span> ₹{parseFloat(room.b2b_pricing_matrix.b2b_base).toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold">+ ₹{parseFloat(room.b2b_pricing_matrix.agent_tac_amount).toLocaleString()} TAC</div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-red-500 font-semibold">Not included in contract</div>
                    )}
                  </div>
                  <div className="w-32 flex flex-col items-center justify-center border-l pl-4">
                    <label className="text-xs font-bold text-slate-500 mb-2">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleUpdateRoomQty(room.id, (roomSelections[room.id] || 0) - 1)} className="p-1 border rounded hover:bg-slate-50"><Minus className="w-4 h-4"/></button>
                      <span className="font-bold">{roomSelections[room.id] || 0}</span>
                      <button onClick={() => handleUpdateRoomQty(room.id, (roomSelections[room.id] || 0) + 1)} className="p-1 border rounded hover:bg-slate-50"><Plus className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Global Rate Plan</label>
                  <select 
                    className="w-full p-3 border rounded-xl"
                    value={selectedGlobalPlanId || ''}
                    onChange={e => setSelectedGlobalPlanId(Number(e.target.value))}
                  >
                    <option value="">-- Select a Plan --</option>
                    {hotel.global_rate_plans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name} (Min {plan.min_rooms} rooms)</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Rooms Needed</label>
                    <div className="flex items-center gap-3 border rounded-xl p-2 w-fit">
                      <button onClick={() => setGlobalTotalRooms(Math.max(1, globalTotalRooms - 1))} className="p-2 hover:bg-slate-50 rounded"><Minus className="w-4 h-4"/></button>
                      <span className="font-bold w-8 text-center">{globalTotalRooms}</span>
                      <button onClick={() => setGlobalTotalRooms(globalTotalRooms + 1)} className="p-2 hover:bg-slate-50 rounded"><Plus className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Guests</label>
                    <div className="flex items-center gap-3 border rounded-xl p-2 w-fit">
                      <button onClick={() => setGlobalTotalGuests(Math.max(1, globalTotalGuests - 1))} className="p-2 hover:bg-slate-50 rounded"><Minus className="w-4 h-4"/></button>
                      <span className="font-bold w-8 text-center">{globalTotalGuests}</span>
                      <button onClick={() => setGlobalTotalGuests(globalTotalGuests + 1)} className="p-2 hover:bg-slate-50 rounded"><Plus className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Quote */}
        <div className="lg:col-span-1 relative">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Quotation</h3>
              <button 
                onClick={getQuote}
                disabled={quoting}
                className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100 disabled:opacity-50"
              >
                {quoting ? 'Calculating...' : 'Update Quote'}
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {quoteResult ? (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2 border-b pb-4">
                    {quoteResult.lines.map((line, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-600">{line.quantity}x {line.room_type_name || 'Global Allocation'}</span>
                        <span className="font-semibold">₹{parseFloat(line.pricing.b2c_total || line.pricing.final_b2b_selling_total || '0').toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2 pb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Public Selling Total (B2C)</span>
                      <span>₹{parseFloat(quoteResult.summary.b2c_total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Net B2B Price</span>
                      <span>₹{parseFloat(quoteResult.summary.hotel_net_total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-2 rounded">
                      <span>Your TAC (Commission)</span>
                      <span>+ ₹{parseFloat(quoteResult.summary.agent_tac_total).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-dashed mt-auto">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-lg">Amount Payable</span>
                      <span className="text-2xl font-black text-slate-900">₹{parseFloat(quoteResult.summary.b2b_selling_total).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={proceedToReservation}
                    className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/30"
                  >
                    Confirm & Reserve <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <p>Select rooms or a global plan, dates, and click &quot;Update Quote&quot; to see pricing breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
