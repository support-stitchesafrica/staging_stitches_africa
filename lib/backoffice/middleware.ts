/**
 * Permission Middleware for Back Office System
 * Handles route protection, authentication verification, and authorization checks
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { BackOfficeUser, Department, PermissionLevel } from '@/types/backoffice';
import { PermissionService } from './permission-service';

/**
 * Authentication context passed to route handlers
 */
export interface AuthContext {
  user: BackOfficeUser;
  hasPermission: (department: Department, level: PermissionLevel) => boolean;
  canAccessDepartment: (department: Department) => boolean;
  isSuperAdmin: boolean;
}

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  // Skip authentication (for public routes)
  skipAuth?: boolean;
  
  // Required role for access
  requiredRole?: BackOfficeUser['role'];
  
  // Required department access
  requiredDepartment?: Department;
  
  // Required permission level for department
  requiredPermission?: PermissionLevel;
  
  // Allow inactive users (default: false)
  allowInactiveUsers?: boolean;
  
  // Custom authorization check
  customAuthCheck?: (user: BackOfficeUser) => boolean;
}

/**
 * Unauthorized access attempt log entry
 */
interface UnauthorizedAttempt {
  timestamp: Date;
  userId?: string;
  email?: string;
  route: string;
  method: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract Firebase ID token from request
 * Checks Authorization header and session cookie
 * 
 * Requirement: 19.3 - API endpoints verify authentication tokens
 */
async function extractIdToken(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try session cookie
  const sessionCookie = request.cookies.get('backoffice_session')?.value;
  if (sessionCookie) {
    return sessionCookie;
  }

  return null;
}

/**
 * Validate Firebase ID token
 * 
 * Requirement: 19.3 - API endpoints verify authentication tokens
 */
async function validateIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('[BackOffice Middleware] Token validation failed:', error);
    return null;
  }
}

/**
 * Fetch back office user profile from Firestore
 * 
 * Requirement: 19.1 - Unauthenticated users redirect to login
 */
