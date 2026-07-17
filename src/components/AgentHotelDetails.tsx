'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { ImageWithFallback } from './ImageWithFallback';
import { MapPin, ArrowRight, Loader2 } from 'lucide-react';
import RoomWiseBookingWidget from './b2b/RoomWiseBookingWidget';
import GlobalBookingWidget from './b2b/GlobalBookingWidget';
import B2BPriceBreakdown from './b2b/B2BPriceBreakdown';

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
    available_rooms: number;
    images: { image_url: string }[];
    b2b_pricing_matrix: {
      id: string;
      room_type: string;
      meal_plan: string;
      is_sub_row: boolean;
      b2c_price: number;
      agent_tac: number;
      final_b2b_selling: number;
    }[];
  }[];
  global_rate_plans: {
    id: number;
    name: string;
    rate_per_room_per_night: string;
    min_rooms: number;
    max_rooms: number | null;
    allocation_mode: string;
    terms_and_conditions?: string;
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
  quote_id: string;
  booking_mode: string;
  summary: {
    b2c_total: string;
    agent_tac_total: string;
    b2b_selling_total: string;
  };
  lines: QuoteLine[];
  allocation_mode?: string;
  requires_confirmation?: boolean;
  warnings?: string[];
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
  
  const initialCheckIn = searchParams.get('check_in') || searchParams.get('checkIn') || '';
  const initialCheckOut = searchParams.get('check_out') || searchParams.get('checkOut') || '';
  const requestedAdults = Number(searchParams.get('adults') || 1);
  const initialAdults = Number.isFinite(requestedAdults) ? Math.max(1, requestedAdults) : 1;
  
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [bookingMode, setBookingMode] = useState<'ROOM_WISE' | 'GLOBAL'>('ROOM_WISE');
  
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [roomWiseAdults, setRoomWiseAdults] = useState(initialAdults);
  
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
    const controller = new AbortController();
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/b2b/hotels/${hotelId}/`, {
          params: { check_in: checkIn || undefined, check_out: checkOut || undefined, adults: roomWiseAdults },
          signal: controller.signal,
        });
        setHotel(res.data);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        const responseError = error as { response?: { data?: { error?: string } } };
        toast.error(responseError.response?.data?.error || 'Failed to load hotel details', { id: 'hotel-detail-error' });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchHotel();
    return () => controller.abort();
  }, [hotelId, checkIn, checkOut, roomWiseAdults]);

  const handleUpdateRoomQty = (roomId: number, qty: number) => {
    setQuoteResult(null);
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
          adults: roomWiseAdults
        }));
      
      if (rooms.length === 0) {
        toast.error('Please select at least one room.');
        return;
      }
      payload.rooms = rooms;
      payload.total_guests = roomWiseAdults;
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
    if (!quoteResult?.quote_id) {
      toast.error('Please update the quote before reserving.');
      return;
    }

    const tid = toast.loading('Holding inventory...');
    try {
      const res = await api.post('/b2b/reservations/', { quote_id: quoteResult.quote_id });
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
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Total adults</label>
              <input type="number" min={1} value={roomWiseAdults} onChange={e => { const value = Number(e.target.value); setRoomWiseAdults(Number.isFinite(value) ? Math.max(1, value) : 1); setQuoteResult(null); }} className="w-full mt-1 p-2 border rounded-lg" />
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
              <RoomWiseBookingWidget 
                rooms={hotel.rooms}
                roomSelections={roomSelections}
                onUpdateQuantity={handleUpdateRoomQty}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <GlobalBookingWidget
                plans={hotel.global_rate_plans}
                selectedPlanId={selectedGlobalPlanId}
                onSelectPlan={setSelectedGlobalPlanId}
                totalRooms={globalTotalRooms}
                onUpdateTotalRooms={setGlobalTotalRooms}
                totalGuests={globalTotalGuests}
                onUpdateTotalGuests={setGlobalTotalGuests}
              />
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
                    <B2BPriceBreakdown quoteResult={quoteResult} />
                    {quoteResult.requires_confirmation && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                        <p className="font-bold">Pending hotel allocation after checkout</p>
                        {(quoteResult.warnings || []).map((warning) => <p key={warning} className="mt-1">{warning}</p>)}
                      </div>
                    )}
                  
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
