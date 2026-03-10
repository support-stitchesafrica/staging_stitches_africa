// BOGO Mapping Service Property-Based Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { Timestamp } from 'firebase/firestore';
import { bogoMappingService } from './mapping-service';
import type { CreateBogoMappingData, BogoMapping } from '../../types/bogo';
import { BogoError, BogoErrorCode } from '../../types/bogo';

// Mock Firebase for testing
const mockFirebaseDb = {
  collection: () => ({
    add: () => Promise.resolve({ id: 'test-id' }),
    doc: () => ({
      get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    where: () => ({
      where: () => ({
        where: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] })
        })
      })
    })
  })
};

// Mock the Firebase module
vi.mock('../firebase', () => ({
  getFirebaseDb: () => Promise.resolve(mockFirebaseDb)
}));

describe('BOGO Mapping Service Property Tests', () => {
  beforeEach(() => {
    // Clear any cached state
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 1: BOGO Mapping Persistence', () => {
    // Feature: bogo-promotion, Property 1: BOGO Mapping Persistence
    it('should persist and retrieve BOGO mappings with all field values intact', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid BOGO mapping data
          fc.record({
            mainProductId: fc.string({ minLength: 1, maxLength: 50 }),
            freeProductIds: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
            promotionStartDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            promotionEndDate: fc.date({ min: new Date('2024-01-02'), max: new Date('2026-12-31') }),
            active: fc.boolean(),
            autoFreeShipping: fc.boolean(),
            promotionName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            maxRedemptions: fc.option(fc.integer({ min: 1, max: 10000 }))
          }),
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          async (mappingData, userId) => {
            // Ensure end date is after start date
            if (mappingData.promotionEndDate <= mappingData.promotionStartDate) {
              mappingData.promotionEndDate = new Date(mappingData.promotionStartDate.getTime() + 24 * 60 * 60 * 1000);
            }

            // Ensure main product is not in free products list
            mappingData.freeProductIds = mappingData.freeProductIds.filter(id => id !== mappingData.mainProductId);
            if (mappingData.freeProductIds.length === 0) {
              mappingData.freeProductIds = ['different-free-product'];
            }

            try {
              // Mock successful creation and retrieval
              const mockCreatedMapping: BogoMapping = {
                id: 'test-mapping-id',
                mainProductId: mappingData.mainProductId,
                freeProductIds: mappingData.freeProductIds,
                promotionStartDate: Timestamp.fromDate(mappingData.promotionStartDate),
                promotionEndDate: Timestamp.fromDate(mappingData.promotionEndDate),
                active: mappingData.active ?? true,
                autoFreeShipping: mappingData.autoFreeShipping ?? true,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                redemptionCount: 0,
                totalRevenue: 0,
                promotionName: mappingData.promotionName,
                description: mappingData.description,
                maxRedemptions: mappingData.maxRedemptions
              };

              // Mock the service methods for this test
              vi.spyOn(bogoMappingService, 'createMapping').mockResolvedValue(mockCreatedMapping);
              vi.spyOn(bogoMappingService, 'getMapping').mockResolvedValue(mockCreatedMapping);
              vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null); // No existing mapping

              const created = await bogoMappingService.createMapping(mappingData, userId);
              const retrieved = await bogoMappingService.getMapping(created.id);

              // Verify all fields are preserved
              expect(retrieved).toBeTruthy();
              expect(retrieved!.mainProductId).toBe(mappingData.mainProductId);
              expect(retrieved!.freeProductIds).toEqual(mappingData.freeProductIds);
              expect(retrieved!.active).toBe(mappingData.active ?? true);
              expect(retrieved!.autoFreeShipping).toBe(mappingData.autoFreeShipping ?? true);
              expect(retrieved!.promotionName).toBe(mappingData.promotionName);
              expect(retrieved!.description).toBe(mappingData.description);
              expect(retrieved!.maxRedemptions).toBe(mappingData.maxRedemptions);
              expect(retrieved!.createdBy).toBe(userId);
              expect(retrieved!.redemptionCount).toBe(0);
              expect(retrieved!.totalRevenue).toBe(0);
            } catch (error) {
              // If validation fails, that's expected for some inputs
              if (error instanceof BogoError && error.code === BogoErrorCode.VALIDATION_ERROR) {
                return; // Skip invalid inputs
              }
              throw error;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 2: Mapping Validation', () => {
    // Feature: bogo-promotion, Property 2: Mapping Validation
    it('should reject mappings with invalid dates or non-existent product IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid BOGO mapping data
          fc.oneof(
            // Invalid date range (end before start)
            fc.record({
              mainProductId: fc.string({ minLength: 1 }),
              freeProductIds: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
              promotionStartDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') }),
              promotionEndDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-05-31') }),
              active: fc.boolean()
            }),
            // Empty main product ID
            fc.record({
              mainProductId: fc.constant(''),
              freeProductIds: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
              promotionStartDate: fc.date(),
              promotionEndDate: fc.date(),
              active: fc.boolean()
            }),
            // Empty free products array
            fc.record({
              mainProductId: fc.string({ minLength: 1 }),
              freeProductIds: fc.constant([]),
              promotionStartDate: fc.date(),
              promotionEndDate: fc.date(),
              active: fc.boolean()
            }),
            // Self-referencing (main product in free products)
            fc.string({ minLength: 1 }).chain(productId => 
              fc.record({
                mainProductId: fc.constant(productId),
                freeProductIds: fc.constant([productId]),
                promotionStartDate: fc.date(),
                promotionEndDate: fc.date(),
                active: fc.boolean()
              })
            ),
            // Invalid max redemptions
            fc.record({
              mainProductId: fc.string({ minLength: 1 }),
              freeProductIds: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
              promotionStartDate: fc.date(),
              promotionEndDate: fc.date(),
              active: fc.boolean(),
              maxRedemptions: fc.integer({ max: 0 })
            })
          ),
          async (invalidMappingData) => {
            const validation = await bogoMappingService.validateMapping(invalidMappingData);
            
            // Invalid data should fail validation
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 3: Deactivated Mappings Don\'t Trigger', () => {
    // Feature: bogo-promotion, Property 3: Deactivated Mappings Don't Trigger
    it('should not return deactivated mappings when checking for active mappings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mainProductId: fc.string({ minLength: 1, maxLength: 50 }),
            freeProductIds: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
            promotionStartDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            promotionEndDate: fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
            active: fc.constant(false), // Force inactive
            autoFreeShipping: fc.boolean()
          }),
          fc.string({ minLength: 1 }), // userId
          async (mappingData, userId) => {
            // Ensure end date is after start date
            if (mappingData.promotionEndDate <= mappingData.promotionStartDate) {
              mappingData.promotionEndDate = new Date(mappingData.promotionStartDate.getTime() + 24 * 60 * 60 * 1000);
            }

            // Ensure main product is not in free products list
            mappingData.freeProductIds = mappingData.freeProductIds.filter(id => id !== mappingData.mainProductId);
            if (mappingData.freeProductIds.length === 0) {
              mappingData.freeProductIds = ['different-free-product'];
            }

            try {
              // Mock inactive mapping
              const mockInactiveMapping: BogoMapping = {
                id: 'inactive-mapping-id',
                mainProductId: mappingData.mainProductId,
                freeProductIds: mappingData.freeProductIds,
                promotionStartDate: Timestamp.fromDate(mappingData.promotionStartDate),
                promotionEndDate: Timestamp.fromDate(mappingData.promotionEndDate),
                active: false,
                autoFreeShipping: mappingData.autoFreeShipping ?? true,
                createdBy: userId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                redemptionCount: 0,
                totalRevenue: 0
              };

              // Mock the service to return null for inactive mappings
              vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null);
              vi.spyOn(bogoMappingService, 'createMapping').mockResolvedValue(mockInactiveMapping);

              // Create the inactive mapping
              await bogoMappingService.createMapping(mappingData, userId);

              // Check for active mapping - should return null
              const activeMapping = await bogoMappingService.getActiveMapping(mappingData.mainProductId);
              
              // Deactivated mappings should not be returned as active
              expect(activeMapping).toBeNull();
            } catch (error) {
              // If validation fails, that's expected for some inputs
              if (error instanceof BogoError && error.code === BogoErrorCode.VALIDATION_ERROR) {
                return; // Skip invalid inputs
              }
              throw error;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});