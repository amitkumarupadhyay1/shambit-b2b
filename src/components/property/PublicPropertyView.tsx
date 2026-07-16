"use client";

import React from 'react';
import Image from 'next/image';
import PremiumGallery from '../gallery/PremiumGallery';
import RoomGallery from '../gallery/RoomGallery';
import { Star, MapPin, CheckCircle2 } from 'lucide-react';

interface PublicHotelData {
  id: number;
  name: string;
  address: string;
  latitude?: string;
  longitude?: string;
  nearby_places?: Array<{
    name: string;
    distance_m: number;
    category?: { name?: string; icon?: string; code?: string };
  }>;
  description: string;
  star_rating: number;
  images: Array<{ id?: number; file_url?: string; image?: string; is_primary?: boolean; alt_text?: string }>;
  amenities?: string[];
  rooms: Array<{ 
    id?: number; 
    name?: string; 
    description?: string;
    amenities?: string[];
    room_size_sqft?: string;
    media?: Array<{ file_url: string; alt_text?: string }>;
  }>;
}

interface PublicPropertyViewProps {
  hotel: PublicHotelData;
  agent?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export default function PublicPropertyView({ hotel, agent }: PublicPropertyViewProps) {
  const getContactUrl = () => {
    if (agent?.phone) {
      const cleanPhone = agent.phone.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi${agent.name ? ' ' + agent.name : ''}, I'm interested in booking ${hotel.name}.`)}`;
    }
    if (agent?.email) {
      return `mailto:${agent.email}?subject=${encodeURIComponent(`Inquiry about ${hotel.name}`)}`;
    }
    return "mailto:support@shambit.com";
  };

  const contactUrl = getContactUrl();

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
            <span className="font-playfair font-bold text-xl tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-indigo-800">Sham</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Bit</span>
            </span>
          </div>
          <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center justify-center py-2 px-5 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all">
            Contact {agent?.name || 'your Agent'}
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title and Rating */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 font-playfair leading-tight tracking-tight">
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

            {hotel.amenities && hotel.amenities.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 font-playfair mb-4">Property Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold text-slate-900 font-playfair mb-6">Location & Surroundings</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {hotel.latitude && hotel.longitude ? (
                  <div className="w-full h-64 bg-slate-100 relative">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=15&output=embed`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : null}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {hotel.address}
                    </p>
                  </div>

                  {hotel.nearby_places && hotel.nearby_places.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Nearby Places</h3>
                      <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
                        {hotel.nearby_places.map((place, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                              <span className="text-lg" title={place.category?.name}>{place.category?.icon || '📍'}</span>
                              <span className="text-sm line-clamp-1">{place.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                              {place.distance_m < 1000 
                                ? `${place.distance_m} m` 
                                : `${(place.distance_m / 1000).toFixed(1)} km`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 font-playfair mb-6">Available Accommodations</h2>
              <div className="space-y-6">
                {hotel.rooms?.length > 0 ? (
                  hotel.rooms.map((room, idx) => (
                    <div key={room.id || `room-${idx}`} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                      {/* Room Image */}
                      <div className="w-full sm:w-1/3 aspect-[4/3] shrink-0">
                        <RoomGallery 
                          images={room.media} 
                          roomName={room.name || `Premium Room ${idx + 1}`} 
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{room.name || `Premium Room ${idx + 1}`}</h3>
                          {room.room_size_sqft && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
                              <span className="text-sm">📏</span> {parseInt(room.room_size_sqft)} sq.ft.
                            </div>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                          {room.description || "Experience comfort and luxury in this well-appointed room, designed to provide a perfect retreat for your stay."}
                        </p>
                        
                        {/* Room Amenities */}
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
                          {room.amenities && room.amenities.length > 0 ? (
                            room.amenities.slice(0, 6).map((amenity, i) => (
                              <span key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                {amenity}
                              </span>
                            ))
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Premium Bedding
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Ensuite Bathroom
                              </span>
                            </>
                          )}
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
              <p className="text-slate-500 mb-6">
                Contact {agent?.name ? `your agent, ${agent.name},` : 'your ShamBit agent'} to unlock exclusive agent rates, confirm availability, and finalize your booking.
              </p>

              {(agent?.name || agent?.phone || agent?.email) && (
                <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Travel Agent</p>
                  {agent.name && <p className="font-bold text-slate-900 text-lg">{agent.name}</p>}
                  {agent.phone && (
                    <a href={`tel:${agent.phone.replace(/[^0-9+]/g, '')}`} className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                      <span className="text-lg">📞</span> {agent.phone}
                    </a>
                  )}
                  {agent.email && agent.email !== "$undefined" && (
                    <a href={`mailto:${agent.email}`} className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-2 break-all transition-colors">
                      <span className="text-lg">✉️</span> {agent.email}
                    </a>
                  )}
                </div>
              )}

              <button 
                onClick={() => window.open(contactUrl, '_blank')}
                className="w-full flex justify-center py-4 px-4 rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 transition-all transform hover:-translate-y-0.5"
              >
                Inquire with {agent?.name || 'Agent'}
              </button>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-400">
                <span>Curated by</span>
                <span className="font-semibold text-slate-600">ShamBit</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
