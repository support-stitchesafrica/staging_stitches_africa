/**
 * API Route: Admin Payout Management
 * GET /api/hierarchical-referral/admin/payouts - Get payout queue and history
 * POST /api/hierarchical-referral/admin/payouts - Process payouts
 * PUT /api/hierarchical-referral/admin/payouts - Adjust payout amounts
 * Requirements: 8.1 - Automated payout processing and admin controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/hierarchical-referral/middleware/admin-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';
import { HierarchicalPayoutService } from '@/lib/hierarchical-referral/services/payout-service';

interface ProcessPayoutsRequest {
  influencerIds: string[];
  forceProcess?: boolean;
}

interface AdjustPayoutRequest {
  payoutId: string;
  adjustmentAmount: number;
  reason: string;
}

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

      // Check if admin has payout processing permission
      if (!context.permissions.canProcessPayouts) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to view payouts'
          },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const includeHistory = searchParams.get('includeHistory') === 'true';
      const status = searchParams.get('status') as 'pending' | 'failed' | 'success' | undefined;

      // Get payout queue
      const payoutQueue = await HierarchicalAdminService.getPayoutQueue();

      const responseData: any = {
        payoutQueue: status ? payoutQueue.filter(p => p.status === status) : payoutQueue
      };

      // Add payout history if requested
      if (includeHistory) {
        const payoutHistory = await HierarchicalPayoutService.getPayoutHistory(50);
        responseData.payoutHistory = payoutHistory;
      }

      // Add dispute cases
      const disputeCases = await HierarchicalAdminService.getDisputeCases();
      responseData.disputeCases = disputeCases;

      return NextResponse.json({
        success: true,
        data: responseData
      });

    } catch (error: any) {
      console.error('Admin payouts get error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'PAYOUTS_GET_FAILED',
          message: error.message || 'Failed to get payouts data'
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canProcessPayouts'] }
);

export const POST = withAdminAuth(
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

      // Check if admin has payout processing permission
      if (!context.permissions.canProcessPayouts) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to process payouts'
          },
          { status: 403 }
        );
      }

      // Parse request body
      const body: ProcessPayoutsRequest = await request.json();

      // Validate request
      if (!body.influencerIds || !Array.isArray(body.influencerIds) || body.influencerIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Influencer IDs array is required'
          },
          { status: 400 }
        );
      }

      // Process payouts
      const results = await HierarchicalPayoutService.processPayouts(body.influencerIds);

      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      return NextResponse.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failedCount
          },
          processedBy: context.user.uid,
          processedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Admin process payouts error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'PROCESS_PAYOUTS_FAILED',
          message: error.message || 'Failed to process payouts'
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canProcessPayouts'] }
);

export const PUT = withAdminAuth(
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

      // Check if admin has payout processing permission
      if (!context.permissions.canProcessPayouts) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to adjust payouts'
          },
          { status: 403 }
        );
      }

      // Parse request body
      const body: AdjustPayoutRequest = await request.json();

      // Validate request
      if (!body.payoutId || typeof body.adjustmentAmount !== 'number' || !body.reason) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Payout ID, adjustment amount, and reason are required'
          },
          { status: 400 }
        );
      }

      // Adjust payout
      const result = await HierarchicalAdminService.adjustPayout(
        body.payoutId,
        body.adjustmentAmount,
        body.reason
      );

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          payoutId: body.payoutId,
          adjustmentAmount: body.adjustmentAmount,
          reason: body.reason,
          adjustedBy: context.user.uid,
          adjustedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Admin adjust payout error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'ADJUST_PAYOUT_FAILED',
          message: error.message || 'Failed to adjust payout'
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canProcessPayouts'] }
);