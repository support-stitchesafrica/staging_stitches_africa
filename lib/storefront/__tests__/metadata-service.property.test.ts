/**
 * Property-Based Tests for Metadata Service
 * Tests OpenGraph metadata generation with random inputs
 * 
 * **Feature: merchant-storefront-upgrade, Property 11: OpenGraph Metadata Generation**
 */

import fc from 'fast-check';
import { generateStorefrontMetadata, generateStorefrontStructuredData } from '../metadata-service';
import { StorefrontConfig } from '@/types/storefront';

// Generators for property-based testing
const colorGenerator = fc.string({ minLength: 6, maxLength: 6 })
  .filter(s => /^[0-9A-Fa-f]{6}$/.test(s))
  .map(hex => `#${hex}`);

const fontSizeConfigGenerator = fc.record({
  xs: fc.constant('0.75rem'),
  sm: fc.constant('0.875rem'),
  base: fc.constant('1rem'),
  lg: fc.constant('1.125rem'),
  xl: fc.constant('1.25rem'),
  '2xl': fc.constant('1.5rem'),
  '3xl': fc.constant('1.875rem'),
  '4xl': fc.constant('2.25rem'),
});

const spacingConfigGenerator = fc.record({
  xs: fc.constant('0.25rem'),
  sm: fc.constant('0.5rem'),
  md: fc.constant('1rem'),
  lg: fc.constant('1.5rem'),
  xl: fc.constant('2rem'),
  '2xl': fc.constant('3rem'),
});

const themeGenerator = fc.record({
  colors: fc.record({
    primary: colorGenerator,
    secondary: colorGenerator,
    accent: colorGenerator,
    background: colorGenerator,
    text: colorGenerator,
  }),
  typography: fc.record({
    headingFont: fc.constantFrom('Inter', 'Roboto', 'Open Sans', 'Lato'),
    bodyFont: fc.constantFrom('Inter', 'Roboto', 'Open Sans', 'Lato'),
    sizes: fontSizeConfigGenerator,
  }),
  layout: fc.record({
    headerStyle: fc.constantFrom('modern', 'classic', 'minimal'),
    productCardStyle: fc.constantFrom('card', 'minimal', 'detailed'),
    spacing: spacingConfigGenerator,
  }),
  media: fc.record({
    logoUrl: fc.option(fc.string().map(s => `https://example.com/${s}.jpg`)),
    bannerUrl: fc.option(fc.string().map(s => `https://example.com/${s}.jpg`)),
    videoUrl: fc.option(fc.string().map(s => `https://example.com/${s}.mp4`)),
  }),
});

const seoMetadataGenerator = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 300 }),
  keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
  ogTitle: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  ogDescription: fc.option(fc.string({ minLength: 1, maxLength: 300 })),
  ogImage: fc.option(fc.string().map(s => `https://example.com/${s}.jpg`)),
  twitterCard: fc.option(fc.constantFrom('summary', 'summary_large_image')),
  canonicalUrl: fc.option(fc.string().map(s => `https://example.com/${s}`)),
});

const productDisplayConfigGenerator = fc.record({
  layout: fc.constantFrom('grid', 'list', 'carousel'),
  productsPerPage: fc.integer({ min: 1, max: 50 }),
  showFilters: fc.boolean(),
  showSorting: fc.boolean(),
  cartIntegration: fc.record({
    enabled: fc.boolean(),
    redirectToStitchesAfrica: fc.boolean(),
  }),
  promotionalDisplay: fc.record({
    showBadges: fc.boolean(),
    showBanners: fc.boolean(),
    highlightPromotions: fc.boolean(),
  }),
});

const storefrontPageGenerator = fc.record({
  id: fc.constant('home'),
  type: fc.constant('home' as const),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.constant([]),
  seoMetadata: seoMetadataGenerator,
  productDisplay: productDisplayConfigGenerator,
});

const handleGenerator = fc.string({ minLength: 3, maxLength: 50 })
  .filter(s => /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s.toLowerCase()))
  .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));

