// BOGO Specific Mappings Integration Test
// Tests each of the 7 product pairs end-to-end

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bogoMappingService } from './mapping-service';
import { bogoCartService } from './cart-service';
import { 
  configureSpecificBogoMappings, 
  validateProductIds, 
  testMappingsWithProductData,
  verifyFreeShippingForAllMappings,
  SPECIFIC_BOGO_MAPPINGS,
  PRODUCT_ID_MAPPINGS
} from './configure-specific-mappings';
import type { CartItem, Product } from '../../types';
import type { BogoCartItem } from '../../types/bogo';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  getFirebaseDb: vi.fn().mockResolvedValue({
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn()
  })
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({}) }),
  getDocs: vi.fn().mockResolvedValue({ empty: false, docs: [] }),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn().mockReturnValue({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }),
  Timestamp: {
    now: vi.fn().mockReturnValue({ toDate: () => new Date() }),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date }))
  }
}));

describe('BOGO Specific Mappings Integration Tests', () => {
  const mockUserId = 'test-admin-user';
  const createdMappingIds: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup created mappings
    for (const mappingId of createdMappingIds) {
      try {
        await bogoMappingService.deleteMapping(mappingId, mockUserId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdMappingIds.length = 0;
  });

  describe('Product ID Validation', () => {
    it('should validate all required product IDs exist', async () => {
      const validation = await validateProductIds();
      
      expect(validation.valid).toBe(true);
      expect(validation.missingProducts).toHaveLength(0);
      expect(validation.validProducts.length).toBeGreaterThan(0);
      
      // Verify all expected product IDs are included
      const expectedProductIds = Object.values(PRODUCT_ID_MAPPINGS);
      expectedProductIds.forEach(productId => {
        expect(validation.validProducts).toContain(productId);
      });
    });
  });

  describe('Mapping Configuration', () => {
    it('should configure all 7 specific BOGO mappings successfully', async () => {
      // Mock successful mapping creation
      let mockIdCounter = 1;
      vi.spyOn(bogoMappingService, 'createMapping').mockImplementation(async (data, userId) => {
        const mockMapping = {
          id: `mock-mapping-${mockIdCounter++}`,
          ...data,
          createdBy: userId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          redemptionCount: 0,
          totalRevenue: 0
        };
        createdMappingIds.push(mockMapping.id);
        return mockMapping;
      });

      vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null);

      const result = await configureSpecificBogoMappings(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.created).toBe(SPECIFIC_BOGO_MAPPINGS.length);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle duplicate mappings gracefully', async () => {
      // Mock existing mapping for first product
      vi.spyOn(bogoMappingService, 'getActiveMapping')
        .mockResolvedValueOnce({
          id: 'existing-mapping',
          mainProductId: SPECIFIC_BOGO_MAPPINGS[0].mainProductId,
          freeProductIds: SPECIFIC_BOGO_MAPPINGS[0].freeProductIds,
          active: true
        } as any)
        .mockResolvedValue(null);

      vi.spyOn(bogoMappingService, 'createMapping').mockImplementation(async (data, userId) => {
        const mockMapping = {
          id: `mock-mapping-${Date.now()}`,
          ...data,
          createdBy: userId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          redemptionCount: 0,
          totalRevenue: 0
        };
        return mockMapping;
      });

      const result = await configureSpecificBogoMappings(mockUserId);
      
      // Should create all except the first one (duplicate)
      expect(result.created).toBe(SPECIFIC_BOGO_MAPPINGS.length - 1);
    });
  });

  describe('Individual Mapping Tests', () => {
    const testCases = [
      {
        name: 'OUCH SNEAKERS → TTDALK LONG WALLET',
        mainProductId: 'ouch-sneakers-240',
        freeProductId: 'ttdalk-long-wallet-96',
        mainPrice: 240.00,
        freePrice: 96.00
      },
      {
        name: 'TRAX PANTS WIDE LEG PANT → TTDALK LONG WALLET',
        mainProductId: 'trax-pants-wide-leg-pant',
        freeProductId: 'ttdalk-long-wallet-96',
        mainPrice: 85.00,
        freePrice: 96.00
      },
      {
        name: 'TRAX PANTS SPLATTERED SHORTS → TTDALK LONG WALLET',
        mainProductId: 'trax-pants-splattered-shorts',
        freeProductId: 'ttdalk-long-wallet-96',
        mainPrice: 75.00,
        freePrice: 96.00
      },
      {
        name: 'AKWETE MAXI DRESS → SEQUIN PURSE',
        mainProductId: 'haute-afrikana-akwete-maxi-dress-120',
        freeProductId: 'by-ore-sequin-purse-79',
        mainPrice: 120.00,
        freePrice: 79.00
      }
    ];

    testCases.forEach(testCase => {
      it(`should handle ${testCase.name} mapping correctly`, async () => {
        // Create mock products
        const mainProduct: Product = {
          product_id: testCase.mainProductId,
          title: testCase.name.split(' → ')[0],
          description: 'Test main product',
          type: 'ready-to-wear',
          category: 'accessories',
          availability: 'in_stock',
          status: 'verified',
          price: { base: testCase.mainPrice, currency: 'USD' },
          discount: 0,
          deliveryTimeline: '3-5 days',
          returnPolicy: '30 days',
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          tags: ['test']
        };

        const freeProduct: Product = {
          ...mainProduct,
          product_id: testCase.freeProductId,
          title: testCase.name.split(' → ')[1],
          price: { base: testCase.freePrice, currency: 'USD' }
        };

        // Mock cart items
        const cartItems: CartItem[] = [];

        // Mock BOGO mapping
        const mockMapping = {
          id: 'test-mapping',
          mainProductId: testCase.mainProductId,
          freeProductIds: [testCase.freeProductId],
          active: true,
          autoFreeShipping: true,
          promotionStartDate: { toDate: () => new Date('2024-12-01') } as any,
          promotionEndDate: { toDate: () => new Date('2024-12-31') } as any
        };

        vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(mockMapping as any);

        // Test adding main product with BOGO
        const result = await bogoCartService.addProductWithBogo(mainProduct, 1, cartItems);

        expect(result.success).toBe(true);
        expect(result.freeProductAdded).toBe(true);
        expect(result.freeProductId).toBe(testCase.freeProductId);
        expect(result.shippingUpdated).toBe(true);
      });
    });

    it('should handle NANCY HANSON SILENT POWER TOP with multiple free product options', async () => {
      const mainProduct: Product = {
        product_id: 'nancy-hanson-silent-power-top-120',
        title: 'NANCY HANSON SILENT POWER TOP',
        description: 'Test main product with multiple free options',
        type: 'ready-to-wear',
        category: 'clothing',
        availability: 'in_stock',
        status: 'verified',
        price: { base: 120.00, currency: 'USD' },
        discount: 0,
        deliveryTimeline: '3-5 days',
        returnPolicy: '30 days',
        images: ['/test-image.jpg'],
        tailor_id: 'test-tailor',
        tailor: 'Test Tailor',
        tags: ['test']
      };

      const cartItems: CartItem[] = [];

      // Mock mapping with multiple free products
      const mockMapping = {
        id: 'test-mapping-multiple',
        mainProductId: 'nancy-hanson-silent-power-top-120',
        freeProductIds: ['lola-signature-candy-108', 'lola-signature-ewa-bead-bag-98'],
        active: true,
        autoFreeShipping: true,
        promotionStartDate: { toDate: () => new Date('2024-12-01') } as any,
        promotionEndDate: { toDate: () => new Date('2024-12-31') } as any
      };

      vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(mockMapping as any);

      const result = await bogoCartService.addProductWithBogo(mainProduct, 1, cartItems);

      expect(result.success).toBe(true);
      expect(result.freeProductAdded).toBe(false);
      expect(result.requiresSelection).toBe(true);
      expect(result.availableFreeProducts).toEqual(['lola-signature-candy-108', 'lola-signature-ewa-bead-bag-98']);
    });

    it('should handle IYANGA WOMAN AINA DRESS with multiple free product options', async () => {
      const mainProduct: Product = {
        product_id: 'iyanga-woman-aina-dress-366',
        title: 'IYANGA WOMAN AINA DRESS',
        description: 'Test main product with multiple free options',
        type: 'ready-to-wear',
        category: 'clothing',
        availability: 'in_stock',
        status: 'verified',
        price: { base: 366.00, currency: 'USD' },
        discount: 0,
        deliveryTimeline: '3-5 days',
        returnPolicy: '30 days',
        images: ['/test-image.jpg'],
        tailor_id: 'test-tailor',
        tailor: 'Test Tailor',
        tags: ['test']
      };

      const cartItems: CartItem[] = [];

      // Mock mapping with multiple free products
      const mockMapping = {
        id: 'test-mapping-multiple-2',
        mainProductId: 'iyanga-woman-aina-dress-366',
        freeProductIds: ['lola-signature-candy-108', 'lola-signature-ewa-bead-bag-98'],
        active: true,
        autoFreeShipping: true,
        promotionStartDate: { toDate: () => new Date('2024-12-01') } as any,
        promotionEndDate: { toDate: () => new Date('2024-12-31') } as any
      };

      vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(mockMapping as any);

      const result = await bogoCartService.addProductWithBogo(mainProduct, 1, cartItems);

      expect(result.success).toBe(true);
      expect(result.freeProductAdded).toBe(false);
      expect(result.requiresSelection).toBe(true);
      expect(result.availableFreeProducts).toEqual(['lola-signature-candy-108', 'lola-signature-ewa-bead-bag-98']);
    });
  });

  describe('Cart Behavior Tests', () => {
    it('should apply free shipping to all BOGO orders', async () => {
      const cartItems: CartItem[] = [
        {
          product_id: 'lola-signature-candy-108',
          title: 'LOLA SIGNATURE CANDY',
          description: 'Main product',
          price: 108.00,
          discount: 0,
          quantity: 1,
          color: null,
          size: null,
          sizes: null,
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          user_id: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: 'iyanga-woman-aina-dress-366',
          title: 'IYANGA WOMAN AINA DRESS',
          description: 'Free product',
          price: 0,
          discount: 0,
          quantity: 1,
          color: null,
          size: null,
          sizes: null,
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          user_id: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isBogoFree: true,
          bogoMainProductId: 'lola-signature-candy-108'
        } as BogoCartItem
      ];

      const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);
      expect(shippingCost).toBe(0);
    });

    it('should maintain 1:1 quantity ratio for BOGO pairs', async () => {
      const cartItems: CartItem[] = [
        {
          product_id: 'nancy-hanson-pearl-neutral-78',
          title: 'NANCY HANSON PEARL NEUTRAL',
          description: 'Main product',
          price: 78.00,
          discount: 0,
          quantity: 2,
          color: null,
          size: null,
          sizes: null,
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          user_id: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: 'lola-signature-ewa-bead-bag-98',
          title: 'LOLA SIGNATURE EWA BEAD BAG',
          description: 'Free product',
          price: 0,
          discount: 0,
          quantity: 2,
          color: null,
          size: null,
          sizes: null,
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          user_id: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isBogoFree: true,
          bogoMainProductId: 'nancy-hanson-pearl-neutral-78'
        } as BogoCartItem
      ];

      const validation = await bogoCartService.validateBogoCart(cartItems);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle cascading removal correctly', async () => {
      const cartItems: CartItem[] = [
        {
          product_id: 'by-ore-sequin-purse-79',
          title: 'BY ORE SEQUIN PURSE',
          description: 'Main product',
          price: 79.00,
          discount: 0,
          quantity: 1,
          color: null,
          size: null,
          sizes: null,
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          user_id: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          product_id: 'haute-afrikana-akwete-maxi-dress-120',
          title: 'HAUTE AFRIKANA AKWETE MAXI DRESS',
          description: 'Free product',
          price: 0,
          discount: 0,
          quantity: 1,
          color: null,
          size: null,
          sizes: null,
          images: ['/test-image.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor',
          user_id: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isBogoFree: true,
          bogoMainProductId: 'by-ore-sequin-purse-79'
        } as BogoCartItem
      ];

      const result = await bogoCartService.removeBogoPair('by-ore-sequin-purse-79', cartItems);
      
      expect(result.success).toBe(true);
      expect(result.itemsToRemove).toContain('by-ore-sequin-purse-79');
      expect(result.itemsToRemove).toContain('haute-afrikana-akwete-maxi-dress-120');
      expect(result.shippingUpdated).toBe(true); // Should lose free shipping
    });
  });

  describe('System Integration Tests', () => {
    it('should test all mappings with actual product data', async () => {
      // Mock successful mapping retrieval
      vi.spyOn(bogoMappingService, 'getAllMappings').mockResolvedValue(
        SPECIFIC_BOGO_MAPPINGS.map((mapping, index) => ({
          id: `mapping-${index}`,
          ...mapping,
          createdBy: mockUserId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          redemptionCount: 0,
          totalRevenue: 0,
          promotionStartDate: { toDate: () => mapping.promotionStartDate } as any,
          promotionEndDate: { toDate: () => mapping.promotionEndDate } as any
        }))
      );

      vi.spyOn(bogoMappingService, 'getMapping').mockImplementation(async (id) => {
        const index = parseInt(id.split('-')[1]);
        const mapping = SPECIFIC_BOGO_MAPPINGS[index];
        return {
          id,
          ...mapping,
          createdBy: mockUserId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          redemptionCount: 0,
          totalRevenue: 0,
          promotionStartDate: { toDate: () => mapping.promotionStartDate } as any,
          promotionEndDate: { toDate: () => mapping.promotionEndDate } as any
        };
      });

      const result = await testMappingsWithProductData();
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(SPECIFIC_BOGO_MAPPINGS.length);
      
      result.results.forEach(testResult => {
        expect(testResult.tested).toBe(true);
        expect(testResult.error).toBeUndefined();
      });
    });

    it('should verify free shipping applies to all mappings', async () => {
      // Mock mappings with free shipping enabled
      vi.spyOn(bogoMappingService, 'getAllMappings').mockResolvedValue(
        SPECIFIC_BOGO_MAPPINGS.map((mapping, index) => ({
          id: `mapping-${index}`,
          ...mapping,
          autoFreeShipping: true, // Ensure all have free shipping
          createdBy: mockUserId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          redemptionCount: 0,
          totalRevenue: 0,
          promotionStartDate: { toDate: () => mapping.promotionStartDate } as any,
          promotionEndDate: { toDate: () => mapping.promotionEndDate } as any
        }))
      );

      const result = await verifyFreeShippingForAllMappings();
      
      expect(result.success).toBe(true);
      expect(result.mappingsWithFreeShipping).toBe(SPECIFIC_BOGO_MAPPINGS.length);
      expect(result.mappingsWithoutFreeShipping).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle mapping creation failures gracefully', async () => {
      vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null);
      vi.spyOn(bogoMappingService, 'createMapping').mockRejectedValue(new Error('Database error'));

      const result = await configureSpecificBogoMappings(mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(SPECIFIC_BOGO_MAPPINGS.length);
    });

    it('should handle invalid product IDs in cart operations', async () => {
      const invalidProduct: Product = {
        product_id: 'invalid-product-id',
        title: 'Invalid Product',
        description: 'This product should not have BOGO',
        type: 'ready-to-wear',
        category: 'accessories',
        availability: 'in_stock',
        status: 'verified',
        price: { base: 100, currency: 'USD' },
        discount: 0,
        deliveryTimeline: '3-5 days',
        returnPolicy: '30 days',
        images: ['/test-image.jpg'],
        tailor_id: 'test-tailor',
        tailor: 'Test Tailor',
        tags: ['test']
      };

      vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null);

      const result = await bogoCartService.addProductWithBogo(invalidProduct, 1, []);
      
      expect(result.success).toBe(true);
      expect(result.freeProductAdded).toBe(false);
      expect(result.requiresSelection).toBeFalsy();
    });
  });
});