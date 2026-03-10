// Example usage of storefront types and validation
import type { 
  StorefrontConfig, 
  ThemeConfiguration, 
  ProductDisplayConfig,
  PromotionalConfig 
} from './types';
import { 
  validateHandleFormat, 
  sanitizeHandle, 
  validateStorefrontConfig 
} from './validation';

// Example StorefrontConfig
export const exampleStorefrontConfig: StorefrontConfig = {
  id: 'storefront_123',
  vendorId: 'vendor_456',
  handle: 'fashion-boutique',
  isPublic: true,
  templateId: 'modern_template_1',
  theme: {
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#45b7d1',
      background: '#ffffff',
      text: '#333333'
    },
    typography: {
      headingFont: 'Playfair Display',
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
      headerStyle: 'centered',
      productCardStyle: 'modern',
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      }
    },
    media: {
      logoUrl: 'https://example.com/logo.png',
      bannerUrl: 'https://example.com/banner.jpg'
    }
  },
  pages: [{
    id: 'home_page_1',
    type: 'home',
    title: 'Fashion Boutique - Premium Clothing',
    content: [
      {
        id: 'hero_section',
        type: 'hero',
        order: 1,
        content: {
          title: 'Welcome to Fashion Boutique',
          subtitle: 'Discover premium fashion pieces',
          backgroundImage: 'https://example.com/hero-bg.jpg'
        },
        styling: {
          textAlign: 'center',
          padding: '4rem 2rem'
        }
      },
      {
        id: 'products_section',
        type: 'products',
        order: 2,
        content: {
          title: 'Featured Products',
          showAll: false,
          limit: 8
        },
        styling: {
          padding: '2rem'
        }
      }
    ],
    seoMetadata: {
      title: 'Fashion Boutique - Premium Clothing & Accessories',
      description: 'Discover our curated collection of premium fashion pieces and accessories.',
      keywords: ['fashion', 'boutique', 'premium', 'clothing', 'accessories'],
      ogTitle: 'Fashion Boutique - Premium Fashion',
      ogDescription: 'Shop our exclusive collection of premium fashion pieces.',
      twitterCard: 'summary_large_image'
    },
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
    enabled: true,
    trackingId: 'SA_ANALYTICS_123',
    customEvents: ['product_view', 'add_to_cart', 'checkout_start'],
    retentionDays: 90,
    exportEnabled: true
  },
  socialPixels: {
    facebook: {
      pixelId: '1234567890',
      enabled: true
    },
    tiktok: {
      pixelId: 'TT_PIXEL_123',
      enabled: false
    }
  },
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-20T15:30:00Z')
};

// Example PromotionalConfig
export const examplePromotionalConfig: PromotionalConfig = {
  id: 'promo_123',
  vendorId: 'vendor_456',
  type: 'discount',
  isActive: true,
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: new Date('2024-01-31T23:59:59Z'),
  applicableProducts: ['product_1', 'product_2', 'product_3'],
  displaySettings: {
    badgeText: '20% OFF',
    badgeColor: '#ff4757',
    bannerMessage: 'New Year Sale - 20% off selected items!',
    priority: 1
  }
};

// Example validation usage
export function demonstrateValidation() {
  // Test handle validation
  const handleResult = validateHandleFormat('my-fashion-store');
  console.log('Handle validation:', handleResult);

  // Test handle sanitization
  const sanitized = sanitizeHandle('My Fashion Store!');
  console.log('Sanitized handle:', sanitized);

  // Test storefront config validation
  const configValidation = validateStorefrontConfig({
    vendorId: 'vendor_123',
    handle: 'test-store',
    templateId: 'template_1'
  });
  console.log('Config validation:', configValidation);

  return {
    handleResult,
    sanitized,
    configValidation
  };
}

// Type checking examples
export function typeCheckingExamples() {
  // This should compile without errors, demonstrating all interfaces are properly defined
  const config: StorefrontConfig = exampleStorefrontConfig;
  const promo: PromotionalConfig = examplePromotionalConfig;
  
  // Access nested properties to verify interface structure
  const primaryColor = config.theme.colors.primary;
  const headingFont = config.theme.typography.headingFont;
  const layoutStyle = config.theme.layout.headerStyle;
  const pageTitle = config.pages[0].title;
  const seoTitle = config.pages[0].seoMetadata.title;
  const productLayout = config.pages[0].productDisplay.layout;
  
  return {
    primaryColor,
    headingFont,
    layoutStyle,
    pageTitle,
    seoTitle,
    productLayout,
    promoType: promo.type,
    promoBadge: promo.displaySettings.badgeText
  };
}