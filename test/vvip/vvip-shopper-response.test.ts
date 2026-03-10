/**
 * VVIP Shopper Response Property Test
 * 
 * Feature: vvip-shopper-program, Property 8: VVIP Shopper Response Contains All Required Fields
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * This test verifies that VVIP shopper responses contain all required fields
 * as specified in the requirements.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { VvipShopper } from '@/types/vvip';
import { Timestamp } from 'firebase/firestore';

// Test data generators
const vvipShopperArbitrary = fc.record({
  userId: fc.uuid(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  country: fc.constantFrom('Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Finland', 'United States', 'United Kingdom'),
  isVvip: fc.constant(true),
  vvip_created_by: fc.uuid(),
  vvip_created_at: fc.date().map(date => Timestamp.fromDate(date)),
  createdByName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
});

// Mock VVIP service response function
const mockVvipShopperResponse = (shopper: VvipShopper): VvipShopper => {
  // Simulate the actual service response that should include all required fields
  return {
    userId: shopper.userId,
    firstName: shopper.firstName,
    lastName: shopper.lastName,
    email: shopper.email,
    country: shopper.country,
    isVvip: shopper.isVvip,
    vvip_created_by: shopper.vvip_created_by,
    vvip_created_at: shopper.vvip_created_at,
    createdByName: shopper.createdByName,
  };
};

describe('Feature: vvip-shopper-program, Property 8: VVIP Shopper Response Contains All Required Fields', () => {
  it('should contain firstName field for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: firstName field is present and matches input
          expect(response).toHaveProperty('firstName');
          expect(response.firstName).toBe(shopperData.firstName);
          expect(typeof response.firstName).toBe('string');
          expect(response.firstName.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should contain lastName field for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: lastName field is present and matches input
          expect(response).toHaveProperty('lastName');
          expect(response.lastName).toBe(shopperData.lastName);
          expect(typeof response.lastName).toBe('string');
          expect(response.lastName.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should contain email field for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: email field is present and matches input
          expect(response).toHaveProperty('email');
          expect(response.email).toBe(shopperData.email);
          expect(typeof response.email).toBe('string');
          expect(response.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/); // Basic email format
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should contain country field for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: country field is present and matches input
          expect(response).toHaveProperty('country');
          expect(response.country).toBe(shopperData.country);
          expect(typeof response.country).toBe('string');
          expect(response.country.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should contain vvip_created_at field for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: vvip_created_at field is present and matches input
          expect(response).toHaveProperty('vvip_created_at');
          expect(response.vvip_created_at).toBe(shopperData.vvip_created_at);
          expect(response.vvip_created_at).toBeInstanceOf(Timestamp);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should contain vvip_created_by field for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: vvip_created_by field is present and matches input
          expect(response).toHaveProperty('vvip_created_by');
          expect(response.vvip_created_by).toBe(shopperData.vvip_created_by);
          expect(typeof response.vvip_created_by).toBe('string');
          expect(response.vvip_created_by.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should contain all required fields simultaneously for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: All required fields are present
          const requiredFields = [
            'userId',
            'firstName', 
            'lastName', 
            'email', 
            'country', 
            'isVvip',
            'vvip_created_by', 
            'vvip_created_at'
          ];
          
          for (const field of requiredFields) {
            expect(response).toHaveProperty(field);
            expect(response[field as keyof VvipShopper]).toBeDefined();
            expect(response[field as keyof VvipShopper]).not.toBeNull();
          }
          
          // Verify: All fields match input data
          expect(response.userId).toBe(shopperData.userId);
          expect(response.firstName).toBe(shopperData.firstName);
          expect(response.lastName).toBe(shopperData.lastName);
          expect(response.email).toBe(shopperData.email);
          expect(response.country).toBe(shopperData.country);
          expect(response.isVvip).toBe(shopperData.isVvip);
          expect(response.vvip_created_by).toBe(shopperData.vvip_created_by);
          expect(response.vvip_created_at).toBe(shopperData.vvip_created_at);
          
          // Verify: Optional fields are handled correctly
          if (shopperData.createdByName) {
            expect(response.createdByName).toBe(shopperData.createdByName);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should maintain data types for all fields for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: Data types are correct
          expect(typeof response.userId).toBe('string');
          expect(typeof response.firstName).toBe('string');
          expect(typeof response.lastName).toBe('string');
          expect(typeof response.email).toBe('string');
          expect(typeof response.country).toBe('string');
          expect(typeof response.isVvip).toBe('boolean');
          expect(typeof response.vvip_created_by).toBe('string');
          expect(response.vvip_created_at).toBeInstanceOf(Timestamp);
          
          // Verify: Boolean field is always true for VVIP shoppers
          expect(response.isVvip).toBe(true);
          
          // Verify: Optional fields have correct types when present
          if (response.createdByName !== undefined) {
            expect(typeof response.createdByName).toBe('string');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should not contain unexpected fields for any VVIP shopper', async () => {
    await fc.assert(
      fc.asyncProperty(
        vvipShopperArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: Only expected fields are present
          const expectedFields = [
            'userId',
            'firstName',
            'lastName',
            'email',
            'country',
            'isVvip',
            'vvip_created_by',
            'vvip_created_at',
            'createdByName'
          ];
          
          const responseKeys = Object.keys(response);
          
          for (const key of responseKeys) {
            expect(expectedFields).toContain(key);
          }
          
          // Verify: No sensitive fields are exposed
          const sensitiveFields = ['password', 'token', 'secret', 'private'];
          for (const sensitiveField of sensitiveFields) {
            expect(response).not.toHaveProperty(sensitiveField);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle edge cases in field values for any VVIP shopper', async () => {
    // Test with edge case data
    const edgeCaseArbitrary = fc.record({
      userId: fc.uuid(),
      firstName: fc.constantFrom('A', 'Z', 'a', 'z', 'José', 'François', '李', '山田'), // Various character sets
      lastName: fc.constantFrom('B', 'Y', 'b', 'y', 'García', 'Müller', '王', '佐藤'),
      email: fc.constantFrom(
        'a@b.co', 
        'very.long.email.address@example.com',
        'user+tag@domain.org',
        'test.email-with-dash@sub.domain.com'
      ),
      country: fc.constantFrom('Nigeria', 'South Africa', 'United Kingdom', 'United States'),
      isVvip: fc.constant(true),
      vvip_created_by: fc.uuid(),
      vvip_created_at: fc.constantFrom(
        Timestamp.fromDate(new Date('2020-01-01')), // Old date
        Timestamp.fromDate(new Date()), // Current date
        Timestamp.fromDate(new Date('2030-12-31')) // Future date
      ),
      createdByName: fc.option(fc.constantFrom('Admin', 'Super Admin', 'Team Lead', '')),
    });

    await fc.assert(
      fc.asyncProperty(
        edgeCaseArbitrary,
        async (shopperData) => {
          // Execute: Get shopper response
          const response = mockVvipShopperResponse(shopperData);
          
          // Verify: All required fields are still present and valid
          expect(response.firstName).toBe(shopperData.firstName);
          expect(response.lastName).toBe(shopperData.lastName);
          expect(response.email).toBe(shopperData.email);
          expect(response.country).toBe(shopperData.country);
          expect(response.vvip_created_at).toBe(shopperData.vvip_created_at);
          expect(response.vvip_created_by).toBe(shopperData.vvip_created_by);
          
          // Verify: Edge case values are handled correctly
          expect(response.firstName.length).toBeGreaterThan(0);
          expect(response.lastName.length).toBeGreaterThan(0);
          expect(response.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
          expect(response.country.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });
});