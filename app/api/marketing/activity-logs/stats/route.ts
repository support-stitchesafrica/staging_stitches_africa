/**
 * Marketing Dashboard Activity Logs Statistics API
 * GET /api/marketing/activity-logs/stats - Get activity statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogServiceServer as ActivityLogService } from '@/lib/marketing/activity-log-service-server';
import { withAuth } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/activity-logs/stats
 * Get activity log statistics
 * Requires: Super Admin role
 */
export const GET = withAuth(
  async (request: NextRequest, context) => {
    try {
      const { user, permissions } = context;

      console.log('[Activity Stats API] GET request from user:', user.email, 'role:', user.role);

      // Only Super Admin can view activity statistics
      if (!permissions.canViewAuditLogs) {
        console.log('[Activity Stats API] Permission denied for user:', user.email);
        return NextResponse.json(
          { error: 'Insufficient permissions to view activity statistics' },
          { status: 403 }
        );
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      console.log('[Activity Stats API] Fetching stats with date range:', { startDate, endDate });
      const stats = await ActivityLogService.getActivityStats(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      console.log('[Activity Stats API] Successfully fetched stats');

      return NextResponse.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('[Activity Stats API] Error fetching activity statistics:', error);
      console.error('[Activity Stats API] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[Activity Stats API] Error details:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { 
          error: 'Failed to fetch activity statistics',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canViewAuditLogs'] }
);
