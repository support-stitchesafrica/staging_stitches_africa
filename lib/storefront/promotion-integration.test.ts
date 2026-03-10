// Test file for StorefrontPromotionService
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storefrontPromotionService } from './promotion-integration';
import { bogoMappingService } from '../bogo/mapping-service';
import { bogoDurationService } from '../bogo/duration-service';
import type { BogoMapping } from '../../types/bogo';
import { Timestamp } from 'firebase/firestore';

// Mock the dependencies
vi.mock('../bogo/mapping-service');
vi.mock('../bogo/duration-service');

const mockBogoMappingService = vi.mocked(bogoMappingService);
const mockBogoDurationService = vi.mocked(bogoDurationService);

describe('StorefrontPromotionService', () => {
  const mockVendorId = 'vendor123';
  const mockCurrentDate = new Date('2024-01-15T12:00:00Z');
  
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

  describe('getActivePromotionsForVendor', () => {
    it('should return only currently active promotions', async () => {
      // Mock the mapping service to return active mappings
      mockBogoMappingService.getAllMappings.mockResolvedValue([mockActiveMapping]);
      
      // Mock the duration service to confirm promotion is active
      mockBogoDurationService.getPromotionStatus.mockReturnValue('active');
      mockBogoDurationService.isPromotionActive.mockReturnValue(true);
      mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
        hasCountdown: true,
        timeRemaining: { days: 16, hours: 11, minutes: 59, seconds: 59 },
        promotionEndDate: new Date('2024-01-31T23:59:59Z'),
        isExpiringSoon: false
      });

      const result = await storefrontPromotionService.getActivePromotionsForVendor(
        mockVendorId,
        { currentDate: mockCurrentDate }
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'mapping123',
        vendorId: mockVendorId,
        type: 'bogo',
        isActive: true,
        applicableProducts: ['product123', 'freeProduct123']
      });
      
      expect(result[0].displaySettings.badgeText).toBe('Test BOGO Offer');
      expect(result[0].displaySettings.customText?.primary).toBe('BOGO');
      expect(result[0].displaySettings.customText?.secondary).toBe('Buy 1 Get 1 Free');
    });

    it('should filter out inactive promotions', async () => {
      const inactiveMapping = { ...mockActiveMapping, active: false };
      mockBogoMappingService.getAllMappings.mockResolvedValue([inactiveMapping]);
      
      // Duration service should return inactive status
      mockBogoDurationService.getPromotionStatus.mockReturnValue('inactive');
      mockBogoDurationService.isPromotionActive.mockReturnValue(false);

      const result = await storefrontPromotionService.getActivePromotionsForVendor(
        mockVendorId,
        { currentDate: mockCurrentDate }
      );

      expect(result).toHaveLength(0);
    });

    it('should filter out expired promotions', async () => {
      const expiredMapping = {
        ...mockActiveMapping,
        promotionEndDate: Timestamp.fromDate(new Date('2024-01-10T23:59:59Z'))
      };
      mockBogoMappingService.getAllMappings.mockResolvedValue([expiredMapping]);
      
      // Duration service should return expired status
      mockBogoDurationService.getPromotionStatus.mockReturnValue('expired');
      mockBogoDurationService.isPromotionActive.mockReturnValue(false);

      const result = await storefrontPromotionService.getActivePromotionsForVendor(
        mockVendorId,
        { currentDate: mockCurrentDate }
      );

      expect(result).toHaveLength(0);
    });

    it('should include expiring promotions when requested', async () => {
      mockBogoMappingService.getAllMappings.mockResolvedValue([mockActiveMapping]);
      mockBogoDurationService.getPromotionStatus.mockReturnValue('active');
      mockBogoDurationService.isPromotionActive.mockReturnValue(true);
      mockBogoDurationService.getExpiringPromotions.mockResolvedValue([
        {
          mappingId: 'mapping123',
          mainProductId: 'product123',
          expiresAt: new Date('2024-01-16T12:00:00Z'),
          timeRemaining: { days: 0, hours: 23, minutes: 59 }
        }
      ]);
      mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
        hasCountdown: true,
        timeRemaining: { days: 0, hours: 23, minutes: 59, seconds: 59 },
        promotionEndDate: new Date('2024-01-16T12:00:00Z'),
        isExpiringSoon: true
      });

      const result = await storefrontPromotionService.getActivePromotionsForVendor(
        mockVendorId,
        { includeExpiring: true, currentDate: mockCurrentDate }
      );

      expect(result).toHaveLength(1);
      expect(result[0].displaySettings.badgeText).toContain('Ending Soon!');
      expect(result[0].displaySettings.customText?.secondary).toBe('Ending Soon!');
      expect(result[0].displaySettings.priority).toBe(2);
    });
  });

  describe('hasActivePromotion', () => {
    it('should return true for products with active promotions', async () => {
      mockBogoDurationService.getActiveMappingWithDateCheck.mockResolvedValue(mockActiveMapping);

      const result = await storefrontPromotionService.hasActivePromotion('product123', mockCurrentDate);

      expect(result).toBe(true);
      expect(mockBogoDurationService.getActiveMappingWithDateCheck).toHaveBeenCalledWith('product123', mockCurrentDate);
    });

    it('should return false for products without active promotions', async () => {
      mockBogoDurationService.getActiveMappingWithDateCheck.mockResolvedValue(null);

      const result = await storefrontPromotionService.hasActivePromotion('product456', mockCurrentDate);

      expect(result).toBe(false);
    });
  });

  describe('getPromotionForProduct', () => {
    it('should return promotion config for product with active promotion', async () => {
      mockBogoDurationService.getActiveMappingWithDateCheck.mockResolvedValue(mockActiveMapping);
      mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
        hasCountdown: true,
        timeRemaining: { days: 16, hours: 11, minutes: 59, seconds: 59 },
        promotionEndDate: new Date('2024-01-31T23:59:59Z'),
        isExpiringSoon: false
      });

      const result = await storefrontPromotionService.getPromotionForProduct('product123', mockCurrentDate);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('mapping123');
      expect(result?.type).toBe('bogo');
      expect(result?.applicableProducts).toContain('product123');
    });

    it('should return null for product without active promotion', async () => {
      mockBogoDurationService.getActiveMappingWithDateCheck.mockResolvedValue(null);

      const result = await storefrontPromotionService.getPromotionForProduct('product456', mockCurrentDate);

      expect(result).toBeNull();
    });
  });
});