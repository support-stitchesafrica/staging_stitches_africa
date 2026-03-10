/**
 * Marketing User Role Management API Route
 * PUT /api/marketing/users/[id]/role - Update user role and team assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/marketing/user-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;
    const targetUserId = params.id;

    // Only Super Admins can update user roles
    if (currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Only Super Admins can update user roles',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }

    // Get target user
    const targetUser = await UserService.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role, teamId } = body;

    // Validate role
    const validRoles = ['super_admin', 'team_lead', 'bdm', 'team_member'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { 
          error: 'Invalid role',
          code: 'INVALID_ROLE',
          validRoles
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (role) {
      updateData.role = role;
    }
    if (teamId !== undefined) {
      updateData.teamId = teamId || null; // null to remove team assignment
    }

    // Update user
    const updatedUser = await UserService.updateUser(targetUserId, updateData);

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update user role',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}