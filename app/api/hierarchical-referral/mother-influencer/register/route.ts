import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { HierarchicalReferralService } from '@/lib/hierarchical-referral/services/referral-service';
import { z } from 'zod';

const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  profileImage: z.string().url().optional(),
  verificationData: z.object({
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    socialMediaHandles: z.array(z.string()).optional(),
    expectedMonthlyReferrals: z.number().min(0).optional()
  }).optional()
});

/**
 * POST /api/hierarchical-referral/mother-influencer/register
 * Register a new Mother Influencer
 * Requirements: 1.1, 3.1 - Mother Influencer registration and verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = registrationSchema.safeParse(body);
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

    const { email, password, name, profileImage, verificationData } = validationResult.data;

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
      // Generate master referral code directly (without requiring existing influencer)
      const masterReferralCode = await HierarchicalReferralService.generateMasterCodeForRegistration(user.uid);

      // Create influencer document
      const influencerData = {
        type: 'mother',
        email: user.email,
        name,
        profileImage: profileImage || null,
        masterReferralCode,
        status: 'pending', // Requires approval
        totalEarnings: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        verificationData: verificationData || null,
        payoutInfo: {
          method: null,
          details: null,
          minimumThreshold: 100 // Default minimum payout threshold
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false
        }
      };

      await setDoc(doc(db, 'influencers', user.uid), influencerData);

      // Create master referral code document
      await setDoc(doc(db, 'referralCodes', masterReferralCode), {
        code: masterReferralCode,
        type: 'master',
        createdBy: user.uid,
        status: 'active',
        usageCount: 0,
        createdAt: serverTimestamp(),
        metadata: {
          influencerType: 'mother',
          notes: 'Master referral code for Mother Influencer'
        }
      });

      // Log activity
      await setDoc(doc(db, 'activities', `${user.uid}_registration_${Date.now()}`), {
        influencerId: user.uid,
        type: 'registration',
        referralCode: masterReferralCode,
        metadata: {
          userType: 'mother_influencer',
          registrationMethod: 'web',
          verificationRequired: true
        },
        timestamp: serverTimestamp(),
        processed: false
      });

      return NextResponse.json({
        success: true,
        data: {
          user: {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
          },
          influencer: {
            id: user.uid,
            type: 'mother',
            name,
            email: user.email,
            status: 'pending',
            masterReferralCode,
            totalEarnings: 0,
            createdAt: new Date().toISOString()
          },
          message: 'Mother Influencer application submitted successfully. You will receive an email notification once your account is verified and activated.'
        }
      });

    } catch (firestoreError) {
      // If Firestore operations fail, delete the created user
      await user.delete();
      throw firestoreError;
    }

  } catch (error: any) {
    console.error('Mother Influencer registration error:', error);

    // Handle Firebase Auth errors
    if (error.code) {
      let message = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Email/password accounts are not enabled. Please contact support.';
          break;
      }

      return NextResponse.json({
        success: false,
        error: {
          code: error.code,
          message
        }
      }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during registration. Please try again.'
      }
    }, { status: 500 });
  }
}