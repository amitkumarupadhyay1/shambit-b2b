'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, Download, Star, Share, MapPin, Calendar, Users, Filter, Plus, Minus } from 'lucide-react';

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
  images: Array<{ id: number; image: string; is_primary: boolean }>;
  rooms: Array<Record<string, unknown>>;
  b2b_pricing?: {
    contract_id: number;
    base_price: string;
    net_rate: string;
    tac_amount: string;
    commission_type: string;
  };
}

export default function SearchPage() {
  const router = useRouter();
  
  // Search parameters
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityName, setSelectedCityName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  
  // Filters
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  
  // Data state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [error, setError] = useState('');

  // Initial Data Fetch
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

  // Fetch hotels whenever city changes (auto-search)
  useEffect(() => {
    if (!selectedCityName) return;
    
    const fetchHotels = async () => {
      setLoading(true);
      setError('');
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
    
    // Add a small debounce
    const timer = setTimeout(() => {
      fetchHotels();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedCityName, checkIn, checkOut, adults]);

  // Derived filtered results
  const filteredResults = useMemo(() => {
    return results.filter(hotel => {
      // Star rating filter
      if (selectedStars.length > 0 && !selectedStars.includes(hotel.star_rating)) {
        return false;
      }
      
      // Price filter (B2B net rate)
      if (hotel.b2b_pricing) {
        const netRate = parseFloat(hotel.b2b_pricing.net_rate);
        if (netRate > maxPrice) return false;
      }
      
      return true;
    });
  }, [results, selectedStars, maxPrice]);

  const handleStarToggle = (star: number) => {
    setSelectedStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const handleDownloadImages = async (hotelName: string, images: Array<{ id: number; image: string; is_primary: boolean }>) => {
    images.forEach(async (img) => {
      try {
        const response = await fetch(img.image);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${hotelName.replace(/\s+/g, '_')}_${img.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Failed to download image:', err);
      }
    });
  };

  const proceedToCheckout = (hotelId: number) => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates before booking.");
      return;
    }
    router.push(`/dashboard/checkout?hotel_id=${hotelId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`);
  };

  const handleShareLink = (hotel: HotelResult) => {
    const slug = hotel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const url = `${window.location.origin}/stay/${hotel.id}-${slug}`;
    navigator.clipboard.writeText(url);
    alert('Premium public gallery link copied to clipboard!');
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      {/* LEFT SIDEBAR: FILTERS */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-6">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
            <Filter className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-900 font-playfair">Filters</h2>
          </div>

          {/* Star Rating Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Star Rating</h3>
            <div className="space-y-2">
              {[5, 4, 3].map(star => (
                <label key={star} className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStars.includes(star) ? 'bg-orange-500 border-orange-500' : 'border-slate-300 group-hover:border-orange-400'}`}>
                    {selectedStars.includes(star) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input type="checkbox" className="hidden" checked={selectedStars.includes(star)} onChange={() => handleStarToggle(star)} />
                  <div className="flex items-center">
                    {Array(star).fill(0).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Max Net Rate (₹)</h3>
            <div className="space-y-4">
              <input 
                type="range" 
                min="1000" 
                max="50000" 
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>₹1,000</span>
                <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md">
                  {maxPrice >= 50000 ? 'Any Price' : `Up to ₹${maxPrice.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SEARCH & RESULTS */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-playfair">B2B Inventory Search</h1>
        </div>
        
        {/* Modern Search Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col lg:flex-row gap-2">
          {/* Destination */}
          <div className="flex-1 flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl px-4 py-3 border border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
            <MapPin className="w-5 h-5 text-orange-500 mr-3 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Destination</label>
              <select 
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-900 focus:ring-0 outline-none cursor-pointer appearance-none truncate"
                value={selectedCityName}
                onChange={(e) => setSelectedCityName(e.target.value)}
              >
                <option value="" disabled>Select a City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="flex-1 flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl px-4 py-3 border border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
            <Calendar className="w-5 h-5 text-orange-500 mr-3 shrink-0" />
            <div className="flex-1 flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Check In</label>
                <input 
                  type="date" 
                  className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-900 focus:ring-0 outline-none cursor-pointer"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="flex-1 border-l border-slate-200 pl-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Check Out</label>
                <input 
                  type="date" 
                  className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-900 focus:ring-0 outline-none cursor-pointer"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="w-full lg:w-48 flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl px-4 py-3 border border-transparent">
            <Users className="w-5 h-5 text-orange-500 mr-3 shrink-0" />
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Adults</label>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-semibold text-sm w-6 text-center">{adults}</span>
                <button 
                  onClick={() => setAdults(adults + 1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 shadow-sm flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="bg-white rounded-2xl border border-slate-100 shadow-sm h-[400px] animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-2xl"></div>
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl"></div>
                  <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredResults.map((hotel) => {
                  const primaryImage = hotel.images?.find(i => i.is_primary)?.image || hotel.images?.[0]?.image || '/placeholder-hotel.jpg';
                  
                  return (
                    <div key={hotel.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative">
                      {/* B2B Badge */}
                      <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full shadow-lg">
                        B2B Partner
                      </div>
                      
                      <div className="relative h-56 w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={primaryImage} alt={hotel.name} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <button 
                          onClick={() => handleDownloadImages(hotel.name, hotel.images)}
                          className="absolute bottom-3 right-12 bg-white/95 backdrop-blur-sm text-slate-800 p-2 rounded-xl text-xs font-semibold shadow-lg flex items-center hover:bg-orange-50 hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                          title="Download Photos"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleShareLink(hotel)}
                          className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 p-2 rounded-xl text-xs font-semibold shadow-lg flex items-center hover:bg-orange-50 hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 delay-75"
                          title="Copy Public Link"
                        >
                          <Share className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-playfair text-lg font-bold text-slate-900 leading-tight line-clamp-2">{hotel.name}</h3>
                          <div className="flex bg-amber-50 px-1.5 py-0.5 rounded shadow-sm border border-amber-100 shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-xs font-bold ml-1 text-amber-700">{hotel.star_rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-1 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 opacity-70" />
                          {hotel.address}
                        </p>
                        
                        <div className="mt-auto">
                          {hotel.b2b_pricing ? (
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3.5 border border-slate-200 mb-4">
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Retail Price:</span>
                                <span className="line-through decoration-slate-400">₹{hotel.b2b_pricing.base_price}</span>
                              </div>
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Net Rate:</span>
                                <span className="text-xl font-bold text-slate-900 leading-none">₹{hotel.b2b_pricing.net_rate}</span>
                              </div>
                              <div className="flex justify-between text-xs pt-2 border-t border-slate-200/60 mt-2">
                                <span className="text-green-700 font-semibold flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                  Your Commission
                                </span>
                                <span className="text-green-700 font-black">₹{hotel.b2b_pricing.tac_amount}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 text-center">
                              <span className="text-sm text-slate-500 font-medium">B2B Pricing Unavailable</span>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => proceedToCheckout(hotel.id)}
                            className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filteredResults.length === 0 && selectedCityName && !error && (
              <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Hotels Found</h3>
                <p className="text-slate-500 max-w-sm">
                  We couldn&apos;t find any inventory matching your exact filters. Try adjusting your price range or star rating.
                </p>
                {(selectedStars.length > 0 || maxPrice < 50000) && (
                  <button 
                    onClick={() => { setSelectedStars([]); setMaxPrice(100000); }}
                    className="mt-6 text-orange-600 font-semibold text-sm hover:text-orange-700 hover:underline"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
            
            {!selectedCityName && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center h-[50vh]">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                  <MapPin className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-playfair mb-3">Where are you booking for?</h3>
                <p className="text-slate-600 max-w-md">
                  Select a destination from the dropdown above to instantly view all available B2B hotel inventory, negotiated rates, and your guaranteed commission.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
