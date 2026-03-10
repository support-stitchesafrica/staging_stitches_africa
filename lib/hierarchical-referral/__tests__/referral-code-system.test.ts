import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  generateMasterCode, 
  generateSubCode, 
  isValidCodeFormat, 
  getCodeType 
} from '../utils/code-generator';

/**
 * Property-Based Tests for Referral Code System
 * Feature: hierarchical-referral-program
 * Properties: 1, 2, 5
 * Validates: Requirements 1.1, 1.2, 1.5
 */

describe('Referral Code System Properties', () => {

  /**
   * Property 1: Unique Master Code Generation
   * For any Mother Influencer account creation, the system should generate exactly one unique 
   * Master_Referral_Code that does not conflict with any existing codes
   * Validates: Requirements 1.1
   */
  it('Property 1: Unique Master Code Generation - For any Mother Influencer account creation, the system should generate exactly one unique Master_Referral_Code that does not conflict with any existing codes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 100 }),
        (motherInfluencerIds) => {
          const generatedCodes = new Set<string>();
          
          for (const influencerId of motherInfluencerIds) {
            const masterCode = generateMasterCode();
            
            // Verify code format is valid for master codes
            expect(isValidCodeFormat(masterCode)).toBe(true);
            expect(getCodeType(masterCode)).toBe('master');
            
            // Verify code follows master code pattern (8 chars, starts with letter)
            expect(masterCode).toMatch(/^[A-Z][A-Z0-9]{7}$/);
            expect(masterCode).not.toContain('-'); // Master codes should not contain dash
            expect(masterCode.length).toBe(8);
            
            // Verify uniqueness within this test run
            expect(generatedCodes.has(masterCode)).toBe(false);
            generatedCodes.add(masterCode);
          }
          
          // Verify all codes are unique
          expect(generatedCodes.size).toBe(motherInfluencerIds.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2: Sub Code Uniqueness and Linking
   * For any Sub_Referral_Code generation request by a Mother Influencer, the system should 
   * create a unique code that is properly linked to their Master_Referral_Code
   * Validates: Requirements 1.2
   */
  it('Property 2: Sub Code Uniqueness and Linking - For any Sub_Referral_Code generation request by a Mother Influencer, the system should create a unique code that is properly linked to their Master_Referral_Code', () => {
    fc.assert(
      fc.property(
        fc.record({
          masterCode: fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)),
          numberOfSubCodes: fc.integer({ min: 1, max: 50 })
        }),
        (data) => {
          const generatedSubCodes = new Set<string>();
          
          for (let i = 0; i < data.numberOfSubCodes; i++) {
            const subCode = generateSubCode(data.masterCode);
            
            // Verify sub code format is valid
            expect(isValidCodeFormat(subCode)).toBe(true);
            expect(getCodeType(subCode)).toBe('sub');
            
            // Verify proper linking to master code
            expect(subCode.startsWith(data.masterCode)).toBe(true);
            expect(subCode).toContain('-');
            
            // Verify sub code pattern (master code + dash + 4 chars)
            expect(subCode).toMatch(/^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/);
            expect(subCode.length).toBe(13); // 8 (master) + 1 (dash) + 4 (suffix)
            
            // Extract and verify master code from sub code
            const extractedMasterCode = subCode.split('-')[0];
            expect(extractedMasterCode).toBe(data.masterCode);
            
            // Verify uniqueness within this test run
            expect(generatedSubCodes.has(subCode)).toBe(false);
            generatedSubCodes.add(subCode);
          }
          
          // Verify all sub codes are unique
          expect(generatedSubCodes.size).toBe(data.numberOfSubCodes);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Global Code Uniqueness
   * For any referral code generation across all influencer levels, the system should ensure 
   * no duplicate codes exist in the entire system
   * Validates: Requirements 1.5
   */
  it('Property 5: Global Code Uniqueness - For any referral code generation across all influencer levels, the system should ensure no duplicate codes exist in the entire system', () => {
    fc.assert(
      fc.property(
        fc.record({
          numberOfMasterCodes: fc.integer({ min: 1, max: 20 }),
          numberOfSubCodesPerMaster: fc.integer({ min: 1, max: 10 })
        }),
        (data) => {
          const allGeneratedCodes = new Set<string>();
          const masterCodes: string[] = [];
          
          // Generate master codes
          for (let i = 0; i < data.numberOfMasterCodes; i++) {
            const masterCode = generateMasterCode();
            
            // Verify master code is unique globally
            expect(allGeneratedCodes.has(masterCode)).toBe(false);
            allGeneratedCodes.add(masterCode);
            masterCodes.push(masterCode);
          }
          
          // Generate sub codes for each master code
          for (const masterCode of masterCodes) {
            for (let j = 0; j < data.numberOfSubCodesPerMaster; j++) {
              const subCode = generateSubCode(masterCode);
              
              // Verify sub code is unique globally
              expect(allGeneratedCodes.has(subCode)).toBe(false);
              allGeneratedCodes.add(subCode);
              
              // Verify sub code doesn't conflict with any master code
              expect(masterCodes.includes(subCode)).toBe(false);
            }
          }
          
          // Verify total uniqueness
          const expectedTotalCodes = data.numberOfMasterCodes + 
            (data.numberOfMasterCodes * data.numberOfSubCodesPerMaster);
          expect(allGeneratedCodes.size).toBe(expectedTotalCodes);
          
          // Verify no master code can be mistaken for a sub code and vice versa
          for (const code of allGeneratedCodes) {
            const codeType = getCodeType(code);
            expect(['master', 'sub']).toContain(codeType);
            
            if (codeType === 'master') {
              expect(code).not.toContain('-');
              expect(code.length).toBe(8);
            } else if (codeType === 'sub') {
              expect(code).toContain('-');
              expect(code.length).toBe(13);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Additional Property: Code Format Consistency
   * For any generated code, it should consistently follow the defined format rules
   */
  it('Property: Code Format Consistency - For any generated code, it should consistently follow the defined format rules', () => {
    fc.assert(
      fc.property(
        fc.record({
          masterCodes: fc.array(fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)), { minLength: 1, maxLength: 10 })
        }),
        (data) => {
          for (const masterCode of data.masterCodes) {
            // Test master code format
            expect(isValidCodeFormat(masterCode)).toBe(true);
            expect(getCodeType(masterCode)).toBe('master');
            expect(masterCode).toMatch(/^[A-Z][A-Z0-9]{7}$/);
            expect(masterCode[0]).toMatch(/[A-Z]/); // First character must be a letter
            
            // Test sub code format
            const subCode = generateSubCode(masterCode);
            expect(isValidCodeFormat(subCode)).toBe(true);
            expect(getCodeType(subCode)).toBe('sub');
            expect(subCode).toMatch(/^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/);
            expect(subCode.startsWith(masterCode)).toBe(true);
            
            // Test invalid formats
            const invalidCodes = [
              '', // Empty
              'ABC', // Too short
              'ABCDEFGHIJK', // Too long
              'abcd1234', // Lowercase
              '1ABCD234', // Starts with number (invalid for master)
              'ABCD1234-', // Incomplete sub code
              'ABCD1234-ABC', // Sub code suffix too short
              'ABCD1234-ABCDE', // Sub code suffix too long
              'ABCD-1234-EFGH' // Multiple dashes
            ];
            
            for (const invalidCode of invalidCodes) {
              expect(isValidCodeFormat(invalidCode)).toBe(false);
              expect(getCodeType(invalidCode)).toBe('invalid');
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Code Generation Determinism
   * For any master code, generating sub codes should be deterministic in format but random in content
   */
  it('Property: Code Generation Determinism - For any master code, generating sub codes should be deterministic in format but random in content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[A-Z][A-Z0-9]{7}$/.test(s)),
        (masterCode) => {
          const subCodes = new Set<string>();
          const numberOfGenerations = 20;
          
          // Generate multiple sub codes from the same master code
          for (let i = 0; i < numberOfGenerations; i++) {
            const subCode = generateSubCode(masterCode);
            
            // All should have the same format
            expect(subCode).toMatch(/^[A-Z][A-Z0-9]{7}-[A-Z0-9]{4}$/);
            expect(subCode.startsWith(masterCode)).toBe(true);
            expect(subCode.length).toBe(13);
            
            // But should be unique (randomness)
            subCodes.add(subCode);
          }
          
          // Should generate different sub codes (high probability with good randomness)
          // Allow for some collision possibility but expect mostly unique codes
          expect(subCodes.size).toBeGreaterThan(numberOfGenerations * 0.8);
        }
      ),
      { numRuns: 10 }
    );
  });
});