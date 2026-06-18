import React, { useState, useEffect } from 'react';
import { getResponsiveSizes, getImageFormats, getCompressedImageUrl, generateSrcSet } from '@/utils/imageOptimization';

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
  const [isMounted, setIsMounted] = useState(false);

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
    setIsMounted(true);

    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Reduce quality on mobile for faster loading
  const optimizedQuality = isMobile ? Math.max(quality - 20, 50) : quality;
  const optimizedSrc = getCompressedImageUrl(src, optimizedQuality);
  const formats = getImageFormats(optimizedSrc);

  const imageClasses = `${className} object-${objectFit} w-full h-auto`;
  const webpSrcSet = generateSrcSet(formats.webp);
  const fallbackSrcSet = generateSrcSet(formats.fallback);

  return (
    <picture>
      <source
        srcSet={webpSrcSet}
        type="image/webp"
        sizes={sizes}
      />
      <img
        srcSet={fallbackSrcSet}
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
