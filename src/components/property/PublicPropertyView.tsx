import React from 'react';
import Image from 'next/image';
import PremiumGallery from '../gallery/PremiumGallery';
import { Star, MapPin, CheckCircle2 } from 'lucide-react';

interface PublicHotelData {
  id: number;
  name: string;
  address: string;
  description: string;
  star_rating: number;
  images: Array<{ id: number; image: string; is_primary: boolean }>;
  rooms: Array<{ name?: string; description?: string; [key: string]: unknown }>;
}

interface PublicPropertyViewProps {
  hotel: PublicHotelData;
}

export default function PublicPropertyView({ hotel }: PublicPropertyViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200">
      {/* Sticky ShamBit Branding Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.svg" 
              alt="ShamBit Travels Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8" 
              priority
            />
            <span className="font-playfair font-bold text-xl text-slate-900 tracking-tight">
              ShamBit Collection
            </span>
          </div>
          <a href="mailto:contact@shambit.com" className="hidden sm:inline-flex items-center justify-center py-2 px-5 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all">
            Contact your Agent
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title and Rating */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 font-playfair leading-tight">
              {hotel.name}
            </h1>
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 self-start sm:self-auto shrink-0">
              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
              ))}
            </div>
          </div>
          <div className="flex items-center text-slate-500 text-sm sm:text-base">
            <MapPin className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
            <p>{hotel.address}</p>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-12">
          <PremiumGallery images={hotel.images} hotelName={hotel.name} />
        </div>

        {/* Content & Sidebar CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            
            <section>
              <h2 className="text-2xl font-bold text-slate-900 font-playfair mb-4">About the Property</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-lg">
                  {hotel.description}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 font-playfair mb-6">Available Accommodations</h2>
              <div className="space-y-6">
                {hotel.rooms?.length > 0 ? (
                  hotel.rooms.map((room, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{room.name || `Premium Room ${idx + 1}`}</h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                          {room.description || "Experience comfort and luxury in this well-appointed room, designed to provide a perfect retreat for your stay."}
                        </p>
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Premium Bedding
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Ensuite Bathroom
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Accommodation details are available upon request from your agent.</p>
                )}
              </div>
            </section>
            
          </div>

          {/* Sticky CTA Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-2xl font-playfair font-bold text-slate-900 mb-2">Ready to stay?</h3>
              <p className="text-slate-500 mb-8">
                Contact your ShamBit travel agent to unlock exclusive agent rates, confirm availability, and finalize your booking.
              </p>
              <button 
                onClick={() => window.location.href = "mailto:contact@shambit.com"}
                className="w-full flex justify-center py-4 px-4 rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 transition-all transform hover:-translate-y-0.5"
              >
                Inquire with Agent
              </button>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-400">
                <span>Curated by</span>
                <span className="font-semibold text-slate-600">ShamBit Travels</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
