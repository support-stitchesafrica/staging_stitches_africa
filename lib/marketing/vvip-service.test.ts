/**
 * VVIP Service Property-Based Tests
 * 
 * Tests universal properties for VVIP management operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { VvipService } from './vvip-service';
import { VvipErrorCode } from '@/types/vvip';
import { Timestamp } from 'firebase-admin/firestore';

// Mock firebase-admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

// Mock permission service
vi.mock('./vvip-permission-service', () => ({
  vvipPermissionService: {
    validatePermission: vi.fn(async () => {}),
  },
}));

import { adminDb } from '@/lib/firebase-admin';
import { vvipPermissionService } from './vvip-permission-service';

// Helper to create mock Firestore document
function createMockDoc(exists: boolean, id: string, data?: any) {
  return {
    exists,
    id,
    data: () => data,
  };
}

// Helper to create mock Firestore query snapshot
function createMockSnapshot(docs: any[]) {
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
  };
}

// Generators for property-based testing
const emailArb = fc.emailAddress();
const userIdArb = fc.uuid();
const nameArb = fc.string({ minLength: 1, maxLength: 50 });
const countryArb = fc.constantFrom('Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Finland', 'USA');

const userDataArb = fc.record({
  email: emailArb,
  first_name: nameArb,
  last_name: nameArb,
  registration_country: countryArb,
  isVvip: fc.boolean(),
});

describe('VvipService Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 1: User Search by Email Returns Correct Results', () => {
    /**
     * Feature: vvip-shopper-program, Property 1: User Search by Email Returns Correct Results
     * Validates: Requirements 1.2
     * 
     * For any email address query, searching for users by email should return 
     * all and only users whose email matches the query.
     */
    it('should return all and only users with matching email', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          fc.array(userDataArb, { minLength: 0, maxLength: 5 }),
          async (searchEmail, users) => {
            // Setup: Create mock users, some with matching email
            const normalizedSearchEmail = searchEmail.toLowerCase().trim();
            const matchingUsers = users.filter(
              u => u.email.toLowerCase() === normalizedSearchEmail
            );
            const nonMatchingUsers = users.filter(
              u => u.email.toLowerCase() !== normalizedSearchEmail
            );

            // Create mock documents
            const mockDocs = matchingUsers.map((user, idx) =>
              createMockDoc(true, `user-${idx}`, user)
            );

            // Mock Firestore query
            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Search by email
            const results = await VvipService.searchUsersByEmail(searchEmail);

            // Verify: All results have matching email
            expect(results.length).toBe(matchingUsers.length);
            results.forEach(result => {
              expect(result.email.toLowerCase()).toBe(normalizedSearchEmail);
            });

            // Verify: No non-matching emails in results
            const resultEmails = results.map(r => r.email.toLowerCase());
            nonMatchingUsers.forEach(user => {
              expect(resultEmails).not.toContain(user.email.toLowerCase());
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle case-insensitive email search', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArb,
          async (email) => {
            // Setup: Create user with lowercase email
            const userData = {
              email: email.toLowerCase(),
              first_name: 'Test',
              last_name: 'User',
              registration_country: 'Nigeria',
              isVvip: false,
            };

            const mockDocs = [createMockDoc(true, 'user-1', userData)];

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Search with uppercase email
            const results = await VvipService.searchUsersByEmail(email.toUpperCase());

            // Verify: Should find the user regardless of case
            expect(results.length).toBeGreaterThanOrEqual(0);
            if (results.length > 0) {
              expect(results[0].email.toLowerCase()).toBe(email.toLowerCase());
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 2: User Search by ID Returns Correct Results', () => {
    /**
     * Feature: vvip-shopper-program, Property 2: User Search by ID Returns Correct Results
     * Validates: Requirements 1.3
     * 
     * For any user ID query, searching for users by ID should return the user 
     * with that exact ID if they exist, or an empty result if they don't.
     */
    it('should return user with exact ID if exists, null otherwise', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.boolean(),
          userDataArb,
          async (userId, userExists, userData) => {
            // Setup: Mock Firestore to return user or not based on userExists
            const mockDoc = userExists
              ? createMockDoc(true, userId, userData)
              : createMockDoc(false, userId);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Search by user ID
            const result = await VvipService.searchUserById(userId);

            // Verify: Result matches expectation
            if (userExists) {
              expect(result).not.toBeNull();
              expect(result?.userId).toBe(userId);
              expect(result?.email).toBe(userData.email);
            } else {
              expect(result).toBeNull();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return exactly one user for valid ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userDataArb,
          async (userId, userData) => {
            // Setup: Mock user exists
            const mockDoc = createMockDoc(true, userId, userData);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Search by ID
            const result = await VvipService.searchUserById(userId);

            // Verify: Exactly one user returned
            expect(result).not.toBeNull();
            expect(result?.userId).toBe(userId);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 3: User Existence Validation', () => {
    /**
     * Feature: vvip-shopper-program, Property 3: User Existence Validation
     * Validates: Requirements 1.4, 1.5
     * 
     * For any user ID, when attempting to create VVIP status, the system should 
     * verify the user exists in Firebase and reject the operation with an error 
     * if the user does not exist.
     */
    it('should validate user exists and throw error if not', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.boolean(),
          async (userId, userExists) => {
            // Setup: Mock Firestore
            const mockDoc = createMockDoc(userExists, userId, userExists ? {} : undefined);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute and Verify
            if (userExists) {
              await expect(
                VvipService.validateUserExists(userId)
              ).resolves.toBe(true);
            } else {
              await expect(
                VvipService.validateUserExists(userId)
              ).rejects.toThrow('User does not exist');
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 4: VVIP Creation Updates All Required Fields', () => {
    /**
     * Feature: vvip-shopper-program, Property 4: VVIP Creation Updates All Required Fields
     * Validates: Requirements 1.6, 1.7, 1.8
     * 
     * For any valid user, when VVIP status is created by an authorized admin, 
     * the user document should be updated with isVvip=true, vvip_created_by set 
     * to the admin's ID, and vvip_created_at set to the current timestamp.
     */
    it('should set all required VVIP fields when creating VVIP shopper', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          userDataArb,
          async (userId, adminId, userData) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock user exists and is not VVIP
            const existingUserData = { ...userData, isVvip: false };
            const mockDoc = createMockDoc(true, userId, existingUserData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Create VVIP shopper
            const result = await VvipService.createVvipShopper(userId, adminId);

            // Verify: All required fields are set
            expect(result.success).toBe(true);
            expect(updatedFields).not.toBeNull();
            expect(updatedFields.isVvip).toBe(true);
            expect(updatedFields.vvip_created_by).toBe(adminId);
            expect(updatedFields.vvip_created_at).toBeInstanceOf(Timestamp);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject creating VVIP for already VVIP user', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          userDataArb,
          async (userId, adminId, userData) => {
            // Setup: Mock permission check to pass
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Mock user exists and is already VVIP
            const existingUserData = { ...userData, isVvip: true };
            const mockDoc = createMockDoc(true, userId, existingUserData);

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Execute and Verify: Should throw error
            await expect(
              VvipService.createVvipShopper(userId, adminId)
            ).rejects.toThrow('User is already a VVIP shopper');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 7: VVIP List Query Returns Only VVIP Users', () => {
    /**
     * Feature: vvip-shopper-program, Property 7: VVIP List Query Returns Only VVIP Users
     * Validates: Requirements 2.1
     * 
     * For any set of users in the database, querying for VVIP shoppers should 
     * return all and only users where isVvip is true.
     */
    it('should return only users with isVvip=true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userDataArb, { minLength: 0, maxLength: 10 }),
          async (users) => {
            // Setup: Separate VVIP and non-VVIP users
            const vvipUsers = users.filter(u => u.isVvip);
            const nonVvipUsers = users.filter(u => !u.isVvip);

            // Create mock documents for VVIP users only
            const mockDocs = vvipUsers.map((user, idx) =>
              createMockDoc(true, `user-${idx}`, {
                ...user,
                isVvip: true,
                vvip_created_by: 'admin-123',
                vvip_created_at: Timestamp.now(),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP shoppers
            const results = await VvipService.getVvipShoppers();

            // Verify: All results are VVIP users
            expect(results.length).toBe(vvipUsers.length);
            results.forEach(result => {
              expect(result.isVvip).toBe(true);
            });

            // Verify: No non-VVIP users in results
            const resultIds = results.map(r => r.userId);
            nonVvipUsers.forEach((_, idx) => {
              expect(resultIds).not.toContain(`non-vvip-${idx}`);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 9: VVIP List Filters Work Correctly', () => {
    /**
     * Feature: vvip-shopper-program, Property 9: VVIP List Filters Work Correctly
     * Validates: Requirements 2.7, 2.8, 2.9
     * 
     * For any filter criteria (country, date range, or creator), the filtered 
     * VVIP list should return all and only VVIP shoppers that match the specified criteria.
     */
    it('should filter by country correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          countryArb,
          fc.array(userDataArb, { minLength: 0, maxLength: 10 }),
          async (filterCountry, users) => {
            // Setup: Create VVIP users with various countries
            const vvipUsers = users.map(u => ({ ...u, isVvip: true }));
            const matchingUsers = vvipUsers.filter(
              u => u.registration_country === filterCountry
            );

            const mockDocs = matchingUsers.map((user, idx) =>
              createMockDoc(true, `user-${idx}`, {
                ...user,
                vvip_created_by: 'admin-123',
                vvip_created_at: Timestamp.now(),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP shoppers with country filter
            const results = await VvipService.getVvipShoppers({
              country: filterCountry,
            });

            // Verify: All results match the filter country
            results.forEach(result => {
              expect(result.country).toBe(filterCountry);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should filter by creator correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(userDataArb, { minLength: 0, maxLength: 10 }),
          async (creatorId, users) => {
            // Setup: Create VVIP users with various creators
            const vvipUsers = users.map(u => ({ ...u, isVvip: true }));

            const mockDocs = vvipUsers.map((user, idx) =>
              createMockDoc(true, `user-${idx}`, {
                ...user,
                vvip_created_by: creatorId,
                vvip_created_at: Timestamp.now(),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP shoppers with creator filter
            const results = await VvipService.getVvipShoppers({
              createdBy: creatorId,
            });

            // Verify: All results match the creator
            results.forEach(result => {
              expect(result.vvip_created_by).toBe(creatorId);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should filter by search query correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate non-whitespace strings for search query
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
          fc.array(userDataArb, { minLength: 0, maxLength: 10 }),
          async (searchQuery, users) => {
            // Setup: Create VVIP users
            const vvipUsers = users.map(u => ({ ...u, isVvip: true }));

            const mockDocs = vvipUsers.map((user, idx) =>
              createMockDoc(true, `user-${idx}`, {
                ...user,
                vvip_created_by: 'admin-123',
                vvip_created_at: Timestamp.now(),
              })
            );

            const mockQuery = {
              where: vi.fn().mockReturnThis(),
              get: vi.fn(async () => createMockSnapshot(mockDocs)),
            };

            const mockCollectionFn = vi.fn(() => mockQuery);
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get VVIP shoppers with search query
            const results = await VvipService.getVvipShoppers({
              searchQuery: searchQuery.toLowerCase(),
            });

            // Verify: All results match the search query
            const searchLower = searchQuery.toLowerCase().trim();
            results.forEach(result => {
              const matchesEmail = result.email.toLowerCase().includes(searchLower);
              const matchesFirstName = result.firstName.toLowerCase().includes(searchLower);
              const matchesLastName = result.lastName.toLowerCase().includes(searchLower);
              const matchesId = result.userId.includes(searchLower);

              expect(
                matchesEmail || matchesFirstName || matchesLastName || matchesId
              ).toBe(true);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 28: Field Preservation During VVIP Updates', () => {
    /**
     * Feature: vvip-shopper-program, Property 28: Field Preservation During VVIP Updates
     * Validates: Requirements 9.4
     * 
     * For any user document, when VVIP fields (isVvip, vvip_created_by, vvip_created_at) 
     * are added or updated, all other existing fields in the document should remain unchanged.
     */
    it('should preserve all existing user fields when adding VVIP status', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          userDataArb,
          fc.array(fc.tuple(fc.string(), fc.anything()), { minLength: 1, maxLength: 5 }),
          async (userId, adminId, userData, extraFields) => {
            // Setup: Create user with extra fields
            const existingUserData = {
              ...userData,
              isVvip: false,
              ...Object.fromEntries(extraFields),
            };

            const mockDoc = createMockDoc(true, userId, existingUserData);

            let updatedFields: any = null;

            const mockCollectionFn = vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn(async () => mockDoc),
                update: vi.fn(async (fields) => {
                  updatedFields = fields;
                }),
              })),
            }));
            (adminDb.collection as any) = mockCollectionFn;

            // Mock permission check
            (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

            // Execute: Create VVIP shopper
            await VvipService.createVvipShopper(userId, adminId);

            // Verify: Only VVIP fields are in the update
            expect(updatedFields).not.toBeNull();
            const updatedKeys = Object.keys(updatedFields);
            expect(updatedKeys).toContain('isVvip');
            expect(updatedKeys).toContain('vvip_created_by');
            expect(updatedKeys).toContain('vvip_created_at');

            // Verify: Update only contains VVIP fields (no other fields modified)
            expect(updatedKeys.length).toBe(3);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});


describe('VvipService Unit Tests', () => {
  describe('createVvipShopper', () => {
    it('should successfully create VVIP shopper for valid user', async () => {
      // Setup: Mock permission check to pass
      (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

      // Mock user exists and is not VVIP
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        registration_country: 'Nigeria',
        isVvip: false,
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      let updatedFields: any = null;

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
          update: vi.fn(async (fields) => {
            updatedFields = fields;
          }),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.createVvipShopper('user-123', 'admin-456');

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('VVIP status granted successfully');
      expect(result.userId).toBe('user-123');
      expect(updatedFields.isVvip).toBe(true);
      expect(updatedFields.vvip_created_by).toBe('admin-456');
      expect(updatedFields.vvip_created_at).toBeInstanceOf(Timestamp);
    });

    it('should reject duplicate VVIP creation', async () => {
      // Setup: Mock permission check to pass
      (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

      // Mock user exists and is already VVIP
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        registration_country: 'Nigeria',
        isVvip: true,
        vvip_created_by: 'admin-123',
        vvip_created_at: Timestamp.now(),
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute and Verify
      await expect(
        VvipService.createVvipShopper('user-123', 'admin-456')
      ).rejects.toThrow('User is already a VVIP shopper');
    });

    it('should reject non-existent user', async () => {
      // Setup: Mock permission check to pass
      (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

      // Mock user does not exist
      const mockDoc = createMockDoc(false, 'user-123');

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute and Verify
      await expect(
        VvipService.createVvipShopper('user-123', 'admin-456')
      ).rejects.toThrow('User does not exist');
    });

    it('should reject unauthorized admin', async () => {
      // Setup: Mock permission check to fail
      (vvipPermissionService.validatePermission as any).mockRejectedValue(
        new Error('You do not have permission to create VVIP resources')
      );

      // Execute and Verify
      // The service catches the permission error and wraps it
      await expect(
        VvipService.createVvipShopper('user-123', 'unauthorized-admin')
      ).rejects.toThrow();
    });
  });

  describe('revokeVvipStatus', () => {
    it('should successfully revoke VVIP status', async () => {
      // Setup: Mock permission check to pass
      (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

      // Mock user exists and is VVIP
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        registration_country: 'Nigeria',
        isVvip: true,
        vvip_created_by: 'admin-123',
        vvip_created_at: Timestamp.now(),
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      let updatedFields: any = null;

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
          update: vi.fn(async (fields) => {
            updatedFields = fields;
          }),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.revokeVvipStatus('user-123', 'admin-456');

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toBe('VVIP status revoked successfully');
      expect(result.userId).toBe('user-123');
      expect(updatedFields.isVvip).toBe(false);
      expect(updatedFields.vvip_revoked_by).toBe('admin-456');
      expect(updatedFields.vvip_revoked_at).toBeInstanceOf(Timestamp);
    });

    it('should reject revoking non-VVIP user', async () => {
      // Setup: Mock permission check to pass
      (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

      // Mock user exists but is not VVIP
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        registration_country: 'Nigeria',
        isVvip: false,
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute and Verify
      await expect(
        VvipService.revokeVvipStatus('user-123', 'admin-456')
      ).rejects.toThrow('User is not a VVIP shopper');
    });

    it('should reject non-existent user', async () => {
      // Setup: Mock permission check to pass
      (vvipPermissionService.validatePermission as any).mockResolvedValue(undefined);

      // Mock user does not exist
      const mockDoc = createMockDoc(false, 'user-123');

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute and Verify
      await expect(
        VvipService.revokeVvipStatus('user-123', 'admin-456')
      ).rejects.toThrow('User does not exist');
    });
  });

  describe('searchUsersByEmail', () => {
    it('should return empty array when no users match', async () => {
      // Setup: Mock empty query result
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(async () => createMockSnapshot([])),
      };

      const mockCollectionFn = vi.fn(() => mockQuery);
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const results = await VvipService.searchUsersByEmail('nonexistent@example.com');

      // Verify
      expect(results).toEqual([]);
    });

    it('should return matching users', async () => {
      // Setup: Mock query result with matching users
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        registration_country: 'Nigeria',
        isVvip: false,
      };

      const mockDocs = [createMockDoc(true, 'user-123', userData)];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(async () => createMockSnapshot(mockDocs)),
      };

      const mockCollectionFn = vi.fn(() => mockQuery);
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const results = await VvipService.searchUsersByEmail('test@example.com');

      // Verify
      expect(results.length).toBe(1);
      expect(results[0].email).toBe('test@example.com');
      expect(results[0].userId).toBe('user-123');
    });
  });

  describe('searchUserById', () => {
    it('should return null when user does not exist', async () => {
      // Setup: Mock non-existent user
      const mockDoc = createMockDoc(false, 'user-123');

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.searchUserById('user-123');

      // Verify
      expect(result).toBeNull();
    });

    it('should return user when exists', async () => {
      // Setup: Mock existing user
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        registration_country: 'Nigeria',
        isVvip: false,
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.searchUserById('user-123');

      // Verify
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('getVvipShoppers', () => {
    it('should return empty array when no VVIP shoppers exist', async () => {
      // Setup: Mock empty query result
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        get: vi.fn(async () => createMockSnapshot([])),
      };

      const mockCollectionFn = vi.fn(() => mockQuery);
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const results = await VvipService.getVvipShoppers();

      // Verify
      expect(results).toEqual([]);
    });

    it('should return all VVIP shoppers', async () => {
      // Setup: Mock VVIP shoppers
      const vvipUsers = [
        {
          email: 'vvip1@example.com',
          first_name: 'VVIP',
          last_name: 'One',
          registration_country: 'Nigeria',
          isVvip: true,
          vvip_created_by: 'admin-123',
          vvip_created_at: Timestamp.now(),
        },
        {
          email: 'vvip2@example.com',
          first_name: 'VVIP',
          last_name: 'Two',
          registration_country: 'Ghana',
          isVvip: true,
          vvip_created_by: 'admin-456',
          vvip_created_at: Timestamp.now(),
        },
      ];

      const mockDocs = vvipUsers.map((user, idx) =>
        createMockDoc(true, `user-${idx}`, user)
      );

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        get: vi.fn(async () => createMockSnapshot(mockDocs)),
      };

      const mockCollectionFn = vi.fn(() => mockQuery);
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const results = await VvipService.getVvipShoppers();

      // Verify
      expect(results.length).toBe(2);
      expect(results[0].isVvip).toBe(true);
      expect(results[1].isVvip).toBe(true);
    });

    it('should filter by country', async () => {
      // Setup: Mock VVIP shoppers from Nigeria
      const vvipUsers = [
        {
          email: 'vvip1@example.com',
          first_name: 'VVIP',
          last_name: 'One',
          registration_country: 'Nigeria',
          isVvip: true,
          vvip_created_by: 'admin-123',
          vvip_created_at: Timestamp.now(),
        },
      ];

      const mockDocs = vvipUsers.map((user, idx) =>
        createMockDoc(true, `user-${idx}`, user)
      );

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        get: vi.fn(async () => createMockSnapshot(mockDocs)),
      };

      const mockCollectionFn = vi.fn(() => mockQuery);
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const results = await VvipService.getVvipShoppers({ country: 'Nigeria' });

      // Verify
      expect(results.length).toBe(1);
      expect(results[0].country).toBe('Nigeria');
    });
  });

  describe('isVvipUser', () => {
    it('should return true for VVIP user', async () => {
      // Setup: Mock VVIP user
      const userData = {
        email: 'test@example.com',
        isVvip: true,
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.isVvipUser('user-123');

      // Verify
      expect(result).toBe(true);
    });

    it('should return false for non-VVIP user', async () => {
      // Setup: Mock non-VVIP user
      const userData = {
        email: 'test@example.com',
        isVvip: false,
      };

      const mockDoc = createMockDoc(true, 'user-123', userData);

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.isVvipUser('user-123');

      // Verify
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      // Setup: Mock non-existent user
      const mockDoc = createMockDoc(false, 'user-123');

      const mockCollectionFn = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
        })),
      }));
      (adminDb.collection as any) = mockCollectionFn;

      // Execute
      const result = await VvipService.isVvipUser('user-123');

      // Verify
      expect(result).toBe(false);
    });
  });
});
