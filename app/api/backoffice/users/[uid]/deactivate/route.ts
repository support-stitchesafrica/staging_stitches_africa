/**
 * Back Office User Deactivation API Endpoint
 * 
 * POST /api/backoffice/users/[uid]/deactivate - Deactivate (soft delete) a user
 * 
 * Requirements: 17.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/backoffice/user-service';
import { verifyAuth, isSuperAdmin, createErrorResponse, createSuccessResponse } from '@/lib/backoffice/api-auth';

/**
 * POST /api/backoffice/users/[uid]/deactivate
 * Deactivate a user (soft delete)
 * 
 * This sets isActive to false and disables the Firebase Auth account
 * The user data is preserved but the user cannot log in
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.4 - Deactivate team members
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        createErrorResponse(
          authResult.error?.code || 'UNAUTHORIZED',
          authResult.error?.message || 'Authentication required'
        ),
        { status: authResult.error?.status || 401 }
      );
    }

    // Only superadmin can deactivate users
    if (!isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Only superadmin can deactivate users'
        ),
        { status: 403 }
      );
    }

    const { uid } = params;

    // Prevent self-deactivation
    if (authResult.user.uid === uid) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Cannot deactivate your own account'
        ),
        { status: 403 }
      );
    }

    // Deactivate user
    await UserService.deactivateUser(uid);

    // Fetch updated user
    const deactivatedUser = await UserService.getUserById(uid);

    return NextResponse.json(
      createSuccessResponse({
        user: deactivatedUser,
        message: 'User deactivated successfully',
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[User Deactivate API] POST error:', error);

    // Handle specific errors
    if (error.message.includes('not found')) {
      return NextResponse.json(
        createErrorResponse(
          'USER_NOT_FOUND',
          'User not found'
        ),
        { status: 404 }
      );
    }

    if (error.message.includes('last active superadmin')) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Cannot deactivate the last active superadmin'
        ),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to deactivate user'
      ),
      { status: 500 }
    );
  }
}
