import { NextRequest, NextResponse } from 'next/server';
import { MotherInfluencerAuthService } from '@/lib/hierarchical-referral/services/mother-influencer-auth-service';
import { verifyIdToken } from '@/lib/firebase-admin';
import { z } from 'zod';

// Request validation schema for generating sub codes
const generateSubCodeSchema = z.object({
  metadata: z.object({
    campaign: z.string().optional(),
    notes: z.string().optional()
  }).optional()
});

/**
 * POST /api/hierarchical-referral/mother-influencer/sub-codes
 * Generate a new sub referral code for Mother Influencer
 * Requirements: 1.2
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate request body
    const validation = generateSubCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validation.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { metadata } = validation.data;

    // Generate sub referral code
    const result = await MotherInfluencerAuthService.generateSubReferralCode(
      decodedToken.uid,
      metadata
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'PERMISSION_DENIED' ? 403 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      data: {
        subReferralCode: result.data
      }
    });

  } catch (error) {
    console.error('Sub referral code generation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Sub code generation failed. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hierarchical-referral/mother-influencer/sub-codes
 * Get Mother Influencer's master referral code
 * Requirements: 1.1
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

    // Get master referral code
    const result = await MotherInfluencerAuthService.getMasterReferralCode(decodedToken.uid);

    if (!result.success) {
      const statusCode = result.error?.code === 'PERMISSION_DENIED' ? 403 : 404;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      data: {
        masterReferralCode: result.data
      }
    });

  } catch (error) {
    console.error('Master referral code API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get master referral code. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}