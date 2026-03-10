/**
 * ProductCard Component Test
 * 
 * Simple test to verify the ProductCard component renders correctly
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

describe('ProductCard', () => {
  const mockProduct: Product = {
    product_id: 'test-123',
    title: 'Traditional Ankara Dress',
    description: 'Beautiful traditional dress',
    type: 'ready-to-wear',
    category: 'Dresses',
    availability: 'in_stock',
    status: 'verified',
    price: {
      base: 25000,
      currency: '$',
      discount: 10,
    },
    discount: 10,
    deliveryTimeline: '3-5 days',
    returnPolicy: '7 days',
    images: ['/test-image.jpg'],
    tailor_id: 'tailor-123',
    tailor: 'Test Vendor',
    tags: ['traditional', 'ankara'],
    vendor: {
      id: 'vendor-123',
      name: 'Test Vendor',
    },
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    // Check if product title is rendered
    expect(screen.getByText('Traditional Ankara Dress')).toBeDefined();
    
    // Check if vendor name is rendered
    expect(screen.getByText('Test Vendor')).toBeDefined();
    
    // Check if availability status is rendered
    expect(screen.getByText('In Stock')).toBeDefined();
  });

  it('displays discount badge when product has discount', () => {
    render(<ProductCard product={mockProduct} />);
    
    // Check if discount badge is rendered
    expect(screen.getByText('-10%')).toBeDefined();
  });

  it('renders action buttons when handlers are provided', () => {
    const mockHandlers = {
      onAddToCart: () => {},
      onViewDetails: () => {},
      onTryOn: () => {},
    };
    
    render(<ProductCard product={mockProduct} {...mockHandlers} />);
    
    // Check if action buttons are rendered
    expect(screen.getByText('Try It On')).toBeDefined();
    expect(screen.getByText('Add to Cart')).toBeDefined();
    expect(screen.getByText('Details')).toBeDefined();
  });

  it('does not render Try It On button for out of stock products', () => {
    const outOfStockProduct = {
      ...mockProduct,
      availability: 'out_of_stock' as const,
    };
    
    render(
      <ProductCard 
        product={outOfStockProduct} 
        onTryOn={() => {}}
        onAddToCart={() => {}}
        onViewDetails={() => {}}
      />
    );
    
    // Try It On button should not be rendered
    expect(screen.queryByText('Try It On')).toBeNull();
  });

  it('formats price correctly with currency', () => {
    render(<ProductCard product={mockProduct} />);
    
    // Check if price is formatted (should show discounted price)
    const priceElement = screen.getByText(/$22,500/);
    expect(priceElement).toBeDefined();
  });
});
