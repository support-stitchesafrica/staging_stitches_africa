/**
 * VVIP Audit Service Property-Based Tests
 * 
 * Tests universal properties for VVIP audit logging operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { VvipAuditService } from './vvip-audit-service';
import { VvipService } from './vvip-service';
import { VvipActionType } from '@/types/vvip';
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

// Helper to create mock Firestore document
function createMockDoc(exists: boolean, id: string, data?: any) {
  return {
    exists,
    id,
    data: () => data,
  };
}

// Helper to create mock Firestore document reference
function createMockDocRef(id: string) {
  return {
    id,
    set: vi.fn(async () => {}),
    get: vi.fn(),
    update: vi.fn(async () => {}),
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
const userIdArb = fc.uuid();
const emailArb = fc.emailAddress();
const actionTypeArb = fc.constantFrom<VvipActionType>(
  'vvip_created',
  'vvip_revoked',
  'payment_approved',
  'payment_rejected'
);

describe('VVIP Audit Service Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 5: VVIP Creation Generates Audit Log', () => {
    /**
     * Feature: vvip-shopper-program, Property 5: VVIP Creation Generates Audit Log
     * Validates: Requirements 1.10
     * 
     * For any successful VVIP creation, the system should create an audit log entry 
     * with action_type "vvip_created", the performing admin's ID, and the affected user's ID.
     */
    it('should create audit log with correct fields when VVIP is created', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          emailArb,
          emailArb,
          async (userId, adminId, userEmail, adminEmail) => {
            // Skip if userId and adminId are the same (edge case)
            fc.pre(userId !== adminId);

            // Setup: Mock Firestore operations
            const mockAuditLogRef = createMockDocRef('audit-log-123');
            const mockUserDoc = createMockDoc(true, userId, {
              email: userEmail,
              isVvip: false,
            });
            const mockAdminDoc = createMockDoc(true, adminId, {
              email: adminEmail,
            });

            let capturedAuditLog: any = null;

            // Mock collection chain for audit logs
            const mockAuditCollection = {
              doc: vi.fn(() => {
                mockAuditLogRef.set = vi.fn(async (data) => {
                  capturedAuditLog = data;
                });
                return mockAuditLogRef;
              }),
            };

            // Mock collection chain for users
            const mockUsersCollection = {
              doc: vi.fn((id: string) => {
                if (id === userId) {
                  mockUserDoc.get = vi.fn(async () => mockUserDoc);
                  mockUserDoc.update = vi.fn(async () => {});
                  return mockUserDoc;
                } else if (id === adminId) {
                  mockAdminDoc.get = vi.fn(async () => mockAdminDoc);
                  return mockAdminDoc;
                }
                return createMockDoc(false, id);
              }),
            };

            // Mock collection chain for marketing users
            const mockMarketingUsersCollection = {
              doc: vi.fn(() => createMockDoc(false, 'not-found')),
            };

            (adminDb.collection as any) = vi.fn((collectionName: string) => {
              if (collectionName === 'vvip_audit_logs') {
                return mockAuditCollection;
              } else if (collectionName === 'users') {
                return mockUsersCollection;
              } else if (collectionName === 'marketing_users') {
                return mockMarketingUsersCollection;
              }
              return {};
            });

            // Execute: Create VVIP shopper
            await VvipService.createVvipShopper(userId, adminId);

            // Verify: Audit log was created with correct fields
            expect(capturedAuditLog).not.toBeNull();
            expect(capturedAuditLog.action_type).toBe('vvip_created');
            expect(capturedAuditLog.performed_by).toBe(adminId);
            expect(capturedAuditLog.affected_user).toBe(userId);
            expect(capturedAuditLog.performed_by_email).toBe(adminEmail);
            expect(capturedAuditLog.affected_user_email).toBe(userEmail);
            expect(capturedAuditLog.timestamp).toBeInstanceOf(Timestamp);
            expect(capturedAuditLog.logId).toBe('audit-log-123');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 25: All VVIP Actions Generate Audit Logs', () => {
    /**
     * Feature: vvip-shopper-program, Property 25: All VVIP Actions Generate Audit Logs
     * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
     * 
     * For any VVIP action (creation, revocation, payment approval, payment rejection), 
     * the system should create an audit log entry with action_type, performed_by, 
     * affected_user, and timestamp fields populated correctly.
     */
    it('should create audit log with all required fields for any VVIP action', async () => {
      await fc.assert(
        fc.asyncProperty(
          actionTypeArb,
          userIdArb,
          userIdArb,
          emailArb,
          emailArb,
          fc.record({
            orderId: fc.option(fc.uuid()),
            admin_note: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            previous_status: fc.option(fc.string()),
            new_status: fc.option(fc.string()),
          }),
          async (actionType, performedBy, affectedUser, performedByEmail, affectedUserEmail, metadata) => {
            // Skip if performedBy and affectedUser are the same (edge case)
            fc.pre(performedBy !== affectedUser);

            // Setup: Mock Firestore operations
            const mockAuditLogRef = createMockDocRef('audit-log-456');
            let capturedAuditLog: any = null;

            // Mock collection chain for audit logs
            const mockAuditCollection = {
              doc: vi.fn(() => {
                mockAuditLogRef.set = vi.fn(async (data) => {
                  capturedAuditLog = data;
                });
                return mockAuditLogRef;
              }),
            };

            // Mock collection chain for users
            const mockUsersCollection = {
              doc: vi.fn((id: string) => {
                const mockDoc = createMockDoc(true, id, {
                  email: id === performedBy ? performedByEmail : affectedUserEmail,
                });
                mockDoc.get = vi.fn(async () => mockDoc);
                return mockDoc;
              }),
            };

            // Mock collection chain for marketing users
            const mockMarketingUsersCollection = {
              doc: vi.fn(() => createMockDoc(false, 'not-found')),
            };

            (adminDb.collection as any) = vi.fn((collectionName: string) => {
              if (collectionName === 'vvip_audit_logs') {
                return mockAuditCollection;
              } else if (collectionName === 'users') {
                return mockUsersCollection;
              } else if (collectionName === 'marketing_users') {
                return mockMarketingUsersCollection;
              }
              return {};
            });

            // Execute: Log VVIP action
            const timestamp = Timestamp.now();
            await VvipAuditService.logVvipAction({
              action_type: actionType,
              performed_by: performedBy,
              affected_user: affectedUser,
              timestamp,
              metadata,
            });

            // Verify: Audit log was created with all required fields
            expect(capturedAuditLog).not.toBeNull();
            expect(capturedAuditLog.action_type).toBe(actionType);
            expect(capturedAuditLog.performed_by).toBe(performedBy);
            expect(capturedAuditLog.affected_user).toBe(affectedUser);
            expect(capturedAuditLog.performed_by_email).toBe(performedByEmail);
            expect(capturedAuditLog.affected_user_email).toBe(affectedUserEmail);
            expect(capturedAuditLog.timestamp).toBeInstanceOf(Timestamp);
            expect(capturedAuditLog.logId).toBe('audit-log-456');
            expect(capturedAuditLog.metadata).toBeDefined();
            
            // Verify metadata fields if provided
            if (metadata.orderId) {
              expect(capturedAuditLog.metadata.orderId).toBe(metadata.orderId);
            }
            if (metadata.admin_note) {
              expect(capturedAuditLog.metadata.admin_note).toBe(metadata.admin_note);
            }
            if (metadata.previous_status) {
              expect(capturedAuditLog.metadata.previous_status).toBe(metadata.previous_status);
            }
            if (metadata.new_status) {
              expect(capturedAuditLog.metadata.new_status).toBe(metadata.new_status);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

describe('VVIP Audit Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logVvipAction', () => {
    it('should successfully create audit log for vvip_created action', async () => {
      // Setup
      const mockAuditLogRef = createMockDocRef('audit-log-789');
      let capturedAuditLog: any = null;

      const mockAuditCollection = {
        doc: vi.fn(() => {
          mockAuditLogRef.set = vi.fn(async (data) => {
            capturedAuditLog = data;
          });
          return mockAuditLogRef;
        }),
      };

      const mockUsersCollection = {
        doc: vi.fn((id: string) => {
          const mockDoc = createMockDoc(true, id, {
            email: `${id}@example.com`,
          });
          mockDoc.get = vi.fn(async () => mockDoc);
          return mockDoc;
        }),
      };

      const mockMarketingUsersCollection = {
        doc: vi.fn(() => createMockDoc(false, 'not-found')),
      };

      (adminDb.collection as any) = vi.fn((collectionName: string) => {
        if (collectionName === 'vvip_audit_logs') {
          return mockAuditCollection;
        } else if (collectionName === 'users') {
          return mockUsersCollection;
        } else if (collectionName === 'marketing_users') {
          return mockMarketingUsersCollection;
        }
        return {};
      });

      // Execute
      const logId = await VvipAuditService.logVvipAction({
        action_type: 'vvip_created',
        performed_by: 'admin-123',
        affected_user: 'user-456',
        timestamp: Timestamp.now(),
        metadata: { test: 'data' },
      });

      // Verify
      expect(logId).toBe('audit-log-789');
      expect(capturedAuditLog).not.toBeNull();
      expect(capturedAuditLog.action_type).toBe('vvip_created');
      expect(capturedAuditLog.performed_by).toBe('admin-123');
      expect(capturedAuditLog.affected_user).toBe('user-456');
    });

    it('should handle missing user emails gracefully', async () => {
      // Setup
      const mockAuditLogRef = createMockDocRef('audit-log-999');
      let capturedAuditLog: any = null;

      const mockAuditCollection = {
        doc: vi.fn(() => {
          mockAuditLogRef.set = vi.fn(async (data) => {
            capturedAuditLog = data;
          });
          return mockAuditLogRef;
        }),
      };

      const mockUsersCollection = {
        doc: vi.fn(() => createMockDoc(false, 'not-found')),
      };

      const mockMarketingUsersCollection = {
        doc: vi.fn(() => createMockDoc(false, 'not-found')),
      };

      (adminDb.collection as any) = vi.fn((collectionName: string) => {
        if (collectionName === 'vvip_audit_logs') {
          return mockAuditCollection;
        } else if (collectionName === 'users') {
          return mockUsersCollection;
        } else if (collectionName === 'marketing_users') {
          return mockMarketingUsersCollection;
        }
        return {};
      });

      // Execute
      await VvipAuditService.logVvipAction({
        action_type: 'vvip_revoked',
        performed_by: 'admin-123',
        affected_user: 'user-456',
        timestamp: Timestamp.now(),
      });

      // Verify - should use 'Unknown' for missing emails
      expect(capturedAuditLog.performed_by_email).toBe('Unknown');
      expect(capturedAuditLog.affected_user_email).toBe('Unknown');
    });
  });

  describe('getAuditLogsForUser', () => {
    it('should return audit logs for a specific user', async () => {
      // Setup
      const mockDocs = [
        createMockDoc(true, 'log-1', {
          logId: 'log-1',
          action_type: 'vvip_created',
          affected_user: 'user-123',
          performed_by: 'admin-456',
          timestamp: Timestamp.now(),
        }),
        createMockDoc(true, 'log-2', {
          logId: 'log-2',
          action_type: 'payment_approved',
          affected_user: 'user-123',
          performed_by: 'admin-789',
          timestamp: Timestamp.now(),
        }),
      ];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(async () => createMockSnapshot(mockDocs)),
      };

      const mockCollection = vi.fn(() => mockQuery);

      (adminDb.collection as any) = mockCollection;

      // Execute
      const logs = await VvipAuditService.getAuditLogsForUser('user-123');

      // Verify
      expect(logs).toHaveLength(2);
      expect(logs[0].action_type).toBe('vvip_created');
      expect(logs[1].action_type).toBe('payment_approved');
    });
  });
});
