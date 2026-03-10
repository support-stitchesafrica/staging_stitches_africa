/**
 * VVIP API Routes Unit Tests
 * 
 * Tests specific examples and edge cases for VVIP API endpoints
 * Requirements: 1.11, 7.9
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    canCreateVvip: vi.fn(),
    canViewVvipOrders: vi.fn(),
    getUserPermissions: vi.fn(),
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

describe('VVIP API Routes Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/marketing/vvip/create', () => {
    it('should return 403 for unauthorized users', async () => {
      // Setup: Mock authentication with team_member role
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'team-member-123',
          email: 'member@example.com',
          role: 'team_member',
        },
      } as any);

      // Mock service to throw unauthorized error
      vi.mocked(vvipService.createVvipShopper).mockRejectedValue(
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
        { userId: 'user-123' }
      );

      // Execute
      const response = await createVvipPost(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(403);
      expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
      expect(data.message).toContain('permission');
    });

    it('should return 400 for missing userId', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Create request without userId
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/create',
        'POST',
        {}
      );

      // Execute
      const response = await createVvipPost(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.message).toContain('User ID is required');
      expect(data.field).toBe('userId');
    });

    it('should return 200 for successful VVIP creation', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Mock successful creation
      vi.mocked(vvipService.createVvipShopper).mockResolvedValue({
        success: true,
        message: 'VVIP status granted successfully',
        userId: 'user-123',
      });

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/create',
        'POST',
        { userId: 'user-123' }
      );

      // Execute
      const response = await createVvipPost(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('user-123');
      expect(vvipService.createVvipShopper).toHaveBeenCalledWith('user-123', 'admin-123');
    });
  });

  describe('POST /api/marketing/vvip/revoke', () => {
    it('should return 403 for unauthorized users', async () => {
      // Setup: Mock authentication with bdm role (cannot revoke)
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'bdm-123',
          email: 'bdm@example.com',
          role: 'bdm',
        },
      } as any);

      // Mock service to throw unauthorized error
      vi.mocked(vvipService.revokeVvipStatus).mockRejectedValue(
        new VvipError(
          VvipErrorCode.UNAUTHORIZED,
          'You do not have permission to revoke VVIP resources',
          403
        )
      );

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/revoke',
        'POST',
        { userId: 'user-123' }
      );

      // Execute
      const response = await revokeVvipPost(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(403);
      expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
    });

    it('should return 400 for missing userId', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Create request without userId
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/revoke',
        'POST',
        {}
      );

      // Execute
      const response = await revokeVvipPost(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.field).toBe('userId');
    });

    it('should return 200 for successful revocation', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Mock successful revocation
      vi.mocked(vvipService.revokeVvipStatus).mockResolvedValue({
        success: true,
        message: 'VVIP status revoked successfully',
        userId: 'user-123',
      });

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/revoke',
        'POST',
        { userId: 'user-123' }
      );

      // Execute
      const response = await revokeVvipPost(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vvipService.revokeVvipStatus).toHaveBeenCalledWith('user-123', 'admin-123');
    });
  });

  describe('GET /api/marketing/vvip/shoppers', () => {
    it('should return 403 for users without view permission', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'user-123',
          email: 'user@example.com',
          role: 'none',
        },
      } as any);

      // Mock permission check to deny
      vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(false);

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/shoppers',
        'GET'
      );

      // Execute
      const response = await getShoppers(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(403);
      expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
    });

    it('should return shoppers list with filters', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canViewVvipOrders).mockResolvedValue(true);

      // Mock shoppers data
      const mockShoppers = [
        {
          userId: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          country: 'Nigeria',
          isVvip: true,
          vvip_created_by: 'admin-123',
          vvip_created_at: {} as any,
        },
      ];
      vi.mocked(vvipService.getVvipShoppers).mockResolvedValue(mockShoppers);

      // Mock permissions
      vi.mocked(vvipPermissionService.getUserPermissions).mockResolvedValue({
        role: 'super_admin',
        canCreate: true,
        canEdit: true,
        canRevoke: true,
        canView: true,
        canApprove: true,
      });

      // Create request with filters
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/shoppers?country=Nigeria&search=john',
        'GET'
      );

      // Execute
      const response = await getShoppers(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.shoppers).toEqual(mockShoppers);
      expect(data.total).toBe(1);
      expect(vvipService.getVvipShoppers).toHaveBeenCalledWith({
        country: 'Nigeria',
        searchQuery: 'john',
        createdBy: undefined,
      });
    });
  });

  describe('GET /api/marketing/vvip/search', () => {
    it('should return 403 for users without create permission', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'member-123',
          email: 'member@example.com',
          role: 'team_member',
        },
      } as any);

      // Mock permission check to deny
      vi.mocked(vvipPermissionService.canCreateVvip).mockResolvedValue(false);

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/search?query=test@example.com&type=email',
        'GET'
      );

      // Execute
      const response = await searchUsers(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(403);
      expect(data.error).toBe(VvipErrorCode.UNAUTHORIZED);
    });

    it('should return 400 for missing query parameter', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canCreateVvip).mockResolvedValue(true);

      // Create request without query
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/search?type=email',
        'GET'
      );

      // Execute
      const response = await searchUsers(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.field).toBe('query');
    });

    it('should return 400 for invalid search type', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canCreateVvip).mockResolvedValue(true);

      // Create request with invalid type
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/search?query=test&type=invalid',
        'GET'
      );

      // Execute
      const response = await searchUsers(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(400);
      expect(data.error).toBe(VvipErrorCode.VALIDATION_ERROR);
      expect(data.field).toBe('type');
    });

    it('should return search results for valid query', async () => {
      // Setup: Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue({
        user: {
          uid: 'admin-123',
          email: 'admin@example.com',
          role: 'super_admin',
        },
      } as any);

      // Mock permission check
      vi.mocked(vvipPermissionService.canCreateVvip).mockResolvedValue(true);

      // Mock search results
      const mockUsers = [
        {
          userId: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isVvip: false,
        },
      ];
      vi.mocked(vvipService.searchUsers).mockResolvedValue(mockUsers);

      // Create request
      const request = createMockRequest(
        'http://localhost:3000/api/marketing/vvip/search?query=test@example.com&type=email',
        'GET'
      );

      // Execute
      const response = await searchUsers(request);
      const data = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toEqual(mockUsers);
      expect(vvipService.searchUsers).toHaveBeenCalledWith('test@example.com', 'email');
    });
  });
});
