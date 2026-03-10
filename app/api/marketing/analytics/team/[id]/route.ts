/**
 * Team Analytics API Endpoint
 * GET /api/marketing/analytics/team/[id] - Get team performance analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const teamId = params.id;

    // Check permissions - only super_admin, team_lead (of this team), or BDM can access team analytics
    if (user.role === 'team_member') {
      return NextResponse.json(
        { error: 'Insufficient permissions to access team analytics' },
        { status: 403 }
      );
    }

    // For team_lead, ensure they can only access their own team's analytics
    if (user.role === 'team_lead' && user.teamId !== teamId) {
      return NextResponse.json(
        { error: 'You can only access your own team analytics' },
        { status: 403 }
      );
    }

    // Calculate team performance metrics
    const teamAnalytics = await AnalyticsService.calculateTeamPerformance(teamId);

    return NextResponse.json({
      success: true,
      data: teamAnalytics
    });

  } catch (error) {
    console.error('Error fetching team analytics:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Team not found') {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}