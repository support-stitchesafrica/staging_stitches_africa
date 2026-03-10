/**
 * API Route: Link Influencer using Referral Code
 * POST /api/hierarchical-referral/codes/link
 * Requirements: 1.4, 2.2 - Link Mini Influencer to Mother Influencer using sub code
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth, requireMiniInfluencer } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalReferralService } from '@/lib/hierarchical-referral/services/referral-service';

interface LinkInfluencerRequest {
  code: string;
}

export const POST = withHierarchicalAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'LINK_INFLUENCER'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Parse request body
      const body: LinkInfluencerRequest = await request.json();

      if (!body.code) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Code is required'
          },
          { status: 400 }
        );
      }

      // Link influencer
      await HierarchicalReferralService.linkInfluencer(body.code, context.user.uid);

      return NextResponse.json({
        success: true,
        data: {
          miniInfluencerId: context.user.uid,
          code: body.code,
          message: 'Successfully linked to Mother Influencer'
        }
      });

    } catch (error: any) {
      console.error('Link influencer error:', error);
      
      let statusCode = 500;
      if (error.code === 'INVALID_CODE') statusCode = 400;
      if (error.code === 'INFLUENCER_NOT_FOUND') statusCode = 404;
      if (error.code === 'PERMISSION_DENIED') statusCode = 403;
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'LINKING_FAILED',
          message: error.message || 'Failed to link influencer'
        },
        { status: statusCode }
      );
    }
  },
  requireMiniInfluencer()
);