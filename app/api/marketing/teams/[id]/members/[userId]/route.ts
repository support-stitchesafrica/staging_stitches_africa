import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/marketing/team-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * DELETE /api/marketing/teams/[id]/members/[userId]
 * Remove member from team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const teamId = params.id;
    const userId = params.userId;

    // Only super_admin can remove members
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can remove team members' },
        { status: 403 }
      );
    }

    // Remove member from team
    const team = await TeamService.removeMemberFromTeam(
      teamId,
      userId,
      user.uid,
      user.name || user.email
    );

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to remove team member' 
      },
      { status: 500 }
    );
  }
}