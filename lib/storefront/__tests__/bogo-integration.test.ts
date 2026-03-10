// Integration test to verify BOGO mappings work with storefront promotions
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storefrontPromotionService } from '../promotion-integration';
import { bogoMappingService } from '../../bogo/mapping-service';
import { bogoDurationService } from '../../bogo/duration-service';
import { SPECIFIC_BOGO_MAPPINGS } from '../../bogo/configure-specific-mappings';
import type { BogoMapping } from '../../../types/bogo';
import { Timestamp } from 'firebase/firestore';

// Mock the dependencies
vi.mock('../../bogo/mapping-service');
vi.mock('../../bogo/duration-service');

const mockBogoMappingService = vi.mocked(bogoMappingService);
const mockBogoDurationService = vi.mocked(bogoDurationService);

describe('BOGO Integration with Storefront Promotions', () => {
  const mockVendorId = 'test-vendor-123';
  const mockCurrentDate = new Date('2025-12-15T12:00:00Z'); // During promotion period

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate with existing BOGO mappings for vendor promotions', async () => {
    // Mock BOGO mappings based on the specific mappings configuration
    const mockMappings: BogoMapping[] = SPECIFIC_BOGO_MAPPINGS.slice(0, 2).map((mapping, index) => ({
      id: `mapping-${index}`,
      mainProductId: mapping.mainProductId,
      freeProductIds: mapping.freeProductIds,
      promotionStartDate: Timestamp.fromDate(mapping.promotionStartDate),
      promotionEndDate: Timestamp.fromDate(mapping.promotionEndDate),
      active: mapping.active,
      autoFreeShipping: mapping.autoFreeShipping,
      createdBy: mockVendorId,
      createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      redemptionCount: 0,
      totalRevenue: 0,
      promotionName: mapping.promotionName,
      description: mapping.description
    }));

    // Mock the BOGO service responses
    mockBogoMappingService.getAllMappings.mockResolvedValue(mockMappings);
    
    // Mock duration service to return active status
    mockBogoDurationService.getPromotionStatus.mockReturnValue('active');
    mockBogoDurationService.isPromotionActive.mockReturnValue(true);
    mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
      hasCountdown: true,
      timeRemaining: { days: 16, hours: 11, minutes: 59, seconds: 59 },
      promotionEndDate: new Date('2025-12-31T23:59:59Z'),
      isExpiringSoon: false
    });

    // Get active promotions through the storefront service
    const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
      mockVendorId,
      { currentDate: mockCurrentDate }
    );

    // Verify integration
    expect(promotions).toHaveLength(2);
    
    // Check first promotion (OUCH SNEAKERS → TTDALK LONG WALLET)
    const firstPromotion = promotions[0];
    expect(firstPromotion.id).toBe('mapping-0');
    expect(firstPromotion.type).toBe('bogo');
    expect(firstPromotion.isActive).toBe(true);
    expect(firstPromotion.applicableProducts).toContain('3trwkBLsvCiiU8nKBhb5'); // OUCH SNEAKERS
    expect(firstPromotion.applicableProducts).toContain('esjRjS6b2L5biT5Q2EA8'); // TTDALK LONG WALLET
    expect(firstPromotion.displaySettings.badgeText).toBe('December BOGO - OUCH SNEAKERS');
    expect(firstPromotion.displaySettings.customText?.primary).toBe('BOGO');
    expect(firstPromotion.displaySettings.customText?.secondary).toBe('Buy 1 Get 1 Free');

    // Check second promotion (TRAX PANTS WIDE LEG PANT → TTDALK LONG WALLET)
    const secondPromotion = promotions[1];
    expect(secondPromotion.id).toBe('mapping-1');
    expect(secondPromotion.applicableProducts).toContain('shTKa7lSx4r3uVsZCEYt'); // TRAX PANTS
    expect(secondPromotion.applicableProducts).toContain('esjRjS6b2L5biT5Q2EA8'); // TTDALK LONG WALLET
    expect(secondPromotion.displaySettings.badgeText).toBe('December BOGO - WIDE LEG FRINGE PANT');
  });

  it('should integrate with existing BOGO mappings for product-specific promotions', async () => {
    const productIds = ['3trwkBLsvCiiU8nKBhb5', 'y8YyOtzN9yer2NhHSfFk']; // OUCH SNEAKERS, AKWETE MAXI DRESS

    // Mock active mappings for these products
    mockBogoDurationService.getActiveMappingWithDateCheck
      .mockResolvedValueOnce({
        id: 'mapping-ouch',
        mainProductId: '3trwkBLsvCiiU8nKBhb5',
        freeProductIds: ['esjRjS6b2L5biT5Q2EA8'],
        promotionStartDate: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
        promotionEndDate: Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')),
        active: true,
        autoFreeShipping: true,
        createdBy: mockVendorId,
        createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
        redemptionCount: 5,
        totalRevenue: 1200,
        promotionName: 'December BOGO - OUCH SNEAKERS',
        description: 'Buy OUCH SNEAKERS ($240.00) and get TTDALK LONG WALLET ($96) free'
      } as BogoMapping)
      .mockResolvedValueOnce({
        id: 'mapping-akwete',
        mainProductId: 'y8YyOtzN9yer2NhHSfFk',
        freeProductIds: ['ZVYPmLrOo4XTXSXPLa94'],
        promotionStartDate: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
        promotionEndDate: Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')),
        active: true,
        autoFreeShipping: true,
        createdBy: mockVendorId,
        createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
        redemptionCount: 3,
        totalRevenue: 360,
        promotionName: 'December BOGO - AKWETE MAXI DRESS',
        description: 'Buy HAUTE AFRIKANA AKWETE MAXI DRESS ($120) and get BY ORE SEQUIN PURSE ($79) free'
      } as BogoMapping);

    mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
      hasCountdown: true,
      timeRemaining: { days: 16, hours: 11, minutes: 59, seconds: 59 },
      promotionEndDate: new Date('2025-12-31T23:59:59Z'),
      isExpiringSoon: false
    });

    // Get promotions for specific products
    const promotions = await storefrontPromotionService.getActivePromotionsForProducts(
      productIds,
      { currentDate: mockCurrentDate }
    );

    // Verify integration
    expect(promotions).toHaveLength(2);
    
    // Verify OUCH SNEAKERS promotion
    const ouchPromotion = promotions.find(p => p.applicableProducts.includes('3trwkBLsvCiiU8nKBhb5'));
    expect(ouchPromotion).toBeDefined();
    expect(ouchPromotion?.displaySettings.badgeText).toBe('December BOGO - OUCH SNEAKERS');
    
    // Verify AKWETE MAXI DRESS promotion
    const akwetePromotion = promotions.find(p => p.applicableProducts.includes('y8YyOtzN9yer2NhHSfFk'));
    expect(akwetePromotion).toBeDefined();
    expect(akwetePromotion?.displaySettings.badgeText).toBe('December BOGO - AKWETE MAXI DRESS');
  });

  it('should handle products with multiple free product options', async () => {
    const productId = 'ykpYu6LH8eZypC61ANUq'; // NANCY HANSON SILENT POWER TOP

    // Mock mapping with multiple free products
    mockBogoDurationService.getActiveMappingWithDateCheck.mockResolvedValue({
      id: 'mapping-nancy',
      mainProductId: 'ykpYu6LH8eZypC61ANUq',
      freeProductIds: ['v9vNnnLSeJwkICbRqFM5', 'Tz8ibBFZiTipwKn9P52Z'], // LOLA SIGNATURE CANDY, LOLA SIGNATURE EWA BEAD BAG
      promotionStartDate: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      promotionEndDate: Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')),
      active: true,
      autoFreeShipping: true,
      createdBy: mockVendorId,
      createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      redemptionCount: 2,
      totalRevenue: 240,
      promotionName: 'December BOGO - SILENT POWER TOP',
      description: 'Buy NANCY HANSON SILENT POWER TOP ($120) and choose either LOLA SIGNATURE CANDY ($108.00) or LOLA SIGNATURE EWA BEAD BAG ($98.00) free'
    } as BogoMapping);

    mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
      hasCountdown: true,
      timeRemaining: { days: 16, hours: 11, minutes: 59, seconds: 59 },
      promotionEndDate: new Date('2025-12-31T23:59:59Z'),
      isExpiringSoon: false
    });

    const promotions = await storefrontPromotionService.getActivePromotionsForProducts(
      [productId],
      { currentDate: mockCurrentDate }
    );

    expect(promotions).toHaveLength(1);
    
    const promotion = promotions[0];
    expect(promotion.applicableProducts).toHaveLength(3); // Main product + 2 free products
    expect(promotion.applicableProducts).toContain('ykpYu6LH8eZypC61ANUq'); // Main product
    expect(promotion.applicableProducts).toContain('v9vNnnLSeJwkICbRqFM5'); // Free option 1
    expect(promotion.applicableProducts).toContain('Tz8ibBFZiTipwKn9P52Z'); // Free option 2
    expect(promotion.displaySettings.badgeText).toBe('December BOGO - SILENT POWER TOP');
  });

  it('should filter out expired BOGO mappings', async () => {
    // Mock expired mapping
    const expiredMapping: BogoMapping = {
      id: 'expired-mapping',
      mainProductId: 'expired-product',
      freeProductIds: ['expired-free-product'],
      promotionStartDate: Timestamp.fromDate(new Date('2025-11-01T00:00:00Z')),
      promotionEndDate: Timestamp.fromDate(new Date('2025-11-30T23:59:59Z')), // Expired
      active: true,
      autoFreeShipping: true,
      createdBy: mockVendorId,
      createdAt: Timestamp.fromDate(new Date('2025-11-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2025-11-01T00:00:00Z')),
      redemptionCount: 0,
      totalRevenue: 0,
      promotionName: 'Expired BOGO',
      description: 'This promotion has expired'
    };

    mockBogoMappingService.getAllMappings.mockResolvedValue([expiredMapping]);
    mockBogoDurationService.getPromotionStatus.mockReturnValue('expired');
    mockBogoDurationService.isPromotionActive.mockReturnValue(false);

    const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
      mockVendorId,
      { currentDate: mockCurrentDate }
    );

    expect(promotions).toHaveLength(0);
  });

  it('should handle BOGO mappings with expiring soon status', async () => {
    const expiringMapping: BogoMapping = {
      id: 'expiring-mapping',
      mainProductId: 'expiring-product',
      freeProductIds: ['expiring-free-product'],
      promotionStartDate: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      promotionEndDate: Timestamp.fromDate(new Date('2025-12-16T23:59:59Z')), // Expires tomorrow
      active: true,
      autoFreeShipping: true,
      createdBy: mockVendorId,
      createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')),
      redemptionCount: 10,
      totalRevenue: 500,
      promotionName: 'Expiring BOGO',
      description: 'This promotion expires soon'
    };

    mockBogoMappingService.getAllMappings.mockResolvedValue([expiringMapping]);
    mockBogoDurationService.getPromotionStatus.mockReturnValue('active');
    mockBogoDurationService.isPromotionActive.mockReturnValue(true);
    mockBogoDurationService.getExpiringPromotions.mockResolvedValue([
      {
        mappingId: 'expiring-mapping',
        mainProductId: 'expiring-product',
        expiresAt: new Date('2025-12-16T23:59:59Z'),
        timeRemaining: { days: 0, hours: 23, minutes: 59 }
      }
    ]);
    mockBogoDurationService.getPromotionCountdown.mockResolvedValue({
      hasCountdown: true,
      timeRemaining: { days: 0, hours: 23, minutes: 59, seconds: 59 },
      promotionEndDate: new Date('2025-12-16T23:59:59Z'),
      isExpiringSoon: true
    });

    const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
      mockVendorId,
      { includeExpiring: true, currentDate: mockCurrentDate }
    );

    expect(promotions).toHaveLength(1);
    
    const promotion = promotions[0];
    expect(promotion.displaySettings.badgeText).toContain('Ending Soon!');
    expect(promotion.displaySettings.customText?.secondary).toBe('Ending Soon!');
    expect(promotion.displaySettings.priority).toBe(2);
    expect(promotion.displaySettings.customColors?.background).toBe('#FF4444'); // Red for urgency
  });
});