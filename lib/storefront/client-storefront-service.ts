/**
 * Client-side Storefront Service
 * Handles storefront configuration operations from the client
 */

import { StorefrontConfig } from '@/types/storefront';

export interface StorefrontConfigResponse {
  success: boolean;
  data?: StorefrontConfig;
  error?: string;
}

export interface SaveStorefrontConfigRequest {
  vendorId: string;
  handle: string;
  isPublic?: boolean;
  templateId?: string;
  theme?: any;
}

/**
 * Fetches storefront configuration for a vendor
 */
export async function getStorefrontConfig(vendorId: string): Promise<StorefrontConfigResponse> {
  try {
    const response = await fetch(`/api/storefront/config?vendorId=${encodeURIComponent(vendorId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching storefront config:', error);
    return {
      success: false,
      error: 'Failed to fetch storefront configuration'
    };
  }
}

/**
 * Saves storefront configuration
 */
export async function saveStorefrontConfig(config: SaveStorefrontConfigRequest): Promise<StorefrontConfigResponse> {
  try {
    const response = await fetch('/api/storefront/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving storefront config:', error);
    return {
      success: false,
      error: 'Failed to save storefront configuration'
    };
  }
}

/**
 * Generates preview URL for a storefront handle
 */
export function generatePreviewUrl(handle: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${baseUrl}/store/${handle}`;
}

/**
 * Validates storefront handle format
 */
export function validateHandle(handle: string): { isValid: boolean; error?: string } {
  if (!handle) {
    return { isValid: false, error: 'Handle is required' };
  }

  if (handle.length < 3) {
    return { isValid: false, error: 'Handle must be at least 3 characters long' };
  }

  if (handle.length > 50) {
    return { isValid: false, error: 'Handle must be less than 50 characters long' };
  }

  // Check for valid characters (alphanumeric and hyphens only)
  const validPattern = /^[a-z0-9-]+$/;
  if (!validPattern.test(handle)) {
    return { isValid: false, error: 'Handle can only contain lowercase letters, numbers, and hyphens' };
  }

  // Check for reserved words
  const reservedWords = [
    'admin', 'api', 'app', 'blog', 'dashboard', 'help', 'home', 'login', 'logout',
    'register', 'settings', 'support', 'terms', 'privacy', 'about', 'contact',
    'store', 'shop', 'cart', 'checkout', 'account', 'profile', 'orders'
  ];

  if (reservedWords.includes(handle.toLowerCase())) {
    return { isValid: false, error: 'This handle is reserved and cannot be used' };
  }

  return { isValid: true };
}