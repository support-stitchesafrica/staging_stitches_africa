/**
 * Product Catalog Layout Toggle Tests
 * Tests for grid/list layout toggle functionality
 * 
 * **Feature: merchant-storefront-upgrade, Property 7: Product Showcase and Cart Integration**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCatalog from '../ProductCatalog';
import { ProductDisplayConfig } from '@/types/storefront';

// Mock the client-side product service
vi.mock('@/lib/storefront/client-product-service', () => {
  const mockProducts = [
    {
      product_id: 'product-1',
      title: 'Test Product 1',
      description: 'A beautiful test product',
      type: 'ready-to-wear',
      category: 'clothing',
      availability: 'in_stock' as const,
      status: 'verified' as const,
      price: {
        base: 29.99,
        currency: 'NGN',
        discount: 0,
      },
      discount: 0,
      deliveryTimeline: '3-5 days',
      returnPolicy: '30 days',
      images: ['/placeholder-product.svg'],
      thumbnail: '/placeholder-product.svg',
      tailor_id: 'test-vendor-123',
      tailor: 'Test Vendor',
      tags: ['fashion'],
      featured: true,
      isNewArrival: false,
      isBestSeller: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isPublished: true,
    },
    {
      product_id: 'product-2',
      title: 'Test Product 2',
      description: 'Another great product',
      type: 'ready-to-wear',
      category: 'accessories',
      availability: 'in_stock' as const,
      status: 'verified' as const,
      price: {
        base: 49.99,
        currency: 'NGN',
        discount: 10,
      },
      discount: 10,
      deliveryTimeline: '1-3 days',
      returnPolicy: '30 days',
      images: ['/placeholder-product.svg'],
      thumbnail: '/placeholder-product.svg',
      tailor_id: 'test-vendor-123',
      tailor: 'Test Vendor',
      tags: ['fashion'],
      featured: false,
      isNewArrival: true,
      isBestSeller: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      isPublished: true,
    },
  ];

  return {
    getVendorProducts: vi.fn().mockResolvedValue({ products: mockProducts, total: mockProducts.length }),
    getVendorProductCategories: vi.fn().mockResolvedValue(['clothing', 'accessories']),
    getVendorProductPriceRange: vi.fn().mockResolvedValue({ min: 29.99, max: 49.99 }),
  };
});

describe('ProductCatalog Layout Toggle', () => {
  const mockVendorId = 'test-vendor-123';
  
  const mockConfig: ProductDisplayConfig = {
    layout: 'grid',
    productsPerPage: 12,
    showFilters: false,
    showSorting: false,
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

  it('should render layout toggle buttons for grid and list views', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    // Wait for component to load
    await screen.findByText('Showing 2 of 2 products');

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

    // Wait for component to load
    await screen.findByText('Showing 2 of 2 products');

    // Layout toggle should not be present for carousel
    expect(screen.queryByTitle('Grid view')).not.toBeInTheDocument();
    expect(screen.queryByTitle('List view')).not.toBeInTheDocument();
  });

  it('should switch between grid and list layouts when toggle buttons are clicked', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    // Wait for component to load
    await screen.findByText('Showing 2 of 2 products');

    const gridButton = screen.getByTitle('Grid view');
    const listButton = screen.getByTitle('List view');

    // Initially should be in grid view (default)
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).not.toHaveClass('bg-blue-600');

    // Click list view button
    fireEvent.click(listButton);
    
    // Should switch to list view
    expect(listButton).toHaveClass('bg-blue-600');
    expect(gridButton).not.toHaveClass('bg-blue-600');

    // Click grid view button
    fireEvent.click(gridButton);
    
    // Should switch back to grid view
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).not.toHaveClass('bg-blue-600');
  });

  it('should start with list layout when configured', async () => {
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

    // Wait for component to load
    await screen.findByText('Showing 2 of 2 products');

    const gridButton = screen.getByTitle('Grid view');
    const listButton = screen.getByTitle('List view');

    // Should start in list view when configured
    expect(listButton).toHaveClass('bg-blue-600');
    expect(gridButton).not.toHaveClass('bg-blue-600');
  });

  it('should display products with layout switching functionality', async () => {
    render(
      <ProductCatalog
        vendorId={mockVendorId}
        config={mockConfig}
      />
    );

    // Wait for products to load
    await screen.findByText('Test Product 1');
    await screen.findByText('Test Product 2');
    await screen.findByText('Showing 2 of 2 products');

    const gridButton = screen.getByTitle('Grid view');
    const listButton = screen.getByTitle('List view');

    // Initially should be in grid view
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).not.toHaveClass('bg-blue-600');

    // Products should be displayed
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    // Switch to list view
    fireEvent.click(listButton);
    
    // Layout should change
    expect(listButton).toHaveClass('bg-blue-600');
    expect(gridButton).not.toHaveClass('bg-blue-600');

    // Products should still be displayed
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    // Switch back to grid view
    fireEvent.click(gridButton);
    
    // Layout should change back
    expect(gridButton).toHaveClass('bg-blue-600');
    expect(listButton).not.toHaveClass('bg-blue-600');

    // Products should still be displayed
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });
});