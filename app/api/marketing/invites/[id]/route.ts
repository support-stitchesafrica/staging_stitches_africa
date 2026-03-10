/**
 * Marketing Dashboard - Individual Invitation Management API
 * GET /api/marketing/invites/[id] - Get specific invitation
 * PUT /api/marketing/invites/[id] - Update invitation (revoke)
 * DELETE /api/marketing/invites/[id] - Delete invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  InvitationService, 
  InvitationErrorCodes 
} from '@/lib/marketing';
import { authenticateRequest, hasRole } from '@/lib/marketing';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Check if user has permission to view invitations (Super Admin only)
    if (!hasRole(authResult.user, 'super_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Super Admin can view invitations.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get invitation by ID
    const invitation = await InvitationService.getInvitationById(id);

    if (!invitation) {
      return NextResponse.json(
        { 
          error: 'Invitation not found',
          code: InvitationErrorCodes.NOT_FOUND
        },
        { status: 404 }
      );
    }

    // Remove sensitive data (token) from response
    const sanitizedInvitation = {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      invitedByUserId: invitation.invitedByUserId,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      acceptedAt: invitation.acceptedAt
    };

    return NextResponse.json({
      success: true,
      invitation: sanitizedInvitation
    }, { status: 200 });

  } catch (error) {
    console.error('Get invitation error:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve invitation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Check if user has permission to manage invitations (Super Admin only)
    if (!hasRole(authResult.user, 'super_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Super Admin can manage invitations.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Parse request body
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (action !== 'revoke') {
      return NextResponse.json(
        { error: 'Invalid action. Only "revoke" is supported.' },
        { status: 400 }
      );
    }

    // Check if invitation exists
    const invitation = await InvitationService.getInvitationById(id);
    if (!invitation) {
      return NextResponse.json(
        { 
          error: 'Invitation not found',
          code: InvitationErrorCodes.NOT_FOUND
        },
        { status: 404 }
      );
    }

    // Check if invitation can be revoked
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot revoke an already accepted invitation' },
        { status: 400 }
      );
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { error: 'Invitation is already revoked' },
        { status: 400 }
      );
    }

    // Revoke invitation
    await InvitationService.revokeInvitation(id);

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Update invitation error:', error);

    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate and authorize user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Check if user has permission to manage invitations (Super Admin only)
    if (!hasRole(authResult.user, 'super_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Super Admin can delete invitations.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if invitation exists
    const invitation = await InvitationService.getInvitationById(id);
    if (!invitation) {
      return NextResponse.json(
        { 
          error: 'Invitation not found',
          code: InvitationErrorCodes.NOT_FOUND
        },
        { status: 404 }
      );
    }

    // Delete invitation
    await InvitationService.deleteInvitation(id);

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete invitation error:', error);

    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}