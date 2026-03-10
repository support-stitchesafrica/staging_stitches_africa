/**
 * Tests for Storefront Dynamic Page
 * Validates 404 handling for invalid/private storefronts
 * 
 * **Feature: merchant-storefront-upgrade, Property 8: Access Control Enforcement**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getStorefrontByHandle } from '@/lib/storefront/storefront-service';
import StorefrontPage, { generateMetadata } from './page';
import { StorefrontConfig } from '@/types/storefront';

// Mock dependencies
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/storefront/storefront-service', () => ({
  getStorefrontByHandle: vi.fn(),
}));

vi.mock('@/lib/storefront/metadata-service', () => ({
  generateStorefrontMetadata: vi.fn(() => ({
    title: 'Test Store',
    description: 'Test store description',
  })),
  generateStorefrontStructuredData: vi.fn(() => ({})),
}));

vi.mock('@/components/storefront/StorefrontRenderer', () => ({
  default: () => <div data-testid="storefront-renderer">Storefront Content</div>,
}));

const mockStorefront: StorefrontConfig = {
  id: 'test-id',
  vendorId: 'vendor-123',
  handle: 'test-store',
  isPublic: true,
  templateId: 'default',
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
    media: {},
  },
  pages: [],
  analytics: {
    enabled: true,
    customEvents: ['page_view'],
    retentionDays: 90,
    exportEnabled: true,
  },
  socialPixels: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StorefrontPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('404 Handling for Invalid Storefronts', () => {
    it('should call notFound() when storefront does not exist', async () => {
      // Arrange
      const params = { handle: 'nonexistent-store' };
      vi.mocked(getStorefrontByHandle).mockResolvedValue(null);

      // Act
      await StorefrontPage({ params });

      // Assert
      expect(getStorefrontByHandle).toHaveBeenCalledWith('nonexistent-store');
      expect(notFound).toHaveBeenCalled();
    });

    it('should call notFound() when storefront is private', async () => {
      // Arrange
      const params = { handle: 'private-store' };
      const privateStorefront = { ...mockStorefront, isPublic: false };
      vi.mocked(getStorefrontByHandle).mockResolvedValue(privateStorefront);

      // Act
      await StorefrontPage({ params });

      // Assert
      expect(getStorefrontByHandle).toHaveBeenCalledWith('private-store');
      expect(notFound).toHaveBeenCalled();
    });

    it('should render storefront when it exists and is public', async () => {
      // Arrange
      const params = { handle: 'public-store' };
      vi.mocked(getStorefrontByHandle).mockResolvedValue(mockStorefront);

      // Act
      const result = await StorefrontPage({ params });

      // Assert
      expect(getStorefrontByHandle).toHaveBeenCalledWith('public-store');
      expect(notFound).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('Metadata Generation', () => {
    it('should generate 404 metadata when storefront does not exist', async () => {
      // Arrange
      const params = { handle: 'nonexistent-store' };
      vi.mocked(getStorefrontByHandle).mockResolvedValue(null);

      // Act
      const metadata = await generateMetadata({ params });

      // Assert
      expect(metadata.title).toBe('Store Not Found - Stitches Africa');
      expect(metadata.description).toBe('The requested store could not be found on Stitches Africa.');
      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
      });
    });

    it('should generate proper metadata when storefront exists', async () => {
      // Arrange
      const params = { handle: 'test-store' };
      vi.mocked(getStorefrontByHandle).mockResolvedValue(mockStorefront);

      // Act
      const metadata = await generateMetadata({ params });

      // Assert
      expect(metadata.title).toBe('Test Store');
      expect(metadata.description).toBe('Test store description');
    });
  });
});