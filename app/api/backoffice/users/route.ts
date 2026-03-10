/**
 * Back Office Users API Endpoints
 * 
 * GET /api/backoffice/users - Get all users (with optional filters)
 * POST /api/backoffice/users - Create a new user
 * 
 * Requirements: 4.4, 17.1, 17.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/backoffice/user-service';
import { withAuth, requireSuperAdmin } from '@/lib/backoffice/middleware';
import { BackOfficeRole, Department } from '@/types/backoffice';

/**
 * GET /api/backoffice/users
 * Get all back office users
 * 
 * Query Parameters:
 * - includeInactive: boolean (optional) - Include inactive users
 * - role: BackOfficeRole (optional) - Filter by role
 * - department: Department (optional) - Filter by department
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.1 - View all team members
 */
export const GET = withAuth(async (request, context) => {
  try {
    // Authentication and authorization handled by middleware
    // context.user is guaranteed to be a superadmin

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const role = searchParams.get('role') as BackOfficeRole | null;
    const department = searchParams.get('department') as Department | null;

    // Get users with filters
    const users = await UserService.getAllUsers({
      includeInactive,
      role: role || undefined,
      department: department || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          users,
          count: users.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Users API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch users',
        },
      },
      { status: 500 }
    );
  }
}, requireSuperAdmin());

/**
 * POST /api/backoffice/users
 * Create a new back office user
 * 
 * Body:
 * - email: string (required)
 * - password: string (required)
 * - fullName: string (required)
 * - role: BackOfficeRole (required)
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.2 - Create new team members
 */
export const POST = withAuth(async (request, context) => {
  try {
    // Authentication and authorization handled by middleware
    // context.user is guaranteed to be a superadmin

    // Parse request body
    const body = await request.json();
    const { email, password, fullName, role } = body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: email, password, fullName, role',
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid email format',
          },
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Password must be at least 8 characters long',
          },
        },
        { status: 400 }
      );
    }

    // Validate role
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
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid role',
          },
        },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await UserService.createUser(
      email,
      password,
      fullName,
      role,
      context.user.uid // invitedBy
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user: newUser,
          message: 'User created successfully',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Users API] POST error:', error);

    // Handle specific errors
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user',
        },
      },
      { status: 500 }
    );
  }
}, requireSuperAdmin());
