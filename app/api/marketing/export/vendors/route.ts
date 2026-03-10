import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';
import { TeamAssignmentService } from '@/lib/marketing/team-assignment-service';
import { getTailorStats } from '@/admin-services/useTailors';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/export/vendors
 * Export vendor performance data
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
        { success: false, error: 'Insufficient permissions to export vendor data' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Get all vendor assignments using server-side operations
    let assignments = await TeamAssignmentService.getAllVendorAssignmentsServerSide();

    // Filter by team if specified
    if (teamId) {
      assignments = assignments.filter(a => a.teamId === teamId);
    }

    // Filter by user if specified
    if (userId) {
      assignments = assignments.filter(a => a.assignedToUserId === userId);
    }

    // Filter by status if specified
    if (status) {
      assignments = assignments.filter(a => a.status === status);
    }

    // Calculate performance metrics for each vendor
    const vendorPerformances = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          return await AnalyticsService.calculateVendorPerformance(assignment.vendorId);
        } catch (error) {
          console.error(`Error calculating performance for vendor ${assignment.vendorId}:`, error);
          return null;
        }
      })
    );

    // Filter out null values
    const validPerformances = vendorPerformances.filter(p => p !== null);

    return NextResponse.json({
      success: true,
      data: validPerformances,
      count: validPerformances.length
    });
  } catch (error) {
    console.error('Error exporting vendor data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export vendor data' },
      { status: 500 }
    );
  }
}