/**
 * Metadata Service Tests
 * Tests for OpenGraph metadata generation
 * 
 * **Feature: merchant-storefront-upgrade, Property 11: OpenGraph Metadata Generation**
 */

import { generateStorefrontMetadata, generateStorefrontStructuredData } from '../metadata-service';
import { StorefrontConfig } from '@/types/storefront';

// Mock storefront configuration for testing
const mockStorefront: StorefrontConfig = {
  id: 'test-storefront-id',
  vendorId: 'test-vendor-id',
  handle: 'test-store',
  isPublic: true,
  templateId: 'modern',
  theme: {
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
    media: {
      logoUrl: 'https://example.com/logo.png',
      bannerUrl: 'https://example.com/banner.jpg',
    },
  },
  pages: [
    {
      id: 'home',
      type: 'home',
      title: 'Test Store Home',
      content: [],
      seoMetadata: {
        title: 'Test Store - Premium Fashion',
        description: 'Discover amazing fashion at Test Store on Stitches Africa',
        keywords: ['fashion', 'clothing', 'test-store'],
        ogTitle: 'Test Store - Premium Fashion Collection',
        ogDescription: 'Shop the latest fashion trends at Test Store',
        ogImage: 'https://example.com/og-image.jpg',
        twitterCard: 'summary_large_image',
      },
      productDisplay: {
        layout: 'grid',
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
    },
  ],
  analytics: {
    enabled: true,
    customEvents: ['page_view', 'product_view'],
    retentionDays: 90,
    exportEnabled: true,
  },
  socialPixels: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('Metadata Service', () => {
  describe('generateStorefrontMetadata', () => {
    it('should generate complete OpenGraph metadata for a storefront', () => {
      const metadata = generateStorefrontMetadata(mockStorefront);

      // Basic metadata
      expect(metadata.title).toBe('Test Store - Premium Fashion');
      expect(metadata.description).toBe('Discover amazing fashion at Test Store on Stitches Africa');
      expect(metadata.keywords).toBe('fashion, clothing, test-store');

      // OpenGraph metadata
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe('Test Store - Premium Fashion Collection');
      expect(metadata.openGraph?.description).toBe('Shop the latest fashion trends at Test Store');
      expect(metadata.openGraph?.siteName).toBe('Stitches Africa');
      expect(metadata.openGraph?.type).toBe('website');
      expect(metadata.openGraph?.locale).toBe('en_US');

      // OpenGraph images
      expect(metadata.openGraph?.images).toBeDefined();
      expect(Array.isArray(metadata.openGraph?.images)).toBe(true);
      const images = metadata.openGraph?.images as any[];
      expect(images[0].url).toBe('https://example.com/og-image.jpg');
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
      expect(images[0].alt).toBe('test-store store logo');

      // Twitter metadata
      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('Test Store - Premium Fashion Collection');
      expect(metadata.twitter?.description).toBe('Shop the latest fashion trends at Test Store');
      expect(metadata.twitter?.creator).toBe('@StitchesAfrica');
      expect(metadata.twitter?.site).toBe('@StitchesAfrica');

      // Robots metadata
      expect(metadata.robots).toBeDefined();
      expect(metadata.robots?.index).toBe(true);
      expect(metadata.robots?.follow).toBe(true);

      // Custom metadata
      expect(metadata.other).toBeDefined();
      expect(metadata.other?.['storefront-id']).toBe('test-storefront-id');
      expect(metadata.other?.['vendor-id']).toBe('test-vendor-id');
      expect(metadata.other?.['storefront-handle']).toBe('test-store');
    });

    it('should handle private storefronts correctly', () => {
      const privateStorefront = {
        ...mockStorefront,
        isPublic: false,
      };

      const metadata = generateStorefrontMetadata(privateStorefront);

      expect(metadata.robots?.index).toBe(false);
      expect(metadata.robots?.follow).toBe(false);
      expect(metadata.robots?.googleBot?.index).toBe(false);
      expect(metadata.robots?.googleBot?.follow).toBe(false);
    });

    it('should use fallback values when SEO metadata is missing', () => {
      const storefrontWithoutSEO = {
        ...mockStorefront,
        pages: [
          {
            ...mockStorefront.pages[0],
            seoMetadata: {
              title: '',
              description: '',
              keywords: [],
            },
          },
        ],
      };

      const metadata = generateStorefrontMetadata(storefrontWithoutSEO);

      expect(metadata.title).toBe('test-store - Stitches Africa Store');
      expect(metadata.description).toContain('Shop the latest collection from test-store');
      expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/logo.png');
    });

    it('should use placeholder image when no logo is available', () => {
      const storefrontWithoutLogo = {
        ...mockStorefront,
        theme: {
          ...mockStorefront.theme,
          media: {},
        },
        pages: [
          {
            ...mockStorefront.pages[0],
            seoMetadata: {
              ...mockStorefront.pages[0].seoMetadata,
              ogImage: undefined,
            },
          },
        ],
      };

      const metadata = generateStorefrontMetadata(storefrontWithoutLogo);

      expect(metadata.openGraph?.images?.[0]?.url).toBe('/placeholder-logo.png');
    });
  });

  describe('generateStorefrontStructuredData', () => {
    it('should generate valid JSON-LD structured data', () => {
      const structuredData = generateStorefrontStructuredData(mockStorefront);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Store');
      expect(structuredData.name).toBe('Test Store - Premium Fashion');
      expect(structuredData.description).toBe('Discover amazing fashion at Test Store on Stitches Africa');
      expect(structuredData.logo).toBe('https://example.com/logo.png');
      expect(structuredData.image).toBe('https://example.com/banner.jpg');

      // Parent organization
      expect(structuredData.parentOrganization).toBeDefined();
      expect(structuredData.parentOrganization['@type']).toBe('Organization');
      expect(structuredData.parentOrganization.name).toBe('Stitches Africa');

      // Search action
      expect(structuredData.potentialAction).toBeDefined();
      expect(structuredData.potentialAction['@type']).toBe('SearchAction');
    });

    it('should fallback to logo when banner is not available', () => {
      const storefrontWithoutBanner = {
        ...mockStorefront,
        theme: {
          ...mockStorefront.theme,
          media: {
            logoUrl: 'https://example.com/logo.png',
          },
        },
      };

      const structuredData = generateStorefrontStructuredData(storefrontWithoutBanner);

      expect(structuredData.image).toBe('https://example.com/logo.png');
    });
  });
});