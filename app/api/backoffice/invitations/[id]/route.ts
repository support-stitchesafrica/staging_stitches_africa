/**
 * Back Office Single Invitation API Endpoints
 * 
 * GET /api/backoffice/invitations/[id] - Get a specific invitation
 * PUT /api/backoffice/invitations/[id] - Update invitation (expire/resend)
 * DELETE /api/backoffice/invitations/[id] - Delete an invitation
 * 
 * Requirements: 2.1, 17.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/lib/backoffice/invitation-service';
import { verifyAuth, isSuperAdmin, createErrorResponse, createSuccessResponse } from '@/lib/backoffice/api-auth';

/**
 * GET /api/backoffice/invitations/[id]
 * Get a specific invitation by ID
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.5 - View invitation details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only superadmin can view invitations
    if (!isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Only superadmin can view invitations'
        ),
        { status: 403 }
      );
    }

    const { id } = params;

    // Get invitation
    const invitation = await InvitationService.getInvitationById(id);

    if (!invitation) {
      return NextResponse.json(
        createErrorResponse(
          'NOT_FOUND',
          'Invitation not found'
        ),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        invitation,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Invitations API] GET [id] error:', error);
    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch invitation'
      ),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/backoffice/invitations/[id]
 * Update invitation (expire or resend)
 * 
 * Requires: Superadmin role
 * 
 * Body:
 * - action: 'expire' | 'resend'
 * - invitedBy?: string (required for resend)
 * - invitedByName?: string (required for resend)
 * 
 * Requirement: 17.5 - Manage invitations
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only superadmin can update invitations
    if (!isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Only superadmin can update invitations'
        ),
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, invitedBy, invitedByName } = body;

    // Validate action
    if (!action || !['expire', 'resend'].includes(action)) {
      return NextResponse.json(
        createErrorResponse(
          'INVALID_REQUEST',
          'Action must be either "expire" or "resend"'
        ),
        { status: 400 }
      );
    }

    // Check if invitation exists
    const invitation = await InvitationService.getInvitationById(id);
    if (!invitation) {
      return NextResponse.json(
        createErrorResponse(
          'NOT_FOUND',
          'Invitation not found'
        ),
        { status: 404 }
      );
    }

    if (action === 'expire') {
      // Expire invitation
      await InvitationService.expireInvitation(id);
      
      return NextResponse.json(
        createSuccessResponse({
          message: 'Invitation expired successfully',
        }),
        { status: 200 }
      );
    } else if (action === 'resend') {
      // Validate required fields for resend
      if (!invitedBy || !invitedByName) {
        return NextResponse.json(
          createErrorResponse(
            'INVALID_REQUEST',
            'invitedBy and invitedByName are required for resend action'
          ),
          { status: 400 }
        );
      }

      // Resend invitation
      const result = await InvitationService.resendInvitation(id, invitedBy, invitedByName);
      
      return NextResponse.json(
        createSuccessResponse({
          message: 'Invitation resent successfully',
          invitation: result.invitation,
          token: result.token,
        }),
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('[Invitations API] PUT error:', error);
    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        `Failed to ${body?.action || 'update'} invitation`
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/backoffice/invitations/[id]
 * Delete an invitation (permanent removal)
 * 
 * Requires: Superadmin role
 * 
 * Requirement: 17.5 - Manage invitations
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only superadmin can delete invitations
    if (!isSuperAdmin(authResult.user)) {
      return NextResponse.json(
        createErrorResponse(
          'FORBIDDEN',
          'Only superadmin can delete invitations'
        ),
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if invitation exists
    const invitation = await InvitationService.getInvitationById(id);
    if (!invitation) {
      return NextResponse.json(
        createErrorResponse(
          'NOT_FOUND',
          'Invitation not found'
        ),
        { status: 404 }
      );
    }

    // Delete invitation
    await InvitationService.deleteInvitation(id);

    return NextResponse.json(
      createSuccessResponse({
        message: 'Invitation deleted successfully',
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Invitations API] DELETE error:', error);
    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to delete invitation'
      ),
      { status: 500 }
    );
  }
}
