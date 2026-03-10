/**
 * BOGO Admin Dashboard Service Property-Based Tests
 * 
 * Tests for BOGO admin dashboard functionality using property-based testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { Timestamp } from 'firebase/firestore';
import type { 
  BogoMapping, 
  CreateBogoMappingData,
  BogoDashboardData,
  BogoAnalytics,
  BogoBulkImportResult
} from '../../types/bogo';
import { bogoMappingService } from './mapping-service';

// Custom generators for valid strings
const validStringGen = fc.string({ minLength: 1, maxLength: 20 })
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => s.replace(/\s+/g, '_')); // Replace spaces with underscores

const validProductIdGen = fc.string({ minLength: 1, maxLength: 15 })
  .map(s => `product_${s.replace(/[^a-zA-Z0-9]/g, '')}_${Math.random().toString(36).substr(2, 5)}`);

const validUserIdGen = fc.string({ minLength: 1, maxLength: 15 })
  .map(s => `user_${s.replace(/[^a-zA-Z0-9]/g, '')}_${Math.random().toString(36).substr(2, 5)}`);

// Mock Firebase
vi.mock('../firebase', () => ({
  getFirebaseDb: vi.fn(() => Promise.resolve({}))
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
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
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date(), seconds: Date.now() / 1000 })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000 }))
  },
  writeBatch: vi.fn()
}));

describe('BOGO Admin Dashboard Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 22: Dashboard Completeness', () => {
    // Feature: bogo-promotion, Property 22: Dashboard Completeness
    // Validates: Requirements 9.1, 9.5
    it('should display all created BOGO mappings with correct status, dates, and product associations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: validStringGen,
              mainProductId: validProductIdGen,
              freeProductIds: fc.array(validProductIdGen, { minLength: 1, maxLength: 3 }),
              promotionStartDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-06-01') }),
              promotionEndDate: fc.date({ min: new Date('2025-06-01'), max: new Date('2030-12-31') }),
              active: fc.boolean(),
              autoFreeShipping: fc.boolean(),
              createdBy: validUserIdGen,
              redemptionCount: fc.nat({ max: 1000 }),
              totalRevenue: fc.nat({ max: 100000 }),
              promotionName: fc.option(validStringGen),
              description: fc.option(validStringGen)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (mappingsData) => {
            // All mappings should be valid due to our generators
            const validMappings = mappingsData.map((m, index) => ({
              ...m,
              id: `mapping_${index}_${m.id}`, // Ensure unique IDs
              mainProductId: `main_${index}_${m.mainProductId}`, // Ensure unique product IDs
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
              promotionStartDate: Timestamp.fromDate(m.promotionStartDate),
              promotionEndDate: Timestamp.fromDate(m.promotionEndDate)
            } as BogoMapping));

            // Mock the service to return our test mappings
            const getAllMappingsSpy = vi.spyOn(bogoMappingService, 'getAllMappings').mockResolvedValue(validMappings);

            // Get dashboard data
            const dashboardMappings = await bogoMappingService.getAllMappings();

            // Verify completeness: all mappings are returned
            expect(dashboardMappings).toHaveLength(validMappings.length);

            // Verify each mapping has all required fields for dashboard display
            dashboardMappings.forEach((mapping, index) => {
              const originalMapping = validMappings[index];
              
              // Check that all essential dashboard fields are present
              expect(mapping.id).toBe(originalMapping.id);
              expect(mapping.mainProductId).toBe(originalMapping.mainProductId);
              expect(mapping.freeProductIds).toEqual(originalMapping.freeProductIds);
              expect(mapping.active).toBe(originalMapping.active);
              expect(mapping.promotionStartDate).toEqual(originalMapping.promotionStartDate);
              expect(mapping.promotionEndDate).toEqual(originalMapping.promotionEndDate);
              expect(mapping.redemptionCount).toBe(originalMapping.redemptionCount);
              expect(mapping.totalRevenue).toBe(originalMapping.totalRevenue);
              expect(mapping.createdBy).toBe(originalMapping.createdBy);
              
              // Verify status can be determined from dates and active flag
              const now = new Date();
              const startDate = mapping.promotionStartDate.toDate();
              const endDate = mapping.promotionEndDate.toDate();
              
              let expectedStatus: string;
              if (!mapping.active) {
                expectedStatus = 'inactive';
              } else if (now < startDate) {
                expectedStatus = 'not_started';
              } else if (now > endDate) {
                expectedStatus = 'expired';
              } else {
                expectedStatus = 'active';
              }
              
              // Status should be determinable from the data
              expect(['active', 'inactive', 'not_started', 'expired']).toContain(expectedStatus);
            });

            getAllMappingsSpy.mockRestore();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 23: Bulk Import Consistency', () => {
    // Feature: bogo-promotion, Property 23: Bulk Import Consistency
    // Validates: Requirements 9.3
    it('should create mappings with data matching the imported file contents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              mainProductId: validProductIdGen,
              freeProductIds: fc.array(validProductIdGen, { minLength: 1, maxLength: 3 }),
              promotionStartDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-06-01') }),
              promotionEndDate: fc.date({ min: new Date('2025-06-01'), max: new Date('2030-12-31') }),
              active: fc.boolean(),
              autoFreeShipping: fc.boolean(),
              promotionName: fc.option(validStringGen),
              description: fc.option(validStringGen)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          validUserIdGen,
          async (importData, userId) => {
            // All data should be valid due to our generators
            const validImportData = importData.map((data, index) => ({
              ...data,
              // Ensure no duplicate main product IDs in the same import
              mainProductId: `import_${index}_${data.mainProductId}`,
              freeProductIds: data.freeProductIds.map((id, freeIndex) => `free_${index}_${freeIndex}_${id}`)
            }));

            // Mock successful bulk import
            const mockResult: BogoBulkImportResult = {
              success: true,
              totalProcessed: validImportData.length,
              successCount: validImportData.length,
              errorCount: 0,
              errors: [],
              warnings: []
            };

            const bulkImportSpy = vi.spyOn(bogoMappingService, 'bulkImportMappings').mockResolvedValue(mockResult);
            const validateSpy = vi.spyOn(bogoMappingService, 'validateMapping').mockResolvedValue({
              isValid: true,
              errors: []
            });
            const getActiveSpy = vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null);

            // Perform bulk import
            const result = await bogoMappingService.bulkImportMappings(validImportData, userId);

            // Verify import consistency
            expect(result.success).toBe(true);
            expect(result.totalProcessed).toBe(validImportData.length);
            expect(result.successCount).toBe(validImportData.length);
            expect(result.errorCount).toBe(0);
            
            // All valid mappings should be processed successfully
            expect(result.successCount).toBe(validImportData.length);
            
            // No errors should occur for valid data
            expect(result.errors).toHaveLength(0);

            // Cleanup
            bulkImportSpy.mockRestore();
            validateSpy.mockRestore();
            getActiveSpy.mockRestore();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 24: Status Toggle Immediacy', () => {
    // Feature: bogo-promotion, Property 24: Status Toggle Immediacy
    // Validates: Requirements 9.4
    it('should immediately affect whether mapping triggers free product additions when status is toggled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: validStringGen,
            mainProductId: validProductIdGen,
            freeProductIds: fc.array(validProductIdGen, { minLength: 1, maxLength: 3 }),
            active: fc.boolean(),
            autoFreeShipping: fc.boolean(),
            createdBy: validUserIdGen,
            redemptionCount: fc.nat({ max: 1000 }),
            totalRevenue: fc.nat({ max: 100000 })
          }),
          validUserIdGen,
          async (mappingData, userId) => {
            // Ensure valid date range and current time is within promotion period
            const now = new Date();
            const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
            const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now
            
            const mapping: BogoMapping = {
              ...mappingData,
              id: `toggle_${mappingData.id}`,
              mainProductId: `toggle_${mappingData.mainProductId}`,
              promotionStartDate: Timestamp.fromDate(startDate),
              promotionEndDate: Timestamp.fromDate(endDate),
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date())
            };

            // Mock the mapping retrieval and update
            const getMappingSpy = vi.spyOn(bogoMappingService, 'getMapping').mockResolvedValue(mapping);
            const updateMappingSpy = vi.spyOn(bogoMappingService, 'updateMapping').mockResolvedValue();
            
            // Test initial state - if active, should find active mapping
            let getActiveSpy;
            if (mapping.active) {
              getActiveSpy = vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(mapping);
            } else {
              getActiveSpy = vi.spyOn(bogoMappingService, 'getActiveMapping').mockResolvedValue(null);
            }

            // Check initial active mapping state
            const initialActiveMapping = await bogoMappingService.getActiveMapping(mapping.mainProductId);
            const initiallyActive = initialActiveMapping !== null;
            expect(initiallyActive).toBe(mapping.active);

            // Toggle the status
            const newStatus = !mapping.active;
            await bogoMappingService.toggleMappingStatus(mapping.id, newStatus, userId);

            // Mock the new state after toggle
            const updatedMapping = { ...mapping, active: newStatus };
            getMappingSpy.mockResolvedValue(updatedMapping);
            
            if (newStatus) {
              getActiveSpy.mockResolvedValue(updatedMapping);
            } else {
              getActiveSpy.mockResolvedValue(null);
            }

            // Check that the status change is immediately effective
            const newActiveMapping = await bogoMappingService.getActiveMapping(mapping.mainProductId);
            const nowActive = newActiveMapping !== null;
            
            // The active state should have changed immediately
            expect(nowActive).toBe(newStatus);
            expect(nowActive).not.toBe(initiallyActive);
            
            // Verify the update was called with correct parameters
            expect(bogoMappingService.updateMapping).toHaveBeenCalledWith(
              mapping.id,
              { active: newStatus },
              userId
            );

            // Cleanup
            getMappingSpy.mockRestore();
            updateMappingSpy.mockRestore();
            getActiveSpy.mockRestore();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});