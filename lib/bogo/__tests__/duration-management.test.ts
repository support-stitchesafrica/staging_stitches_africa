// BOGO Duration Management Property-Based Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { bogoDurationService } from '../duration-service';
import { bogoMappingService } from '../mapping-service';
import { bogoCartService } from '../cart-service';
import type { BogoMapping } from '../../../types/bogo';
import { BogoPromotionStatus } from '../../../types/bogo';
import type { CartItem } from '../../../types';
import { Timestamp } from 'firebase/firestore';

// Mock the services
vi.mock('../mapping-service', () => ({
  bogoMappingService: {
    getActiveMapping: vi.fn(),
    getAllMappings: vi.fn(),
    getMapping: vi.fn(),
    getPromotionStatus: vi.fn(),
  }
}));

vi.mock('../cart-service', () => ({
  bogoCartService: {
    addProductWithBogo: vi.fn(),
    calculateShippingWithBogo: vi.fn(),
  }
}));

describe('BOGO Duration Management Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Property 18: Pre-Start Date Inactive
  // Feature: bogo-promotion, Property 18: Pre-Start Date Inactive
  it('should not trigger BOGO for mappings before start date', () => {
    fc.assert(
      fc.property(
        fc.record({
          mappingId: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          mainProductId: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          freeProductIds: fc.array(
            fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0), 
            { minLength: 1, maxLength: 3 }
          ),
          futureDays: fc.integer({ min: 1, max: 30 }), // 1-30 days in future
          promotionDuration: fc.integer({ min: 1, max: 30 }), // 1-30 days duration
        }),
        (testData) => {
          const currentDate = new Date();
          const startDate = new Date(currentDate.getTime() + (testData.futureDays * 24 * 60 * 60 * 1000));
          const endDate = new Date(startDate.getTime() + (testData.promotionDuration * 24 * 60 * 60 * 1000));

          const mapping: BogoMapping = {
            id: testData.mappingId,
            mainProductId: testData.mainProductId,
            freeProductIds: testData.freeProductIds,
            promotionStartDate: Timestamp.fromDate(startDate),
            promotionEndDate: Timestamp.fromDate(endDate),
            active: true,
            autoFreeShipping: true,
            createdBy: 'test-user',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            redemptionCount: 0,
            totalRevenue: 0,
          };

          // Test that the promotion is not active before start date
          const isActive = bogoDurationService.isPromotionActive(mapping, currentDate);
          expect(isActive).toBe(false);

          // Test that the promotion is correctly identified as before start
          const isBeforeStart = bogoDurationService.isPromotionBeforeStart(mapping, currentDate);
          expect(isBeforeStart).toBe(true);

          // Test that the status is NOT_STARTED
          const status = bogoDurationService.getPromotionStatus(mapping, currentDate);
          expect(status).toBe(BogoPromotionStatus.NOT_STARTED);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 19: Post-End Date Inactive
  // Feature: bogo-promotion, Property 19: Post-End Date Inactive
  it('should not trigger BOGO for mappings after end date', () => {
    fc.assert(
      fc.property(
        fc.record({
          mappingId: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          mainProductId: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          freeProductIds: fc.array(
            fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0), 
            { minLength: 1, maxLength: 3 }
          ),
          pastDays: fc.integer({ min: 1, max: 30 }), // 1-30 days in past
          promotionDuration: fc.integer({ min: 1, max: 30 }), // 1-30 days duration
        }),
        (testData) => {
          const currentDate = new Date();
          const endDate = new Date(currentDate.getTime() - (testData.pastDays * 24 * 60 * 60 * 1000));
          const startDate = new Date(endDate.getTime() - (testData.promotionDuration * 24 * 60 * 60 * 1000));

          const mapping: BogoMapping = {
            id: testData.mappingId,
            mainProductId: testData.mainProductId,
            freeProductIds: testData.freeProductIds,
            promotionStartDate: Timestamp.fromDate(startDate),
            promotionEndDate: Timestamp.fromDate(endDate),
            active: true,
            autoFreeShipping: true,
            createdBy: 'test-user',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            redemptionCount: 0,
            totalRevenue: 0,
          };

          // Test that the promotion is not active after end date
          const isActive = bogoDurationService.isPromotionActive(mapping, currentDate);
          expect(isActive).toBe(false);

          // Test that the promotion is correctly identified as after end
          const isAfterEnd = bogoDurationService.isPromotionAfterEnd(mapping, currentDate);
          expect(isAfterEnd).toBe(true);

          // Test that the status is EXPIRED
          const status = bogoDurationService.getPromotionStatus(mapping, currentDate);
          expect(status).toBe(BogoPromotionStatus.EXPIRED);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 20: Expiration Cart Cleanup
  // Feature: bogo-promotion, Property 20: Expiration Cart Cleanup
  it('should remove expired BOGO items from cart and recalculate shipping', () => {
    fc.assert(
      fc.property(
        fc.record({
          mainProductId: fc.uuid(),
          freeProductId: fc.uuid(),
          pastDays: fc.integer({ min: 1, max: 30 }), // How many days ago the promotion ended
          promotionDuration: fc.integer({ min: 1, max: 30 }), // How long the promotion lasted
        }),
        async (testData) => {
          const currentDate = new Date();
          const endDate = new Date(currentDate.getTime() - (testData.pastDays * 24 * 60 * 60 * 1000));
          const startDate = new Date(endDate.getTime() - (testData.promotionDuration * 24 * 60 * 60 * 1000));
          
          // Create expired mapping
          const expiredMapping: BogoMapping = {
            id: 'expired-mapping',
            mainProductId: testData.mainProductId,
            freeProductIds: [testData.freeProductId],
            promotionStartDate: Timestamp.fromDate(startDate),
            promotionEndDate: Timestamp.fromDate(endDate),
            active: true,
            autoFreeShipping: true,
            createdBy: 'test-user',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            redemptionCount: 0,
            totalRevenue: 0,
          };

          // Mock getAllMappings to return the expired mapping
          vi.mocked(bogoMappingService.getAllMappings).mockResolvedValue([expiredMapping]);

          // Create cart items with expired BOGO pair
          const cartItems: CartItem[] = [
            // Main product
            {
              product_id: testData.mainProductId,
              title: 'Main Product',
              description: 'Test main product',
              price: 100,
              discount: 0,
              quantity: 1,
              color: null,
              size: null,
              sizes: null,
              images: [],
              tailor_id: 'test-tailor',
              tailor: 'Test Tailor',
              user_id: 'test-user',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            // Free product
            {
              product_id: testData.freeProductId,
              title: 'Free Product',
              description: 'Test free product',
              price: 0,
              discount: 0,
              quantity: 1,
              color: null,
              size: null,
              sizes: null,
              images: [],
              tailor_id: 'test-tailor',
              tailor: 'Test Tailor',
              user_id: 'test-user',
              createdAt: new Date(),
              updatedAt: new Date(),
              isBogoFree: true,
              bogoMainProductId: testData.mainProductId,
            } as CartItem & { isBogoFree?: boolean; bogoMainProductId?: string }
          ];

          // Test cleanup of expired items
          const expiredItems = await bogoDurationService.cleanupExpiredBogoItems(cartItems, currentDate);

          // Both main and free products should be identified for removal since the promotion is expired
          expect(expiredItems).toContain(testData.mainProductId);
          expect(expiredItems).toContain(testData.freeProductId);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 21: Checkout Expiration Validation
  // Feature: bogo-promotion, Property 21: Checkout Expiration Validation
  it('should validate checkout and recalculate prices for expired promotions', () => {
    fc.assert(
      fc.property(
        fc.record({
          mainProductId: fc.uuid(),
          freeProductId: fc.uuid(),
          originalPrice: fc.float({ min: 50, max: 500 }),
          pastDays: fc.integer({ min: 1, max: 30 }),
          promotionDuration: fc.integer({ min: 1, max: 30 }),
        }),
        async (testData) => {
          const currentDate = new Date();
          const endDate = new Date(currentDate.getTime() - (testData.pastDays * 24 * 60 * 60 * 1000));
          const startDate = new Date(endDate.getTime() - (testData.promotionDuration * 24 * 60 * 60 * 1000));
          
          // Create expired mapping
          const expiredMapping: BogoMapping = {
            id: 'expired-mapping',
            mainProductId: testData.mainProductId,
            freeProductIds: [testData.freeProductId],
            promotionStartDate: Timestamp.fromDate(startDate),
            promotionEndDate: Timestamp.fromDate(endDate),
            active: true,
            autoFreeShipping: true,
            createdBy: 'test-user',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            redemptionCount: 0,
            totalRevenue: 0,
          };

          vi.mocked(bogoMappingService.getAllMappings).mockResolvedValue([expiredMapping]);

          // Create cart items for checkout with expired BOGO
          const cartItems: CartItem[] = [
            // Main product
            {
              product_id: testData.mainProductId,
              title: 'Main Product',
              description: 'Test main product',
              price: 100,
              discount: 0,
              quantity: 1,
              color: null,
              size: null,
              sizes: null,
              images: [],
              tailor_id: 'test-tailor',
              tailor: 'Test Tailor',
              user_id: 'test-user',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            // Free product with expired promotion
            {
              product_id: testData.freeProductId,
              title: 'Free Product',
              description: 'Test free product',
              price: 0, // Current price (free)
              discount: 0,
              quantity: 1,
              color: null,
              size: null,
              sizes: null,
              images: [],
              tailor_id: 'test-tailor',
              tailor: 'Test Tailor',
              user_id: 'test-user',
              createdAt: new Date(),
              updatedAt: new Date(),
              isBogoFree: true,
              bogoMainProductId: testData.mainProductId,
              bogoOriginalPrice: testData.originalPrice,
            } as CartItem & { isBogoFree?: boolean; bogoMainProductId?: string; bogoOriginalPrice?: number }
          ];

          // Test checkout validation
          const validation = await bogoDurationService.validateCheckoutExpiration(cartItems, currentDate);

          // Should be invalid because there are expired items
          expect(validation.isValid).toBe(false);

          // Should identify the free product as expired
          expect(validation.expiredItems).toContain(testData.freeProductId);

          // Should have errors for expired items
          expect(validation.errors.length).toBeGreaterThan(0);

          // Should recalculate price for the free product
          expect(validation.recalculatedPrices).toBeDefined();
          if (validation.recalculatedPrices) {
            const recalc = validation.recalculatedPrices.find(r => r.productId === testData.freeProductId);
            expect(recalc).toBeDefined();
            if (recalc) {
              expect(recalc.newPrice).toBe(testData.originalPrice);
              expect(recalc.originalPrice).toBe(0); // Was free
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});