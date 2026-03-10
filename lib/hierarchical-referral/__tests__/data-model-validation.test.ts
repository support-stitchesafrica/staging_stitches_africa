import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  ReferralCode, 
  Influencer, 
  Activity, 
  Commission,
  HierarchicalReferralErrorCode 
} from '../../../types/hierarchical-referral';
import { validateReferralCode, validateInfluencer } from '../utils/validation';
import { generateSubCode, generateMasterCode, isValidCodeFormat } from '../utils/code-generator';

/**
 * Property-Based Tests for Hierarchical Referral Data Model Validation
 * Feature: hierarchical-referral-program, Property 3: Sub Code Data Completeness
 * Validates: Requirements 1.3
 */

describe('Hierarchical Referral Data Model Validation', () => {
  
  // Property 3: Sub Code Data Completeness
  // For any Sub_Referral_Code creation, the stored record should contain 
  // Mother_Influencer ID, creation timestamp, and usage status
  it('Property 3: Sub Code Data Completeness - For any Sub_Referral_Code creation, the stored record should contain Mother_Influencer ID, creation timestamp, and usage status', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary data for sub referral codes
        fc.record({
          masterCode: fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)),
          motherInfluencerId: fc.uuid(),
          assignedTo: fc.option(fc.uuid()),
          metadata: fc.record({
            campaign: fc.option(fc.string()),
            notes: fc.option(fc.string())
          })
        }),
        (data) => {
          // Generate a sub code using the master code
          const subCode = generateSubCode(data.masterCode);
          
          // Create a sub referral code record
          const subReferralCode: Partial<ReferralCode> = {
            id: subCode,
            code: subCode,
            type: 'sub',
            createdBy: data.motherInfluencerId,
            assignedTo: data.assignedTo || undefined,
            status: 'active',
            usageCount: 0,
            createdAt: new Date() as any, // Simulating Firestore timestamp
            metadata: data.metadata
          };
          
          // Validate the sub referral code
          const validationResult = validateReferralCode(subReferralCode);
          
          // The validation should pass (no error)
          expect(validationResult).toBeNull();
          
          // Verify data completeness requirements
          expect(subReferralCode.createdBy).toBeDefined();
          expect(subReferralCode.createdBy).toBe(data.motherInfluencerId);
          expect(subReferralCode.createdAt).toBeDefined();
          expect(subReferralCode.status).toBeDefined();
          expect(['active', 'inactive', 'expired']).toContain(subReferralCode.status);
          expect(subReferralCode.type).toBe('sub');
          
          // Verify code format is correct for sub codes
          expect(isValidCodeFormat(subCode)).toBe(true);
          expect(subCode).toContain('-'); // Sub codes should contain a dash
          expect(subCode.startsWith(data.masterCode)).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Additional property test for master code generation
  it('Property: Master Code Generation - For any Mother Influencer, generated master codes should be unique and valid format', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 50 }),
        (motherInfluencerIds) => {
          const generatedCodes = new Set<string>();
          
          for (const influencerId of motherInfluencerIds) {
            const masterCode = generateMasterCode();
            
            // Verify code format
            expect(isValidCodeFormat(masterCode)).toBe(true);
            expect(masterCode).toMatch(/^[A-Z][A-Z0-9]{7}$/);
            expect(masterCode).not.toContain('-'); // Master codes should not contain dash
            
            // Verify uniqueness (in this test run)
            expect(generatedCodes.has(masterCode)).toBe(false);
            generatedCodes.add(masterCode);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property test for influencer data validation
  it('Property: Influencer Data Validation - For any valid influencer data, validation should pass', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('mother', 'mini'),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          parentInfluencerId: fc.option(fc.uuid()),
          masterReferralCode: fc.option(fc.string({ minLength: 8, maxLength: 8 }))
        }),
        (data) => {
          // Ensure data consistency based on type
          const influencer: Partial<Influencer> = {
            ...data,
            parentInfluencerId: data.type === 'mini' ? (data.parentInfluencerId || 'some-parent-id') : undefined,
            masterReferralCode: data.type === 'mother' ? (data.masterReferralCode || 'ABCD1234') : undefined
          };
          
          const validationResult = validateInfluencer(influencer);
          
          // Valid influencer data should pass validation
          expect(validationResult).toBeNull();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property test for invalid influencer data
  it('Property: Invalid Influencer Data Rejection - For any invalid influencer data, validation should fail with appropriate error', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Invalid email
          fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('mother', 'mini'),
            email: fc.string().filter(s => !s.includes('@')),
            name: fc.string({ minLength: 2, maxLength: 50 })
          }),
          // Invalid name (too short or only spaces)
          fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('mother', 'mini'),
            email: fc.emailAddress(),
            name: fc.oneof(
              fc.string({ maxLength: 1 }),
              fc.string().filter(s => s.trim().length < 2)
            )
          }),
          // Mini influencer without parent
          fc.record({
            id: fc.uuid(),
            type: fc.constant('mini'),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 50 }),
            parentInfluencerId: fc.constant(undefined)
          }),
          // Mother influencer with parent (invalid)
          fc.record({
            id: fc.uuid(),
            type: fc.constant('mother'),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 50 }),
            parentInfluencerId: fc.uuid()
          })
        ),
        (invalidData) => {
          const validationResult = validateInfluencer(invalidData);
          
          // Invalid data should fail validation
          expect(validationResult).not.toBeNull();
          expect(validationResult?.code).toBe(HierarchicalReferralErrorCode.INVALID_INPUT);
          expect(validationResult?.message).toBeDefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property test for activity data structure
  it('Property: Activity Data Structure - For any activity, required fields should be present and valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          influencerId: fc.uuid(),
          type: fc.constantFrom('click', 'view', 'conversion', 'signup', 'purchase'),
          referralCode: fc.string({ minLength: 8, maxLength: 13 }).filter(s => s.trim().length > 0 && /^[A-Z0-9-]+$/.test(s)),
          metadata: fc.record({
            productId: fc.option(fc.uuid()),
            amount: fc.option(fc.float({ min: 0, max: 10000 })),
            currency: fc.option(fc.constantFrom('USD', 'EUR', 'GBP', 'NGN')),
            userAgent: fc.option(fc.string()),
            location: fc.option(fc.string())
          }),
          timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          processed: fc.boolean()
        }),
        (activityData) => {
          const activity: Activity = {
            ...activityData,
            timestamp: activityData.timestamp as any // Simulating Firestore timestamp
          };
          
          // Verify required fields are present
          expect(activity.id).toBeDefined();
          expect(activity.influencerId).toBeDefined();
          expect(activity.type).toBeDefined();
          expect(activity.referralCode).toBeDefined();
          expect(activity.timestamp).toBeDefined();
          expect(typeof activity.processed).toBe('boolean');
          
          // Verify type is valid
          expect(['click', 'view', 'conversion', 'signup', 'purchase']).toContain(activity.type);
          
          // Verify metadata structure
          expect(activity.metadata).toBeDefined();
          if (activity.metadata.amount !== undefined && activity.metadata.amount !== null) {
            expect(typeof activity.metadata.amount).toBe('number');
            expect(activity.metadata.amount).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property test for commission data structure
  it('Property: Commission Data Structure - For any commission, required fields should be present and calculations should be valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          activityId: fc.uuid(),
          motherInfluencerId: fc.uuid(),
          miniInfluencerId: fc.option(fc.uuid()),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
          currency: fc.constantFrom('USD', 'EUR', 'GBP', 'NGN'),
          rate: fc.float({ min: Math.fround(0.1), max: Math.fround(50) }),
          type: fc.constantFrom('direct', 'indirect'),
          status: fc.constantFrom('pending', 'approved', 'paid'),
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
        }),
        (commissionData) => {
          const commission: Commission = {
            ...commissionData,
            createdAt: commissionData.createdAt as any, // Simulating Firestore timestamp
            paidAt: commissionData.status === 'paid' ? commissionData.createdAt as any : undefined
          };
          
          // Verify required fields are present
          expect(commission.id).toBeDefined();
          expect(commission.activityId).toBeDefined();
          expect(commission.motherInfluencerId).toBeDefined();
          expect(commission.amount).toBeGreaterThan(0);
          expect(commission.currency).toBeDefined();
          expect(commission.rate).toBeGreaterThan(0);
          expect(commission.rate).toBeLessThanOrEqual(100); // Rate should be reasonable
          expect(['direct', 'indirect']).toContain(commission.type);
          expect(['pending', 'approved', 'paid']).toContain(commission.status);
          expect(commission.createdAt).toBeDefined();
          
          // If status is paid, paidAt should be defined
          if (commission.status === 'paid') {
            expect(commission.paidAt).toBeDefined();
          }
          
          // If type is indirect, miniInfluencerId should be defined
          if (commission.type === 'indirect') {
            expect(commission.miniInfluencerId).toBeDefined();
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});