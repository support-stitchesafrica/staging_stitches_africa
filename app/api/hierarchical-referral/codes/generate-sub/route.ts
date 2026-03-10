/**
 * API Route: Generate Sub Referral Code
 * POST /api/hierarchical-referral/codes/generate-sub
 * Requirements: 1.2 - Generate unique Sub_Referral_Code linked to Master_Referral_Code
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth, requireMotherInfluencer } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalReferralService } from '@/lib/hierarchical-referral/services/referral-service';

interface GenerateSubCodeRequest {
  metadata?: {
    campaign?: string;
    notes?: string;
    maxUsage?: number;
    expiresAt?: string;
  };
}

export const POST = withHierarchicalAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'GENERATE_SUB_CODE'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Parse request body
      const body: GenerateSubCodeRequest = await request.json().catch(() => ({}));

      // Generate sub code
      const subCode = await HierarchicalReferralService.generateSubCode(
        context.user.uid,
        body.metadata
      );

      return NextResponse.json({
        success: true,
        data: {
          subCode,
          motherInfluencerId: context.user.uid,
          type: 'sub',
          metadata: body.metadata || {}
        }
      });

    } catch (error: any) {
      console.error('Generate sub code error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'GENERATION_FAILED',
          message: error.message || 'Failed to generate sub code'
        },
        { status: error.code === 'INFLUENCER_NOT_FOUND' ? 404 : 500 }
      );
    }
  },
  requireMotherInfluencer()
);