/**
 * Back Office Individual User API Endpoints
 * 
 * GET /api/backoffice/users/[uid] - Get user by ID
 * PUT /api/backoffice/users/[uid] - Update user
 * DELETE /api/backoffice/users/[uid] - Delete user (hard delete)
 * 
 * Requirements: 17.1, 17.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/backoffice/user-service';
import { verifyAuth, isSuperAdmin, createErrorResponse, createSuccessResponse } from '@/lib/backoffice/api-auth';
import { BackOfficeRole } from '@/types/backoffice';

/**
 * GET /api/backoffice/users/[uid]
 * Get a specific user by ID
 * 
 * Requires: Superadmin role OR requesting own user data
 * 
 * Requirement: 17.1 - View team members
 */
export async function GET(
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

    const { uid } = params;

    // Users can view their own data, or superadmin can view any user
    if (authResult.user.uid !== uid && !isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'You can only view your own user data'
        ),
        { status: 403 }
      );
    }

    // Get user
    const user = await UserService.getUserById(uid);

    if (!user) {
      return NextResponse.json(
        createErrorResponse(
          'USER_NOT_FOUND',
          'User not found'
        ),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ user }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[User API] GET error:', error);
    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch user'
      ),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/backoffice/users/[uid]
 * Update a user's information
 * 
 * Body:
 * - fullName: string (optional)
 * - role: BackOfficeRole (optional)
 * - isActive: boolean (optional)
 * - teamId: string (optional)
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.3 - Edit team member roles and permissions
 */
export async function PUT(
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

    // Only superadmin can update users
    if (!isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Only superadmin can update users'
        ),
        { status: 403 }
      );
    }

    const { uid } = params;

    // Parse request body
    const body = await request.json();
    const { fullName, role, isActive, teamId } = body;

    // Validate at least one field is provided
    if (fullName === undefined && role === undefined && isActive === undefined && teamId === undefined) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_INPUT',
          'At least one field must be provided for update'
        ),
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role !== undefined) {
      const validRoles: BackOfficeRole[] = [
        'superadmin',
        'founder',
        'bdm',
        'brand_lead',
        'logistics_lead',
        'marketing_manager',
        'marketing_member',
        'admin',
        'editor',
        'viewer',
      ];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          createErrorResponse(
            'INVALID_INPUT',
            'Invalid role'
          ),
          { status: 400 }
        );
      }
    }

    // Update user
    await UserService.updateUser(uid, {
      fullName,
      role,
      isActive,
      teamId,
    });

    // Fetch updated user
    const updatedUser = await UserService.getUserById(uid);

    return NextResponse.json(
      createSuccessResponse({
        user: updatedUser,
        message: 'User updated successfully',
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[User API] PUT error:', error);

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
          'Cannot modify the last active superadmin'
        ),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to update user'
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/backoffice/users/[uid]
 * Hard delete a user (removes from Firebase Auth and Firestore)
 * 
 * Note: For soft delete (deactivation), use the /deactivate endpoint instead
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 4.4 - Superadmin can delete users
 */
export async function DELETE(
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

    // Only superadmin can delete users
    if (!isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Only superadmin can delete users'
        ),
        { status: 403 }
      );
    }

    const { uid } = params;

    // Prevent self-deletion
    if (authResult.user.uid === uid) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Cannot delete your own account'
        ),
        { status: 403 }
      );
    }

    // Get user to check if they're a superadmin
    const userToDelete = await UserService.getUserById(uid);
    
    if (!userToDelete) {
      return NextResponse.json(
        createErrorResponse(
          'USER_NOT_FOUND',
          'User not found'
        ),
        { status: 404 }
      );
    }

    // Prevent deleting the last superadmin
    if (userToDelete.role === 'superadmin') {
      const allUsers = await UserService.getAllUsers();
      const activeSuperadmins = allUsers.filter(
        u => u.role === 'superadmin' && u.isActive && u.uid !== uid
      );
      
      if (activeSuperadmins.length === 0) {
        return NextResponse.json(
          createErrorResponse(
            'FORBIDDEN',
            'Cannot delete the last active superadmin'
          ),
          { status: 403 }
        );
      }
    }

    // Hard delete: Remove from Firestore and Firebase Auth
    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');
    
    // Delete from Firestore
    await adminDb.collection("staging_backoffice_users").doc(uid).delete();
    
    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    return NextResponse.json(
      createSuccessResponse({
        message: 'User deleted successfully',
        uid,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[User API] DELETE error:', error);

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

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to delete user'
      ),
      { status: 500 }
    );
  }
}
