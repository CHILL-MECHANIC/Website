/**
 * Image optimization utilities for responsive and mobile-friendly images
 */

export interface ResponsiveImageOptions {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  lazy?: boolean;
}

/**
 * Generate srcset for responsive images with different device pixel ratios
 * @param imagePath - Base path to the image
 * @param widths - Array of widths to generate srcset for
 * @returns srcset string
 */
export const generateSrcSet = (imagePath: string, widths: number[] = [320, 480, 640, 1024]): string => {
  const separator = imagePath.includes('?') ? '&' : '?';
  return widths
    .map(width => `${imagePath}${separator}w=${width} ${width}w`)
    .join(', ');
};

/**
 * Get optimized image size for mobile devices
 * @param mobileSize - Size for mobile devices
 * @param tabletSize - Size for tablet devices
 * @param desktopSize - Size for desktop devices
 * @returns sizes attribute string
 */
export const getResponsiveSizes = (
  mobileSize = '100vw',
  tabletSize = '50vw',
  desktopSize = '33vw'
): string => {
  return `(max-width: 480px) ${mobileSize}, (max-width: 1024px) ${tabletSize}, ${desktopSize}`;
};

/**
 * Compress image for mobile view by reducing quality
 * @param imagePath - Path to the image
 * @param quality - Quality percentage (1-100)
 * @returns Compressed image URL
 */
export const getCompressedImageUrl = (imagePath: string, quality = 80): string => {
  // For local images, return as is (compression happens during build)
  // For external images, add compression parameters
  if (imagePath.includes('http') || imagePath.includes('supabase')) {
    const separator = imagePath.includes('?') ? '&' : '?';
    return `${imagePath}${separator}quality=${quality}`;
  }
  return imagePath;
};

/**
 * Get appropriate image size for device type
 * @param baseSize - Base image size
 * @param isMobile - Whether device is mobile
 * @returns Appropriate size
 */
export const getImageSizeForDevice = (baseSize: number, isMobile: boolean): number => {
  return isMobile ? Math.round(baseSize * 0.75) : baseSize;
};

/**
 * Optimize CSS and inline styles for mobile
 * @param isSmallScreen - Whether screen size is small
 * @returns Optimized className or style
 */
export const getResponsiveImageClasses = (isSmallScreen: boolean): string => {
  if (isSmallScreen) {
    return 'w-full h-auto object-cover loading-lazy';
  }
  return 'w-full h-auto object-cover';
};

/**
 * Generate WebP fallback format for images
 * @param imagePath - Path to the image
 * @returns Object with different image formats
 */
export const getImageFormats = (imagePath: string) => {
  const webpPath = imagePath.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, '.webp');
  // If the image format wasn't recognized, append .webp instead of replacing
  const webp = webpPath === imagePath ? `${imagePath.split('?')[0]}.webp${imagePath.includes('?') ? '?' + imagePath.split('?')[1] : ''}` : webpPath;
  return {
    webp,
    fallback: imagePath,
  };
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Create a picture element with multiple sources for optimal loading
 * @param imagePath - Path to the image
 * @param alt - Alt text for image
 * @param sizes - Sizes attribute
 * @returns Picture element HTML
 */
export const createResponsiveImage = (
  imagePath: string,
  alt: string,
  sizes = getResponsiveSizes()
): string => {
  const formats = getImageFormats(imagePath);
  const escapedAlt = escapeHtml(alt);
  const escapedSizes = escapeHtml(sizes);
  const webpSrcSet = generateSrcSet(formats.webp);
  const fallbackSrcSet = generateSrcSet(formats.fallback);
  return `
    <picture>
      <source srcset="${webpSrcSet}" type="image/webp" sizes="${escapedSizes}">
      <img srcset="${fallbackSrcSet}" src="${formats.fallback}" alt="${escapedAlt}" sizes="${escapedSizes}" loading="lazy" />
    </picture>
  `;
};

/**
 * Preload critical images for better performance
 * @param imagePath - Path to the image
 * @returns Link element for preloading
 */
export const preloadImage = (imagePath: string): string => {
  return `<link rel="preload" as="image" href="${imagePath}" />`;
};
