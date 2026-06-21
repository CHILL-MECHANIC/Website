import React, { useState, useEffect } from 'react';
import { getResponsiveSizes, getCompressedImageUrl, generateSrcSet } from '@/utils/imageOptimization';

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
    let resizeTimer: NodeJS.Timeout;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    const debouncedCheckMobile = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 150);
    };

    checkMobile();

    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Reduce quality on mobile for faster loading
  const optimizedQuality = isMobile ? Math.max(quality - 20, 50) : quality;
  const optimizedSrc = getCompressedImageUrl(src, optimizedQuality);

  const imageClasses = `${className} object-${objectFit} w-full h-auto`;
  const fallbackSrcSet = generateSrcSet(optimizedSrc);

  return (
    <img
      srcSet={fallbackSrcSet}
      src={optimizedSrc}
      alt={alt}
      className={imageClasses}
      sizes={sizes}
      loading={lazy && !priority ? 'lazy' : 'eager'}
      decoding={priority ? 'auto' : 'async'}
      {...(priority && { fetchPriority: 'high' as const })}
    />
  );
};

export default ResponsiveImage;
