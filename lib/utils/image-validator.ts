/**
 * Image URL validation and fixing utilities
 */

/**
 * Check if an image URL is valid and accessible
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim();
  if (trimmedUrl === '') return false;
  
  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return false;
  }
  
  // Check if it's from allowed domains
  const allowedDomains = [
    'firebasestorage.googleapis.com',
    'ik.imagekit.io',
    'images.unsplash.com',
    'via.placeholder.com'
  ];
  
  return allowedDomains.some(domain => trimmedUrl.includes(domain));
}

/**
 * Get the first valid image URL from an array
 */
export function getFirstValidImage(images: (string | null | undefined)[]): string | null {
  if (!Array.isArray(images)) return null;
  
  for (const img of images) {
    if (isValidImageUrl(img)) {
      return img!.trim();
    }
  }
  
  return null;
}

/**
 * Filter out invalid images from an array
 */
export function filterValidImages(images: (string | null | undefined)[]): string[] {
  if (!Array.isArray(images)) return [];
  
  return images
    .filter(img => isValidImageUrl(img))
    .map(img => img!.trim());
}

/**
 * Fix common image URL issues
 */
export function fixImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  let fixed = url.trim();
  
  // Remove any whitespace
  fixed = fixed.replace(/\s+/g, '');
  
  // Fix double slashes (except after protocol)
  fixed = fixed.replace(/([^:]\/)\/+/g, '$1');
  
  // Ensure HTTPS
  if (fixed.startsWith('http://')) {
    fixed = fixed.replace('http://', 'https://');
  }
  
  return isValidImageUrl(fixed) ? fixed : null;
}

/**
 * Get a placeholder image URL
 */
export function getPlaceholderImage(): string {
  return '/placeholder-product.svg';
}

/**
 * Get image URL with fallback
 */
export function getImageWithFallback(
  images: (string | null | undefined)[] | string | null | undefined
): string {
  // Handle single image
  if (typeof images === 'string') {
    const fixed = fixImageUrl(images);
    return fixed || getPlaceholderImage();
  }
  
  // Handle array of images
  if (Array.isArray(images)) {
    const validImage = getFirstValidImage(images);
    if (validImage) {
      const fixed = fixImageUrl(validImage);
      return fixed || getPlaceholderImage();
    }
  }
  
  return getPlaceholderImage();
}
