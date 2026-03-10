/**
 * Back Office Invitations API Endpoints
 * 
 * GET /api/backoffice/invitations - Get all invitations (with optional filters)
 * POST /api/backoffice/invitations - Create a new invitation
 * 
 * Requirements: 2.1, 2.2, 17.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/lib/backoffice/invitation-service';
import { withAuth, requireSuperAdmin } from '@/lib/backoffice/middleware';
import { BackOfficeRole } from '@/types/backoffice';

/**
 * GET /api/backoffice/invitations
 * Get all back office invitations
 * 
 * Query Parameters:
 * - status: 'pending' | 'accepted' | 'expired' (optional) - Filter by status
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.5 - View pending, accepted, and expired invitations
 */
export const GET = withAuth(async (request, context) => {
  try {
    // Authentication and authorization handled by middleware
    // context.user is guaranteed to be a superadmin

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'accepted' | 'expired' | null;

    // Get invitations
    let invitations;
    if (status) {
      invitations = await InvitationService.getInvitationsByStatus(status);
    } else {
      invitations = await InvitationService.getAllInvitations();
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          invitations,
          count: invitations.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Invitations API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch invitations',
        },
      },
      { status: 500 }
    );
  }
}, requireSuperAdmin());

/**
 * POST /api/backoffice/invitations
 * Create a new back office invitation
 * 
 * Body:
 * - email: string (required)
 * - role: BackOfficeRole (required)
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 2.1 - Administrator creates invitation with unique token
 * Requirement: 2.2 - Send email with acceptance link
 */
export const POST = withAuth(async (request, context) => {
  try {
    // Authentication and authorization handled by middleware
    // context.user is guaranteed to be a superadmin

    // Parse request body
    const body = await request.json();
    const { email, role } = body;

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: email, role',
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

    // Create invitation
    const result = await InvitationService.createInvitation(
      email,
      role,
      context.user.uid,
      context.user.fullName
    );

    // Generate invitation link
    const invitationLink = InvitationService.generateInvitationLink(result.token);

    // TODO: Send invitation email
    // This would integrate with your email service
    // await sendInvitationEmail(email, invitationLink, role, context.user.fullName);

    return NextResponse.json(
      {
        success: true,
        data: {
          invitation: result.invitation,
          invitationLink,
          message: 'Invitation created successfully',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Invitations API] POST error:', error);

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
          message: 'Failed to create invitation',
        },
      },
      { status: 500 }
    );
  }
}, requireSuperAdmin());
