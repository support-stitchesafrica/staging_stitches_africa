import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { generateToken } from '@/lib/referral/auth-service';
import { ReferralErrorCode, ReferralUser } from '@/lib/referral/types';
import { AutoProvisionService } from '@/lib/referral/auto-provision-service';

/**
 * POST /api/referral/login
 * Authenticate referral user and set JWT cookie
 * With auto-provisioning support for existing Firebase Auth users
 * Requirements: 3.1, 3.2, 3.3, 3.4, 11.1, 12.1
 * 
 * Body:
 * - idToken: Firebase ID token from client-side authentication
 * 
 * Returns:
 * - success: Boolean
 * - user: User object (userId, email, fullName, isAdmin)
 * - autoProvisioned: Boolean (indicates if user was auto-provisioned)
 * 
 * Sets HTTP-only cookie with JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'ID token is required',
          },
        },
        { status: 400 }
      );
    }

    // Requirement 3.1: Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Invalid or expired ID token',
          },
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email || '';
    const displayName = decodedToken.name || null;

    // Requirement 3.2, 3.3: Check for referral user and auto-provision if needed
    let userData: ReferralUser;
    let wasAutoProvisioned = false;

    try {
      // Check if referral user exists
      const userDoc = await adminDb
        .collection("staging_referralUsers")
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        // Requirement 3.3: Auto-provision referral user for authenticated Firebase user
        console.log(`Referral user not found for ${userId}, auto-provisioning...`);
        
        if (!displayName) {
          console.log(`User ${userId} has no display name, requiring profile completion`);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PROFILE_REQUIRED',
                message: 'Profile setup required',
              },
            },
            { status: 400 }
          );
        }

        try {
          // Requirement 3.3: Auto-provision referral user for authenticated Firebase user (only if name exists)
          userData = await AutoProvisionService.autoProvisionReferralUser(
            userId,
            email,
            displayName,
            'login'
          );
          wasAutoProvisioned = true;
          console.log(`Successfully auto-provisioned referral user: ${userId}`);
        } catch (provisionError: any) {
          console.error('Auto-provisioning failed:', provisionError);
          
          // Return user-friendly error message
          return NextResponse.json(
            {
              success: false,
              error: {
                code: provisionError.code || ReferralErrorCode.INVALID_INPUT,
                message: 'Failed to create referral account. Please try again or contact support.',
                details: process.env.NODE_ENV === 'development' ? provisionError.message : undefined,
              },
            },
            { status: 500 }
          );
        }
      } else {
        // Requirement 8.1, 8.2: Use existing referral user (backward compatibility)
        userData = userDoc.data() as ReferralUser;
        console.log(`Existing referral user found: ${userId}`);
      }

      // Requirement 3.4: Check if account is active
      if (!userData.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ReferralErrorCode.UNAUTHORIZED,
              message: 'Your referral account is inactive. Please contact support.',
            },
          },
          { status: 403 }
        );
      }

      // Generate JWT token
      const jwtToken = await generateToken(userData);

      // Create response
      const response = NextResponse.json(
        {
          success: true,
          user: {
            userId: userData.userId,
            email: userData.email,
            fullName: userData.fullName,
            isAdmin: userData.isAdmin,
          },
          autoProvisioned: wasAutoProvisioned,
        },
        { status: 200 }
      );

      // Set HTTP-only cookie with JWT token
      const isProduction = process.env.NODE_ENV === 'production';
      
      response.cookies.set('referral_token', jwtToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;

    } catch (error: any) {
      console.error('Error processing referral user:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An error occurred during login',
            details: process.env.NODE_ENV === 'development' ? error : undefined,
          },
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in login endpoint:', error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during login',
        },
      },
      { status: 500 }
    );
  }
}
