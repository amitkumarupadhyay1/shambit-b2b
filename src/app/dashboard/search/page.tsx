'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '../../../lib/api';
import { Search, Star, Share, MapPin, Calendar, Users, Filter, Plus, Minus, ImageIcon, Wifi, Coffee, Car, Eye, EyeOff } from 'lucide-react';

interface City {
  id: number;
  name: string;
}

interface HotelResult {
  id: number;
  name: string;
  address: string;
  description: string;
  star_rating: number;
  image_url_first?: string; 
  images?: string[];
  rooms?: Array<{ id: number; [key: string]: unknown }>;
  b2b_pricing?: {
    base_price: string;
    net_rate: string;
    tac_amount: string;
  };
}

export default function SearchPage() {
  const router = useRouter();
  
  // Search parameters
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityName, setSelectedCityName] = useState('');
  const [customerView, setCustomerView] = useState(false);
  
  // "Wise" Date Picker Logic
  const [today] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [adults, setAdults] = useState(2);
  
  // Filters
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // Data state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Initial Data Fetch for Cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get('/cities/', {
          params: { has_b2b_properties: true }
        });
        const cityData = response.data.results || response.data || [];
        setCities(Array.isArray(cityData) ? cityData : []);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      }
    };
    fetchCities();
  }, []);



  // Manual Trigger Search
  const handleSearch = async () => {
    if (!selectedCityName) {
      setError('Please select a destination.');
      return;
    }
    
    setLoading(true);
    setError('');
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
    } catch {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Derived filtered results
  const filteredResults = useMemo(() => {
    return results.filter(hotel => {
      // Star rating filter
      if (selectedStars.length > 0 && !selectedStars.includes(hotel.star_rating)) {
        return false;
      }
      
      // Price filter (B2B net rate)
      if (hotel.b2b_pricing && maxPrice < 50000) {
        const netRate = parseFloat(hotel.b2b_pricing.net_rate);
        if (netRate > maxPrice) return false;
      }
      
      // Amenities filter (Mock logic, assuming description or mock data for now)
      if (selectedAmenities.length > 0) {
        const desc = hotel.description?.toLowerCase() || '';
        const matchesAll = selectedAmenities.every(a => desc.includes(a.toLowerCase()));
        if (!matchesAll && hotel.description) return false; 
      }

      return true;
    });
  }, [results, selectedStars, maxPrice, selectedAmenities]);

  const handleStarToggle = (star: number) => {
    setSelectedStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };



  const proceedToCheckout = (hotel: HotelResult) => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates before booking.");
      return;
    }
    const roomId = hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms[0].id : 1;
    router.push(`/dashboard/checkout?hotel_id=${hotel.id}&room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`);
  };

  const handleShareLink = (hotel: HotelResult) => {
    // Include the hotel ID in the slug so the dynamic route can parse it correctly.
    const slug = `${hotel.id}-${hotel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;
    const url = `${window.location.origin}/stay/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Premium public gallery link copied to clipboard!');
  };

  // Generate SEO JSON-LD for Search Results (List of Hotels)
  const jsonLd = useMemo(() => {
    if (filteredResults.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": filteredResults.map((hotel, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Hotel",
          "name": hotel.name,
          "address": hotel.address,
          "starRating": {
            "@type": "Rating",
            "ratingValue": hotel.star_rating
          }
        }
      }))
    };
  }, [filteredResults]);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      <div className="flex flex-col min-h-[calc(100vh-6rem)] bg-transparent">
        {/* GLOBAL SEARCH HEADER - FLOATING PILL DESIGN */}
        <div className="w-full relative z-20 pb-6 mb-2 mt-6 overflow-visible">
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="flex justify-end items-center mb-4">
              <button 
                onClick={() => setCustomerView(!customerView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border transition-all ${
                  customerView 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Customer View hides Net Rates and Commissions"
              >
                {customerView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {customerView ? 'Customer View: ON' : 'Customer View: OFF'}
                </span>
              </button>
            </div>
            
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
            <div className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap items-center gap-6 sticky top-[90px] z-40 transition-all">
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

              {/* Price Slider Dropdown Alternative / Inline */}
              <div className="flex items-center gap-3 border-r border-slate-200 pr-6 min-w-[200px]">
                <span className="text-xs font-bold text-slate-400 uppercase">Max Rate</span>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400">₹1k</span>
                    <span className="text-xs font-black text-orange-600">{maxPrice >= 50000 ? 'Any' : `₹${maxPrice.toLocaleString()}`}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="50000" 
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
                 {[
                   { id: 'wifi', icon: Wifi, label: 'WiFi' },
                   { id: 'pool', icon: Coffee, label: 'Breakfast' },
                   { id: 'parking', icon: Car, label: 'Parking' }
                 ].map(amenity => {
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
              {(selectedStars.length > 0 || maxPrice < 50000 || selectedAmenities.length > 0) && (
                <button 
                  onClick={() => { setSelectedStars([]); setMaxPrice(50000); setSelectedAmenities([]); }}
                  className="ml-auto text-xs font-bold text-slate-400 hover:text-red-500 underline underline-offset-2 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
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
              <>
                {filteredResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredResults.map((hotel) => {
                      const primaryImage = hotel.image_url_first || (hotel.images && hotel.images.length > 0 ? hotel.images[0] : '/placeholder-hotel.jpg');
                      
                      return (
                        <div key={hotel.id} className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 group relative">
                          {/* B2B Badge */}
                          <div className="absolute top-5 left-5 z-10 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-full shadow-lg border border-white/20 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                            B2B Verified
                          </div>
                          
                          <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                            {primaryImage !== '/placeholder-hotel.jpg' ? (
                               <Image 
                                 src={primaryImage} 
                                 alt={hotel.name || 'Hotel'} 
                                 fill
                                 className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                               />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ImageIcon className="w-16 h-16 opacity-50" />
                               </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                            

                          </div>
                          
                          <div className="p-6 flex flex-col flex-1 bg-white relative z-10 -mt-6 rounded-t-[2rem]">
                            <div className="flex justify-between items-start mb-3 gap-3">
                              <h3 className="font-playfair text-2xl font-bold text-slate-900 leading-tight line-clamp-2">{hotel.name}</h3>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-5">
                              <div className="flex bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50">
                                <span className="text-xs font-bold text-amber-700 flex items-center">
                                  {hotel.star_rating} <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 ml-1" />
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-1 flex items-center">
                                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {hotel.address}
                              </p>
                            </div>
                            
                            <div className="mt-auto space-y-4">
                              {hotel.b2b_pricing ? (
                                customerView ? (
                                  <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/50 p-1">
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100/50 mb-1 flex justify-between items-end">
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Final Price</span>
                                      <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{hotel.b2b_pricing.base_price}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/50 p-1">
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100/50 mb-1">
                                      <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
                                        <span>Retail</span>
                                        <span className="line-through">₹{hotel.b2b_pricing.base_price}</span>
                                      </div>
                                      <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Net Rate</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{hotel.b2b_pricing.net_rate}</span>
                                      </div>
                                    </div>
                                    <div className="bg-green-500/10 rounded-xl p-3 flex justify-between items-center border border-green-500/20">
                                      <span className="text-green-700 text-[10px] font-bold uppercase tracking-widest flex items-center">
                                        Commission
                                      </span>
                                      <span className="text-green-700 text-lg font-black tracking-tight">₹{hotel.b2b_pricing.tac_amount}</span>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center flex flex-col items-center justify-center">
                                  <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Pricing Unavailable</span>
                                </div>
                              )}
                              
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleShareLink(hotel)}
                                  className="flex-1 flex justify-center items-center py-4 px-4 rounded-2xl shadow-sm border border-slate-200 text-sm font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-50 transition-all transform hover:scale-[1.02] active:scale-95"
                                >
                                  <Share className="w-4 h-4 mr-2" /> Share Property
                                </button>
                                <button 
                                  onClick={() => proceedToCheckout(hotel)}
                                  disabled={!hotel.b2b_pricing}
                                  className="flex-1 flex justify-center items-center py-4 px-4 rounded-2xl shadow-xl shadow-orange-500/20 text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                                >
                                  Book Now
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasSearched && !loading && filteredResults.length === 0 && !error && (
                  <div className="bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] p-16 text-center shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Search className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3 font-playfair">No Properties Found</h3>
                    <p className="text-slate-500 max-w-sm text-lg">
                      We couldn&apos;t find any premium inventory matching your exact filters.
                    </p>
                    {(selectedStars.length > 0 || maxPrice < 50000 || selectedAmenities.length > 0) && (
                      <button 
                        onClick={() => { setSelectedStars([]); setMaxPrice(50000); setSelectedAmenities([]); }}
                        className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
                
                {!hasSearched && !loading && (
                  <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in zoom-in duration-700">
                    <div className="w-32 h-32 bg-orange-100/50 rounded-full flex items-center justify-center mb-8 relative">
                      <div className="absolute inset-0 border-2 border-orange-200 rounded-full animate-ping opacity-20"></div>
                      <MapPin className="w-12 h-12 text-orange-500 drop-shadow-md" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 font-playfair mb-4 text-center max-w-lg">
                      Discover Your Next Great Booking
                    </h3>
                    <p className="text-slate-600 max-w-md text-center text-lg">
                      Search above to unlock exclusive B2B inventory, negotiated net rates, and instantly calculate your commissions.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
