import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * POST /api/hierarchical-referral/auth/login
 * Login for Mother Influencers and Mini Influencers
 * Requirements: Authentication for hierarchical referral system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationResult.error.errors
        }
      }, { status: 400 });
    }

    const { email, password } = validationResult.data;

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get influencer data from Firestore
    const influencerDoc = await getDoc(doc(db, 'influencers', user.uid));
    
    if (!influencerDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INFLUENCER_NOT_FOUND',
          message: 'Influencer account not found. Please contact support.'
        }
      }, { status: 404 });
    }

    const influencerData = influencerDoc.data();

    // Check if account is active
    if (influencerData.status !== 'active') {
      let message = 'Your account is not active.';
      if (influencerData.status === 'pending') {
        message = 'Your account is pending approval. You will receive an email once approved.';
      } else if (influencerData.status === 'suspended') {
        message = 'Your account has been suspended. Please contact support.';
      }

      return NextResponse.json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message
        }
      }, { status: 403 });
    }

    // Get Firebase ID token for session management
    const idToken = await user.getIdToken();

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        },
        influencer: {
          id: influencerDoc.id,
          type: influencerData.type,
          name: influencerData.name,
          status: influencerData.status,
          masterReferralCode: influencerData.masterReferralCode,
          parentInfluencerId: influencerData.parentInfluencerId,
          totalEarnings: influencerData.totalEarnings || 0,
          createdAt: influencerData.createdAt
        },
        token: idToken
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);

    // Handle Firebase Auth errors
    if (error.code) {
      let message = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Invalid email or password.';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
      }

      return NextResponse.json({
        success: false,
        error: {
          code: error.code,
          message
        }
      }, { status: 401 });
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}