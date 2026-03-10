/**
 * Back Office Invitation Acceptance API Endpoint
 * 
 * POST /api/backoffice/invitations/accept - Accept an invitation and create user account
 * 
 * Requirements: 2.3, 2.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/lib/backoffice/invitation-service';
import { createErrorResponse, createSuccessResponse } from '@/lib/backoffice/api-auth';
import { InvitationError } from '@/types/backoffice';

/**
 * POST /api/backoffice/invitations/accept
 * Accept an invitation and create user account
 * 
 * Body:
 * - token: string (required) - Invitation token
 * - fullName: string (required) - User's full name
 * - password: string (required) - User's password
 * 
 * No authentication required (public endpoint for invitation acceptance)
 * 
 * Requirement: 2.3 - Validate token and display acceptance form
 * Requirement: 2.4 - Create account with assigned role and permissions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token, fullName, password } = body;

    // Validate required fields
    if (!token || !fullName || !password) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_INPUT',
          'Missing required fields: token, fullName, password'
        ),
        { status: 400 }
      );
    }

    // Validate full name
    if (fullName.trim().length < 2) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_INPUT',
          'Full name must be at least 2 characters long'
        ),
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_INPUT',
          'Password must be at least 8 characters long'
        ),
        { status: 400 }
      );
    }

    // Accept invitation (validates token, creates user)
    const acceptedInvitation = await InvitationService.acceptInvitation(
      token,
      fullName,
      password
    );

    return NextResponse.json(
      createSuccessResponse({
        invitation: acceptedInvitation,
        message: 'Invitation accepted successfully. You can now log in.',
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Invitations API] Accept error:', error);

    // Handle specific invitation errors
    if (error.message === InvitationError.INVALID_TOKEN) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_TOKEN',
          'Invalid invitation token'
        ),
        { status: 400 }
      );
    }

    if (error.message === InvitationError.EXPIRED_TOKEN) {
      return NextResponse.json(
        createErrorResponse(
          'EXPIRED_TOKEN',
          'This invitation has expired. Please request a new invitation.'
        ),
        { status: 400 }
      );
    }

    if (error.message === InvitationError.ALREADY_ACCEPTED) {
      return NextResponse.json(
        createErrorResponse(
          'ALREADY_ACCEPTED',
          'This invitation has already been accepted'
        ),
        { status: 400 }
      );
    }

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        createErrorResponse(
          'USER_EXISTS',
          'An account with this email already exists'
        ),
        { status: 409 }
      );
    }

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to accept invitation'
      ),
      { status: 500 }
    );
  }
}
