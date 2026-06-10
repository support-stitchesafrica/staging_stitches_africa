/**
 * Client-side URL Service
 * Handles URL validation, sanitization without Firebase dependencies
 * Safe for client-side components
 */

/**
 * Sanitizes a handle to be URL-safe (client-side version)
 */
export function sanitizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validates handle format according to requirements (client-side version)
 */
export function validateHandleFormat(handle: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const sanitized = sanitizeHandle(handle);

  // Check if sanitization changed the handle significantly (indicates invalid format)
  const originalLower = handle.toLowerCase();
  if (originalLower !== sanitized && (originalLower.startsWith('-') || originalLower.endsWith('-'))) {
    errors.push('Handle must start and end with alphanumeric characters');
  }

  // Length validation
  if (sanitized.length < 3) {
    errors.push('Handle must be at least 3 characters long');
  }

  if (sanitized.length > 50) {
    errors.push('Handle must be no more than 50 characters long');
  }

  // Reserved words check
  if (isReservedHandle(sanitized)) {
    errors.push('Handle cannot use reserved words');
  }

  // Format validation for the sanitized version
  if (sanitized.length > 1 && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(sanitized)) {
    errors.push('Handle contains invalid characters');
  }

  if (sanitized.length === 1 && !/^[a-z0-9]$/.test(sanitized)) {
    errors.push('Single character handles must be alphanumeric');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a handle is reserved (client-side version)
 */
export function isReservedHandle(handle: string): boolean {
  const reservedWords = [
    'admin', 'api', 'app', 'www', 'mail', 'ftp', 'store', 'shop', 'cart',
    'checkout', 'payment', 'order', 'account', 'profile', 'settings',
    'help', 'support', 'contact', 'about', 'terms', 'privacy', 'legal',
    'blog', 'news', 'home', 'index', 'root', 'test', 'demo', 'example',
    'static', 'assets', 'public', 'uploads', 'downloads', 'images'
  ];

  return reservedWords.includes(handle.toLowerCase());
}

/**
 * Generates handle suggestions (client-side version)
 */
export function generateHandleSuggestions(handle: string): string[] {
  const suggestions: string[] = [];
  const baseHandle = sanitizeHandle(handle).replace(/-+$/, '');

  // Add number suffixes
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${baseHandle}-${i}`);
  }

  // Add year suffix
  const currentYear = new Date().getFullYear();
  suggestions.push(`${baseHandle}-${currentYear}`);

  // Add descriptive suffixes
  const suffixes = ['shop', 'store', 'boutique', 'collection', 'brand'];
  suffixes.forEach(suffix => {
    suggestions.push(`${baseHandle}-${suffix}`);
  });

  return suggestions.slice(0, 8); // Return top 8 suggestions
}

/**
 * Generates a storefront URL from a handle (client-side version)
 */
export function generateStorefrontUrl(handle: string, baseUrl?: string): string {
  const sanitized = sanitizeHandle(handle);
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.stitchesafrica.com';
  return `${base}/store/${sanitized}`;
}

/**
 * Extracts handle from a storefront URL (client-side version)
 */
export function extractHandleFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Expected format: /store/[handle]
    if (pathParts.length >= 3 && pathParts[1] === 'store') {
      return pathParts[2];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}