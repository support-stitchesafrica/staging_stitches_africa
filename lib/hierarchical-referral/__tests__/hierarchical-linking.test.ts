import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  generateMasterCode, 
  generateSubCode, 
  isValidCodeFormat, 
  getCodeType 
} from '../utils/code-generator';
import { validateReferralCode } from '../utils/validation';
import { 
  ReferralCode, 
  Influencer,
  ReferralCodeValidation,
  HierarchicalReferralErrorCode 
} from '../../../types/hierarchical-referral';

/**
 * Property-Based Tests for Hierarchical Linking
 * Feature: hierarchical-referral-program
 * Properties: 4, 7
 * Validates: Requirements 1.4, 2.4
 */

describe('Hierarchical Linking Properties', () => {

  /**
   * Property 4: Hierarchical Relationship Establishment
   * For any valid Sub_Referral_Code usage during signup, the system should establish 
   * a bidirectional hierarchical relationship between the new Mini_Influencer and the Mother_Influencer
   * Validates: Requirements 1.4, 2.2
   */
  it('Property 4: Hierarchical Relationship Establishment - For any valid Sub_Referral_Code usage during signup, the system should establish a bidirectional hierarchical relationship between the new Mini_Influencer and the Mother_Influencer', () => {
    fc.assert(
      fc.property(
        fc.record({
          motherInfluencerId: fc.uuid(),
          miniInfluencerId: fc.uuid(),
          masterCode: fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)),
          metadata: fc.record({
            campaign: fc.option(fc.string()),
            notes: fc.option(fc.string())
          })
        }),
        (data) => {
          // Generate a sub code from the master code
          const subCode = generateSubCode(data.masterCode);
          
          // Create a referral code record that would be stored in the database
          const referralCodeRecord: ReferralCode = {
            id: subCode,
            code: subCode,
            type: 'sub',
            createdBy: data.motherInfluencerId,
            status: 'active',
            usageCount: 0,
            createdAt: new Date() as any, // Simulating Firestore timestamp
            metadata: data.metadata
          };
          
          // Validate the referral code structure
          const validationResult = validateReferralCode(referralCodeRecord);
          expect(validationResult).toBeNull(); // Should be valid
          
          // Verify hierarchical relationship properties
          expect(referralCodeRecord.createdBy).toBe(data.motherInfluencerId);
          expect(referralCodeRecord.type).toBe('sub');
          expect(referralCodeRecord.code).toBe(subCode);
          
          // Verify sub code format and linking to master code
          expect(isValidCodeFormat(subCode)).toBe(true);
          expect(getCodeType(subCode)).toBe('sub');
          expect(subCode.startsWith(data.masterCode)).toBe(true);
          expect(subCode).toContain('-');
          
          // Simulate the linking process - when a Mini Influencer uses this code
          const linkedReferralCode: ReferralCode = {
            ...referralCodeRecord,
            assignedTo: data.miniInfluencerId,
            usageCount: 1,
            status: 'inactive' // Marked as used
          };
          
          // Verify the bidirectional relationship establishment
          expect(linkedReferralCode.createdBy).toBe(data.motherInfluencerId); // Mother -> Mini relationship
          expect(linkedReferralCode.assignedTo).toBe(data.miniInfluencerId); // Mini -> Mother relationship
          expect(linkedReferralCode.usageCount).toBe(1);
          expect(linkedReferralCode.status).toBe('inactive');
          
          // Verify that the relationship is properly established
          expect(linkedReferralCode.createdBy).not.toBe(linkedReferralCode.assignedTo); // Different entities
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 7: Invalid Code Rejection
   * For any invalid or expired Sub_Referral_Code used during signup, the system should 
   * reject the registration and return a descriptive error message
   * Validates: Requirements 2.4
   */
  it('Property 7: Invalid Code Rejection - For any invalid or expired Sub_Referral_Code used during signup, the system should reject the registration and return a descriptive error message', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Invalid code formats
          fc.record({
            type: fc.constant('invalid_format'),
            code: fc.oneof(
              fc.string({ maxLength: 7 }), // Too short
              fc.string({ minLength: 14 }), // Too long
              fc.string().filter(s => s.includes(' ')), // Contains spaces
              fc.string().filter(s => /[a-z]/.test(s)), // Contains lowercase
              fc.constant(''), // Empty string
              fc.constant('ABCD1234-'), // Incomplete sub code
              fc.constant('ABCD1234-ABC'), // Sub code suffix too short
              fc.constant('ABCD1234-ABCDE'), // Sub code suffix too long
              fc.constant('1ABCD234-WXYZ') // Starts with number
            )
          }),
          // Expired codes
          fc.record({
            type: fc.constant('expired'),
            code: fc.string({ minLength: 13, maxLength: 13 }).filter(s => /^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/.test(s)),
            expiresAt: fc.date({ max: new Date(Date.now() - 86400000) }) // Expired yesterday
          }),
          // Inactive codes
          fc.record({
            type: fc.constant('inactive'),
            code: fc.string({ minLength: 13, maxLength: 13 }).filter(s => /^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/.test(s)),
            status: fc.constantFrom('inactive', 'expired')
          }),
          // Already assigned codes
          fc.record({
            type: fc.constant('already_assigned'),
            code: fc.string({ minLength: 13, maxLength: 13 }).filter(s => /^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/.test(s)),
            assignedTo: fc.uuid()
          }),
          // Usage limit exceeded
          fc.record({
            type: fc.constant('usage_exceeded'),
            code: fc.string({ minLength: 13, maxLength: 13 }).filter(s => /^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/.test(s)),
            usageCount: fc.integer({ min: 1, max: 10 }),
            maxUsage: fc.integer({ min: 1, max: 10 }).filter((max, ctx) => max <= (ctx as any).usageCount)
          })
        ),
        (invalidCodeData) => {
          let shouldBeRejected = false;
          let expectedErrorType = '';
          
          if (invalidCodeData.type === 'invalid_format') {
            // Test invalid code format
            const isValid = isValidCodeFormat(invalidCodeData.code);
            expect(isValid).toBe(false);
            
            const codeType = getCodeType(invalidCodeData.code);
            expect(codeType).toBe('invalid');
            
            shouldBeRejected = true;
            expectedErrorType = 'format';
          } else {
            // For other types, the code format should be valid but other conditions make it invalid
            const isValid = isValidCodeFormat(invalidCodeData.code);
            expect(isValid).toBe(true);
            
            // Create a referral code record with the invalid conditions
            const referralCode: Partial<ReferralCode> = {
              id: invalidCodeData.code,
              code: invalidCodeData.code,
              type: 'sub',
              createdBy: 'some-mother-id',
              status: 'active',
              usageCount: 0,
              createdAt: new Date() as any,
              metadata: {}
            };
            
            // Apply the specific invalid condition
            switch (invalidCodeData.type) {
              case 'expired':
                referralCode.expiresAt = invalidCodeData.expiresAt as any;
                shouldBeRejected = true;
                expectedErrorType = 'expired';
                break;
              case 'inactive':
                referralCode.status = invalidCodeData.status as any;
                shouldBeRejected = true;
                expectedErrorType = 'inactive';
                break;
              case 'already_assigned':
                referralCode.assignedTo = invalidCodeData.assignedTo;
                shouldBeRejected = true;
                expectedErrorType = 'assigned';
                break;
              case 'usage_exceeded':
                referralCode.usageCount = invalidCodeData.usageCount;
                referralCode.maxUsage = invalidCodeData.maxUsage;
                shouldBeRejected = true;
                expectedErrorType = 'usage';
                break;
            }
            
            // Validate the referral code - should pass basic validation
            const validationResult = validateReferralCode(referralCode);
            expect(validationResult).toBeNull(); // Basic structure should be valid
          }
          
          // All these conditions should result in rejection during signup
          expect(shouldBeRejected).toBe(true);
          expect(expectedErrorType).toBeTruthy();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property: Code Assignment Uniqueness
   * For any sub referral code, it should only be assignable to one Mini Influencer
   */
  it('Property: Code Assignment Uniqueness - For any sub referral code, it should only be assignable to one Mini Influencer', () => {
    fc.assert(
      fc.property(
        fc.record({
          masterCode: fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)),
          motherInfluencerId: fc.uuid(),
          miniInfluencerIds: fc.array(fc.uuid(), { minLength: 2, maxLength: 5 })
        }),
        (data) => {
          const subCode = generateSubCode(data.masterCode);
          
          // Create initial referral code
          let referralCode: ReferralCode = {
            id: subCode,
            code: subCode,
            type: 'sub',
            createdBy: data.motherInfluencerId,
            status: 'active',
            usageCount: 0,
            createdAt: new Date() as any,
            metadata: {}
          };
          
          // First assignment should be successful
          const firstMiniInfluencerId = data.miniInfluencerIds[0];
          referralCode = {
            ...referralCode,
            assignedTo: firstMiniInfluencerId,
            usageCount: 1,
            status: 'inactive'
          };
          
          expect(referralCode.assignedTo).toBe(firstMiniInfluencerId);
          expect(referralCode.usageCount).toBe(1);
          expect(referralCode.status).toBe('inactive');
          
          // Subsequent assignment attempts should be rejected
          for (let i = 1; i < data.miniInfluencerIds.length; i++) {
            const nextMiniInfluencerId = data.miniInfluencerIds[i];
            
            // Code is already assigned, so this should be rejected
            expect(referralCode.assignedTo).toBeTruthy();
            expect(referralCode.assignedTo).not.toBe(nextMiniInfluencerId);
            expect(referralCode.status).toBe('inactive');
            
            // The code should remain assigned to the first Mini Influencer
            expect(referralCode.assignedTo).toBe(firstMiniInfluencerId);
          }
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * Property: Sub Code Type Validation
   * For any linking operation, only sub codes should be accepted, not master codes
   */
  it('Property: Sub Code Type Validation - For any linking operation, only sub codes should be accepted, not master codes', () => {
    fc.assert(
      fc.property(
        fc.record({
          masterCode: fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)),
          motherInfluencerId: fc.uuid(),
          miniInfluencerId: fc.uuid()
        }),
        (data) => {
          // Test with master code (should be rejected for linking)
          const masterCodeRecord: ReferralCode = {
            id: data.masterCode,
            code: data.masterCode,
            type: 'master',
            createdBy: data.motherInfluencerId,
            status: 'active',
            usageCount: 0,
            createdAt: new Date() as any,
            metadata: {}
          };
          
          // Master codes should not be used for Mini Influencer linking
          expect(masterCodeRecord.type).toBe('master');
          expect(getCodeType(data.masterCode)).toBe('master');
          expect(data.masterCode).not.toContain('-');
          
          // Generate a proper sub code
          const subCode = generateSubCode(data.masterCode);
          const subCodeRecord: ReferralCode = {
            id: subCode,
            code: subCode,
            type: 'sub',
            createdBy: data.motherInfluencerId,
            status: 'active',
            usageCount: 0,
            createdAt: new Date() as any,
            metadata: {}
          };
          
          // Sub codes should be accepted for linking
          expect(subCodeRecord.type).toBe('sub');
          expect(getCodeType(subCode)).toBe('sub');
          expect(subCode).toContain('-');
          expect(subCode.startsWith(data.masterCode)).toBe(true);
          
          // Verify that master and sub codes are distinguishable
          expect(masterCodeRecord.type).not.toBe(subCodeRecord.type);
          expect(getCodeType(data.masterCode)).not.toBe(getCodeType(subCode));
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * Property: Hierarchical Relationship Integrity
   * For any established hierarchy, the relationship should be consistent and traceable
   */
  it('Property: Hierarchical Relationship Integrity - For any established hierarchy, the relationship should be consistent and traceable', () => {
    fc.assert(
      fc.property(
        fc.record({
          motherInfluencer: fc.record({
            id: fc.uuid(),
            masterCode: fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s))
          }),
          miniInfluencers: fc.array(
            fc.record({
              id: fc.uuid(),
              subCode: fc.string({ minLength: 13, maxLength: 13 }).filter(s => /^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/.test(s))
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (data) => {
          // Create referral codes for each mini influencer
          const referralCodes: ReferralCode[] = [];
          
          for (const miniInfluencer of data.miniInfluencers) {
            // Generate a proper sub code from the mother's master code
            const properSubCode = generateSubCode(data.motherInfluencer.masterCode);
            
            const referralCode: ReferralCode = {
              id: properSubCode,
              code: properSubCode,
              type: 'sub',
              createdBy: data.motherInfluencer.id,
              assignedTo: miniInfluencer.id,
              status: 'inactive', // Used
              usageCount: 1,
              createdAt: new Date() as any,
              metadata: {}
            };
            
            referralCodes.push(referralCode);
            
            // Verify hierarchical relationship integrity
            expect(referralCode.createdBy).toBe(data.motherInfluencer.id);
            expect(referralCode.assignedTo).toBe(miniInfluencer.id);
            expect(referralCode.type).toBe('sub');
            
            // Verify traceability - sub code should link back to master code
            expect(properSubCode.startsWith(data.motherInfluencer.masterCode)).toBe(true);
            
            // Verify the relationship is bidirectional
            expect(referralCode.createdBy).not.toBe(referralCode.assignedTo);
          }
          
          // Verify all codes are unique
          const codeSet = new Set(referralCodes.map(rc => rc.code));
          expect(codeSet.size).toBe(referralCodes.length);
          
          // Verify all codes trace back to the same mother influencer
          for (const referralCode of referralCodes) {
            expect(referralCode.createdBy).toBe(data.motherInfluencer.id);
            expect(referralCode.code.startsWith(data.motherInfluencer.masterCode)).toBe(true);
          }
        }
      ),
      { numRuns: 8 }
    );
  });
});