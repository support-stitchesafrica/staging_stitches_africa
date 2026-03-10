/**
 * API Route: Admin Audit Logs
 * GET /api/hierarchical-referral/admin/logs
 * Requirements: 6.4 - Admin audit trail and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/hierarchical-referral/middleware/admin-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

export const GET = withAdminAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'ADMIN_ACTION'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Check if admin has audit log viewing permission
      if (!context.permissions.canViewAuditLogs) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to view audit logs'
          },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const targetId = searchParams.get('targetId') || undefined;
      const action = searchParams.get('action') || undefined;
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Get admin logs
      const logs = await HierarchicalAdminService.getAdminLogs(
        limit,
        targetId,
        action
      );

      // Filter by date range if provided
      let filteredLogs = logs;
      if (startDate || endDate) {
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          if (startDate && logDate < new Date(startDate)) return false;
          if (endDate && logDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Group logs by action type for summary
      const actionSummary = filteredLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        data: {
          logs: filteredLogs,
          summary: {
            totalLogs: filteredLogs.length,
            actionBreakdown: actionSummary,
            dateRange: {
              start: startDate,
              end: endDate
            }
          }
        },
        metadata: {
          requestedBy: context.user.uid,
          requestedAt: new Date().toISOString(),
          filters: {
            limit,
            targetId,
            action,
            startDate,
            endDate
          }
        }
      });

    } catch (error: any) {
      console.error('Admin logs error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'ADMIN_LOGS_FAILED',
          message: error.message || 'Failed to get admin logs'
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canViewAuditLogs'] }
);