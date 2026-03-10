import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';
import { TeamAssignmentService } from '@/lib/marketing/team-assignment-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/export/teams
 * Export team performance data
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check if user has permission to export data
    if (user.role !== 'super_admin' && user.role !== 'bdm') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to export team data' },
        { status: 403 }
      );
    }

    // Get all teams using server-side operations
    const teams = await TeamAssignmentService.getAllTeamsServerSide();

    // Calculate performance metrics for each team
    const teamPerformances = await Promise.all(
      teams.map(async (team) => {
        try {
          return await AnalyticsService.calculateTeamPerformance(team.id);
        } catch (error) {
          console.error(`Error calculating performance for team ${team.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values
    const validPerformances = teamPerformances.filter(p => p !== null);

    return NextResponse.json({
      success: true,
      data: validPerformances,
      count: validPerformances.length
    });
  } catch (error) {
    console.error('Error exporting team data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export team data' },
      { status: 500 }
    );
  }
}