/**
 * VVIP API Routes Property-Based Tests
 * 
 * Tests universal properties for VVIP API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import { VvipErrorCode } from '@/types/vvip';

// Mock dependencies
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock('@/lib/marketing/auth-middleware', () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock('@/lib/marketing/vvip-service', () => ({
  vvipService: {
    createVvipShopper: vi.fn(),
    revokeVvipStatus: vi.fn(),
    getVvipShoppers: vi.fn(),
    searchUsers: vi.fn(),
  },
}));

vi.mock('@/lib/marketing/vvip-permission-service', () => ({
  vvipPermissionService: {
    getUserRole: vi.fn(),
    canCreateVvip: vi.fn(),
    canViewVvipOrders: vi.fn(),
    getUserPermissions: vi.fn(),
    validatePermission: vi.fn(),
  },
}));

import { POST as createVvipPost } from '../create/route';
import { POST as revokeVvipPost } from '../revoke/route';
import { GET as getShoppers } from '../shoppers/route';
import { GET as searchUsers } from '../search/route';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipService } from '@/lib/marketing/vvip-service';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { VvipError } from '@/types/vvip';
import { NextResponse } from 'next/server';

// Generators for property-based testing
const userIdArb = fc.uuid();
const emailArb = fc.emailAddress();
const roleArb = fc.constantFrom('super_admin', 'bdm', 'team_lead', 'team_member', 'none');
const unauthorizedRoleArb = fc.constantFrom('team_member', 'none');

// Helper to create mock NextRequest
function createMockRequest(url: string, method: string, body?: any): NextRequest {
  const request = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return request;
}

describe('VVIP API Routes Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 6: Unauthorized Users Cannot Create VVIP', () => {
    /**
     * Feature: vvip-shopper-program, Property 6: Unauthorized Users Cannot Create VVIP
     * Validates: Requirements 1.11
     * 
     * For any user with role "team_member" or no role, attempting to create VVIP status 
     * should be denied with an authorization error.
     */
    it('should deny VVIP creation for unauthorized users', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          unauthorizedRoleArb,
          async (adminId, targetUserId, role) => {
            // Setup: Mock authentication with unauthorized role
            vi.mocked(authenticateRequest).mockResolvedValue({
              user: {
                uid: adminId,
                email: 'test@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission service to deny access
            vi.mocked(vvipPermissionService.validatePermission).mockRejectedValue(
              new VvipError(
                VvipErrorCode.UNAUTHORIZED,
                'You do not have permission to create VVIP resources',
                403
              )
            );

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/create',
              'POST',
              { userId: targetUserId }
            );

            // Execute: Attempt to create VVIP
            const response = await createVvipPost(request);
            const data = await response.json();

            // Verify: Request should be denied with 403
            expect(response.status).toBe(403);
            expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
            expect(data.message).toContain('permission');

            // Verify: Service method should not be called (permission check fails first)
            // Note: The service itself validates permissions, so it will throw
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow VVIP creation for authorized users', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          fc.constantFrom('super_admin', 'bdm', 'team_lead'),
          async (adminId, targetUserId, role) => {
            // Setup: Mock authentication with authorized role
            vi.mocked(authenticateRequest).mockResolvedValue({
              user: {
                uid: adminId,
                email: 'admin@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission service to allow access
            vi.mocked(vvipPermissionService.validatePermission).mockResolvedValue();

            // Mock successful VVIP creation
            vi.mocked(vvipService.createVvipShopper).mockResolvedValue({
              success: true,
              message: 'VVIP status granted successfully',
              userId: targetUserId,
            });

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/create',
              'POST',
              { userId: targetUserId }
            );

            // Execute: Create VVIP
            const response = await createVvipPost(request);
            const data = await response.json();

            // Verify: Request should succeed
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.userId).toBe(targetUserId);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 26: Server-Side Validation Prevents Client-Only Changes', () => {
    /**
     * Feature: vvip-shopper-program, Property 26: Server-Side Validation Prevents Client-Only Changes
     * Validates: Requirements 8.8, 8.9
     * 
     * For any attempt to modify isVvip flag directly from client code, the system should 
     * reject the request and require proper server-side authorization.
     */
    it('should enforce server-side permission validation for all VVIP operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          roleArb,
          async (adminId, targetUserId, role) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              user: {
                uid: adminId,
                email: 'test@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission validation based on role
            const hasPermission = ['super_admin', 'bdm', 'team_lead'].includes(role);
            
            if (hasPermission) {
              vi.mocked(vvipPermissionService.validatePermission).mockResolvedValue();
              vi.mocked(vvipService.createVvipShopper).mockResolvedValue({
                success: true,
                message: 'VVIP status granted successfully',
                userId: targetUserId,
              });
            } else {
              vi.mocked(vvipPermissionService.validatePermission).mockRejectedValue(
                new VvipError(
                  VvipErrorCode.UNAUTHORIZED,
                  'You do not have permission to create VVIP resources',
                  403
                )
              );
            }

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/create',
              'POST',
              { userId: targetUserId }
            );

            // Execute: Attempt to create VVIP
            const response = await createVvipPost(request);
            const data = await response.json();

            // Verify: Server-side validation is enforced
            if (hasPermission) {
              // Authorized users should succeed
              expect(response.status).toBe(200);
              expect(data.success).toBe(true);
            } else {
              // Unauthorized users should be rejected
              expect(response.status).toBe(403);
              expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
            }

            // Verify: Permission validation was called
            expect(vvipPermissionService.validatePermission).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should validate permissions on revoke endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          roleArb,
          async (adminId, targetUserId, role) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              user: {
                uid: adminId,
                email: 'test@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission validation based on role
            // Only super_admin can revoke
            const hasPermission = role === 'super_admin';
            
            if (hasPermission) {
              vi.mocked(vvipPermissionService.validatePermission).mockResolvedValue();
              vi.mocked(vvipService.revokeVvipStatus).mockResolvedValue({
                success: true,
                message: 'VVIP status revoked successfully',
                userId: targetUserId,
              });
            } else {
              vi.mocked(vvipPermissionService.validatePermission).mockRejectedValue(
                new VvipError(
                  VvipErrorCode.UNAUTHORIZED,
                  'You do not have permission to revoke VVIP resources',
                  403
                )
              );
            }

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/revoke',
              'POST',
              { userId: targetUserId }
            );

            // Execute: Attempt to revoke VVIP
            const response = await revokeVvipPost(request);
            const data = await response.json();

            // Verify: Server-side validation is enforced
            if (hasPermission) {
              expect(response.status).toBe(200);
              expect(data.success).toBe(true);
            } else {
              expect(response.status).toBe(403);
              expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should validate permissions on shoppers list endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          roleArb,
          async (adminId, role) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              user: {
                uid: adminId,
                email: 'test@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check
            const hasPermission = role !== 'none';
            vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(hasPermission);

            if (hasPermission) {
              vi.mocked(vvipService.getVvipShoppers).mockResolvedValue([]);
              vi.mocked(vvipPermissionService.getUserPermissions).mockResolvedValue({
                role: role as any,
                canCreate: true,
                canEdit: true,
                canRevoke: false,
                canView: true,
                canApprove: false,
              });
            }

            // Create request
            const request = createMockRequest(
              'http://localhost:3000/api/marketing/vvip/shoppers',
              'GET'
            );

            // Execute: Attempt to get shoppers
            const response = await getShoppers(request);
            const data = await response.json();

            // Verify: Server-side validation is enforced
            if (hasPermission) {
              expect(response.status).toBe(200);
              expect(data.success).toBe(true);
            } else {
              expect(response.status).toBe(403);
              expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should validate permissions on search endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          emailArb,
          roleArb,
          async (adminId, searchEmail, role) => {
            // Setup: Mock authentication
            vi.mocked(authenticateRequest).mockResolvedValue({
              user: {
                uid: adminId,
                email: 'test@example.com',
                role: role as any,
              },
            } as any);

            // Mock permission check - only users who can create can search
            const hasPermission = ['super_admin', 'bdm', 'team_lead'].includes(role);
            vi.mocked(vvipPermissionService.canCreateVvip).mockResolvedValue(hasPermission);

            if (hasPermission) {
              vi.mocked(vvipService.searchUsers).mockResolvedValue([]);
            }

            // Create request
            const request = createMockRequest(
              `http://localhost:3000/api/marketing/vvip/search?query=${encodeURIComponent(searchEmail)}&type=email`,
              'GET'
            );

            // Execute: Attempt to search users
            const response = await searchUsers(request);
            const data = await response.json();

            // Verify: Server-side validation is enforced
            if (hasPermission) {
              expect(response.status).toBe(200);
              expect(data.success).toBe(true);
            } else {
              expect(response.status).toBe(403);
              expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
