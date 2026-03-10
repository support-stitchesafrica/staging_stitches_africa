/**
 * API Route: Individual Influencer Management
 * GET /api/hierarchical-referral/admin/influencers/[influencerId] - Get influencer details
 * PUT /api/hierarchical-referral/admin/influencers/[influencerId] - Update influencer status
 * Requirements: 6.1, 6.2 - Admin control capabilities and detailed influencer management
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, requireAdmin } from '@/lib/hierarchical-referral/middleware/admin-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

interface RouteParams {
  params: {
    influencerId: string;
  };
}

interface UpdateInfluencerRequest {
  status: 'active' | 'suspended' | 'pending';
  reason?: string;
}

export const GET = withAdminAuth(
  async (request: NextRequest, context, { params }: RouteParams) => {
    try {
      const { influencerId } = params;

      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'ADMIN_ACTION'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Get detailed influencer information
      const influencerDetails = await HierarchicalAdminService.getInfluencerDetails(influencerId);

      return NextResponse.json({
        success: true,
        data: influencerDetails
      });

    } catch (error: any) {
      console.error('Admin get influencer details error:', error);
      
      let statusCode = 500;
      if (error.message === 'Influencer not found') statusCode = 404;
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'INFLUENCER_DETAILS_FAILED',
          message: error.message || 'Failed to get influencer details'
        },
        { status: statusCode }
      );
    }
  },
  requireAdmin()
);

export const PUT = withAdminAuth(
  async (request: NextRequest, context, { params }: RouteParams) => {
    try {
      const { influencerId } = params;

      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'ADMIN_ACTION'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Parse request body
      const body: UpdateInfluencerRequest = await request.json();

      // Validate request
      if (!body.status || !['active', 'suspended', 'pending'].includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Valid status is required (active, suspended, pending)'
          },
          { status: 400 }
        );
      }

      // Update influencer status
      const result = await HierarchicalAdminService.updateInfluencerStatus(
        influencerId,
        body.status,
        body.reason
      );

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          influencerId,
          newStatus: body.status,
          reason: body.reason,
          updatedBy: context.user.uid,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Admin update influencer error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'UPDATE_INFLUENCER_FAILED',
          message: error.message || 'Failed to update influencer'
        },
        { status: 500 }
      );
    }
  },
  requireAdmin()
);