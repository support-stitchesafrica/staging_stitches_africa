/**
 * Marketing Team Members API Routes
 * Handles adding members to teams
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/marketing/team-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/teams/[id]/members
 * Get team members
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

    // Check permissions - allow super_admin, team_lead (for their own team), and bdm
    const team = await TeamService.getTeamById(teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'super_admin' && user.role !== 'bdm' && 
        (user.role !== 'team_lead' || team.leadUserId !== user.uid)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get team members using server-side operations
    const members = await TeamService.getTeamMembers(teamId);

    return NextResponse.json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/teams/[id]/members
 * Add member to team
 */
export async function POST(
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

    // Allow super_admin and bdm to add members
    if (user.role !== 'super_admin' && user.role !== 'bdm') {
      return NextResponse.json(
        { error: 'Only Super Admin and BDM can add team members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Add member to team using server-side operations
    const team = await TeamService.addMemberToTeam(
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
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to add team member' 
      },
      { status: 500 }
    );
  }
}
