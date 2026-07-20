'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { normalizeMediaUrl } from '@/lib/media';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  fallbackSrc = '/placeholder-hotel.jpg', 
  ...rest 
}: ImageWithFallbackProps) {
  const normalizedSrc = typeof src === 'string' ? normalizeMediaUrl(src) : src;
  const [imgSrc, setImgSrc] = useState(normalizedSrc);
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(normalizedSrc);
  if (prevSrc !== normalizedSrc) {
    setPrevSrc(normalizedSrc);
    setImgSrc(normalizedSrc);
    setHasError(false);
  }

  if (hasError || !imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 w-full h-full ${rest.className || ''}`}>
        <ImageIcon className="w-12 h-12 opacity-50" />
      </div>
    );
  }

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt}
      unoptimized={true}
      onError={() => {
        if (imgSrc !== fallbackSrc && fallbackSrc) {
          setImgSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}
