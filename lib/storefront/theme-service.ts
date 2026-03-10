import { ThemeConfiguration } from '@/types/storefront';
import { getAuth } from 'firebase/auth';

export interface SaveThemeRequest {
  vendorId: string;
  templateId: string;
  theme: ThemeConfiguration;
  heroContent?: {
    title?: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  businessInfo?: {
    businessName?: string;
    description?: string;
    handle?: string;
    slogan?: string;
  };
}

export interface SaveThemeResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string[];
}

export interface GetThemeResponse {
  success: boolean;
  data?: {
    templateId: string;
    theme: ThemeConfiguration;
    heroContent?: {
      title?: string;
      subtitle?: string;
      description?: string;
      ctaText?: string;
      ctaLink?: string;
      backgroundImage?: string;
      backgroundVideo?: string;
    };
    businessInfo?: {
      businessName?: string;
      description?: string;
      handle?: string;
      slogan?: string;
    };
  };
  error?: string;
}

/**
 * Saves theme configuration to Firebase
 */
export async function saveThemeConfiguration(request: SaveThemeRequest): Promise<SaveThemeResponse> {
  try {
    console.log('Theme Service: Saving theme configuration:', request);
    
    // For now, skip authentication to avoid issues
    // TODO: Add proper authentication later
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Temporarily comment out auth to debug
    // const auth = getAuth();
    // if (auth.currentUser) {
    //   const token = await auth.currentUser.getIdToken();
    //   headers['Authorization'] = `Bearer ${token}`;
    // }

    const response = await fetch('/api/storefront/theme', {
      method: 'PUT',
      headers,
      body: JSON.stringify(request),
    });

    console.log('Theme Service: API response status:', response.status);
    const data = await response.json();
    console.log('Theme Service: API response data:', data);
    
    if (!response.ok) {
      console.error('Theme Service: API error:', data);
      return {
        success: false,
        error: data.error || 'Failed to save theme configuration',
        details: data.details
      };
    }

    return data;
  } catch (error) {
    console.error('Theme Service: Network error saving theme configuration:', error);
    return {
      success: false,
      error: 'Network error occurred while saving theme configuration'
    };
  }
}

/**
 * Gets theme configuration from Firebase
 */
export async function getThemeConfiguration(vendorId: string): Promise<GetThemeResponse> {
  try {
    console.log('Theme Service: Fetching theme configuration for vendor:', vendorId);
    
    // For now, skip authentication to avoid issues
    // TODO: Add proper authentication later
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Temporarily comment out auth to debug
    // const auth = getAuth();
    // if (auth.currentUser) {
    //   const token = await auth.currentUser.getIdToken();
    //   headers['Authorization'] = `Bearer ${token}`;
    // }

    const response = await fetch(`/api/storefront/theme?vendorId=${encodeURIComponent(vendorId)}`, {
      method: 'GET',
      headers,
    });

    console.log('Theme Service: API response status:', response.status);
    const data = await response.json();
    console.log('Theme Service: API response data:', data);
    
    if (!response.ok) {
      console.error('Theme Service: API error:', data);
      return {
        success: false,
        error: data.error || 'Failed to fetch theme configuration'
      };
    }

    return data;
  } catch (error) {
    console.error('Theme Service: Network error fetching theme configuration:', error);
    return {
      success: false,
      error: 'Network error occurred while fetching theme configuration'
    };
  }
}