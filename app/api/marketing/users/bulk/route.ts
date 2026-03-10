/**
 * Marketing Users Bulk Operations API
 * Handles bulk user operations for efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  UserService, 
  RoleValidator,
  type UserRole
} from '@/lib/marketing/user-service';
import { 
  authenticateRequest,
  type AuthenticatedUser 
} from '@/lib/marketing/auth-middleware';

interface BulkStatusUpdate {
  userIds: string[];
  isActive: boolean;
}

interface BulkRoleUpdate {
  userIds: string[];
  role: UserRole;
}

interface BulkTeamAssignment {
  userIds: string[];
  teamId: string;
}

/**
 * PUT /api/marketing/users/bulk
 * Perform bulk operations on users
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user: currentUser } = authResult;
    const body = await request.json();
    const { operation, data } = body;

    // Only Super Admin can perform bulk operations
    if (currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can perform bulk operations' },
        { status: 403 }
      );
    }

    let results: any[] = [];
    let errors: any[] = [];

    switch (operation) {
      case 'updateStatus':
        const statusData = data as BulkStatusUpdate;
        
        if (!Array.isArray(statusData.userIds) || typeof statusData.isActive !== 'boolean') {
          return NextResponse.json(
            { error: 'Invalid data format for status update' },
            { status: 400 }
          );
        }

        for (const userId of statusData.userIds) {
          try {
            // Skip if trying to deactivate self
            if (userId === currentUser.uid && !statusData.isActive) {
              errors.push({ userId, error: 'Cannot deactivate your own account' });
              continue;
            }

            // Check if it's the last Super Admin
            const targetUser = await UserService.getUserById(userId);
            if (targetUser?.role === 'super_admin' && !statusData.isActive) {
              const superAdmins = await UserService.getSuperAdmins();
              const activeSuperAdmins = superAdmins.filter(admin => admin.isActive);
              
              if (activeSuperAdmins.length <= 1) {
                errors.push({ userId, error: 'Cannot deactivate the last active Super Admin' });
                continue;
              }
            }

            const updatedUser = await UserService.setUserActiveStatus(userId, statusData.isActive);
            results.push({ userId, success: true, user: updatedUser });
          } catch (error) {
            errors.push({ userId, error: 'Failed to update user status' });
          }
        }
        break;

      case 'updateRole':
        const roleData = data as BulkRoleUpdate;
        
        if (!Array.isArray(roleData.userIds) || !RoleValidator.isValidRole(roleData.role)) {
          return NextResponse.json(
            { error: 'Invalid data format for role update' },
            { status: 400 }
          );
        }

        for (const userId of roleData.userIds) {
          try {
            // Skip if trying to change own role
            if (userId === currentUser.uid) {
              errors.push({ userId, error: 'Cannot change your own role' });
              continue;
            }

            const targetUser = await UserService.getUserById(userId);
            if (!targetUser) {
              errors.push({ userId, error: 'User not found' });
              continue;
            }

            // Validate role assignment
            const roleValidation = RoleValidator.validateRoleAssignment(
              currentUser.role,
              roleData.role
            );
            if (!roleValidation.valid) {
              errors.push({ userId, error: roleValidation.error });
              continue;
            }

            // Check Super Admin demotion
            if (targetUser.role === 'super_admin' && roleData.role !== 'super_admin') {
              const superAdmins = await UserService.getSuperAdmins();
              if (superAdmins.length <= 1) {
                errors.push({ userId, error: 'Cannot demote the last Super Admin' });
                continue;
              }
            }

            const updatedUser = await UserService.updateUserRole(userId, roleData.role);
            results.push({ userId, success: true, user: updatedUser });
          } catch (error) {
            errors.push({ userId, error: 'Failed to update user role' });
          }
        }
        break;

      case 'assignTeam':
        const teamData = data as BulkTeamAssignment;
        
        if (!Array.isArray(teamData.userIds) || !teamData.teamId) {
          return NextResponse.json(
            { error: 'Invalid data format for team assignment' },
            { status: 400 }
          );
        }

        for (const userId of teamData.userIds) {
          try {
            const updatedUser = await UserService.updateUser(userId, { 
              teamId: teamData.teamId 
            });
            results.push({ userId, success: true, user: updatedUser });
          } catch (error) {
            errors.push({ userId, error: 'Failed to assign team' });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      results,
      errors,
      summary: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/users/bulk
 * Get users by multiple IDs for bulk operations preview
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user: currentUser } = authResult;
    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'userIds must be an array' },
        { status: 400 }
      );
    }

    // Only Super Admin can access bulk user data
    if (currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can access bulk user data' },
        { status: 403 }
      );
    }

    const users = [];
    const notFound = [];

    for (const userId of userIds) {
      try {
        const user = await UserService.getUserById(userId);
        if (user) {
          users.push(user);
        } else {
          notFound.push(userId);
        }
      } catch (error) {
        notFound.push(userId);
      }
    }

    return NextResponse.json({
      success: true,
      users,
      notFound,
      summary: {
        requested: userIds.length,
        found: users.length,
        notFound: notFound.length
      }
    });

  } catch (error) {
    console.error('Error fetching bulk users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk users' },
      { status: 500 }
    );
  }
}