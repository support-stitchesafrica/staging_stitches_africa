/**
 * Tests for Back Office Permission Middleware
 * 
 * These tests verify the middleware correctly handles:
 * - Authentication verification
 * - Authorization checks
 * - Error responses
 * - Logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, withAuth, requireSuperAdmin, requireDepartment } from './middleware';
import { BackOfficeUser } from '@/types/backoffice';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        update: vi.fn(),
      })),
      add: vi.fn(),
    })),
  },
}));

// Mock PermissionService
vi.mock('./permission-service', () => ({
  PermissionService: {
    getRolePermissions: vi.fn((role) => {
      if (role === 'superadmin') {
        return {
          analytics: { read: true, write: true, delete: true },
          promotions: { read: true, write: true, delete: true },
          collections: { read: true, write: true, delete: true },
          marketing: { read: true, write: true, delete: true },
          admin: { read: true, write: true, delete: true },
        };
      }
      return {};
    }),
    hasPermission: vi.fn((user, department, level) => {
      if (user.role === 'superadmin') return true;
      return user.permissions?.[department]?.[level] || false;
    }),
    canAccessDepartment: vi.fn((user, department) => {
      return user.departments?.includes(department) || false;
    }),
  },
}));

describe('Permission Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateRequest', () => {
    it('should skip authentication when skipAuth is true', async () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const result = await authenticateRequest(request, { skipAuth: true });
      
      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.user.role).toBe('superadmin');
        expect(result.isSuperAdmin).toBe(true);
      }
    });

    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const result = await authenticateRequest(request);
      
      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        const json = await result.json();
        expect(json.error.code).toBe('UNAUTHORIZED');
        expect(result.status).toBe(401);
      }
    });
  });

  describe('withAuth', () => {
    it('should call handler with auth context when authenticated', async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAuth(handler, { skipAuth: true });
      const request = new NextRequest('http://localhost/api/test');
      
      await wrappedHandler(request);
      
      expect(handler).toHaveBeenCalled();
      const context = handler.mock.calls[0][1];
      expect(context.user).toBeDefined();
      expect(context.hasPermission).toBeDefined();
      expect(context.canAccessDepartment).toBeDefined();
      expect(context.isSuperAdmin).toBeDefined();
    });

    it('should return error response when authentication fails', async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAuth(handler);
      const request = new NextRequest('http://localhost/api/test');
      
      const response = await wrappedHandler(request);
      
      expect(handler).not.toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
      const json = await response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('requireSuperAdmin', () => {
    it('should return options with requiredRole set to superadmin', () => {
      const options = requireSuperAdmin();
      
      expect(options.requiredRole).toBe('superadmin');
    });

    it('should merge with existing options', () => {
      const options = requireSuperAdmin({ allowInactiveUsers: true });
      
      expect(options.requiredRole).toBe('superadmin');
      expect(options.allowInactiveUsers).toBe(true);
    });
  });

  describe('requireDepartment', () => {
    it('should return options with department and permission', () => {
      const options = requireDepartment('analytics', 'read');
      
      expect(options.requiredDepartment).toBe('analytics');
      expect(options.requiredPermission).toBe('read');
    });

    it('should default to read permission', () => {
      const options = requireDepartment('analytics');
      
      expect(options.requiredDepartment).toBe('analytics');
      expect(options.requiredPermission).toBe('read');
    });

    it('should merge with existing options', () => {
      const options = requireDepartment('analytics', 'write', { allowInactiveUsers: true });
      
      expect(options.requiredDepartment).toBe('analytics');
      expect(options.requiredPermission).toBe('write');
      expect(options.allowInactiveUsers).toBe(true);
    });
  });

  describe('Auth Context', () => {
    it('should provide hasPermission method', async () => {
      const handler = vi.fn(async (request, context) => {
        const canWrite = context.hasPermission('analytics', 'write');
        return NextResponse.json({ canWrite });
      });

      const wrappedHandler = withAuth(handler, { skipAuth: true });
      const request = new NextRequest('http://localhost/api/test');
      
      const response = await wrappedHandler(request);
      const json = await response.json();
      
      expect(json.canWrite).toBe(true);
    });

    it('should provide canAccessDepartment method', async () => {
      const handler = vi.fn(async (request, context) => {
        const canAccess = context.canAccessDepartment('analytics');
        return NextResponse.json({ canAccess });
      });

      const wrappedHandler = withAuth(handler, { skipAuth: true });
      const request = new NextRequest('http://localhost/api/test');
      
      const response = await wrappedHandler(request);
      const json = await response.json();
      
      expect(json.canAccess).toBe(true);
    });

    it('should provide isSuperAdmin flag', async () => {
      const handler = vi.fn(async (request, context) => {
        return NextResponse.json({ isSuperAdmin: context.isSuperAdmin });
      });

      const wrappedHandler = withAuth(handler, { skipAuth: true });
      const request = new NextRequest('http://localhost/api/test');
      
      const response = await wrappedHandler(request);
      const json = await response.json();
      
      expect(json.isSuperAdmin).toBe(true);
    });
  });
});
