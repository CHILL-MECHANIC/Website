import React, { useState, useEffect } from 'react';
import { getResponsiveSizes, getImageFormats, getCompressedImageUrl } from '@/utils/imageOptimization';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  quality?: number;
  lazy?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  priority?: boolean;
}

/**
 * ResponsiveImage component for optimized mobile-friendly images
 * Automatically serves compressed images on mobile devices
 * Supports WebP format with fallback
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  sizes = getResponsiveSizes(),
  quality = 80,
  lazy = true,
  objectFit = 'cover',
  priority = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reduce quality on mobile for faster loading
  const optimizedQuality = isMobile ? Math.max(quality - 20, 50) : quality;
  const optimizedSrc = getCompressedImageUrl(src, optimizedQuality);
  const formats = getImageFormats(optimizedSrc);

  const imageClasses = `${className} object-${objectFit} w-full h-auto`;

  return (
    <picture>
      <source
        srcSet={formats.webp}
        type="image/webp"
        sizes={sizes}
      />
      <img
        src={formats.fallback}
        alt={alt}
        className={imageClasses}
        sizes={sizes}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding={priority ? 'auto' : 'async'}
        {...(priority && { fetchPriority: 'high' as const })}
      />
    </picture>
  );
};

export default ResponsiveImage;
