'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ImageIcon, Grid } from 'lucide-react';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });

interface RoomGalleryProps {
  images?: Array<{ file_url: string; alt_text?: string }>;
  roomName: string;
}

export default function RoomGallery({ images, roomName }: RoomGalleryProps) {
  const [open, setOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full min-h-[200px] bg-slate-100 rounded-xl flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-slate-300" />
      </div>
    );
  }

  const primaryImage = images[0];
  const slides = images.map(img => ({ src: img.file_url, alt: img.alt_text || roomName }));

  return (
    <>
      <div 
        className="relative w-full h-full min-h-[200px] cursor-pointer group rounded-xl overflow-hidden"
        onClick={() => setOpen(true)}
      >
        <Image 
          src={primaryImage.file_url} 
          alt={primaryImage.alt_text || roomName} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
        
        {images.length > 1 && (
          <button 
            className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-white transition-all transform hover:scale-105"
          >
            <Grid className="w-3.5 h-3.5" />
            1 / {images.length}
          </button>
        )}
      </div>

      {open && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
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
