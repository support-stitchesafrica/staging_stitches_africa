/**
 * Image optimization utilities for Next.js Image component
 */

/**
 * Generate a simple blur data URL for image placeholders
 * @param width - Image width
 * @param height - Image height
 * @param color - Base color for the blur (default: gray)
 * @returns Base64 encoded blur data URL
 */
export function generateBlurDataURL(width: number = 400, height: number = 400, color: string = '#f3f4f6'): string {
  // Create a simple SVG blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.4" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate responsive image sizes string for different breakpoints
 * @param options - Configuration for responsive sizes
 * @returns Sizes string for Next.js Image component
 */
export function generateResponsiveSizes(options: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  defaultSize?: string;
}): string {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '33vw',
    defaultSize = '100vw'
  } = options;

  return `(max-width: 768px) ${mobile}, (max-width: 1200px) ${tablet}, ${desktop}`;
}

/**
 * Common responsive sizes configurations
 */
export const RESPONSIVE_SIZES = {
  // Full width on all screens
  fullWidth: '100vw',
  
  // Product cards in grid
  productCard: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  
  // Product detail images
  productDetail: '(max-width: 1024px) 100vw, 50vw',
  
  // Small thumbnails and avatars
  thumbnail: '(max-width: 768px) 64px, 80px',
  
  // Order/cart item images
  orderItem: '(max-width: 768px) 64px, 80px',
  
  // Hero section images
  hero: '100vw',
  
  // Vendor logos
  vendorLogo: '(max-width: 768px) 32px, 40px'
};

/**
 * Determine if an image should be prioritized for loading
 * @param index - Image index in a list
 * @param isAboveFold - Whether the image is above the fold
 * @returns Whether to prioritize the image
 */
export function shouldPrioritizeImage(index: number = 0, isAboveFold: boolean = false): boolean {
  // Prioritize first few images or images above the fold
  return index < 2 || isAboveFold;
}

/**
 * Get optimized image dimensions for different use cases
 */
export const IMAGE_DIMENSIONS = {
  productCard: { width: 400, height: 500 },
  productThumbnail: { width: 80, height: 80 },
  orderItem: { width: 64, height: 64 },
  vendorLogo: { width: 40, height: 40 },
  heroImage: { width: 1200, height: 800 },
  avatar: { width: 32, height: 32 }
};