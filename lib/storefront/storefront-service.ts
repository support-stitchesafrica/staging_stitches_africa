/**
 * Storefront Service
 * Handles storefront data operations
 * 
 * Validates: Requirements 1.2, 1.3, 7.1
 */

import { StorefrontConfig } from '@/types/storefront';
import { sanitizeHandle } from './url-service';

// Dynamic import to avoid potential circular dependencies
async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin');
  return adminDb;
}

/**
 * Fetches a storefront by its handle
 */
export async function getStorefrontByHandle(handle: string): Promise<StorefrontConfig | null> {
  try {
    const sanitizedHandle = sanitizeHandle(handle);
    
    if (!sanitizedHandle) {
      console.log('Invalid handle provided:', handle);
      return null;
    }

    console.log('Fetching storefront with handle:', sanitizedHandle);
    
    const adminDb = await getAdminDb();
    const storefrontQuery = await adminDb
      .collection('storefronts')
      .where('handle', '==', sanitizedHandle)
      .limit(1)
      .get();

    console.log('Storefront query result:', {
      empty: storefrontQuery.empty,
      size: storefrontQuery.size
    });

    if (storefrontQuery.empty) {
      return null;
    }

    const doc = storefrontQuery.docs[0];
    const data = doc.data();

    // Fetch theme from storefront_themes collection
    let theme = data.theme || getDefaultTheme();
    try {
      const themeDoc = await adminDb
        .collection('storefront_themes')
        .doc(data.vendorId)
        .get();
      
      if (themeDoc.exists) {
        const themeData = themeDoc.data();
        if (themeData?.theme) {
          theme = themeData.theme;
        }
      }
    } catch (themeError) {
      console.warn('Error fetching theme for storefront:', themeError);
      // Continue with default theme
    }

    // Convert Firestore timestamps to Date objects
    const storefront: StorefrontConfig = {
      id: doc.id,
      vendorId: data.vendorId,
      handle: data.handle,
      isPublic: data.isPublic ?? true,
      templateId: data.templateId || 'default',
      theme,
      pages: data.pages || [getDefaultHomePage()],
      analytics: data.analytics || getDefaultAnalyticsConfig(),
      socialPixels: data.socialPixels || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };

    return storefront;
  } catch (error) {
    console.error('Error fetching storefront by handle:', error);
    return null;
  }
}

/**
 * Fetches a storefront by vendor ID
 */
export async function getStorefrontByVendorId(vendorId: string): Promise<StorefrontConfig | null> {
  try {
    const adminDb = await getAdminDb();
    const storefrontQuery = await adminDb
      .collection('storefronts')
      .where('vendorId', '==', vendorId)
      .limit(1)
      .get();

    if (storefrontQuery.empty) {
      return null;
    }

    const doc = storefrontQuery.docs[0];
    const data = doc.data();

    // Fetch theme from storefront_themes collection
    let theme = data.theme || getDefaultTheme();
    try {
      const themeDoc = await adminDb
        .collection('storefront_themes')
        .doc(vendorId)
        .get();
      
      if (themeDoc.exists) {
        const themeData = themeDoc.data();
        if (themeData?.theme) {
          theme = themeData.theme;
        }
      }
    } catch (themeError) {
      console.warn('Error fetching theme for storefront:', themeError);
      // Continue with default theme
    }

    const storefront: StorefrontConfig = {
      id: doc.id,
      vendorId: data.vendorId,
      handle: data.handle,
      isPublic: data.isPublic ?? true,
      templateId: data.templateId || 'default',
      theme,
      pages: data.pages || [getDefaultHomePage()],
      analytics: data.analytics || getDefaultAnalyticsConfig(),
      socialPixels: data.socialPixels || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };

    return storefront;
  } catch (error) {
    console.error('Error fetching storefront by vendor ID:', error);
    return null;
  }
}

/**
 * Creates a new storefront
 */
export async function createStorefront(storefrontData: Omit<StorefrontConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const adminDb = await getAdminDb();
    const now = new Date();
    const docRef = await adminDb.collection("staging_storefronts").add({
      ...storefrontData,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating storefront:', error);
    throw new Error('Failed to create storefront');
  }
}

/**
 * Updates an existing storefront
 */
export async function updateStorefront(id: string, updates: Partial<StorefrontConfig>): Promise<void> {
  try {
    const adminDb = await getAdminDb();
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;

    await adminDb.collection("staging_storefronts").doc(id).update(updateData);
  } catch (error) {
    console.error('Error updating storefront:', error);
    throw new Error('Failed to update storefront');
  }
}

/**
 * Deletes a storefront
 */
export async function deleteStorefront(id: string): Promise<void> {
  try {
    const adminDb = await getAdminDb();
    await adminDb.collection("staging_storefronts").doc(id).delete();
  } catch (error) {
    console.error('Error deleting storefront:', error);
    throw new Error('Failed to delete storefront');
  }
}

/**
 * Gets default theme configuration
 */
function getDefaultTheme() {
  return {
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#1F2937',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
    },
    layout: {
      headerStyle: 'modern',
      productCardStyle: 'card',
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
    },
    media: {},
  };
}

/**
 * Gets default home page configuration
 */
function getDefaultHomePage() {
  return {
    id: 'home',
    type: 'home' as const,
    title: 'Home',
    content: [
      {
        id: 'hero',
        type: 'hero' as const,
        order: 1,
        content: {
          title: 'Welcome to Our Store',
          subtitle: 'Discover amazing products',
        },
        styling: {},
      },
      {
        id: 'products',
        type: 'products' as const,
        order: 2,
        content: {},
        styling: {},
      },
    ],
    seoMetadata: {
      title: 'Our Store',
      description: 'Discover amazing products in our online store',
      keywords: ['fashion', 'clothing', 'style'],
    },
    productDisplay: {
      layout: 'grid' as const,
      productsPerPage: 12,
      showFilters: true,
      showSorting: true,
      cartIntegration: {
        enabled: true,
        redirectToStitchesAfrica: true,
      },
      promotionalDisplay: {
        showBadges: true,
        showBanners: true,
        highlightPromotions: true,
      },
    },
  };
}

/**
 * Gets default analytics configuration
 */
function getDefaultAnalyticsConfig() {
  return {
    enabled: true,
    customEvents: ['page_view', 'product_view', 'add_to_cart'],
    retentionDays: 90,
    exportEnabled: true,
  };
}