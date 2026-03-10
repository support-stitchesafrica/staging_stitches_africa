// Integration test for apply promotions API
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { storefrontPromotionService } from '../../../../lib/storefront/promotion-integration';
import { bogoCartService } from '../../../../lib/bogo/cart-service';
import type { CartItem } from '../../../../types';
import type { PromotionalConfig } from '../../../../types/storefront';

// Mock the dependencies
vi.mock('../../../../lib/storefront/promotion-integration');
vi.mock('../../../../lib/bogo/cart-service');

const mockStorefrontPromotionService = vi.mocked(storefrontPromotionService);
const mockBogoCartService = vi.mocked(bogoCartService);

describe('/api/promotions/apply', () => {
  const mockCartItems: CartItem[] = [
    {
      product_id: 'product123',
      title: 'Test Product',
      description: 'A test product',
      price: 100,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['/test-image.jpg'],
      tailor_id: 'tailor123',
      tailor: 'Test Tailor',
      user_id: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockPromotionalConfig: PromotionalConfig = {
    id: 'mapping123',
    vendorId: 'vendor123',
    type: 'bogo',
    isActive: true,
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-31T23:59:59Z'),
    applicableProducts: ['product123', 'freeProduct123'],
    displaySettings: {
      badgeText: 'Test BOGO Offer',
      badgeColor: '#FF6B35',
      bannerMessage: 'Buy one test product and get another free!',
      priority: 1,
      customColors: {
        background: '#FF6B35',
        text: '#FFFFFF',
        border: '#E55A2B'
      },
      customText: {
        primary: 'BOGO',
        secondary: 'Buy 1 Get 1 Free',
        prefix: '🎉',
        suffix: ''
      },
      badgeVariant: 'savings',
      showIcon: true
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply promotional pricing to cart items', async () => {
    // Mock the services
    mockStorefrontPromotionService.getActivePromotionsForProducts.mockResolvedValue([mockPromotionalConfig]);
    mockStorefrontPromotionService.getActivePromotionsForVendor.mockResolvedValue([]);
    
    mockBogoCartService.getBogoCartSummary.mockReturnValue({
      hasBogoItems: true,
      bogoSavings: 50,
      freeShipping: true,
      bogoItemsCount: 1
    });
    
    mockBogoCartService.calculateShippingWithBogo.mockReturnValue(0);

    const request = new NextRequest('http://localhost:3000/api/promotions/apply', {
      method: 'POST',
      body: JSON.stringify({
        cartItems: mockCartItems,
        vendorId: 'vendor123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cartItems).toBeDefined();
    expect(data.promotions).toHaveLength(1);
    expect(data.summary.hasBogoItems).toBe(true);
    expect(data.summary.bogoSavings).toBe(50);
    expect(data.summary.shippingCost).toBe(0);
    expect(data.metadata.originalItemCount).toBe(1);
    expect(data.metadata.promotionsApplied).toBe(1);
  });

  it('should return 400 for missing cartItems', async () => {
    const request = new NextRequest('http://localhost:3000/api/promotions/apply', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('cartItems array is required');
  });

  it('should handle empty cart items', async () => {
    mockStorefrontPromotionService.getActivePromotionsForProducts.mockResolvedValue([]);
    mockBogoCartService.getBogoCartSummary.mockReturnValue({
      hasBogoItems: false,
      bogoSavings: 0,
      freeShipping: false,
      bogoItemsCount: 0
    });
    mockBogoCartService.calculateShippingWithBogo.mockReturnValue(30);

    const request = new NextRequest('http://localhost:3000/api/promotions/apply', {
      method: 'POST',
      body: JSON.stringify({
        cartItems: []
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cartItems).toHaveLength(0);
    expect(data.promotions).toHaveLength(0);
    expect(data.summary.hasBogoItems).toBe(false);
    expect(data.summary.bogoSavings).toBe(0);
    expect(data.summary.shippingCost).toBe(30);
  });

  it('should handle vendor-specific promotions', async () => {
    mockStorefrontPromotionService.getActivePromotionsForProducts.mockResolvedValue([]);
    mockStorefrontPromotionService.getActivePromotionsForVendor.mockResolvedValue([mockPromotionalConfig]);
    
    mockBogoCartService.getBogoCartSummary.mockReturnValue({
      hasBogoItems: true,
      bogoSavings: 50,
      freeShipping: true,
      bogoItemsCount: 1
    });
    
    mockBogoCartService.calculateShippingWithBogo.mockReturnValue(0);

    const request = new NextRequest('http://localhost:3000/api/promotions/apply', {
      method: 'POST',
      body: JSON.stringify({
        cartItems: mockCartItems,
        vendorId: 'vendor123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.promotions).toHaveLength(1);
    expect(mockStorefrontPromotionService.getActivePromotionsForVendor).toHaveBeenCalledWith(
      'vendor123',
      { currentDate: expect.any(Date) }
    );
  });

  it('should handle service errors gracefully', async () => {
    mockStorefrontPromotionService.getActivePromotionsForProducts.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/promotions/apply', {
      method: 'POST',
      body: JSON.stringify({
        cartItems: mockCartItems
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to apply promotional pricing');
    expect(data.details).toBe('Database error');
  });
});