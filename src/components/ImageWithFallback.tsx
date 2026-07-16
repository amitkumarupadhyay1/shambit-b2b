'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  fallbackSrc = '/placeholder-hotel.jpg', 
  ...rest 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setImgSrc(src);
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
