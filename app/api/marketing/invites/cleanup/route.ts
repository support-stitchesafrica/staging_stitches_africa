/**
 * Marketing Dashboard - Invitation Cleanup API
 * POST /api/marketing/invites/cleanup - Clean up expired invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/lib/marketing';
import { authenticateRequest, hasRole } from '@/lib/marketing';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Check if user has permission to manage invitations (Super Admin only)
    if (!hasRole(authResult.user, 'super_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Super Admin can cleanup invitations.' },
        { status: 403 }
      );
    }

    // Clean up expired invitations
    const cleanedCount = await InvitationService.cleanupExpiredInvitations();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired invitations`,
      cleanedCount
    }, { status: 200 });

  } catch (error) {
    console.error('Cleanup invitations error:', error);

    return NextResponse.json(
      { error: 'Failed to cleanup expired invitations' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}