/**
 * API Route: Admin Influencer Management
 * GET /api/hierarchical-referral/admin/influencers - List all influencers
 * PUT /api/hierarchical-referral/admin/influencers - Bulk update influencer status
 * Requirements: 6.1, 6.2 - Admin system visibility and control capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, requireAdmin } from '@/lib/hierarchical-referral/middleware/admin-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalAdminService } from '@/lib/hierarchical-referral/services/admin-service';

interface BulkUpdateRequest {
  influencerIds: string[];
  status: 'active' | 'suspended' | 'pending';
  reason?: string;
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

      const { searchParams } = new URL(request.url);
      const searchTerm = searchParams.get('search') || '';
      const type = searchParams.get('type') as 'mother' | 'mini' | undefined;
      const status = searchParams.get('status') as 'active' | 'suspended' | 'pending' | undefined;
      const limit = parseInt(searchParams.get('limit') || '20');
      const includeReferralTrees = searchParams.get('includeReferralTrees') === 'true';

      let responseData: any = {};

      if (includeReferralTrees) {
        // Get all Mother Influencers with their referral trees
        const referralTrees = await HierarchicalAdminService.getAllMotherInfluencersWithTrees();
        responseData.referralTrees = referralTrees;
      }

      if (searchTerm || status || type) {
        // Search influencers or filter by status/type
        const searchResults = await HierarchicalAdminService.searchInfluencers(
          searchTerm,
          type,
          status,
          limit
        );
        responseData.searchResults = searchResults;
        
        // If filtering by status/type without search term, return as main data
        if (!searchTerm && (status || type)) {
          responseData.data = searchResults;
        }
      } else {
        // Get system metrics
        const systemMetrics = await HierarchicalAdminService.getSystemMetrics();
        responseData.systemMetrics = systemMetrics;
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        metadata: {
          searchTerm,
          type,
          status,
          limit,
          includeReferralTrees
        }
      });

    } catch (error: any) {
      console.error('Admin influencers list error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'ADMIN_INFLUENCERS_FAILED',
          message: error.message || 'Failed to get influencers data'
        },
        { status: 500 }
      );
    }
  },
  requireAdmin()
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

      // Parse request body
      const body: BulkUpdateRequest = await request.json();

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

      // Bulk update influencer status
      const result = await HierarchicalAdminService.bulkUpdateInfluencerStatus(
        body.influencerIds,
        body.status,
        body.reason
      );

      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.message
      });

    } catch (error: any) {
      console.error('Admin bulk update error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'BULK_UPDATE_FAILED',
          message: error.message || 'Failed to bulk update influencers'
        },
        { status: 500 }
      );
    }
  },
  requireAdmin()
);