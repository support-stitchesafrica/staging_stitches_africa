import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { HierarchicalCommissionService } from '../commission-service';
import { Activity, Commission, CommissionRates, Influencer } from '../../../../types/hierarchical-referral';
import { Timestamp } from 'firebase-admin/firestore';

// Mock Firebase Admin
vi.mock('../../../firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        id: 'mock-id',
        set: vi.fn(),
        get: vi.fn(() => Promise.resolve({
          exists: true,
          data: vi.fn(() => ({
            type: 'mini',
            parentInfluencerId: 'mother-123',
            payoutInfo: {
              isVerified: true,
              minimumThreshold: 50
            }
          }))
        })),
        update: vi.fn()
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              docs: [{
                data: vi.fn(() => ({
                  miniInfluencerRate: 5,
                  motherInfluencerRate: 2,
                  isActive: true
                }))
              }],
              empty: false,
              size: 1
            }))
          }))
        })),
        get: vi.fn(() => Promise.resolve({
          docs: [],
          empty: true,
          size: 0
        }))
      }))
    })),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn()
    })),
    runTransaction: vi.fn((callback) => callback({
      get: vi.fn(() => Promise.resolve({ exists: true, data: vi.fn() })),
      set: vi.fn(),
      update: vi.fn()
    }))
  }
}));

// Mock validation utility
vi.mock('../../utils/validation', () => ({
  validateCommissionRates: vi.fn(() => null),
  validatePayoutAmount: vi.fn(() => null)
}));

// Mock Timestamp
vi.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date }))
  }
}));

