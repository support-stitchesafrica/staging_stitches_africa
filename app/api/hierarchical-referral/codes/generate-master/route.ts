/**
 * API Route: Generate Master Referral Code
 * POST /api/hierarchical-referral/codes/generate-master
 * Requirements: 1.1 - Generate unique Master_Referral_Code for Mother Influencer
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth, requireMotherInfluencer } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalReferralService } from '@/lib/hierarchical-referral/services/referral-service';

export const POST = withHierarchicalAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'GENERATE_MASTER_CODE'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Generate master code
      const masterCode = await HierarchicalReferralService.generateMasterCode(
        context.user.uid
      );

      return NextResponse.json({
        success: true,
        data: {
          masterCode,
          influencerId: context.user.uid,
          type: 'master'
        }
      });

    } catch (error: any) {
      console.error('Generate master code error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'GENERATION_FAILED',
          message: error.message || 'Failed to generate master code'
        },
        { status: error.code === 'INFLUENCER_NOT_FOUND' ? 404 : 500 }
      );
    }
  },
  requireMotherInfluencer()
);