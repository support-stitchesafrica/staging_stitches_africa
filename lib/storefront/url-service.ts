/**
 * Storefront URL Service
 * Handles URL validation, sanitization, and availability checking
 * 
 * Validates: Requirements 1.1, 1.2
 */

import { adminDb } from '@/lib/firebase-admin';
import { HandleValidationResult } from '@/types/storefront';

/**
 * Sanitizes a handle to be URL-safe
 */
export function sanitizeHandle(handle: string): string {
  if (!handle || typeof handle !== 'string') {
    return '';
  }
  
  return handle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validates handle format according to requirements
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
 * Checks if a handle is reserved
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
 * Checks if a handle is available in the database
 */
export async function checkHandleAvailability(handle: string): Promise<boolean> {
  try {
    const sanitized = sanitizeHandle(handle);
    const existingStorefront = await adminDb
      .collection('storefronts')
      .where('handle', '==', sanitized)
      .limit(1)
      .get();

    return existingStorefront.empty;
  } catch (error) {
    console.error('Error checking handle availability:', error);
    throw new Error('Unable to check handle availability');
  }
}

/**
 * Generates handle suggestions
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
 * Finds available handle suggestions
 */
export async function findAvailableHandleSuggestions(handle: string): Promise<string[]> {
  const suggestions = generateHandleSuggestions(handle);
  const availableSuggestions: string[] = [];

  // Check each suggestion for availability
  for (const suggestion of suggestions) {
    try {
      const isAvailable = await checkHandleAvailability(suggestion);
      if (isAvailable) {
        availableSuggestions.push(suggestion);
      }

      // Stop after finding 3 available suggestions
      if (availableSuggestions.length >= 3) {
        break;
      }
    } catch (error) {
      console.error(`Error checking suggestion ${suggestion}:`, error);
    }
  }

  return availableSuggestions;
}

/**
 * Comprehensive handle validation
 */
export async function validateHandle(handle: string): Promise<HandleValidationResult> {
  const sanitized = sanitizeHandle(handle);
  const formatValidation = validateHandleFormat(handle);

  // If format validation fails, return early with suggestions
  if (!formatValidation.isValid) {
    return {
      isValid: false,
      isAvailable: false,
      errors: formatValidation.errors,
      suggestions: generateHandleSuggestions(sanitized).slice(0, 3)
    };
  }

  // Check availability
  let isAvailable = false;
  try {
    isAvailable = await checkHandleAvailability(sanitized);
  } catch (error) {
    return {
      isValid: false,
      isAvailable: false,
      errors: ['Unable to check handle availability']
    };
  }

  const result: HandleValidationResult = {
    isValid: true,
    isAvailable
  };

  // Generate suggestions if handle is taken
  if (!isAvailable) {
    result.suggestions = await findAvailableHandleSuggestions(sanitized);
  }

  return result;
}

/**
 * Generates a storefront URL from a handle
 */
export function generateStorefrontUrl(handle: string, baseUrl?: string): string {
  const sanitized = sanitizeHandle(handle);
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://staging-stitches-africa.vercel.app';
  return `${base}/store/${sanitized}`;
}

/**
 * Extracts handle from a storefront URL
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