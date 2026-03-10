import { NextRequest, NextResponse } from 'next/server';
import { MotherInfluencerAuthService } from '@/lib/hierarchical-referral/services/mother-influencer-auth-service';
import { verifyIdToken } from '@/lib/firebase-admin';

/**
 * GET /api/hierarchical-referral/mother-influencer/auth
 * Authenticate Mother Influencer and verify dashboard access permissions
 * Requirements: 3.1
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization token required'
          }
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authorization token'
          }
        },
        { status: 401 }
      );
    }

    // Authenticate Mother Influencer
    const result = await MotherInfluencerAuthService.authenticateMotherInfluencer(decodedToken.uid);

    if (!result.success) {
      const statusCode = result.error?.code === 'PERMISSION_DENIED' ? 403 : 404;
      return NextResponse.json(result, { status: statusCode });
    }

    // Return success response (exclude sensitive data)
    const { payoutInfo, ...safeInfluencerData } = result.data!;
    const safePayoutInfo = {
      minimumThreshold: payoutInfo.minimumThreshold,
      currency: payoutInfo.currency,
      isVerified: payoutInfo.isVerified
    };

    return NextResponse.json({
      success: true,
      data: {
        ...safeInfluencerData,
        payoutInfo: safePayoutInfo
      }
    });

  } catch (error) {
    console.error('Mother Influencer authentication API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}