'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, Download, Star } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/v1/b2b/search/', {
        params: {
          q: query,
          check_in: checkIn,
          check_out: checkOut,
          adults: adults
        }
      });
      const hits = response.data.results || response.data || [];
      setResults(hits);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImages = async (hotelName: string, images: Array<{ id: number; image: string; is_primary: boolean }>) => {
    images.forEach(async (img) => {
      try {
        const response = await fetch(img.image);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${hotelName.replace(/\\s+/g, '_')}_${img.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Failed to download image:', err);
      }
    });
  };

  const proceedToCheckout = (hotelId: number) => {
    router.push(`/dashboard/checkout?hotel_id=${hotelId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 font-playfair">B2B Hotel Search</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Destination / Hotel Name</label>
            <input 
              type="text" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none"
              placeholder="e.g., Ayodhya, Prayagraj"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Check In</label>
            <input 
              type="date" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Check Out</label>
            <input 
              type="date" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Adults</label>
            <input 
              type="number" 
              min="1"
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              required
            />
          </div>
          <div className="md:col-span-5 flex justify-end mt-2">
            <button 
              type="submit" 
              className="flex items-center justify-center py-3 px-8 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search Inventory'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((hotel) => {
          const primaryImage = hotel.images?.find(i => i.is_primary)?.image || hotel.images?.[0]?.image || '/placeholder-hotel.jpg';
          
          return (
            <div key={hotel.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md">
              <div className="relative h-48 w-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={primaryImage} alt={hotel.name} className="object-cover w-full h-full" />
                <button 
                  onClick={() => handleDownloadImages(hotel.name, hotel.images)}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-lg text-xs font-semibold shadow-sm flex items-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Download all photos to share via WhatsApp"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Get Media
                </button>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-playfair text-xl font-bold text-slate-900 leading-tight">{hotel.name}</h3>
                  <div className="flex bg-amber-50 px-1.5 py-0.5 rounded text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold ml-1">{hotel.star_rating}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{hotel.address}</p>
                
                <div className="mt-auto">
                  {hotel.b2b_pricing && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Gross Rate:</span>
                        <span className="line-through">₹{hotel.b2b_pricing.base_price}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-sm text-slate-700">B2B Net Rate:</span>
                        <span className="text-sm text-orange-600">₹{hotel.b2b_pricing.net_rate}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-200 mt-1">
                        <span className="text-green-600 font-medium">Your Commission (TAC):</span>
                        <span className="text-green-700 font-bold">₹{hotel.b2b_pricing.tac_amount}</span>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => proceedToCheckout(hotel.id)}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {!loading && results.length === 0 && query && !error && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-500">No B2B inventory found for your search criteria.</p>
        </div>
      )}
    </div>
  );
}
