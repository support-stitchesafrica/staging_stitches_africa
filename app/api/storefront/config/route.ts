import { NextRequest, NextResponse } from 'next/server';
import { getStorefrontByVendorId, createStorefront, updateStorefront } from '@/lib/storefront/storefront-service';
import { StorefrontConfig } from '@/types/storefront';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const storefront = await getStorefrontByVendorId(vendorId);
    
    return NextResponse.json({
      success: true,
      data: storefront
    });
  } catch (error) {
    console.error('Error fetching storefront config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storefront configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, handle, isPublic, templateId, theme } = body;

    if (!vendorId || !handle) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID and handle are required' },
        { status: 400 }
      );
    }

    // Check if storefront already exists for this vendor
    const existingStorefront = await getStorefrontByVendorId(vendorId);
    
    if (existingStorefront) {
      // Update existing storefront
      await updateStorefront(existingStorefront.id, {
        handle,
        isPublic: isPublic ?? true,
        templateId: templateId || 'default',
        theme: theme || existingStorefront.theme
      });

      return NextResponse.json({
        success: true,
        data: { ...existingStorefront, handle, isPublic, templateId, theme }
      });
    } else {
      // Create new storefront
      const storefrontData: Omit<StorefrontConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        vendorId,
        handle,
        isPublic: isPublic ?? true,
        templateId: templateId || 'default',
        theme: theme || getDefaultTheme(),
        pages: [getDefaultHomePage()],
        analytics: getDefaultAnalyticsConfig(),
        socialPixels: {}
      };

      const storefrontId = await createStorefront(storefrontData);

      return NextResponse.json({
        success: true,
        data: { id: storefrontId, ...storefrontData }
      });
    }
  } catch (error) {
    console.error('Error saving storefront config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save storefront configuration' },
      { status: 500 }
    );
  }
}

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

function getDefaultAnalyticsConfig() {
  return {
    enabled: true,
    customEvents: ['page_view', 'product_view', 'add_to_cart'],
    retentionDays: 90,
    exportEnabled: true,
  };
}