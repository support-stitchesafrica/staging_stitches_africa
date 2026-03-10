/**
 * Storefront Creation Service
 * Ensures storefronts are created with all necessary data
 */

import { adminDb } from '@/lib/firebase-admin';
import { StorefrontConfig, ThemeConfiguration } from '@/types/storefront';

export interface CreateStorefrontRequest {
  vendorId: string;
  handle: string;
  templateId?: string;
  theme?: ThemeConfiguration;
  isPublic?: boolean;
}

export async function createStorefront(request: CreateStorefrontRequest): Promise<{ success: boolean; storefrontId?: string; error?: string }> {
  try {
    const { vendorId, handle, templateId = 'default', theme, isPublic = true } = request;

    // Check if handle already exists
    const existingQuery = await adminDb
      .collection('storefronts')
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return {
        success: false,
        error: 'A storefront with this handle already exists'
      };
    }

    // Create default theme if not provided
    const defaultTheme: ThemeConfiguration = theme || {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
        surface: '#F9FAFB',
        border: '#E5E7EB'
      },
      typography: {
        headingFont: 'Montserrat',
        bodyFont: 'Inter',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        }
      },
      layout: {
        headerStyle: 'modern-clean',
        productCardStyle: 'elegant',
        borderRadius: 'medium',
        shadows: 'subtle',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        }
      },
      variants: {
        buttonStyle: 'filled',
        cardStyle: 'elevated',
        animationLevel: 'moderate'
      },
      media: {}
    };

    // Create storefront document
    const storefrontData = {
      vendorId,
      handle,
      isPublic: true, // Explicitly set to true for public access
      templateId,
      theme: defaultTheme,
      pages: [{
        id: 'home',
        type: 'home',
        title: 'Home',
        isActive: true,
        productDisplay: {
          layout: 'grid',
          productsPerPage: 12,
          showFilters: true,
          showSorting: true,
          cartIntegration: {
            enabled: true,
            redirectToStitchesAfrica: true
          },
          promotionalDisplay: {
            showBadges: true,
            showBanners: true,
            highlightPromotions: true
          }
        }
      }],
      analytics: {
        googleAnalyticsId: '',
        facebookPixelId: '',
        trackingEnabled: true
      },
      socialPixels: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create storefront
    const storefrontRef = await adminDb.collection("staging_storefronts").add(storefrontData);

    // Create theme document
    await adminDb.collection("staging_storefront_themes").doc(vendorId).set({
      vendorId,
      templateId,
      theme: defaultTheme,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Storefront created: ${handle} (ID: ${storefrontRef.id})`);

    return {
      success: true,
      storefrontId: storefrontRef.id
    };

  } catch (error) {
    console.error('Error creating storefront:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create storefront'
    };
  }
}

export async function ensureStorefrontExists(vendorId: string, handle: string): Promise<boolean> {
  try {
    // Check if storefront exists
    const query = await adminDb
      .collection('storefronts')
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (!query.empty) {
      return true; // Already exists
    }

    // Create storefront
    const result = await createStorefront({ vendorId, handle });
    return result.success;

  } catch (error) {
    console.error('Error ensuring storefront exists:', error);
    return false;
  }
}