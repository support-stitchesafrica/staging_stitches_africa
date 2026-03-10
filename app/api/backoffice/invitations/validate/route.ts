/**
 * Back Office Invitation Validation API Endpoint
 * 
 * POST /api/backoffice/invitations/validate - Validate an invitation token
 * 
 * Requirements: 2.3, 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/lib/backoffice/invitation-service';
import { createErrorResponse, createSuccessResponse } from '@/lib/backoffice/api-auth';
import { InvitationError } from '@/types/backoffice';

/**
 * POST /api/backoffice/invitations/validate
 * Validate an invitation token without accepting it
 * 
 * Body:
 * - token: string (required) - Invitation token to validate
 * 
 * No authentication required (public endpoint for invitation validation)
 * 
 * Requirement: 2.3 - Validate token and display acceptance form
 * Requirement: 2.5 - Prevent acceptance of expired invitations
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_INPUT',
          'Missing required field: token'
        ),
        { status: 400 }
      );
    }

    // Validate invitation token
    const validation = await InvitationService.validateInvitation(token);

    if (!validation.isValid) {
      // Return specific error based on validation result
      if (validation.error === InvitationError.INVALID_TOKEN) {
        return NextResponse.json(
          createErrorResponse(
            'INVALID_TOKEN',
            'Invalid invitation token'
          ),
          { status: 400 }
        );
      }

      if (validation.error === InvitationError.EXPIRED_TOKEN) {
        return NextResponse.json(
          createErrorResponse(
            'EXPIRED_TOKEN',
            'This invitation has expired. Please request a new invitation.'
          ),
          { status: 400 }
        );
      }

      if (validation.error === InvitationError.ALREADY_ACCEPTED) {
        return NextResponse.json(
          createErrorResponse(
            'ALREADY_ACCEPTED',
            'This invitation has already been accepted'
          ),
          { status: 400 }
        );
      }

      return NextResponse.json(
        createErrorResponse(
          'INVALID_TOKEN',
          validation.error || 'Invalid invitation token'
        ),
        { status: 400 }
      );
    }

    // Return invitation details (without sensitive token)
    const { invitation } = validation;
    
    return NextResponse.json(
      createSuccessResponse({
        isValid: true,
        invitation: {
          id: invitation!.id,
          email: invitation!.email,
          role: invitation!.role,
          departments: invitation!.departments,
          invitedByName: invitation!.invitedByName,
          createdAt: invitation!.createdAt,
          expiresAt: invitation!.expiresAt,
        },
        message: 'Invitation is valid',
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Invitations API] Validate error:', error);

    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to validate invitation'
      ),
      { status: 500 }
    );
  }
}
