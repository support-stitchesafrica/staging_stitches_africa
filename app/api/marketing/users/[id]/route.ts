/**
 * Marketing User Management API Routes
 * Handles individual user operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  UserService, 
  RoleValidator, 
  UserProfileValidator,
  type UpdateUserData
} from '@/lib/marketing/user-service';
import { 
  authenticateRequest,
  type AuthenticatedUser 
} from '@/lib/marketing/auth-middleware';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/marketing/users/[id]
 * Get user by ID with role-based access control
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    const targetUserId = params.id;

    // Get target user
    const targetUser = await UserService.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canAccess = 
      currentUser.role === 'super_admin' ||
      currentUser.uid === targetUserId ||
      (currentUser.role === 'team_lead' && targetUser.teamId === currentUser.teamId) ||
      (currentUser.role === 'bdm' && (targetUser.role === 'team_member' || targetUser.role === 'bdm'));

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access this user' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: targetUser
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketing/users/[id]
 * Update user profile
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    const targetUserId = params.id;

    // Get target user
    const targetUser = await UserService.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can update themselves, or higher roles can update lower roles
    const canUpdate = 
      currentUser.role === 'super_admin' ||
      currentUser.uid === targetUserId ||
      RoleValidator.canManageUser(currentUser.role, targetUser.role);

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this user' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: UpdateUserData = {
      name: body.name,
      phoneNumber: body.phoneNumber,
      teamId: body.teamId,
      profileImage: body.profileImage
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateUserData] === undefined) {
        delete updateData[key as keyof UpdateUserData];
      }
    });

    // Validate name if provided
    if (updateData.name) {
      const nameValidation = UserProfileValidator.validateName(updateData.name);
      if (!nameValidation.valid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate phone if provided
    if (updateData.phoneNumber) {
      const phoneValidation = UserProfileValidator.validatePhoneNumber(updateData.phoneNumber);
      if (!phoneValidation.valid) {
        return NextResponse.json(
          { error: phoneValidation.error },
          { status: 400 }
        );
      }
    }

    // Team assignment validation - only Super Admin and Team Leads can change team assignments
    if (updateData.teamId && currentUser.uid !== targetUserId) {
      if (currentUser.role !== 'super_admin' && currentUser.role !== 'team_lead') {
        return NextResponse.json(
          { error: 'Insufficient permissions to change team assignment' },
          { status: 403 }
        );
      }
    }

    // Update user
    const updatedUser = await UserService.updateUser(targetUserId, updateData);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketing/users/[id]
 * Deactivate user (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    const targetUserId = params.id;

    // Get target user
    const targetUser = await UserService.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions - only Super Admin can delete users, and users cannot delete themselves
    if (currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can deactivate users' },
        { status: 403 }
      );
    }

    if (currentUser.uid === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting the last Super Admin
    if (targetUser.role === 'super_admin') {
      const superAdmins = await UserService.getSuperAdmins();
      if (superAdmins.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate the last Super Admin' },
          { status: 400 }
        );
      }
    }

    // Deactivate user
    await UserService.deleteUser(targetUserId);

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}