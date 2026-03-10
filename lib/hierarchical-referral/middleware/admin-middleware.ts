/**
 * Admin Authentication Middleware for Hierarchical Referral System
 * Handles admin-specific authentication and authorization
 * Requirements: 6.2, 8.1, 10.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateHierarchicalRequest, HierarchicalAuthContext } from './auth-middleware';
import { adminDb } from '../../firebase-admin';

export interface AdminUser {
  uid: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermissions;
  isActive: boolean;
}

export interface AdminPermissions {
  canManageInfluencers: boolean;
  canViewAllData: boolean;
  canOverrideCommissions: boolean;
  canProcessPayouts: boolean;
  canManageDisputes: boolean;
  canViewAuditLogs: boolean;
  canExportAllData: boolean;
  canSendNotifications: boolean;
}

export interface AdminAuthContext {
  user: AdminUser;
  permissions: AdminPermissions;
}

export interface AdminMiddlewareOptions {
  requiredRole?: 'super_admin' | 'admin' | 'moderator';
  requiredPermissions?: (keyof AdminPermissions)[];
  skipAuth?: boolean;
}

/**
 * Fetches admin profile from Firestore
 */
async function fetchAdminProfile(uid: string): Promise<AdminUser | null> {
  try {
    const adminDoc = await adminDb
      .collection('hierarchical_admins')
      .doc(uid)
      .get();
    
    if (!adminDoc.exists) {
      return null;
    }

    const adminData = adminDoc.data();
    if (!adminData) {
      return null;
    }

    return {
      uid,
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
      permissions: generateAdminPermissions(adminData.role),
      isActive: adminData.isActive ?? true
    };
  } catch (error) {
    console.error('Failed to fetch admin profile:', error);
    return null;
  }
}

/**
 * Generates admin permissions based on role
 */
function generateAdminPermissions(role: string): AdminPermissions {
  switch (role) {
    case 'super_admin':
      return {
        canManageInfluencers: true,
        canViewAllData: true,
        canOverrideCommissions: true,
        canProcessPayouts: true,
        canManageDisputes: true,
        canViewAuditLogs: true,
        canExportAllData: true,
        canSendNotifications: true
      };
    
    case 'admin':
      return {
        canManageInfluencers: true,
        canViewAllData: true,
        canOverrideCommissions: true,
        canProcessPayouts: true,
        canManageDisputes: true,
        canViewAuditLogs: true,
        canExportAllData: true,
        canSendNotifications: false
      };
    
    case 'moderator':
      return {
        canManageInfluencers: false,
        canViewAllData: true,
        canOverrideCommissions: false,
        canProcessPayouts: false,
        canManageDisputes: true,
        canViewAuditLogs: false,
        canExportAllData: false,
        canSendNotifications: false
      };
    
    default:
      return {
        canManageInfluencers: false,
        canViewAllData: false,
        canOverrideCommissions: false,
        canProcessPayouts: false,
        canManageDisputes: false,
        canViewAuditLogs: false,
        canExportAllData: false,
        canSendNotifications: false
      };
  }
}

/**
 * Checks if admin has required permissions
 */
function hasRequiredAdminPermissions(
  adminPermissions: AdminPermissions,
  requiredPermissions: (keyof AdminPermissions)[]
): boolean {
  return requiredPermissions.every(permission => adminPermissions[permission]);
}

/**
 * Main admin authentication middleware function
 */
export async function authenticateAdminRequest(
  request: NextRequest,
  options: AdminMiddlewareOptions = {}
): Promise<AdminAuthContext | NextResponse> {
  if (options.skipAuth) {
    // Create a mock context for skipped auth (testing purposes)
    return {
      user: {
        uid: 'test-admin',
        email: 'admin@example.com',
        role: 'super_admin',
        permissions: generateAdminPermissions('super_admin'),
        isActive: true
      } as AdminUser,
      permissions: generateAdminPermissions('super_admin')
    };
  }

  // First authenticate as regular user
  const authResult = await authenticateHierarchicalRequest(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return authentication error
  }

  // Fetch admin profile
  const adminUser = await fetchAdminProfile(authResult.user.uid);
  if (!adminUser) {
    return NextResponse.json(
      { 
        error: 'Admin profile not found',
        code: 'ADMIN_NOT_FOUND'
      },
      { status: 404 }
    );
  }

  // Check if admin is active
  if (!adminUser.isActive) {
    return NextResponse.json(
      { 
        error: 'Admin account is deactivated',
        code: 'ADMIN_DEACTIVATED'
      },
      { status: 403 }
    );
  }

  // Check required role
  if (options.requiredRole && adminUser.role !== options.requiredRole) {
    return NextResponse.json(
      { 
        error: 'Insufficient admin role permissions',
        code: 'INSUFFICIENT_ADMIN_ROLE',
        required: options.requiredRole,
        current: adminUser.role
      },
      { status: 403 }
    );
  }

  // Check required permissions
  if (options.requiredPermissions && !hasRequiredAdminPermissions(adminUser.permissions, options.requiredPermissions)) {
    return NextResponse.json(
      { 
        error: 'Insufficient admin permissions',
        code: 'INSUFFICIENT_ADMIN_PERMISSIONS',
        required: options.requiredPermissions
      },
      { status: 403 }
    );
  }

  return {
    user: adminUser,
    permissions: adminUser.permissions
  };
}

/**
 * Higher-order function to wrap API route handlers with admin authentication
 */
export function withAdminAuth(
  handler: (request: NextRequest, context: AdminAuthContext, params?: any) => Promise<NextResponse>,
  options: AdminMiddlewareOptions = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const authResult = await authenticateAdminRequest(request, options);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    return handler(request, authResult, params);
  };
}

/**
 * Middleware for super admin only access
 */
export function requireSuperAdmin(options: AdminMiddlewareOptions = {}): AdminMiddlewareOptions {
  return {
    ...options,
    requiredRole: 'super_admin'
  };
}

/**
 * Middleware for admin or super admin access
 */
export function requireAdmin(options: AdminMiddlewareOptions = {}): AdminMiddlewareOptions {
  return {
    ...options,
    requiredPermissions: ['canManageInfluencers', 'canViewAllData']
  };
}

/**
 * Utility function to check if user has specific admin permission
 */
export function hasAdminPermission(permissions: AdminPermissions, permission: keyof AdminPermissions): boolean {
  return permissions[permission];
}