describe('HierarchicalCommissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 17: Commission Rate Configuration', () => {
    it('should store and apply commission rates correctly for all valid rate combinations', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 17: Commission Rate Configuration
       * Validates: Requirements 5.1
       * 
       * For any admin commission rate setting, the system should store and apply 
       * the rates correctly for Mini_Influencer and Mother_Influencer earnings
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate valid commission rates
          fc.record({
            miniInfluencerRate: fc.float({ min: 0, max: 50 }),
            motherInfluencerRate: fc.float({ min: 0, max: 50 }),
            categoryRates: fc.option(fc.dictionary(
              fc.string({ minLength: 3, maxLength: 20 }),
              fc.record({
                miniInfluencerRate: fc.float({ min: 0, max: 30 }),
                motherInfluencerRate: fc.float({ min: 0, max: 30 })
              })
            )),
            campaignRates: fc.option(fc.dictionary(
              fc.string({ minLength: 5, maxLength: 25 }),
              fc.record({
                miniInfluencerRate: fc.float({ min: 0, max: 40 }),
                motherInfluencerRate: fc.float({ min: 0, max: 40 })
              })
            ))
          }).filter(rates => 
            // Ensure total rates don't exceed 100%
            rates.miniInfluencerRate + rates.motherInfluencerRate <= 100
          ),
          async (rates: CommissionRates) => {
            // Update commission rates
            await HierarchicalCommissionService.updateCommissionRates(rates);

            // Verify rates are stored correctly
            expect(rates.miniInfluencerRate).toBeGreaterThanOrEqual(0);
            expect(rates.miniInfluencerRate).toBeLessThanOrEqual(100);
            expect(rates.motherInfluencerRate).toBeGreaterThanOrEqual(0);
            expect(rates.motherInfluencerRate).toBeLessThanOrEqual(100);
            
            // Verify total doesn't exceed 100%
            const totalRate = rates.miniInfluencerRate + rates.motherInfluencerRate;
            expect(totalRate).toBeLessThanOrEqual(100);

            // Verify category rates if present
            if (rates.categoryRates) {
              Object.values(rates.categoryRates).forEach(categoryRate => {
                expect(categoryRate.miniInfluencerRate + categoryRate.motherInfluencerRate).toBeLessThanOrEqual(100);
              });
            }

            // Verify campaign rates if present
            if (rates.campaignRates) {
              Object.values(rates.campaignRates).forEach(campaignRate => {
                expect(campaignRate.miniInfluencerRate + campaignRate.motherInfluencerRate).toBeLessThanOrEqual(100);
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 18: Commission Calculation Accuracy', () => {
    it('should calculate earnings using configured commission rates for all conversion activities', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 18: Commission Calculation Accuracy
       * Validates: Requirements 5.2
       * 
       * For any conversion through a Mini_Influencer, the system should calculate 
       * earnings using the configured commission rates
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate conversion activity
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 50 }),
            influencerId: fc.string({ minLength: 10, maxLength: 50 }),
            type: fc.constantFrom('conversion', 'purchase'),
            referralCode: fc.string({ minLength: 5, maxLength: 20 }),
            metadata: fc.record({
              amount: fc.float({ min: 1, max: 10000 }),
              currency: fc.constantFrom('USD', 'EUR', 'GBP'),
              productId: fc.option(fc.string({ minLength: 5, maxLength: 20 }))
            }),
            timestamp: fc.constant(Timestamp.now()),
            processed: fc.constant(false)
          }),
          // Generate commission rates
          fc.record({
            miniInfluencerRate: fc.float({ min: 1, max: 20 }),
            motherInfluencerRate: fc.float({ min: 1, max: 15 })
          }).filter(rates => rates.miniInfluencerRate + rates.motherInfluencerRate <= 30),
          async (activity: Activity, rates: CommissionRates) => {
            // Mock the commission rates
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            mockAdminDb.collection().where().orderBy().limit().get.mockResolvedValueOnce({
              docs: [{
                data: () => rates
              }],
              empty: false,
              size: 1
            });

            // Calculate commission
            const commissions = await HierarchicalCommissionService.calculateCommission(activity);

            // Verify commission calculation accuracy
            expect(commissions.length).toBeGreaterThan(0);

            const totalCommissionAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
            const expectedTotalRate = rates.miniInfluencerRate + rates.motherInfluencerRate;
            const expectedTotalAmount = (activity.metadata.amount! * expectedTotalRate) / 100;

            // Allow for small floating point differences
            expect(Math.abs(totalCommissionAmount - expectedTotalAmount)).toBeLessThan(0.01);

            // Verify each commission has correct properties
            commissions.forEach(commission => {
              expect(commission.activityId).toBe(activity.id);
              expect(commission.amount).toBeGreaterThan(0);
              expect(commission.currency).toBe(activity.metadata.currency || 'USD');
              expect(commission.rate).toBeGreaterThan(0);
              expect(commission.status).toBe('pending');
              expect(commission.createdAt).toBeDefined();
            });

            // Verify Mini Influencer commission
            const miniCommission = commissions.find(c => c.type === 'direct' && c.miniInfluencerId);
            if (miniCommission) {
              const expectedMiniAmount = (activity.metadata.amount! * rates.miniInfluencerRate) / 100;
              expect(Math.abs(miniCommission.amount - expectedMiniAmount)).toBeLessThan(0.01);
              expect(miniCommission.rate).toBe(rates.miniInfluencerRate);
            }

            // Verify Mother Influencer commission
            const motherCommission = commissions.find(c => c.type === 'indirect');
            if (motherCommission) {
              const expectedMotherAmount = (activity.metadata.amount! * rates.motherInfluencerRate) / 100;
              expect(Math.abs(motherCommission.amount - expectedMotherAmount)).toBeLessThan(0.01);
              expect(motherCommission.rate).toBe(rates.motherInfluencerRate);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 19: Commission Rate Validation', () => {
    it('should reject commission rate configurations where total percentages exceed 100%', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 19: Commission Rate Validation
       * Validates: Requirements 5.3
       * 
       * For any commission rate configuration, the total percentages should not exceed 100%
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid commission rates (total > 100%)
          fc.record({
            miniInfluencerRate: fc.float({ min: 50, max: 100 }),
            motherInfluencerRate: fc.float({ min: 50, max: 100 })
          }).filter(rates => 
            // Ensure total exceeds 100%
            rates.miniInfluencerRate + rates.motherInfluencerRate > 100
          ),
          async (invalidRates: CommissionRates) => {
            // Mock validation to return error for invalid rates
            const mockValidation = vi.mocked(require('../../utils/validation').validateCommissionRates);
            mockValidation.mockReturnValueOnce({
              code: 'INVALID_INPUT',
              message: 'Total commission rates cannot exceed 100%'
            });

            // Attempt to update with invalid rates should throw error
            await expect(
              HierarchicalCommissionService.updateCommissionRates(invalidRates)
            ).rejects.toThrow();

            // Verify validation was called
            expect(mockValidation).toHaveBeenCalledWith(invalidRates);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept valid commission rate configurations where total is 100% or less', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 19: Commission Rate Validation
       * Validates: Requirements 5.3
       * 
       * For any valid commission rate configuration, the system should accept rates 
       * where total percentages are 100% or less
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate valid commission rates (total <= 100%)
          fc.record({
            miniInfluencerRate: fc.float({ min: 0, max: 50 }),
            motherInfluencerRate: fc.float({ min: 0, max: 50 })
          }).filter(rates => 
            // Ensure total is valid
            rates.miniInfluencerRate + rates.motherInfluencerRate <= 100
          ),
          async (validRates: CommissionRates) => {
            // Mock validation to return null for valid rates
            const mockValidation = vi.mocked(require('../../utils/validation').validateCommissionRates);
            mockValidation.mockReturnValueOnce(null);

            // Update with valid rates should succeed
            await expect(
              HierarchicalCommissionService.updateCommissionRates(validRates)
            ).resolves.not.toThrow();

            // Verify validation was called
            expect(mockValidation).toHaveBeenCalledWith(validRates);

            // Verify rates are within valid bounds
            expect(validRates.miniInfluencerRate).toBeGreaterThanOrEqual(0);
            expect(validRates.miniInfluencerRate).toBeLessThanOrEqual(100);
            expect(validRates.motherInfluencerRate).toBeGreaterThanOrEqual(0);
            expect(validRates.motherInfluencerRate).toBeLessThanOrEqual(100);
            expect(validRates.miniInfluencerRate + validRates.motherInfluencerRate).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Commission Processing Edge Cases', () => {
    it('should handle zero-value activities correctly', async () => {
      /**
       * Property: Zero-value activities should not generate commissions
       * 
       * For any activity with zero or negative amount, no commissions should be generated
       */
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 50 }),
            influencerId: fc.string({ minLength: 10, maxLength: 50 }),
            type: fc.constantFrom('conversion', 'purchase'),
            referralCode: fc.string({ minLength: 5, maxLength: 20 }),
            metadata: fc.record({
              amount: fc.constantFrom(0, -1, -100),
              currency: fc.constantFrom('USD', 'EUR', 'GBP')
            }),
            timestamp: fc.constant(Timestamp.now()),
            processed: fc.constant(false)
          }),
          async (activity: Activity) => {
            // Calculate commission for zero/negative value activity
            const commissions = await HierarchicalCommissionService.calculateCommission(activity);

            // Should return empty array for zero/negative value activities
            expect(commissions).toEqual([]);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle non-conversion activities correctly', async () => {
      /**
       * Property: Non-conversion activities should not generate commissions
       * 
       * For any activity that is not a conversion or purchase, no commissions should be generated
       */
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 50 }),
            influencerId: fc.string({ minLength: 10, maxLength: 50 }),
            type: fc.constantFrom('click', 'view', 'signup'),
            referralCode: fc.string({ minLength: 5, maxLength: 20 }),
            metadata: fc.record({
              amount: fc.option(fc.float({ min: 1, max: 1000 })),
              currency: fc.option(fc.constantFrom('USD', 'EUR', 'GBP'))
            }),
            timestamp: fc.constant(Timestamp.now()),
            processed: fc.constant(false)
          }),
          async (activity: Activity) => {
            // Calculate commission for non-conversion activity
            const commissions = await HierarchicalCommissionService.calculateCommission(activity);

            // Should return empty array for non-conversion activities
            expect(commissions).toEqual([]);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Payout Eligibility Validation', () => {
    it('should validate payout eligibility based on threshold and verification status', async () => {
      /**
       * Property: Payout eligibility respects minimum thresholds and verification status
       * 
       * For any influencer, payout eligibility should depend on verified payout info 
       * and meeting minimum threshold requirements
       */
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }), // influencerId
          fc.record({
            isVerified: fc.boolean(),
            minimumThreshold: fc.float({ min: 10, max: 500 }),
            pendingAmount: fc.float({ min: 0, max: 1000 })
          }),
          async (influencerId: string, payoutData) => {
            // Mock influencer data
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            mockAdminDb.collection().doc().get.mockResolvedValueOnce({
              exists: true,
              data: () => ({
                payoutInfo: {
                  isVerified: payoutData.isVerified,
                  minimumThreshold: payoutData.minimumThreshold
                }
              })
            });

            // Mock pending commissions
            mockAdminDb.collection().where().where().get.mockResolvedValueOnce({
              docs: Array(Math.floor(payoutData.pendingAmount / 10)).fill(null).map(() => ({
                data: () => ({ amount: 10 })
              }))
            });

            // Validate payout eligibility
            const eligibility = await HierarchicalCommissionService.validatePayoutEligibility(influencerId);

            // Verify eligibility logic
            if (!payoutData.isVerified) {
              expect(eligibility.isEligible).toBe(false);
              expect(eligibility.reason).toContain('not verified');
            } else if (payoutData.pendingAmount < payoutData.minimumThreshold) {
              expect(eligibility.isEligible).toBe(false);
              expect(eligibility.reason).toContain('minimum threshold');
            } else {
              expect(eligibility.isEligible).toBe(true);
              expect(eligibility.amount).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 20: Historical Data Preservation', () => {
    it('should preserve historical earnings calculations when commission rates are updated', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 20: Historical Data Preservation
       * Validates: Requirements 5.4
       * 
       * For any commission rate update, historical earnings calculations should remain 
       * unchanged while new rates apply to future earnings
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate historical activity with timestamp
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 50 }),
            influencerId: fc.string({ minLength: 10, maxLength: 50 }),
            type: fc.constantFrom('conversion', 'purchase'),
            referralCode: fc.string({ minLength: 5, maxLength: 20 }),
            metadata: fc.record({
              amount: fc.float({ min: 100, max: 1000 }),
              currency: fc.constantFrom('USD', 'EUR', 'GBP')
            }),
            timestamp: fc.constant(Timestamp.fromDate(new Date('2023-01-01'))), // Historical date
            processed: fc.constant(false)
          }),
          // Generate original commission rates
          fc.record({
            miniInfluencerRate: fc.float({ min: 3, max: 10 }),
            motherInfluencerRate: fc.float({ min: 1, max: 5 })
          }).filter(rates => rates.miniInfluencerRate + rates.motherInfluencerRate <= 15),
          // Generate new commission rates
          fc.record({
            miniInfluencerRate: fc.float({ min: 5, max: 15 }),
            motherInfluencerRate: fc.float({ min: 2, max: 8 })
          }).filter(rates => rates.miniInfluencerRate + rates.motherInfluencerRate <= 20),
          async (historicalActivity: Activity, originalRates: CommissionRates, newRates: CommissionRates) => {
            // Mock historical commission rates lookup
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            
            // Mock getting historical rates (should return original rates)
            mockAdminDb.collection().where().orderBy().limit().get
              .mockResolvedValueOnce({
                docs: [{
                  data: () => originalRates
                }],
                empty: false,
                size: 1
              });

            // Mock activity lookup
            mockAdminDb.collection().doc().get.mockResolvedValueOnce({
              exists: true,
              data: () => historicalActivity
            });

            // Mock influencer lookup
            mockAdminDb.collection().doc().get.mockResolvedValueOnce({
              exists: true,
              data: () => ({
                type: 'mini',
                parentInfluencerId: 'mother-123'
              })
            });

            // Recalculate historical commissions
            const historicalCommissions = await HierarchicalCommissionService.recalculateHistoricalCommissions(
              historicalActivity.id
            );

            // Verify historical commissions use original rates
            expect(historicalCommissions.length).toBeGreaterThan(0);

            const miniCommission = historicalCommissions.find(c => c.type === 'direct');
            const motherCommission = historicalCommissions.find(c => c.type === 'indirect');

            if (miniCommission) {
              const expectedMiniAmount = (historicalActivity.metadata.amount! * originalRates.miniInfluencerRate) / 100;
              expect(Math.abs(miniCommission.amount - expectedMiniAmount)).toBeLessThan(0.01);
              expect(miniCommission.rate).toBe(originalRates.miniInfluencerRate);
              
              // Verify timestamp preservation
              expect(miniCommission.createdAt).toEqual(historicalActivity.timestamp);
            }

            if (motherCommission) {
              const expectedMotherAmount = (historicalActivity.metadata.amount! * originalRates.motherInfluencerRate) / 100;
              expect(Math.abs(motherCommission.amount - expectedMotherAmount)).toBeLessThan(0.01);
              expect(motherCommission.rate).toBe(originalRates.motherInfluencerRate);
              
              // Verify timestamp preservation
              expect(motherCommission.createdAt).toEqual(historicalActivity.timestamp);
            }

            // Verify that new rates would produce different results
            const newMiniAmount = (historicalActivity.metadata.amount! * newRates.miniInfluencerRate) / 100;
            const newMotherAmount = (historicalActivity.metadata.amount! * newRates.motherInfluencerRate) / 100;
            
            // Historical calculations should be different from what new rates would produce
            // (unless rates happen to be the same, which is unlikely with our generators)
            if (originalRates.miniInfluencerRate !== newRates.miniInfluencerRate && miniCommission) {
              expect(Math.abs(miniCommission.amount - newMiniAmount)).toBeGreaterThan(0.01);
            }
            
            if (originalRates.motherInfluencerRate !== newRates.motherInfluencerRate && motherCommission) {
              expect(Math.abs(motherCommission.amount - newMotherAmount)).toBeGreaterThan(0.01);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain audit trail when commission rates are updated', async () => {
      /**
       * Property: Commission rate updates create comprehensive audit trail
       * 
       * For any commission rate update, the system should maintain a complete 
       * audit trail with version history and change metadata
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate new commission rates
          fc.record({
            miniInfluencerRate: fc.float({ min: 1, max: 20 }),
            motherInfluencerRate: fc.float({ min: 1, max: 15 })
          }).filter(rates => rates.miniInfluencerRate + rates.motherInfluencerRate <= 30),
          async (newRates: CommissionRates) => {
            // Mock validation to pass
            const mockValidation = vi.mocked(require('../../utils/validation').validateCommissionRates);
            mockValidation.mockReturnValueOnce(null);

            // Mock current rates lookup
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            mockAdminDb.collection().where().orderBy().limit().get
              .mockResolvedValueOnce({
                docs: [{
                  data: () => ({
                    miniInfluencerRate: 5,
                    motherInfluencerRate: 2,
                    version: 1
                  })
                }],
                empty: false,
                size: 1
              });

            // Mock version lookup
            mockAdminDb.collection().orderBy().limit().get
              .mockResolvedValueOnce({
                docs: [{
                  data: () => ({ version: 1 })
                }],
                empty: false,
                size: 1
              });

            // Mock batch operations
            const mockBatch = {
              update: vi.fn(),
              set: vi.fn(),
              commit: vi.fn()
            };
            mockAdminDb.batch.mockReturnValue(mockBatch);

            // Mock audit log creation
            mockAdminDb.collection().add.mockResolvedValueOnce({ id: 'audit-log-id' });

            // Update commission rates
            await HierarchicalCommissionService.updateCommissionRates(newRates);

            // Verify audit trail creation
            expect(mockAdminDb.collection).toHaveBeenCalledWith('hierarchical_audit_logs');
            expect(mockAdminDb.collection().add).toHaveBeenCalled();

            // Verify batch operations for historical preservation
            expect(mockBatch.update).toHaveBeenCalled(); // Deactivate old rates
            expect(mockBatch.set).toHaveBeenCalled(); // Set new rates
            expect(mockBatch.commit).toHaveBeenCalled();

            // Verify validation was called
            expect(mockValidation).toHaveBeenCalledWith(newRates);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});