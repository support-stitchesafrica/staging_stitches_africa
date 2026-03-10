import type { HandleValidationResult, StorefrontConfig, ThemeConfiguration } from './types';

// Handle validation constants
const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 50;
const HANDLE_REGEX = /^[a-z0-9-]+$/;
const RESERVED_HANDLES = [
  'admin', 'api', 'app', 'www', 'mail', 'ftp', 'blog', 'shop', 'store',
  'support', 'help', 'about', 'contact', 'terms', 'privacy', 'legal',
  'dashboard', 'account', 'profile', 'settings', 'login', 'register',
  'signup', 'signin', 'logout', 'auth', 'oauth', 'callback', 'webhook',
  'static', 'assets', 'images', 'css', 'js', 'fonts', 'media', 'uploads'
];

/**
 * Validates storefront handle format and basic rules
 */
export function validateHandleFormat(handle: string): HandleValidationResult {
  const errors: string[] = [];
  
  // Check if handle is provided
  if (!handle || handle.trim() === '') {
    errors.push('Handle is required');
    return { isValid: false, isAvailable: false, errors };
  }

  const trimmedHandle = handle.trim().toLowerCase();

  // Check length
  if (trimmedHandle.length < HANDLE_MIN_LENGTH) {
    errors.push(`Handle must be at least ${HANDLE_MIN_LENGTH} characters long`);
  }

  if (trimmedHandle.length > HANDLE_MAX_LENGTH) {
    errors.push(`Handle must be no more than ${HANDLE_MAX_LENGTH} characters long`);
  }

  // Check format (alphanumeric and hyphens only)
  if (!HANDLE_REGEX.test(trimmedHandle)) {
    errors.push('Handle can only contain lowercase letters, numbers, and hyphens');
  }

  // Check for consecutive hyphens
  if (trimmedHandle.includes('--')) {
    errors.push('Handle cannot contain consecutive hyphens');
  }

  // Check if starts or ends with hyphen
  if (trimmedHandle.startsWith('-') || trimmedHandle.endsWith('-')) {
    errors.push('Handle cannot start or end with a hyphen');
  }

  // Check reserved words
  if (RESERVED_HANDLES.includes(trimmedHandle)) {
    errors.push('This handle is reserved and cannot be used');
  }

  const isValid = errors.length === 0;
  
  return {
    isValid,
    isAvailable: isValid, // Format validation only, availability checked separately
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Sanitizes handle input to make it URL-friendly
 */
export function sanitizeHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates handle suggestions based on input
 */
export function generateHandleSuggestions(baseHandle: string, existingHandles: string[] = []): string[] {
  const sanitized = sanitizeHandle(baseHandle);
  const suggestions: string[] = [];
  
  if (!sanitized) {
    return suggestions;
  }

  // Add base suggestion if valid and available
  const baseValidation = validateHandleFormat(sanitized);
  if (baseValidation.isValid && !existingHandles.includes(sanitized)) {
    suggestions.push(sanitized);
  }

  // Generate numbered variations
  for (let i = 1; i <= 5; i++) {
    const numbered = `${sanitized}-${i}`;
    const validation = validateHandleFormat(numbered);
    if (validation.isValid && !existingHandles.includes(numbered)) {
      suggestions.push(numbered);
    }
  }

  // Generate variations with common suffixes
  const suffixes = ['shop', 'store', 'boutique', 'collection', 'brand'];
  for (const suffix of suffixes) {
    const withSuffix = `${sanitized}-${suffix}`;
    const validation = validateHandleFormat(withSuffix);
    if (validation.isValid && !existingHandles.includes(withSuffix)) {
      suggestions.push(withSuffix);
    }
  }

  return suggestions.slice(0, 5); // Return max 5 suggestions
}

/**
 * Validates theme configuration
 */
export function validateThemeConfiguration(theme: Partial<ThemeConfiguration>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate colors
  if (theme.colors) {
    const colorFields = ['primary', 'secondary', 'accent', 'background', 'text'];
    for (const field of colorFields) {
      const color = theme.colors[field as keyof typeof theme.colors];
      if (color && !isValidColor(color)) {
        errors.push(`Invalid color format for ${field}: ${color}`);
      }
    }
  }

  // Validate typography
  if (theme.typography) {
    if (theme.typography.headingFont && !isValidFontName(theme.typography.headingFont)) {
      errors.push('Invalid heading font name');
    }
    if (theme.typography.bodyFont && !isValidFontName(theme.typography.bodyFont)) {
      errors.push('Invalid body font name');
    }
  }

  // Validate media URLs
  if (theme.media) {
    if (theme.media.logoUrl && !isValidUrl(theme.media.logoUrl)) {
      errors.push('Invalid logo URL');
    }
    if (theme.media.bannerUrl && !isValidUrl(theme.media.bannerUrl)) {
      errors.push('Invalid banner URL');
    }
    if (theme.media.videoUrl && !isValidUrl(theme.media.videoUrl)) {
      errors.push('Invalid video URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates storefront configuration
 */
export function validateStorefrontConfig(config: Partial<StorefrontConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!config.vendorId) {
    errors.push('Vendor ID is required');
  }

  if (!config.handle) {
    errors.push('Handle is required');
  } else {
    const handleValidation = validateHandleFormat(config.handle);
    if (!handleValidation.isValid && handleValidation.errors) {
      errors.push(...handleValidation.errors);
    }
  }

  if (!config.templateId) {
    errors.push('Template ID is required');
  }

  // Validate theme if provided
  if (config.theme) {
    const themeValidation = validateThemeConfiguration(config.theme);
    if (!themeValidation.isValid) {
      errors.push(...themeValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper functions
function isValidColor(color: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // Check for rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  // Check for hsl/hsla colors
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  // Check for CSS color names (basic validation)
  const cssColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'transparent'
  ];
  
  return cssColors.includes(color.toLowerCase());
}

function isValidFontName(font: string): boolean {
  // Basic font name validation - should be non-empty and reasonable length
  return font.trim().length > 0 && font.length <= 100;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}