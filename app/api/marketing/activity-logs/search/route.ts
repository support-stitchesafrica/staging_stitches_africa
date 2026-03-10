/**
 * Marketing Dashboard Activity Logs Search API
 * POST /api/marketing/activity-logs/search - Search activity logs with advanced filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogServiceServer as ActivityLogService } from '@/lib/marketing/activity-log-service-server';
import { withAuth } from '@/lib/marketing/auth-middleware';

// Search options interface (for compatibility)
interface ActivityLogSearchOptions {
  searchTerm?: string;
  userId?: string;
  actions?: string[];
  entityTypes?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * POST /api/marketing/activity-logs/search
 * Search activity logs with advanced filtering
 * Requires: Super Admin role
 */
export const POST = withAuth(
  async (request: NextRequest, context) => {
    try {
      const { permissions } = context;

      // Only Super Admin can search activity logs
      if (!permissions.canViewAuditLogs) {
        return NextResponse.json(
          { error: 'Insufficient permissions to search activity logs' },
          { status: 403 }
        );
      }

      const body = await request.json();
      
      const searchOptions: ActivityLogSearchOptions = {
        searchTerm: body.searchTerm,
        userId: body.userId,
        actions: body.actions,
        entityTypes: body.entityTypes,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        limit: body.limit,
        offset: body.offset
      };

      const logs = await ActivityLogService.searchLogs(searchOptions);

      return NextResponse.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error searching activity logs:', error);
      return NextResponse.json(
        { error: 'Failed to search activity logs' },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canViewAuditLogs'] }
);
