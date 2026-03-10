/**
 * Marketing Dashboard - Invitation Management API
 * GET /api/marketing/invites - Get all invitations (Super Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  InvitationService, 
  InvitationErrorCodes 
} from '@/lib/marketing';
import { authenticateRequest, hasRole } from '@/lib/marketing';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Check if user has permission to manage invitations (Super Admin only)
    if (!hasRole(authResult.user, 'super_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Super Admin can view all invitations.' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const invitedBy = url.searchParams.get('invitedBy');

    let invitations;

    if (status) {
      // Filter by status
      const validStatuses = ['pending', 'accepted', 'expired', 'revoked'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
          { status: 400 }
        );
      }
      invitations = await InvitationService.getInvitationsByStatus(status as any);
    } else if (invitedBy) {
      // Filter by inviter
      invitations = await InvitationService.getInvitationsByInviter(invitedBy);
    } else {
      // Get all invitations
      invitations = await InvitationService.getAllInvitations();
    }

    // Remove sensitive data (tokens) from response
    const sanitizedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      invitedByUserId: invitation.invitedByUserId,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      acceptedAt: invitation.acceptedAt
    }));

    return NextResponse.json({
      success: true,
      invitations: sanitizedInvitations,
      total: sanitizedInvitations.length
    }, { status: 200 });

  } catch (error) {
    console.error('Get invitations error:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve invitations' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}