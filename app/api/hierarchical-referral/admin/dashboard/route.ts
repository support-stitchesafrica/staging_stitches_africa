/**
 * API Route: Admin Dashboard Data
 * GET /api/hierarchical-referral/admin/dashboard
 * Requirements: 6.1, 6.3 - Admin system visibility and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, requireAdmin } from '@/lib/hierarchical-referral/middleware/admin-middleware';
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

      const { searchParams } = new URL(request.url);
      const includePerformanceAnalytics = searchParams.get('includePerformanceAnalytics') === 'true';
      const period = searchParams.get('period') || '30'; // days

      // Get admin dashboard data
      const dashboardData = await HierarchicalAdminService.getAdminDashboardData();

      // Add performance analytics if requested
      if (includePerformanceAnalytics) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const performanceAnalytics = await HierarchicalAdminService.getSystemPerformanceAnalytics({
          start: startDate,
          end: endDate,
          granularity: 'day'
        });

        dashboardData.performanceAnalytics = performanceAnalytics;
      }

      return NextResponse.json({
        success: true,
        data: dashboardData,
        metadata: {
          generatedAt: new Date().toISOString(),
          adminUser: {
            uid: context.user.uid,
            email: context.user.email,
            role: context.user.role
          }
        }
      });

    } catch (error: any) {
      console.error('Admin dashboard error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'ADMIN_DASHBOARD_FAILED',
          message: error.message || 'Failed to get admin dashboard data'
        },
        { status: 500 }
      );
    }
  },
  requireAdmin()
);