async function fetchUserProfile(uid: string): Promise<BackOfficeUser | null> {
  try {
    const userDoc = await adminDb
      .collection('backoffice_users')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      console.warn('[BackOffice Middleware] User not found:', uid);
      return null;
    }

    const userData = userDoc.data() as BackOfficeUser;
    return {
      uid: userData.uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      departments: userData.departments,
      permissions: userData.permissions,
      teamId: userData.teamId,
      isActive: userData.isActive,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      invitedBy: userData.invitedBy,
      lastLogin: userData.lastLogin,
      migratedFrom: userData.migratedFrom,
    };
  } catch (error) {
    console.error('[BackOffice Middleware] Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Log unauthorized access attempt
 * 
 * Requirement: 19.5 - Log unauthorized access attempts
 */
async function logUnauthorizedAttempt(
  attempt: UnauthorizedAttempt
): Promise<void> {
  try {
    console.warn('[BackOffice Middleware] Unauthorized access attempt:', {
      timestamp: attempt.timestamp.toISOString(),
      userId: attempt.userId || 'anonymous',
      email: attempt.email || 'unknown',
      route: attempt.route,
      method: attempt.method,
      reason: attempt.reason,
      ipAddress: attempt.ipAddress || 'unknown',
      userAgent: attempt.userAgent || 'unknown',
    });

    // Store in Firestore for audit trail
    await adminDb.collection('backoffice_audit_logs').add({
      type: 'unauthorized_access',
      timestamp: new Date(attempt.timestamp),
      userId: attempt.userId || null,
      email: attempt.email || null,
      route: attempt.route,
      method: attempt.method,
      reason: attempt.reason,
      ipAddress: attempt.ipAddress || null,
      userAgent: attempt.userAgent || null,
    });
  } catch (error) {
    console.error('[BackOffice Middleware] Failed to log unauthorized attempt:', error);
  }
}

/**
 * Extract IP address from request
 */
function getIpAddress(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         undefined;
}

/**
 * Update user's last activity timestamp
 */
async function updateLastActivity(uid: string): Promise<void> {
  try {
    await adminDb
      .collection('backoffice_users')
      .doc(uid)
      .update({
        lastLogin: new Date(),
      });
  } catch (error) {
    console.error('[BackOffice Middleware] Failed to update last activity:', error);
  }
}

/**
 * Main authentication middleware function
 * Verifies authentication and authorization for requests
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
export async function authenticateRequest(
  request: NextRequest,
  options: MiddlewareOptions = {}
): Promise<AuthContext | NextResponse> {
  const route = request.nextUrl.pathname;
  const method = request.method;

  // Skip authentication if specified
  if (options.skipAuth) {
    // Create mock context for testing
    const mockUser: BackOfficeUser = {
      uid: 'test-user',
      email: 'test@backoffice.com',
      fullName: 'Test User',
      role: 'superadmin',
      departments: ['analytics', 'promotions', 'collections', 'marketing', 'admin'],
      permissions: PermissionService.getRolePermissions('superadmin'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user: mockUser,
      hasPermission: () => true,
      canAccessDepartment: () => true,
      isSuperAdmin: true,
    };
  }

  // Extract ID token
  const idToken = await extractIdToken(request);
  if (!idToken) {
    // Requirement 19.1: Unauthenticated access redirects to login
    await logUnauthorizedAttempt({
      timestamp: new Date(),
      route,
      method,
      reason: 'Missing authentication token',
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    );
  }

  // Validate ID token
  const decodedToken = await validateIdToken(idToken);
  if (!decodedToken) {
    // Requirement 19.3: Verify authentication tokens
    await logUnauthorizedAttempt({
      timestamp: new Date(),
      route,
      method,
      reason: 'Invalid or expired token',
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token',
        },
      },
      { status: 401 }
    );
  }

  // Fetch user profile
  const user = await fetchUserProfile(decodedToken.uid);
  if (!user) {
    // Requirement 19.2: Authenticated user without permission redirects
    await logUnauthorizedAttempt({
      timestamp: new Date(),
      userId: decodedToken.uid,
      email: decodedToken.email || undefined,
      route,
      method,
      reason: 'User profile not found in back office system',
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Back office account not found',
        },
      },
      { status: 404 }
    );
  }

  // Check if user is active
  if (!user.isActive && !options.allowInactiveUsers) {
    await logUnauthorizedAttempt({
      timestamp: new Date(),
      userId: user.uid,
      email: user.email,
      route,
      method,
      reason: 'Account is deactivated',
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'Account has been deactivated',
        },
      },
      { status: 403 }
    );
  }

  // Check required role
  if (options.requiredRole && user.role !== options.requiredRole) {
    // Requirement 19.4: Verify user permissions for requested resource
    await logUnauthorizedAttempt({
      timestamp: new Date(),
      userId: user.uid,
      email: user.email,
      route,
      method,
      reason: `Insufficient role: required ${options.requiredRole}, has ${user.role}`,
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Insufficient role permissions',
          required: options.requiredRole,
          current: user.role,
        },
      },
      { status: 403 }
    );
  }

  // Check department access
  if (options.requiredDepartment) {
    const canAccess = PermissionService.canAccessDepartment(user, options.requiredDepartment);
    if (!canAccess) {
      // Requirement 19.4: Verify user permissions for requested resource
      await logUnauthorizedAttempt({
        timestamp: new Date(),
        userId: user.uid,
        email: user.email,
        route,
        method,
        reason: `No access to department: ${options.requiredDepartment}`,
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_DEPARTMENT_ACCESS',
            message: `No access to ${options.requiredDepartment} department`,
          },
        },
        { status: 403 }
      );
    }
  }

  // Check permission level
  if (options.requiredDepartment && options.requiredPermission) {
    const hasPermission = PermissionService.hasPermission(
      user,
      options.requiredDepartment,
      options.requiredPermission
    );

    if (!hasPermission) {
      // Requirement 19.4: Verify user permissions for requested resource
      await logUnauthorizedAttempt({
        timestamp: new Date(),
        userId: user.uid,
        email: user.email,
        route,
        method,
        reason: `Insufficient permission: ${options.requiredPermission} on ${options.requiredDepartment}`,
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Insufficient permissions for this action`,
            required: options.requiredPermission,
            department: options.requiredDepartment,
          },
        },
        { status: 403 }
      );
    }
  }

  // Custom authorization check
  if (options.customAuthCheck && !options.customAuthCheck(user)) {
    await logUnauthorizedAttempt({
      timestamp: new Date(),
      userId: user.uid,
      email: user.email,
      route,
      method,
      reason: 'Failed custom authorization check',
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Authorization check failed',
        },
      },
      { status: 403 }
    );
  }

  // Update last activity (fire and forget)
  updateLastActivity(user.uid).catch(console.error);

  // Create auth context
  const authContext: AuthContext = {
    user,
    hasPermission: (department: Department, level: PermissionLevel) =>
      PermissionService.hasPermission(user, department, level),
    canAccessDepartment: (department: Department) =>
      PermissionService.canAccessDepartment(user, department),
    isSuperAdmin: user.role === 'superadmin',
  };

  return authContext;
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * 
 * Usage:
 * ```typescript
 * export const GET = withAuth(
 *   async (request, context) => {
 *     // Handler code with authenticated context
 *     return NextResponse.json({ user: context.user });
 *   },
 *   { requiredDepartment: 'analytics', requiredPermission: 'read' }
 * );
 * ```
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext, params?: any) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request, options);

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    return handler(request, authResult, params);
  };
}

/**
 * Middleware for superadmin-only routes
 */
export function requireSuperAdmin(options: MiddlewareOptions = {}): MiddlewareOptions {
  return {
    ...options,
    requiredRole: 'superadmin',
  };
}

/**
 * Middleware for department access
 */
export function requireDepartment(
  department: Department,
  permission: PermissionLevel = 'read',
  options: MiddlewareOptions = {}
): MiddlewareOptions {
  return {
    ...options,
    requiredDepartment: department,
    requiredPermission: permission,
  };
}

/**
 * Utility function to check if user has specific role
 */
export function hasRole(user: BackOfficeUser, ...roles: BackOfficeUser['role'][]): boolean {
  return roles.includes(user.role);
}

/**
 * Utility function to check if user is superadmin
 */
export function isSuperAdmin(user: BackOfficeUser): boolean {
  return user.role === 'superadmin';
}
