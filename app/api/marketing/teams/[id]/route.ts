/**
 * Marketing Team API Routes (Single Team)
 * Handles team updates and deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/marketing/team-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/teams/[id]
 * Get team by ID with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const teamId = params.id;

    // Get team with members using server-side operations
    const team = await TeamService.getTeamWithMembers(teamId);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role !== 'super_admin' && team.leadUserId !== user.uid && user.role !== 'bdm') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketing/teams/[id]
 * Update team information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const teamId = params.id;

    // Only super_admin and BDM can update teams
    if (user.role !== 'super_admin' && user.role !== 'bdm') {
      return NextResponse.json(
        { error: 'Only Super Admin and BDM can update teams' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, leadUserId, isActive } = body;

    // Update team
    const team = await TeamService.updateTeam(
      teamId,
      { name, description, leadUserId, isActive },
      user.uid,
      user.name || user.email
    );

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update team' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketing/teams/[id]
 * Delete (deactivate) a team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const teamId = params.id;

    // Only super_admin and BDM can delete teams
    if (user.role !== 'super_admin' && user.role !== 'bdm') {
      return NextResponse.json(
        { error: 'Only Super Admin and BDM can delete teams' },
        { status: 403 }
      );
    }

    // Delete team
    await TeamService.deleteTeam(
      teamId,
      user.uid,
      user.name || user.email
    );

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete team' 
      },
      { status: 500 }
    );
  }
}