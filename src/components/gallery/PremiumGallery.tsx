'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { Grid, Image as ImageIcon } from 'lucide-react';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });

interface PremiumGalleryProps {
  images: Array<{ id: number; image: string; is_primary: boolean }>;
  hotelName: string;
}

export default function PremiumGallery({ images, hotelName }: PremiumGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 md:h-96 bg-slate-100 rounded-3xl flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-slate-300" />
      </div>
    );
  }

  const primaryImage = images.find(img => img.is_primary) || images[0];
  const secondaryImages = images.filter(img => img.id !== primaryImage.id).slice(0, 4);
  
  // Format slides for Lightbox
  const slides = images.map(img => ({ src: img.image, alt: hotelName }));

  const openLightbox = (idx: number) => {
    // Find the actual index in the full images array
    setIndex(idx);
    setOpen(true);
  };

  return (
    <>
      {/* Desktop Grid Layout */}
      <div className="relative hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[50vh] min-h-[400px] max-h-[600px] rounded-2xl overflow-hidden group">
        {/* Primary Hero Image */}
        <div 
          className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden"
          onClick={() => openLightbox(images.findIndex(img => img.id === primaryImage.id))}
        >
          <Image 
            src={primaryImage.image} 
            alt={`${hotelName} - Hero`} 
            fill 
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
        </div>

        {/* Secondary Images */}
        {secondaryImages.map((img, idx) => (
          <div 
            key={img.id} 
            className="relative cursor-pointer overflow-hidden"
            onClick={() => openLightbox(images.findIndex(i => i.id === img.id))}
          >
            <Image 
              src={img.image} 
              alt={`${hotelName} - View ${idx + 1}`} 
              fill 
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-300 pointer-events-none" />
          </div>
        ))}
        
        {/* Fallback placeholders if fewer than 5 images total */}
        {Array.from({ length: Math.max(0, 4 - secondaryImages.length) }).map((_, i) => (
          <div key={`placeholder-${i}`} className="bg-slate-100" />
        ))}

        {/* View All Photos Button */}
        <button 
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 hover:bg-white transition-all transform hover:scale-105"
        >
          <Grid className="w-4 h-4" />
          Show all photos
        </button>
      </div>

      {/* Mobile Swipe Container */}
      <div className="md:hidden relative w-full h-[40vh] min-h-[300px]">
        <div 
          className="relative w-full h-full cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          <Image 
            src={primaryImage.image} 
            alt={hotelName} 
            fill 
            className="object-cover rounded-xl"
            priority
            sizes="100vw"
          />
        </div>
        <button 
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5"
        >
          <Grid className="w-3.5 h-3.5" />
          1 / {images.length}
        </button>
      </div>

      {/* Premium Lightbox Modal */}
      {open && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={index}
          slides={slides}
          plugins={[Zoom, Thumbnails, Fullscreen]}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
            scrollToZoom: true,
          }}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
          }}
        />
      )}
    </>
  );
}
