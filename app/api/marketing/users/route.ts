/**
 * Marketing Users API Routes
 * GET /api/marketing/users - Get all users with filtering
 * POST /api/marketing/users - Create a new user
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  UserService, 
  RoleValidator, 
  UserProfileValidator,
  type CreateUserData 
} from '@/lib/marketing/user-service';
import { UserServiceServer } from '@/lib/marketing/user-service-server';
import { 
  authenticateRequest,
  type AuthenticatedUser 
} from '@/lib/marketing/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as any;
    const teamId = searchParams.get('teamId') || undefined;
    const isActive = searchParams.get('isActive');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Build filters
    const filters: any = {};
    if (role) filters.role = role;
    if (teamId) filters.teamId = teamId;
    if (isActive !== null) filters.isActive = isActive === 'true';
    if (limit) filters.limit = limit;

    // Get users based on role and permissions using server-side operations
    let users;
    
    if (user.role === 'super_admin') {
      // Super admin can see all users using server-side operations
      users = await UserServiceServer.getUsersServerSide(filters);
    } else if (user.role === 'team_lead' && user.teamId) {
      // Team lead can see users in their team
      const teamUsers = await UserServiceServer.getUsersByTeamServerSide(user.teamId);
      
      // Apply additional filters
      users = teamUsers.filter(u => {
        let matches = true;
        
        if (filters.role) {
          matches = matches && u.role === filters.role;
        }
        
        if (filters.isActive !== undefined) {
          matches = matches && u.isActive === filters.isActive;
        }
        
        return matches;
      });
      
      // Apply limit if specified
      if (filters.limit && users.length > filters.limit) {
        users = users.slice(0, filters.limit);
      }
    } else if (user.role === 'bdm') {
      // BDM can see team members and team leads using server-side operations
      users = await UserServiceServer.getUsersServerSide(filters);
      users = users.filter(u => 
        ['team_member', 'team_lead'].includes(u.role)
      );
    } else {
      // Regular team members can only see themselves
      const self = await UserService.getUserById(user.uid);
      users = self ? [self] : [];
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: 'Failed to fetch users',
      details: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult.user;

    // Only Super Admin and Team Leads can create users
    if (!['super_admin', 'team_lead'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, phoneNumber, role, teamId, profileImage } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = UserProfileValidator.validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate role assignment permissions
    if (role) {
      const roleValidation = RoleValidator.validateRoleAssignment(currentUser.role, role);
      if (!roleValidation.valid) {
        return NextResponse.json(
          { error: roleValidation.error },
          { status: 403 }
        );
      }
    }

    // For team leads, ensure new users are assigned to their team
    let finalTeamId = teamId;
    if (currentUser.role === 'team_lead') {
      finalTeamId = currentUser.teamId;
    }

    // Create user data
    const userData: CreateUserData = {
      email,
      name,
      phoneNumber,
      role: role || 'team_member',
      teamId: finalTeamId,
      profileImage
    };

    // Create user
    const newUser = await UserService.createUser(
      userData,
      currentUser.uid,
      currentUser.name || currentUser.email
    );

    return NextResponse.json({
      success: true,
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('exists')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}