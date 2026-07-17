'use client';

import { useState, useEffect, useMemo, useDeferredValue, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
// import Image from 'next/image'; // Removed as no longer used
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { Search, Star, MapPin, Calendar, Users, Filter, Plus, Minus, Wifi, Coffee, Car } from 'lucide-react';
import { HotelCard, HotelResult } from '../../../components/HotelCard';

interface City {
  id: number;
  name: string;
}

const AMENITIES = [
  { id: 'wifi', icon: Wifi, label: 'WiFi' },
  { id: 'pool', icon: Coffee, label: 'Breakfast' },
  { id: 'parking', icon: Car, label: 'Parking' }
];

const MAX_SLIDER_PRICE = 500000;

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // URL synced state
  const initialCity = searchParams.get('city') || '';
  const initialAdults = parseInt(searchParams.get('adults') || '2', 10);
  const initialStars = searchParams.get('stars')?.split(',').map(Number).filter(Boolean) || [];
  const initialMaxPrice = parseInt(searchParams.get('maxPrice') || String(MAX_SLIDER_PRICE), 10);
  const initialAmenities = searchParams.get('amenities')?.split(',').filter(Boolean) || [];

  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityName, setSelectedCityName] = useState(initialCity);
  
  const [today] = useState(() => new Date().toISOString().split('T')[0]);
  const [tomorrow] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || today);
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || tomorrow);
  const [adults, setAdults] = useState(initialAdults);
  
  // Filters
  const [selectedStars, setSelectedStars] = useState<number[]>(initialStars);
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);
  const deferredMaxPrice = useDeferredValue(maxPrice);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);
  
  // Data state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [hasSearched, setHasSearched] = useState(!!initialCity);

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCityName) params.set('city', selectedCityName);
    params.set('check_in', checkIn);
    params.set('check_out', checkOut);
    params.set('adults', adults.toString());
    
    if (selectedStars.length) params.set('stars', selectedStars.join(','));
    else params.delete('stars');
    
    if (maxPrice < MAX_SLIDER_PRICE) params.set('maxPrice', maxPrice.toString());
    else params.delete('maxPrice');
    
    if (selectedAmenities.length) params.set('amenities', selectedAmenities.join(','));
    else params.delete('amenities');

    const newQueryString = params.toString();
    if (searchParams.toString() !== newQueryString) {
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
    }
  }, [searchParams, selectedCityName, checkIn, checkOut, adults, selectedStars, maxPrice, selectedAmenities, router, pathname]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Initial Data Fetch for Cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get('/cities/', { params: { has_b2b_properties: true } });
        const cityData = response.data.results || response.data || [];
        setCities(Array.isArray(cityData) ? cityData : []);
      } catch {
        toast.error('Failed to load cities. Please refresh.');
      }
    };
    fetchCities();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedCityName) {
      toast.error('Please select a destination.');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await api.get('/b2b/search/', {
        params: {
          q: selectedCityName,
          check_in: checkIn || undefined,
          check_out: checkOut || undefined,
          adults: adults
        }
      });
      const hits = response.data.results?.hotels || response.data.results || response.data || [];
      setResults(Array.isArray(hits) ? hits : []);
      
      if (hits.length === 0) {
        toast('No properties found for this location.', { icon: '🔍' });
      } else {
        toast.success(`Found ${hits.length} properties!`);
      }
    } catch {
      toast.error('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCityName, checkIn, checkOut, adults]);

  // Fetch results if initialCity exists (deep link support)
  useEffect(() => {
    if (initialCity && !loading && results.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived filtered results using deferred value for smooth UI
  const filteredResults = useMemo(() => {
    return results.filter(hotel => {
      if (selectedStars.length > 0 && !selectedStars.includes(hotel.star_rating)) return false;
      
      if (hotel.b2b_pricing && deferredMaxPrice < MAX_SLIDER_PRICE) {
        const netRate = parseFloat(hotel.b2b_pricing.net_rate);
        if (netRate > deferredMaxPrice) return false;
      }
      
      if (selectedAmenities.length > 0) {
        const desc = hotel.description?.toLowerCase() || '';
        const matchesAll = selectedAmenities.every(a => desc.includes(a.toLowerCase()));
        if (!matchesAll) return false;
      }

      return true;
    });
  }, [results, selectedStars, deferredMaxPrice, selectedAmenities]);

  const handleStarToggle = (star: number) => {
    setSelectedStars(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const proceedToCheckout = async (hotel: HotelResult) => {
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }

    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
    });
    router.push(`/dashboard/hotel/${hotel.id}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] bg-transparent">
      {/* GLOBAL SEARCH HEADER - FLOATING PILL DESIGN */}
      <div className="w-full relative z-20 pb-6 mb-2 mt-6 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-3 bg-white/95 backdrop-blur-xl p-3 rounded-[2rem] border border-white/40 shadow-[0_20px_40px_rgb(0,0,0,0.2)]">
            {/* Destination */}
            <div className="flex-1 flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-[1.25rem] px-5 py-3 border border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100/50">
              <MapPin className="w-6 h-6 text-orange-500 mr-3 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Where to?</label>
                <select 
                  className="w-full bg-transparent border-none p-0 text-base font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer appearance-none truncate"
                  value={selectedCityName}
                  onChange={(e) => setSelectedCityName(e.target.value)}
                >
                  <option value="" disabled>Select Destination</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wise Date Picker */}
            <div className="flex-[1.5] flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-[1.25rem] px-5 py-3 border border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100/50 relative group">
              <Calendar className="w-6 h-6 text-orange-500 mr-3 shrink-0" />
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Check In</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      min={today}
                      className="w-full bg-transparent border-none p-0 text-base font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                      value={checkIn}
                      onChange={(e) => {
                        const newCheckIn = e.target.value;
                        setCheckIn(newCheckIn);
                        if (checkOut && new Date(checkOut) <= new Date(newCheckIn)) {
                          const nextDay = new Date(new Date(newCheckIn).getTime() + 86400000).toISOString().split('T')[0];
                          setCheckOut(nextDay);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-300 rounded-full"></div>
                <div className="flex-1 relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Check Out</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      min={checkIn}
                      className="w-full bg-transparent border-none p-0 text-base font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="w-full lg:w-48 flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-[1.25rem] px-5 py-3 border border-transparent">
              <Users className="w-6 h-6 text-orange-500 mr-3 shrink-0" />
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Guests</label>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-base w-6 text-center text-slate-900">{adults}</span>
                  <button 
                    onClick={() => setAdults(adults + 1)}
                    className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="lg:w-36 bg-slate-900 hover:bg-black text-white rounded-[1.25rem] font-bold text-lg flex items-center justify-center py-4 shadow-xl shadow-slate-900/20 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 md:px-8 max-w-7xl mx-auto w-full pb-12">
        {/* HORIZONTAL FILTER BAR */}
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap items-center gap-6 sticky top-[90px] z-40 transition-all"
          >
            <div className="flex items-center text-slate-800 font-bold mr-2">
              <Filter className="w-5 h-5 mr-2 text-orange-500" />
              Filters
            </div>

            {/* Star Rating Pills */}
            <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
              <span className="text-xs font-bold text-slate-400 uppercase mr-1">Category</span>
              {[5, 4, 3].map(star => (
                <button
                  key={star}
                  onClick={() => handleStarToggle(star)}
                  className={`flex items-center px-3 py-1.5 rounded-full border text-sm font-bold transition-all ${
                    selectedStars.includes(star) 
                      ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  {star} <Star className={`w-3.5 h-3.5 ml-1 ${selectedStars.includes(star) ? 'fill-orange-500 text-orange-500' : 'text-slate-400'}`} />
                </button>
              ))}
            </div>

            {/* Price Slider */}
            <div className="flex items-center gap-3 border-r border-slate-200 pr-6 min-w-[200px]">
              <span className="text-xs font-bold text-slate-400 uppercase">Max Rate</span>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400">₹1k</span>
                  <span className="text-xs font-black text-orange-600">{maxPrice >= MAX_SLIDER_PRICE ? 'Any' : `₹${maxPrice.toLocaleString()}`}</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max={MAX_SLIDER_PRICE} 
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>

            {/* Amenities Pills */}
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase mr-1">Amenities</span>
               {AMENITIES.map(amenity => {
                 const isSelected = selectedAmenities.includes(amenity.id);
                 const Icon = amenity.icon;
                 return (
                   <button
                      key={amenity.id}
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={`flex items-center px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mr-1.5" />
                      {amenity.label}
                    </button>
                 );
               })}
            </div>
            
            {/* Clear Filters */}
            {(selectedStars.length > 0 || maxPrice < MAX_SLIDER_PRICE || selectedAmenities.length > 0) && (
              <button 
                onClick={() => { setSelectedStars([]); setMaxPrice(MAX_SLIDER_PRICE); setSelectedAmenities([]); }}
                className="ml-auto text-xs font-bold text-slate-400 hover:text-red-500 underline underline-offset-2 transition-colors"
              >
                Clear All
              </button>
            )}
          </motion.div>
        )}

        {/* RESULTS */}
        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <div key={skeleton} className="bg-white/50 rounded-3xl border border-slate-100 shadow-sm h-[460px] animate-pulse overflow-hidden flex flex-col">
                  <div className="h-60 bg-slate-200/50 w-full relative"></div>
                  <div className="p-6 space-y-4 flex flex-col flex-1">
                    <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
                    <div className="mt-auto h-24 bg-slate-50 rounded-2xl w-full"></div>
                    <div className="h-14 bg-slate-200 rounded-2xl w-full mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredResults.map((hotel) => (
                  <HotelCard 
                    key={hotel.id} 
                    hotel={hotel} 
                    onBook={proceedToCheckout} 
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {hasSearched && !loading && filteredResults.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200 border-dashed"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-slate-900 mb-2">No properties found</h3>
              <p className="text-slate-500 max-w-md mx-auto">We couldn&apos;t find any properties matching your current filters. Try adjusting your dates, budget, or removing some amenities.</p>
              <button 
                onClick={() => { setSelectedStars([]); setMaxPrice(MAX_SLIDER_PRICE); setSelectedAmenities([]); }}
                className="mt-8 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition-colors shadow-sm"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
