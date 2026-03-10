/**
 * Product Catalog Component Tests
 * Tests for storefront product catalog with grid layout
 * 
 * **Feature: merchant-storefront-upgrade, Property 7: Product Showcase and Cart Integration**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCatalog from '../ProductCatalog';
import { ProductDisplayConfig } from '@/types/storefront';
import * as productService from '@/lib/storefront/client-product-service';

// Mock the client-side product service
vi.mock('@/lib/storefront/client-product-service', () => ({
  getVendorProducts: vi.fn(),
  getVendorProductCategories: vi.fn(),
  getVendorProductPriceRange: vi.fn(),
}));

describe('ProductCatalog', () => {
  const mockVendorId = 'test-vendor-123';
  
  const mockConfig: ProductDisplayConfig = {
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
  };

  const mockProducts = {
    products: [
      {
        product_id: 'product-1',
        title: 'Test Product 1',
        description: 'A beautiful test product',
        price: { base: 29.99, currency: 'NGN', discount: 0 },
        images: ['image1.jpg'],
        category: 'clothing',
        availability: 'in_stock' as const,
        status: 'verified' as const,
        tags: ['fashion'],
        featured: true,
        tailor_id: mockVendorId,
        type: 'ready-to-wear',
        createdAt: new Date().toISOString(),
      },
      {
        product_id: 'product-2',
        title: 'Test Product 2',
        description: 'Another great product',
        price: { base: 49.99, currency: 'NGN', discount: 0 },
        images: ['image2.jpg'],
        category: 'accessories',
        availability: 'in_stock' as const,
        status: 'verified' as const,
        tags: ['fashion'],
        isNewArrival: true,
        tailor_id: mockVendorId,
        type: 'ready-to-wear',
        createdAt: new Date().toISOString(),
      },
    ],
    total: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementations
    vi.mocked(productService.getVendorProducts).mockResolvedValue(mockProducts);
    vi.mocked(productService.getVendorProductCategories).mockResolvedValue(['clothing', 'accessories']);
    vi.mocked(productService.getVendorProductPriceRange).mockResolvedValue({ min: 29.99, max: 49.99 });
  });

  it('should render loading state initially', () => {
    // Mock pending promises
    vi.mocked(productService.getVendorProducts).mockReturnValue(new Promise(() => {}));
    vi.mocked(productService.getVendorProductCategories).mockReturnValue(new Promise(() => {}));
    vi.mocked(productService.getVendorProductPriceRange).mockReturnValue(new Promise(() => {}));

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should render products in grid layout', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    // Check that grid layout class is applied
    const productsContainer = document.querySelector('.grid');
    expect(productsContainer).toBeInTheDocument();
  });

  it('should render filters and sorting controls', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    // Check category options
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('should hide filters when showFilters is false', async () => {
    const configWithoutFilters = {
      ...mockConfig,
      showFilters: false,
    };

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={configWithoutFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  it('should hide sorting when showSorting is false', async () => {
    const configWithoutSorting = {
      ...mockConfig,
      showSorting: false,
      showFilters: false,
    };

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={configWithoutSorting}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sort by:')).not.toBeInTheDocument();
  });

  it('should render no products message when empty', async () => {
    vi.mocked(productService.getVendorProducts).mockResolvedValue({ products: [], total: 0 });
    vi.mocked(productService.getVendorProductCategories).mockResolvedValue([]);
    vi.mocked(productService.getVendorProductPriceRange).mockResolvedValue({ min: 0, max: 0 });

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('This store doesn\'t have any products yet.')).toBeInTheDocument();
    });
  });

  it('should handle error state gracefully', async () => {
    vi.mocked(productService.getVendorProducts).mockRejectedValue(new Error('Failed to fetch'));
    vi.mocked(productService.getVendorProductCategories).mockRejectedValue(new Error('Failed to fetch'));
    vi.mocked(productService.getVendorProductPriceRange).mockRejectedValue(new Error('Failed to fetch'));

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load products. Please try again.')).toBeInTheDocument();
    });
  });

  it('should apply list layout when configured', async () => {
    const listConfig = {
      ...mockConfig,
      layout: 'list' as const,
    };

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={listConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    const productsContainer = document.querySelector('.space-y-4');
    expect(productsContainer).toBeInTheDocument();
  });

  it('should display product count', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument();
    });
  });

  it('should render layout toggle buttons for grid and list views', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    // Check that layout toggle buttons are present
    expect(screen.getByTitle('Grid view')).toBeInTheDocument();
    expect(screen.getByTitle('List view')).toBeInTheDocument();
  });

  it('should not render layout toggle for carousel layout', async () => {
    const carouselConfig = {
      ...mockConfig,
      layout: 'carousel' as const,
    };

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={carouselConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    // Layout toggle should not be present for carousel
    expect(screen.queryByTitle('Grid view')).not.toBeInTheDocument();
    expect(screen.queryByTitle('List view')).not.toBeInTheDocument();
  });

  it('should switch between grid and list layouts when toggle buttons are clicked', async () => {
    const user = userEvent.setup();

    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    const gridButton = screen.getByTitle('Grid view');
    const listButton = screen.getByTitle('List view');

    // Initially should be in grid view (default)
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).not.toHaveClass('bg-blue-600');

    // Click list view button
    await user.click(listButton);
    
    // Should switch to list view
    expect(listButton).toHaveClass('bg-blue-600');
    expect(gridButton).not.toHaveClass('bg-blue-600');

    // Click grid view button
    await user.click(gridButton);
    
    // Should switch back to grid view
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).not.toHaveClass('bg-blue-600');
  });
});