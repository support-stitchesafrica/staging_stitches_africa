/**
 * Marketing Dashboard Activity Logs API
 * GET /api/marketing/activity-logs - Get activity logs with filtering
 * POST /api/marketing/activity-logs - Create a new activity log
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogServiceServer as ActivityLogService, ActivityLogFilters } from '@/lib/marketing/activity-log-service-server';
import { withAuth } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/activity-logs
 * Get activity logs with optional filtering
 * Requires: Super Admin role
 */
export const GET = withAuth(
  async (request: NextRequest, context) => {
    try {
      const { user, permissions } = context;

      console.log('[Activity Logs API] GET request from user:', user.email, 'role:', user.role);
      console.log('[Activity Logs API] Permissions:', permissions);

      // Only Super Admin can view all activity logs
      if (!permissions.canViewAuditLogs) {
        console.log('[Activity Logs API] Permission denied for user:', user.email);
        return NextResponse.json(
          { error: 'Insufficient permissions to view activity logs' },
          { status: 403 }
        );
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId') || undefined;
      const action = searchParams.get('action') || undefined;
      const entityType = searchParams.get('entityType') || undefined;
      const entityId = searchParams.get('entityId') || undefined;
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const limitParam = searchParams.get('limit');

      console.log('[Activity Logs API] Query params:', { userId, action, entityType, entityId, startDate, endDate, limit: limitParam });

      const filters: ActivityLogFilters = {
        userId,
        action: action as any,
        entityType: entityType as any,
        entityId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limitParam ? parseInt(limitParam) : undefined
      };

      console.log('[Activity Logs API] Fetching logs with filters:', filters);
      const result = await ActivityLogService.getLogs(filters);
      console.log('[Activity Logs API] Successfully fetched', result.logs.length, 'logs');

      return NextResponse.json({
        success: true,
        logs: result.logs,
        hasMore: result.hasMore,
        count: result.logs.length
      });
    } catch (error) {
      console.error('[Activity Logs API] Error fetching activity logs:', error);
      console.error('[Activity Logs API] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[Activity Logs API] Error details:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { 
          error: 'Failed to fetch activity logs',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canViewAuditLogs'] }
);

/**
 * POST /api/marketing/activity-logs
 * Create a new activity log entry
 * Requires: Authentication
 */
export const POST = withAuth(
  async (request: NextRequest, context) => {
    try {
      const { user } = context;
      const body = await request.json();

      const {
        action,
        entityType,
        entityId,
        entityName,
        details,
        metadata
      } = body;

      // Validate required fields
      if (!action || !entityType) {
        return NextResponse.json(
          { error: 'Action and entityType are required' },
          { status: 400 }
        );
      }

      // Create activity log
      const log = await ActivityLogService.createLog({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action,
        entityType,
        entityId,
        entityName,
        details,
        metadata
      });

      return NextResponse.json({
        success: true,
        log
      });
    } catch (error) {
      console.error('Error creating activity log:', error);
      return NextResponse.json(
        { error: 'Failed to create activity log' },
        { status: 500 }
      );
    }
  }
);
