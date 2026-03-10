/**
 * API Route: Get Referral Tree
 * GET /api/hierarchical-referral/codes/tree/[influencerId]
 * Requirements: 1.1, 1.2 - Get referral tree for Mother Influencer
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth, requireMotherInfluencer } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { HierarchicalReferralService } from '@/lib/hierarchical-referral/services/referral-service';

interface RouteParams {
  params: {
    influencerId: string;
  };
}

export const GET = withHierarchicalAuth(
  async (request: NextRequest, context, { params }: RouteParams) => {
    try {
      const { influencerId } = params;

      // Ensure user can only access their own tree or is admin
      if (context.user.uid !== influencerId && context.user.influencerType !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'You can only access your own referral tree'
          },
          { status: 403 }
        );
      }

      // Get referral tree
      const referralTree = await HierarchicalReferralService.getReferralTree(influencerId);

      return NextResponse.json({
        success: true,
        data: {
          motherInfluencer: {
            id: referralTree.motherInfluencer.id,
            name: referralTree.motherInfluencer.name,
            email: referralTree.motherInfluencer.email,
            masterReferralCode: referralTree.motherInfluencer.masterReferralCode,
            totalEarnings: referralTree.motherInfluencer.totalEarnings,
            status: referralTree.motherInfluencer.status,
            createdAt: referralTree.motherInfluencer.createdAt
          },
          miniInfluencers: referralTree.miniInfluencers.map(mini => ({
            id: mini.id,
            name: mini.name,
            email: mini.email,
            totalEarnings: mini.totalEarnings,
            status: mini.status,
            createdAt: mini.createdAt
          })),
          totalNetworkEarnings: referralTree.totalNetworkEarnings,
          totalNetworkActivities: referralTree.totalNetworkActivities,
          networkSize: referralTree.miniInfluencers.length
        }
      });

    } catch (error: any) {
      console.error('Get referral tree error:', error);
      
      let statusCode = 500;
      if (error.code === 'INFLUENCER_NOT_FOUND') statusCode = 404;
      if (error.code === 'PERMISSION_DENIED') statusCode = 403;
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'TREE_FETCH_FAILED',
          message: error.message || 'Failed to get referral tree'
        },
        { status: statusCode }
      );
    }
  },
  requireMotherInfluencer()
);