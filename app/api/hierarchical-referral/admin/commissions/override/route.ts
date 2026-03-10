/**
 * API Route: Commission Override for Dispute Handling
 * POST /api/hierarchical-referral/admin/commissions/override
 * Requirements: 6.4 - Admin override functionality for dispute handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/hierarchical-referral/middleware/admin-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

interface CommissionOverrideRequest {
  commissionId: string;
  newAmount: number;
  reason: string;
}

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

      // Check if admin has commission override permission
      if (!context.permissions.canOverrideCommissions) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to override commissions'
          },
          { status: 403 }
        );
      }

      // Parse request body
      const body: CommissionOverrideRequest = await request.json();

      // Validate request
      if (!body.commissionId || typeof body.newAmount !== 'number' || !body.reason) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Commission ID, new amount, and reason are required'
          },
          { status: 400 }
        );
      }

      if (body.newAmount < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'New amount cannot be negative'
          },
          { status: 400 }
        );
      }

      // Override commission
      const result = await HierarchicalAdminService.overrideCommission(
        body.commissionId,
        body.newAmount,
        body.reason
      );

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          commissionId: body.commissionId,
          newAmount: body.newAmount,
          reason: body.reason,
          overriddenBy: context.user.uid,
          overriddenAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Commission override error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'COMMISSION_OVERRIDE_FAILED',
          message: error.message || 'Failed to override commission'
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canOverrideCommissions'] }
);