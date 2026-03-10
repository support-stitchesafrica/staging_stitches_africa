/**
 * Marketing Teams API Routes
 * Handles team creation and listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/marketing/team-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/teams
 * Get all teams
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Only super_admin and team_lead can view teams
    if (user.role !== 'super_admin' && user.role !== 'team_lead') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get teams based on role using server-side operations
    let teams;
    if (user.role === 'super_admin') {
      teams = await TeamService.getAllTeamsServerSide();
    } else {
      // Team leads can only see their own teams
      teams = await TeamService.getTeamsByLeadServerSide(user.uid);
    }

    return NextResponse.json({
      success: true,
      teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Only super_admin and BDM can create teams
    if (user.role !== 'super_admin' && user.role !== 'bdm') {
      return NextResponse.json(
        { error: 'Only Super Admin and BDM can create teams' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, leadUserId } = body;

    // Validate required fields
    if (!name || !leadUserId) {
      return NextResponse.json(
        { error: 'Team name and lead user ID are required' },
        { status: 400 }
      );
    }

    // Create team
    const team = await TeamService.createTeam(
      {
        name,
        description,
        leadUserId,
        createdByUserId: user.uid
      },
      user.name || user.email
    );

    return NextResponse.json({
      success: true,
      team
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create team' 
      },
      { status: 500 }
    );
  }
}