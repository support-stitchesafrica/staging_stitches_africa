import { NextRequest, NextResponse } from 'next/server';
import { MiniInfluencerAuthService } from '../../../../../lib/hierarchical-referral/services/mini-influencer-auth-service';
import { z } from 'zod';

// Request validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  subReferralCode: z.string().min(1, 'Sub referral code is required'),
  profileImage: z.string().url().optional()
});

/**
 * POST /api/hierarchical-referral/mini-influencer/register
 * Register a new Mini Influencer with Sub_Referral_Code validation
 * Requirements: 2.1, 2.3, 2.5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = registerSchema.safeParse(body);
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

    const { email, password, name, subReferralCode, profileImage } = validation.data;

    // Register Mini Influencer
    const result = await MiniInfluencerAuthService.registerMiniInfluencer(
      email,
      password,
      name,
      subReferralCode,
      profileImage
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'INVALID_CODE' ? 400 : 500;
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
    console.error('Mini Influencer registration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Registration failed. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}