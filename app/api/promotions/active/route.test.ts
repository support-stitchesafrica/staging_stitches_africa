// Integration test for active promotions API
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { bogoMappingService } from '../../../../lib/bogo/mapping-service';
import { bogoDurationService } from '../../../../lib/bogo/duration-service';
import { storefrontPromotionService } from '../../../../lib/storefront/promotion-integration';
import type { BogoMapping } from '../../../../types/bogo';
import type { PromotionalConfig } from '../../../../types/storefront';
import { Timestamp } from 'firebase/firestore';

// Mock the dependencies
vi.mock('../../../../lib/bogo/mapping-service');
vi.mock('../../../../lib/bogo/duration-service');
vi.mock('../../../../lib/storefront/promotion-integration');

const mockBogoMappingService = vi.mocked(bogoMappingService);
const mockBogoDurationService = vi.mocked(bogoDurationService);
const mockStorefrontPromotionService = vi.mocked(storefrontPromotionService);

describe('/api/promotions/active', () => {
  const mockVendorId = 'vendor123';
  
  const mockActiveMapping: BogoMapping = {
    id: 'mapping123',
    mainProductId: 'product123',
    freeProductIds: ['freeProduct123'],
    promotionStartDate: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
    promotionEndDate: Timestamp.fromDate(new Date('2024-01-31T23:59:59Z')),
    active: true,
    autoFreeShipping: true,
    createdBy: mockVendorId,
    createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
    redemptionCount: 5,
    totalRevenue: 250.00,
    promotionName: 'Test BOGO Offer',
    description: 'Buy one test product and get another free!'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return active promotions for valid vendor', async () => {
    // Mock the storefront promotion service
    const mockPromotionalConfig: PromotionalConfig = {
      id: 'mapping123',
      vendorId: mockVendorId,
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

    mockStorefrontPromotionService.getActivePromotionsForVendor.mockResolvedValue([mockPromotionalConfig]);

    // Create request
    const request = new NextRequest(`http://localhost:3000/api/promotions/active?vendorId=${mockVendorId}`);
    
    // Call the API
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.promotions).toHaveLength(1);
    
    const promotion = data.promotions[0];
    expect(promotion.id).toBe('mapping123');
    expect(promotion.vendorId).toBe(mockVendorId);
    expect(promotion.type).toBe('bogo');
    expect(promotion.isActive).toBe(true);
    expect(promotion.applicableProducts).toEqual(['product123', 'freeProduct123']);
    expect(promotion.displaySettings.badgeText).toBe('Test BOGO Offer');
  });

  it('should return 400 for missing vendorId', async () => {
    const request = new NextRequest('http://localhost:3000/api/promotions/active');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('vendorId is required');
  });

  it('should return empty array when no active promotions', async () => {
    mockStorefrontPromotionService.getActivePromotionsForVendor.mockResolvedValue([]);

    const request = new NextRequest(`http://localhost:3000/api/promotions/active?vendorId=${mockVendorId}`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(0);
    expect(data.promotions).toHaveLength(0);
  });

  it('should filter out expired promotions', async () => {
    const expiredMapping = {
      ...mockActiveMapping,
      promotionEndDate: Timestamp.fromDate(new Date('2024-01-10T23:59:59Z'))
    };
    
    mockBogoMappingService.getAllMappings.mockResolvedValue([expiredMapping]);
    mockBogoDurationService.getPromotionStatus.mockReturnValue('expired');
    mockBogoDurationService.isPromotionActive.mockReturnValue(false);

    const request = new NextRequest(`http://localhost:3000/api/promotions/active?vendorId=${mockVendorId}`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(0);
    expect(data.promotions).toHaveLength(0);
  });

  it('should return BOGO format when requested', async () => {
    mockBogoMappingService.getAllMappings.mockResolvedValue([mockActiveMapping]);
    mockBogoDurationService.getPromotionStatus.mockReturnValue('active');
    mockBogoDurationService.isPromotionActive.mockReturnValue(true);

    const request = new NextRequest(`http://localhost:3000/api/promotions/active?vendorId=${mockVendorId}&format=bogo`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    
    const promotion = data.promotions[0];
    expect(promotion.id).toBe('mapping123');
    expect(promotion.mainProductId).toBe('product123');
    expect(promotion.freeProductIds).toEqual(['freeProduct123']);
    expect(promotion.active).toBe(true);
  });

  it('should handle service errors gracefully', async () => {
    mockStorefrontPromotionService.getActivePromotionsForVendor.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(`http://localhost:3000/api/promotions/active?vendorId=${mockVendorId}`);
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch active promotions');
    expect(data.details).toBe('Database error');
  });

  describe('POST /api/promotions/active', () => {
    it('should return promotions for specific products', async () => {
      const mockPromotionalConfig: PromotionalConfig = {
        id: 'mapping123',
        vendorId: mockVendorId,
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

      mockStorefrontPromotionService.getActivePromotionsForProducts.mockResolvedValue([mockPromotionalConfig]);

      const request = new NextRequest('http://localhost:3000/api/promotions/active', {
        method: 'POST',
        body: JSON.stringify({
          productIds: ['product123', 'product456']
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
      expect(data.promotions).toHaveLength(1);
      expect(data.metadata.productIds).toEqual(['product123', 'product456']);
      expect(data.metadata.requestedProducts).toBe(2);
    });

    it('should return 400 for missing productIds', async () => {
      const request = new NextRequest('http://localhost:3000/api/promotions/active', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('productIds array is required and must not be empty');
    });

    it('should return 400 for empty productIds array', async () => {
      const request = new NextRequest('http://localhost:3000/api/promotions/active', {
        method: 'POST',
        body: JSON.stringify({
          productIds: []
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('productIds array is required and must not be empty');
    });
  });
});