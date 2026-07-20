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
  global_rate?: {
    amount: string;
    currency: 'INR';
    unit: 'ROOM_PER_NIGHT';
    taxes_included: boolean;
    commission_included: boolean;
    plan_id: number;
    plan_name: string;
    min_rooms: number;
    max_rooms: number | null;
  };
  room_wise_rate?: {
    amount: string;
    currency: 'INR';
    unit: 'ROOM_PER_NIGHT';
    taxes_included: boolean;
    commission_included: boolean;
    room_type_id: number;
    room_type_name: string;
  };
  pricing_mode?: 'ROOM_WISE' | 'GLOBAL' | 'BOTH' | null;
  has_room_wise_availability?: boolean;
  has_global_availability?: boolean;
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

  const globalRate = Number.parseFloat(hotel.global_rate?.amount || '');
  const hasGlobalRate = Number.isFinite(globalRate);
  const roomWiseRate = Number.parseFloat(hotel.room_wise_rate?.amount || '');
  const hasRoomWiseRate = Number.isFinite(roomWiseRate);
  const formatRate = (rate: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(rate);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-[0_8px_24px_rgb(15,23,42,0.06)] flex flex-col hover:shadow-[0_16px_34px_rgb(15,23,42,0.12)] hover:-translate-y-1 group relative transition-[box-shadow,transform] duration-300"
    >
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1 border border-white/50">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          {hotel.star_rating} Star
        </div>
      </div>
      
      <div className="relative h-[230px] w-full overflow-hidden bg-slate-100 shrink-0">
        <ImageWithFallback 
          src={primaryImage} 
          alt={`View of ${hotel.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent transition-opacity duration-300"></div>
      </div>
      
      <div className="p-4 flex flex-col flex-1 bg-white relative z-10 -mt-4 rounded-t-3xl">
        <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight group-hover:text-orange-600 transition-colors line-clamp-1">{hotel.name}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1.5 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {hotel.address || 'Location unavailable'}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {hasRoomWiseRate && <div className="mb-1"><div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Room-wise · {hotel.room_wise_rate?.room_type_name}</div><div className="text-lg font-black leading-tight text-slate-900">from ₹{formatRate(roomWiseRate)}</div></div>}
            {hasGlobalRate && <div><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Global / bulk · min {hotel.global_rate?.min_rooms} rooms</div><div className="text-lg font-black leading-tight text-slate-900">₹{formatRate(globalRate)}</div></div>}
            {!hasRoomWiseRate && !hasGlobalRate && <div className="max-w-[165px] text-sm font-bold leading-tight text-red-700">No settled B2B rate is available for these dates.</div>}
            {(hasRoomWiseRate || hasGlobalRate) && <div className="text-[11px] font-medium text-slate-500">Final B2B rate · room / night</div>}
          </div>

          <div className="flex gap-2 shrink-0">
          <button 
            onClick={handleShare}
            aria-label={`Share public link for ${hotel.name}`}
            title="Share quote with client"
            className="w-11 h-11 shrink-0 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <Share className="w-4.5 h-4.5" aria-hidden="true" />
          </button>
          <button 
            onClick={() => onBook(hotel)}
            className="h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3.5 font-bold text-sm flex items-center justify-center shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 whitespace-nowrap"
          >
            View &amp; Book
          </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
