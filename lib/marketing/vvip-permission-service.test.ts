/**
 * VVIP Permission Service Tests
 * 
 * Feature: vvip-shopper-program, Property 24: Role-Based Permissions Are Enforced
 * Validates: Requirements 7.5, 7.6, 7.7, 7.8, 7.9
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { VvipPermissionService } from './vvip-permission-service';
import { VvipRole, VvipErrorCode } from '@/types/vvip';
import { MarketingRole } from './types';

// Mock firebase-admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

import { adminDb } from '@/lib/firebase-admin';

// Helper to create mock Firestore document
function createMockDoc(exists: boolean, data?: any) {
  return {
    exists,
    data: () => data,
  };
}

// Helper to create mock Firestore collection
function mockCollection(docData: any) {
  return {
    doc: vi.fn(() => ({
      get: vi.fn(async () => createMockDoc(docData !== null, docData)),
    })),
  };
}

describe('VvipPermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 24: Role-Based Permissions Are Enforced', () => {
    /**
     * Property Test: For any user and any VVIP action, the system should allow 
     * the action only if the user's role has the required permission, and deny 
     * all other attempts with an authorization error.
     * 
     * Validates: Requirements 7.5, 7.6, 7.7, 7.8, 7.9
     */
    it('should enforce role-based permissions for all roles and actions', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user IDs
          fc.uuid(),
          // Generate random roles
          fc.constantFrom<MarketingRole>('super_admin', 'bdm', 'team_lead', 'team_member'),
          // Generate random actions
          fc.constantFrom<'create' | 'edit' | 'revoke' | 'view' | 'approve'>(
            'create',
            'edit',
            'revoke',
            'view',
            'approve'
          ),
          async (userId, role, action) => {
            // Setup: Mock Firestore to return the user with the specified role
            const mockCollectionFn = vi.fn(() =>
              mockCollection({ role, isActive: true })
            );
            (adminDb.collection as any) = mockCollectionFn;

            // Define expected permissions for each role
            const expectedPermissions: Record<
              MarketingRole,
              Record<string, boolean>
            > = {
              super_admin: {
                create: true,
                edit: true,
                revoke: true,
                view: true,
                approve: true,
              },
              bdm: {
                create: true,
                edit: true,
                revoke: false,
                view: true,
                approve: true,
              },
              team_lead: {
                create: true,
                edit: true,
                revoke: false,
                view: true,
                approve: false,
              },
              team_member: {
                create: false,
                edit: false,
                revoke: false,
                view: true,
                approve: false,
              },
            };

            const expectedPermission = expectedPermissions[role][action];

            // Execute: Check permission based on action
            let hasPermission = false;
            switch (action) {
              case 'create':
                hasPermission = await VvipPermissionService.canCreateVvip(userId);
                break;
              case 'edit':
                hasPermission = await VvipPermissionService.canEditVvip(userId);
                break;
              case 'revoke':
                hasPermission = await VvipPermissionService.canRevokeVvip(userId);
                break;
              case 'view':
                hasPermission = await VvipPermissionService.canViewVvipOrders(userId);
                break;
              case 'approve':
                hasPermission = await VvipPermissionService.canApprovePayment(userId);
                break;
            }

            // Verify: Permission matches expected value
            expect(hasPermission).toBe(expectedPermission);

            // Also verify validatePermission throws error when permission is denied
            if (!expectedPermission) {
              await expect(
                VvipPermissionService.validatePermission(userId, action)
              ).rejects.toThrow();
            } else {
              await expect(
                VvipPermissionService.validatePermission(userId, action)
              ).resolves.not.toThrow();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return "none" role for non-existent users', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Setup: Mock Firestore to return non-existent user
          const mockCollectionFn = vi.fn(() => mockCollection(null));
          (adminDb.collection as any) = mockCollectionFn;

          // Execute: Get user role
          const role = await VvipPermissionService.getUserRole(userId);

          // Verify: Role should be 'none'
          expect(role).toBe('none');

          // Verify: All permissions should be false
          const canCreate = await VvipPermissionService.canCreateVvip(userId);
          const canEdit = await VvipPermissionService.canEditVvip(userId);
          const canRevoke = await VvipPermissionService.canRevokeVvip(userId);
          const canView = await VvipPermissionService.canViewVvipOrders(userId);
          const canApprove = await VvipPermissionService.canApprovePayment(userId);

          expect(canCreate).toBe(false);
          expect(canEdit).toBe(false);
          expect(canRevoke).toBe(false);
          expect(canView).toBe(false);
          expect(canApprove).toBe(false);
        }),
        { numRuns: 10 }
      );
    });

    it('should return consistent permissions for the same role', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom<MarketingRole>('super_admin', 'bdm', 'team_lead', 'team_member'),
          async (userId, role) => {
            // Setup: Mock Firestore to return the user with the specified role
            const mockCollectionFn = vi.fn(() =>
              mockCollection({ role, isActive: true })
            );
            (adminDb.collection as any) = mockCollectionFn;

            // Execute: Get permissions twice
            const permissions1 = await VvipPermissionService.getUserPermissions(userId);
            const permissions2 = await VvipPermissionService.getUserPermissions(userId);

            // Verify: Permissions should be identical
            expect(permissions1).toEqual(permissions2);
            expect(permissions1.role).toBe(role);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Unit Tests: Permission Edge Cases', () => {
    describe('getUserRole', () => {
      it('should return correct role for super_admin', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'super_admin', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('test-user-id');
        expect(role).toBe('super_admin');
      });

      it('should return correct role for bdm', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'bdm', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('test-user-id');
        expect(role).toBe('bdm');
      });

      it('should return correct role for team_lead', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_lead', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('test-user-id');
        expect(role).toBe('team_lead');
      });

      it('should return correct role for team_member', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_member', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('test-user-id');
        expect(role).toBe('team_member');
      });

      it('should return "none" for non-existent user', async () => {
        const mockCollectionFn = vi.fn(() => mockCollection(null));
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('non-existent-user');
        expect(role).toBe('none');
      });

      it('should return "none" for user without role field', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('test-user-id');
        expect(role).toBe('none');
      });

      it('should return "none" for user with invalid role', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'invalid_role', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const role = await VvipPermissionService.getUserRole('test-user-id');
        expect(role).toBe('none');
      });
    });

    describe('canCreateVvip', () => {
      it('should allow super_admin to create VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'super_admin', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canCreate = await VvipPermissionService.canCreateVvip('test-user-id');
        expect(canCreate).toBe(true);
      });

      it('should allow bdm to create VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'bdm', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canCreate = await VvipPermissionService.canCreateVvip('test-user-id');
        expect(canCreate).toBe(true);
      });

      it('should allow team_lead to create VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_lead', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canCreate = await VvipPermissionService.canCreateVvip('test-user-id');
        expect(canCreate).toBe(true);
      });

      it('should deny team_member from creating VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_member', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canCreate = await VvipPermissionService.canCreateVvip('test-user-id');
        expect(canCreate).toBe(false);
      });

      it('should deny non-marketing user from creating VVIP', async () => {
        const mockCollectionFn = vi.fn(() => mockCollection(null));
        (adminDb.collection as any) = mockCollectionFn;

        const canCreate = await VvipPermissionService.canCreateVvip('test-user-id');
        expect(canCreate).toBe(false);
      });
    });

    describe('canRevokeVvip', () => {
      it('should allow only super_admin to revoke VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'super_admin', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canRevoke = await VvipPermissionService.canRevokeVvip('test-user-id');
        expect(canRevoke).toBe(true);
      });

      it('should deny bdm from revoking VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'bdm', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canRevoke = await VvipPermissionService.canRevokeVvip('test-user-id');
        expect(canRevoke).toBe(false);
      });

      it('should deny team_lead from revoking VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_lead', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canRevoke = await VvipPermissionService.canRevokeVvip('test-user-id');
        expect(canRevoke).toBe(false);
      });

      it('should deny team_member from revoking VVIP', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_member', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canRevoke = await VvipPermissionService.canRevokeVvip('test-user-id');
        expect(canRevoke).toBe(false);
      });
    });

    describe('canApprovePayment', () => {
      it('should allow super_admin to approve payments', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'super_admin', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canApprove = await VvipPermissionService.canApprovePayment('test-user-id');
        expect(canApprove).toBe(true);
      });

      it('should allow bdm to approve payments', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'bdm', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canApprove = await VvipPermissionService.canApprovePayment('test-user-id');
        expect(canApprove).toBe(true);
      });

      it('should deny team_lead from approving payments', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_lead', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canApprove = await VvipPermissionService.canApprovePayment('test-user-id');
        expect(canApprove).toBe(false);
      });

      it('should deny team_member from approving payments', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_member', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const canApprove = await VvipPermissionService.canApprovePayment('test-user-id');
        expect(canApprove).toBe(false);
      });
    });

    describe('canViewVvipOrders', () => {
      it('should allow all marketing users to view VVIP orders', async () => {
        const roles: MarketingRole[] = ['super_admin', 'bdm', 'team_lead', 'team_member'];

        for (const role of roles) {
          const mockCollectionFn = vi.fn(() =>
            mockCollection({ role, isActive: true })
          );
          (adminDb.collection as any) = mockCollectionFn;

          const canView = await VvipPermissionService.canViewVvipOrders('test-user-id');
          expect(canView).toBe(true);
        }
      });

      it('should deny non-marketing users from viewing VVIP orders', async () => {
        const mockCollectionFn = vi.fn(() => mockCollection(null));
        (adminDb.collection as any) = mockCollectionFn;

        const canView = await VvipPermissionService.canViewVvipOrders('test-user-id');
        expect(canView).toBe(false);
      });
    });

    describe('validatePermission', () => {
      it('should not throw for authorized actions', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'super_admin', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        await expect(
          VvipPermissionService.validatePermission('test-user-id', 'create')
        ).resolves.not.toThrow();

        await expect(
          VvipPermissionService.validatePermission('test-user-id', 'revoke')
        ).resolves.not.toThrow();
      });

      it('should throw UNAUTHORIZED error for team_member trying to create', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_member', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        await expect(
          VvipPermissionService.validatePermission('test-user-id', 'create')
        ).rejects.toThrow('You do not have permission to create VVIP resources');
      });

      it('should throw UNAUTHORIZED error for non-marketing user', async () => {
        const mockCollectionFn = vi.fn(() => mockCollection(null));
        (adminDb.collection as any) = mockCollectionFn;

        await expect(
          VvipPermissionService.validatePermission('test-user-id', 'view')
        ).rejects.toThrow('You do not have permission to access VVIP features');
      });

      it('should throw UNAUTHORIZED error for bdm trying to revoke', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'bdm', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        await expect(
          VvipPermissionService.validatePermission('test-user-id', 'revoke')
        ).rejects.toThrow('You do not have permission to revoke VVIP resources');
      });
    });

    describe('getUserPermissions', () => {
      it('should return all permissions for super_admin', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'super_admin', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const permissions = await VvipPermissionService.getUserPermissions('test-user-id');

        expect(permissions.role).toBe('super_admin');
        expect(permissions.canCreate).toBe(true);
        expect(permissions.canEdit).toBe(true);
        expect(permissions.canRevoke).toBe(true);
        expect(permissions.canView).toBe(true);
        expect(permissions.canApprove).toBe(true);
      });

      it('should return limited permissions for team_member', async () => {
        const mockCollectionFn = vi.fn(() =>
          mockCollection({ role: 'team_member', isActive: true })
        );
        (adminDb.collection as any) = mockCollectionFn;

        const permissions = await VvipPermissionService.getUserPermissions('test-user-id');

        expect(permissions.role).toBe('team_member');
        expect(permissions.canCreate).toBe(false);
        expect(permissions.canEdit).toBe(false);
        expect(permissions.canRevoke).toBe(false);
        expect(permissions.canView).toBe(true);
        expect(permissions.canApprove).toBe(false);
      });

      it('should return no permissions for non-marketing user', async () => {
        const mockCollectionFn = vi.fn(() => mockCollection(null));
        (adminDb.collection as any) = mockCollectionFn;

        const permissions = await VvipPermissionService.getUserPermissions('test-user-id');

        expect(permissions.role).toBe('none');
        expect(permissions.canCreate).toBe(false);
        expect(permissions.canEdit).toBe(false);
        expect(permissions.canRevoke).toBe(false);
        expect(permissions.canView).toBe(false);
        expect(permissions.canApprove).toBe(false);
      });
    });

    describe('isMarketingUser', () => {
      it('should return true for marketing users', async () => {
        const roles: MarketingRole[] = ['super_admin', 'bdm', 'team_lead', 'team_member'];

        for (const role of roles) {
          const mockCollectionFn = vi.fn(() =>
            mockCollection({ role, isActive: true })
          );
          (adminDb.collection as any) = mockCollectionFn;

          const isMarketing = await VvipPermissionService.isMarketingUser('test-user-id');
          expect(isMarketing).toBe(true);
        }
      });

      it('should return false for non-marketing users', async () => {
        const mockCollectionFn = vi.fn(() => mockCollection(null));
        (adminDb.collection as any) = mockCollectionFn;

        const isMarketing = await VvipPermissionService.isMarketingUser('test-user-id');
        expect(isMarketing).toBe(false);
      });
    });
  });
});
