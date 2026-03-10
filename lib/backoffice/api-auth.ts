/**
 * API Authentication Utilities for Back Office
 * Handles authentication and authorization for API endpoints
 * Requirements: 19.3, 19.4
 */

import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { BackOfficeUser, Department, PermissionLevel, AuthError } from '@/types/backoffice';
import { PermissionService } from './permission-service';

export interface AuthResult {
  success: boolean;
  user?: BackOfficeUser;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * Verify authentication from request
 * Checks Authorization header or session cookie
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let idToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7);
    }

    // If no Authorization header, try session cookie
    if (!idToken) {
      idToken = request.cookies.get('backoffice_session')?.value || null;
    }

    if (!idToken) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          status: 401,
        },
      };
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[API Auth] Token verification failed:', error);
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          status: 401,
        },
      };
    }

    const userId = decodedToken.uid;

    // Fetch back office user document
    const userDoc = await adminDb
      .collection('backoffice_users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Back office account not found',
          status: 404,
        },
      };
    }

    const userData = userDoc.data() as BackOfficeUser;

    // Check if account is active
    if (!userData.isActive) {
      return {
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'Account has been deactivated',
          status: 403,
        },
      };
    }

    return {
      success: true,
      user: {
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
      },
    };
  } catch (error) {
    console.error('[API Auth] Unexpected error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication verification failed',
        status: 500,
      },
    };
  }
}

/**
 * Verify user has permission for a specific department and level
 * Requirement: 19.4 - API endpoints verify authorization
 */
export function verifyPermission(
  user: BackOfficeUser,
  department: Department,
  level: PermissionLevel
): boolean {
  return PermissionService.hasPermission(user, department, level);
}

/**
 * Verify user is superadmin
 * Used for admin-only operations like user management
 */
export function isSuperAdmin(user: BackOfficeUser): boolean {
  return user.role === 'superadmin';
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400
) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}