const storefrontConfigGenerator = fc.record({
  id: fc.uuid(),
  vendorId: fc.uuid(),
  handle: handleGenerator,
  isPublic: fc.boolean(),
  templateId: fc.constantFrom('minimal', 'modern', 'classic'),
  theme: themeGenerator,
  pages: fc.array(storefrontPageGenerator, { minLength: 1, maxLength: 1 }),
  analytics: fc.record({
    enabled: fc.boolean(),
    customEvents: fc.array(fc.string(), { maxLength: 5 }),
    retentionDays: fc.integer({ min: 1, max: 365 }),
    exportEnabled: fc.boolean(),
  }),
  socialPixels: fc.record({}),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

describe('Metadata Service Property Tests', () => {
  it('Property 11: OpenGraph metadata generation should work for any valid storefront', () => {
    // **Feature: merchant-storefront-upgrade, Property 11: OpenGraph Metadata Generation**
    fc.assert(
      fc.property(storefrontConfigGenerator, (storefront: StorefrontConfig) => {
        const metadata = generateStorefrontMetadata(storefront);

        // Basic metadata should always be present
        expect(typeof metadata.title).toBe('string');
        expect(metadata.title.length).toBeGreaterThan(0);
        expect(typeof metadata.description).toBe('string');
        expect(metadata.description.length).toBeGreaterThan(0);

        // OpenGraph metadata should always be present
        expect(metadata.openGraph).toBeDefined();
        expect(typeof metadata.openGraph?.title).toBe('string');
        expect(metadata.openGraph?.title?.length).toBeGreaterThan(0);
        expect(typeof metadata.openGraph?.description).toBe('string');
        expect(metadata.openGraph?.description?.length).toBeGreaterThan(0);
        expect(metadata.openGraph?.siteName).toBe('Stitches Africa');
        expect(metadata.openGraph?.type).toBe('website');
        expect(metadata.openGraph?.locale).toBe('en_US');

        // OpenGraph images should be an array
        expect(Array.isArray(metadata.openGraph?.images)).toBe(true);
        const images = metadata.openGraph?.images as any[];
        expect(images.length).toBeGreaterThan(0);
        expect(typeof images[0].url).toBe('string');
        expect(images[0].width).toBe(1200);
        expect(images[0].height).toBe(630);
        expect(typeof images[0].alt).toBe('string');

        // Twitter metadata should always be present
        expect(metadata.twitter).toBeDefined();
        expect(typeof metadata.twitter?.title).toBe('string');
        expect(metadata.twitter?.title?.length).toBeGreaterThan(0);
        expect(typeof metadata.twitter?.description).toBe('string');
        expect(metadata.twitter?.description?.length).toBeGreaterThan(0);
        expect(metadata.twitter?.creator).toBe('@StitchesAfrica');
        expect(metadata.twitter?.site).toBe('@StitchesAfrica');

        // Robots metadata should respect public/private setting
        expect(metadata.robots?.index).toBe(storefront.isPublic);
        expect(metadata.robots?.follow).toBe(storefront.isPublic);

        // Custom metadata should include storefront info
        expect(metadata.other?.['storefront-id']).toBe(storefront.id);
        expect(metadata.other?.['vendor-id']).toBe(storefront.vendorId);
        expect(metadata.other?.['storefront-handle']).toBe(storefront.handle);

        // URL should be properly formatted
        expect(metadata.openGraph?.url).toContain(`/store/${storefront.handle}`);
      }),
      { numRuns: 10 }
    );
  });

  it('Property 11: Structured data generation should work for any valid storefront', () => {
    // **Feature: merchant-storefront-upgrade, Property 11: OpenGraph Metadata Generation**
    fc.assert(
      fc.property(storefrontConfigGenerator, (storefront: StorefrontConfig) => {
        const structuredData = generateStorefrontStructuredData(storefront);

        // Schema.org structure should be valid
        expect(structuredData['@context']).toBe('https://schema.org');
        expect(structuredData['@type']).toBe('Store');
        expect(typeof structuredData.name).toBe('string');
        expect(structuredData.name.length).toBeGreaterThan(0);
        expect(typeof structuredData.description).toBe('string');
        expect(structuredData.description.length).toBeGreaterThan(0);

        // URL should be properly formatted
        expect(structuredData.url).toContain(`/store/${storefront.handle}`);

        // Parent organization should be present
        expect(structuredData.parentOrganization).toBeDefined();
        expect(structuredData.parentOrganization['@type']).toBe('Organization');
        expect(structuredData.parentOrganization.name).toBe('Stitches Africa');

        // Search action should be present
        expect(structuredData.potentialAction).toBeDefined();
        expect(structuredData.potentialAction['@type']).toBe('SearchAction');
        expect(structuredData.potentialAction.target).toContain(storefront.handle);
      }),
      { numRuns: 10 }
    );
  });

  it('Property 11: Metadata should handle missing SEO data gracefully', () => {
    // **Feature: merchant-storefront-upgrade, Property 11: OpenGraph Metadata Generation**
    fc.assert(
      fc.property(
        storefrontConfigGenerator.map(storefront => ({
          ...storefront,
          pages: [
            {
              ...storefront.pages[0],
              seoMetadata: {
                title: '',
                description: '',
                keywords: [],
              },
            },
          ],
        })),
        (storefront: StorefrontConfig) => {
          const metadata = generateStorefrontMetadata(storefront);

          // Should still generate valid metadata with fallbacks
          expect(typeof metadata.title).toBe('string');
          expect(metadata.title.length).toBeGreaterThan(0);
          expect(metadata.title).toContain(storefront.handle);

          expect(typeof metadata.description).toBe('string');
          expect(metadata.description.length).toBeGreaterThan(0);
          expect(metadata.description).toContain(storefront.handle);

          // OpenGraph should still be valid
          expect(metadata.openGraph?.title).toBeDefined();
          expect(metadata.openGraph?.description).toBeDefined();
          expect(Array.isArray(metadata.openGraph?.images)).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });
});