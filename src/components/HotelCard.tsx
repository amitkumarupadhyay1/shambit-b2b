'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Share } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { ImageWithFallback } from './ImageWithFallback';

export interface HotelResult {
  id: number;
  name: string;
  address: string;
  description: string;
  star_rating: number;
  slug?: string;
  image_url_first?: string; 
  images?: Array<string | { is_primary?: boolean; file_url?: string; image?: string }>;
  media?: Array<{ is_primary?: boolean; file_url?: string; image?: string }>;
  image_urls?: string[];
  rooms?: Array<{ id?: number; name?: string; description?: string }>;
  b2b_pricing?: {
    base_price: string;
    net_rate: string;
    tac_amount: string;
  };
}

const generateSlug = (id: number, name: string) => {
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
  return `${id}-${cleanName}`;
};

export const HotelCard = memo(function HotelCard({ 
  hotel, 
  onBook 
}: { 
  hotel: HotelResult, 
  onBook: (h: HotelResult) => void 
}) {
  const primaryImage = hotel.image_url_first 
    || hotel.image_urls?.[0]
    || hotel.media?.find(m => m.is_primary)?.file_url 
    || hotel.media?.find(m => m.is_primary)?.image 
    || hotel.media?.[0]?.file_url 
    || hotel.media?.[0]?.image
    || hotel.images?.find((m): m is { is_primary?: boolean; file_url?: string; image?: string } => typeof m !== 'string' && !!m.is_primary)?.file_url
    || hotel.images?.find((m): m is { is_primary?: boolean; file_url?: string; image?: string } => typeof m !== 'string' && !!m.is_primary)?.image
    || (typeof hotel.images?.[0] !== 'string' ? hotel.images?.[0]?.file_url : undefined)
    || (typeof hotel.images?.[0] !== 'string' ? hotel.images?.[0]?.image : undefined)
    || (typeof hotel.images?.[0] === 'string' ? hotel.images[0] : '') 
    || '/placeholder-hotel.jpg';
    
  const { data: session } = useSession();

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const hotelSlug = hotel.slug || generateSlug(hotel.id, hotel.name);
    const urlObj = new URL(`${window.location.origin}/stay/${hotelSlug}`);
    
    if (session?.user) {
      if (session.user.name) urlObj.searchParams.set('agent_name', session.user.name);
      if (session.user.email) urlObj.searchParams.set('agent_email', session.user.email);
      if ((session.user as { phone?: string }).phone) urlObj.searchParams.set('agent_phone', (session.user as { phone?: string }).phone!);
    }
    
    const url = urlObj.toString();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${hotel.name}`,
          url: url
        });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Premium public gallery link copied!');
      } else {
        toast.error('Sharing not supported on this device.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to share link.');
      }
    }
  }, [hotel.id, hotel.name, hotel.slug, session?.user]);

  const netRate = hotel.b2b_pricing?.net_rate ? parseFloat(hotel.b2b_pricing.net_rate) : 0;
  const tacAmount = hotel.b2b_pricing?.tac_amount ? parseFloat(hotel.b2b_pricing.tac_amount) : 0;
  const basePrice = hotel.b2b_pricing?.base_price ? parseFloat(hotel.b2b_pricing.base_price) : 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 group relative"
    >
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1 border border-white/50">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          {hotel.star_rating} Star
        </div>
      </div>
      
      <div className="relative h-64 w-full overflow-hidden bg-slate-100 shrink-0">
        <ImageWithFallback 
          src={primaryImage} 
          alt={`View of ${hotel.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
      </div>
      
      <div className="p-6 flex flex-col flex-1 bg-white relative z-10 -mt-6 rounded-t-[2rem]">
        <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight group-hover:text-orange-600 transition-colors line-clamp-1">{hotel.name}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1 mb-4 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {hotel.address || 'Location unavailable'}
        </p>

        {/* B2B Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
            Instant Confirmation
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md">
            B2B Exclusive Rate
          </span>
        </div>

        {/* Net Rate & Pricing */}
        <div className="mt-auto bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 transition-all">
          {hotel.b2b_pricing ? (
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Net Rate</div>
                <div className="text-3xl font-black text-slate-900 font-playfair tracking-tight">₹{netRate.toLocaleString()}</div>
                <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                  + ₹{tacAmount.toLocaleString()} Commission
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Public Price</div>
                <div className="text-sm font-bold text-slate-400 line-through">₹{basePrice.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[76px] text-center">
              <span className="text-sm font-semibold text-slate-500 mt-1">Pricing unavailable</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-auto shrink-0">
          <button 
            onClick={handleShare}
            aria-label={`Share public link for ${hotel.name}`}
            title="Share quote with client"
            className="w-14 h-14 shrink-0 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <Share className="w-5 h-5" aria-hidden="true" />
          </button>
          <button 
            onClick={() => onBook(hotel)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center py-3 shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Select Rooms
          </button>
        </div>
      </div>
    </motion.div>
  );
});
