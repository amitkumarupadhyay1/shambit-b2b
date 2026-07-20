'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { ImageWithFallback } from './ImageWithFallback';
import { MapPin, ArrowRight, Loader2, CalendarDays, Users, LayoutGrid, Globe, ClipboardList } from 'lucide-react';
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
    max_children: number;
    base_occupancy: number;
    max_occupancy: number;
    max_extra_beds: number;
    max_extra_mattresses: number;
    base_price_per_night: string;
    available_rooms: number;
    images: { image_url: string }[];
    extra_guest_rule: {
      extra_adult_fee: string;
      extra_child_fee: string;
      extra_bed_fee: string;
      extra_mattress_fee: string;
      child_age_min: number;
      child_age_max: number;
      charge_type: string;
    } | null;
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
    confirmation_sla_minutes: number;
    terms_and_conditions?: string;
  }[];
  pricing_mode: 'ROOM_WISE' | 'GLOBAL' | 'BOTH' | null;
  contract_version: number | null;
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
  expiry_time: string;
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
  rooms?: { room_type_id: number; quantity: number; occupancy: RoomOccupancy[] }[];
  global_rate_plan_id?: number;
  total_rooms?: number;
  total_guests?: number;
}

export interface RoomOccupancy {
  adults: number;
  children: number;
  child_ages: number[];
  extra_beds: number;
  extra_mattresses: number;
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
  const [roomOccupancies, setRoomOccupancies] = useState<Record<number, RoomOccupancy[]>>({});
  
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
        const settledHotel = res.data as HotelDetails;
        setHotel(settledHotel);
        const hasRoomWise = settledHotel.pricing_mode === 'ROOM_WISE' || settledHotel.pricing_mode === 'BOTH';
        const hasConfiguredRoom = settledHotel.rooms.some(room => room.b2b_pricing_matrix.length > 0);
        setBookingMode(hasRoomWise && hasConfiguredRoom ? 'ROOM_WISE' : 'GLOBAL');
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
    const normalizedQty = Math.max(0, qty);
    const room = hotel?.rooms.find(candidate => candidate.id === roomId);
    setRoomSelections(prev => ({
      ...prev,
      [roomId]: normalizedQty
    }));
    setRoomOccupancies(prev => {
      const existing = prev[roomId] || [];
      const defaultOccupancy: RoomOccupancy = {
        adults: Math.min(2, Math.max(1, room?.max_adults || 1)),
        children: 0,
        child_ages: [],
        extra_beds: 0,
        extra_mattresses: 0,
      };
      return {
        ...prev,
        [roomId]: Array.from({ length: normalizedQty }, (_, index) => existing[index] || defaultOccupancy),
      };
    });
  };

  const handleUpdateRoomOccupancy = (roomId: number, index: number, occupancy: RoomOccupancy) => {
    setQuoteResult(null);
    setRoomOccupancies(prev => {
      const next = [...(prev[roomId] || [])];
      next[index] = occupancy;
      return { ...prev, [roomId]: next };
    });
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
          occupancy: roomOccupancies[Number(roomId)] || [],
        }));
      
      if (rooms.length === 0) {
        toast.error('Please select at least one room.');
        return;
      }
      payload.rooms = rooms;
      payload.total_guests = rooms.reduce(
        (total, room) => total + room.occupancy.reduce((roomTotal, item) => roomTotal + item.adults + item.children, 0),
        0
      );
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

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-orange-500" /></div>;
  if (!hotel) return <div className="min-h-[400px] flex items-center justify-center text-slate-500 text-lg">Hotel not found</div>;

  const configuredRooms = hotel.rooms.filter(room => room.b2b_pricing_matrix.length > 0);
  const roomWiseAvailable = (hotel.pricing_mode === 'ROOM_WISE' || hotel.pricing_mode === 'BOTH') && configuredRooms.length > 0;
  const globalAvailable = (hotel.pricing_mode === 'GLOBAL' || hotel.pricing_mode === 'BOTH') && hotel.global_rate_plans.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── Hero Card ── */}
      <div className="relative bg-gradient-to-br from-white via-white to-orange-50/40 rounded-[2rem] p-1.5 shadow-lg shadow-orange-500/5 border border-orange-100/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.75rem] p-6 flex flex-col md:flex-row gap-6">
          {/* Hotel Image */}
          <div className="w-full md:w-[320px] h-64 relative rounded-2xl overflow-hidden shrink-0 group">
            <ImageWithFallback src={hotel.images[0]?.image_url || '/placeholder.jpg'} alt={hotel.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Hotel Info */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-playfair tracking-tight">{hotel.name}</h1>
                <p className="text-slate-500 flex items-center gap-2 mt-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" /> 
                  <span className="truncate">{hotel.address}</span>
                </p>
              </div>
              {hotel.pricing_mode && (
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm">
                  {hotel.pricing_mode === 'BOTH' ? 'Flex' : hotel.pricing_mode === 'GLOBAL' ? 'Global' : 'Room-Wise'}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3">{hotel.description}</p>

            {/* ── Booking Inputs ── */}
            <div className="mt-auto pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Check In */}
              <div className="relative">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-orange-400" /> Check In
                </label>
                <input 
                  type="date" 
                  value={checkIn} 
                  onChange={e => setCheckIn(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 transition-all duration-200 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400" 
                />
              </div>
              {/* Check Out */}
              <div className="relative">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-orange-400" /> Check Out
                </label>
                <input 
                  type="date" 
                  value={checkOut} 
                  onChange={e => setCheckOut(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 transition-all duration-200 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400" 
                />
              </div>
              {/* Total Adults */}
              <div className="relative">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-400" /> Total Adults
                </label>
                <input 
                  type="number" 
                  min={1} 
                  value={roomWiseAdults} 
                  onChange={e => { const value = Number(e.target.value); setRoomWiseAdults(Number.isFinite(value) ? Math.max(1, value) : 1); setQuoteResult(null); }} 
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 transition-all duration-200 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Mode Tabs (Pill Style) ── */}
      {(roomWiseAvailable || globalAvailable) && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit backdrop-blur-sm">
          {roomWiseAvailable && (
          <button 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              bookingMode === 'ROOM_WISE' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            onClick={() => { setBookingMode('ROOM_WISE'); setQuoteResult(null); }}
          >
            <LayoutGrid className="w-4 h-4" />
            Room-Wise
          </button>
          )}
          {globalAvailable && (
          <button 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              bookingMode === 'GLOBAL' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            onClick={() => { setBookingMode('GLOBAL'); setQuoteResult(null); }}
          >
            <Globe className="w-4 h-4" />
            Global / Bulk
          </button>
          )}
        </div>
      )}

      {/* ── Content + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {bookingMode === 'ROOM_WISE' ? (
            <div className="space-y-4">
              <RoomWiseBookingWidget 
                rooms={configuredRooms}
                roomSelections={roomSelections}
                roomOccupancies={roomOccupancies}
                onUpdateQuantity={handleUpdateRoomQty}
                onUpdateOccupancy={handleUpdateRoomOccupancy}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <GlobalBookingWidget
                plans={hotel.global_rate_plans}
                selectedPlanId={selectedGlobalPlanId}
                onSelectPlan={(planId) => {
                  setSelectedGlobalPlanId(planId);
                  setQuoteResult(null);
                  const selectedPlan = hotel.global_rate_plans.find(plan => plan.id === planId);
                  if (selectedPlan) {
                    setGlobalTotalRooms(selectedPlan.min_rooms);
                    setGlobalTotalGuests(current => Math.max(current, selectedPlan.min_rooms));
                  }
                }}
                totalRooms={globalTotalRooms}
                onUpdateTotalRooms={setGlobalTotalRooms}
                totalGuests={globalTotalGuests}
                onUpdateTotalGuests={setGlobalTotalGuests}
              />
            </div>
          )}
        </div>

        {/* ── Sidebar Quotation ── */}
        <div className="lg:col-span-1 relative">
          <div className="sticky top-24 rounded-2xl overflow-hidden flex flex-col bg-gradient-to-br from-orange-400/20 via-amber-300/10 to-slate-200/30 p-[1px] shadow-xl shadow-slate-900/5">
            <div className="bg-white rounded-[15px] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10">
                    <ClipboardList className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-lg tracking-tight">Quotation</h3>
                </div>
                <button 
                  onClick={getQuote}
                  disabled={quoting}
                  className="text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded-full hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                >
                  {quoting ? 'Calculating...' : 'Update Quote'}
                </button>
              </div>
              
              {/* Body */}
              <div className="p-5 flex-1 flex flex-col">
                {quoteResult ? (
                  <div className="space-y-4 text-sm">
                      <B2BPriceBreakdown quoteResult={quoteResult} />
                      <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800">
                        Quote valid until {new Date(quoteResult.expiry_time).toLocaleString()}.
                      </p>
                      {quoteResult.requires_confirmation && (
                        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-3.5 text-sm text-purple-800">
                          <p className="font-bold">Pending hotel allocation after checkout</p>
                          {(quoteResult.warnings || []).map((warning) => <p key={warning} className="mt-1">{warning}</p>)}
                        </div>
                      )}
                    
                    <button 
                      onClick={proceedToReservation}
                      className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                    >
                      Confirm & Reserve <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center mb-4">
                      <ClipboardList className="w-7 h-7 text-orange-400" />
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[220px]">Select rooms or a global plan, set dates, and click <span className="font-semibold text-slate-700">&quot;Update Quote&quot;</span> to see pricing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
