import { 
  Influencer, 
  ServiceResponse,
  HierarchicalReferralError,
  HierarchicalReferralErrorCode,
  NotificationPreferences,
  PayoutInfo
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { HierarchicalReferralService } from './referral-service';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { setCustomUserClaims } from '../utils/auth-claims';

/**
 * Mini Influencer Authentication Service
 * Handles registration and authentication for Mini Influencers
 * Requirements: 2.1, 2.3, 2.5
 */
export class MiniInfluencerAuthService {
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';

  /**
   * Register a new Mini Influencer with Sub_Referral_Code validation
   * Requirements: 2.1, 2.3
   */
  static async registerMiniInfluencer(
    email: string,
    password: string,
    name: string,
    subReferralCode: string,
    profileImage?: string
  ): Promise<ServiceResponse<Influencer>> {
    try {
      // Validate the sub referral code
      const codeValidation = await HierarchicalReferralService.validateCode(subReferralCode);
      if (!codeValidation.isValid || !codeValidation.code) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INVALID_CODE,
            message: codeValidation.error || 'Invalid referral code'
          }
        };
      }

      const referralCode = codeValidation.code;

      // Ensure it's a sub code
      if (referralCode.type !== 'sub') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INVALID_CODE,
            message: 'Only sub referral codes can be used for Mini Influencer registration'
          }
        };
      }

      // Check if code is already assigned
      if (referralCode.assignedTo) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INVALID_CODE,
            message: 'This referral code has already been used'
          }
        };
      }

      // Create Firebase Auth user
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create default preferences and payout info
      const defaultPreferences: NotificationPreferences = {
        email: true,
        push: true,
        sms: false,
        newMiniInfluencer: false, // Mini Influencers don't get these notifications
        earningsMilestones: true,
        payoutNotifications: true,
        systemUpdates: true
      };

      const defaultPayoutInfo: PayoutInfo = {
        minimumThreshold: 50, // Default $50 minimum
        currency: 'USD',
        isVerified: false
      };

      // Create Mini Influencer record
      const miniInfluencer: Influencer = {
        id: firebaseUser.uid,
        type: 'mini',
        email,
        name,
        profileImage,
        parentInfluencerId: referralCode.createdBy,
        status: 'active', // Automatically activated per requirement 2.3
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        totalEarnings: 0,
        payoutInfo: defaultPayoutInfo,
        preferences: defaultPreferences
      };

      // Save to Firestore
      await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(firebaseUser.uid)
        .set(miniInfluencer);

      // Link the influencer using the referral service
      await HierarchicalReferralService.linkInfluencer(subReferralCode, firebaseUser.uid);

      // Set custom claims for Mini Influencer (restricted permissions per requirement 2.5)
      await setCustomUserClaims(firebaseUser.uid, {
        hierarchicalReferral: true,
        influencerType: 'mini',
        canCreateSubCodes: false, // Mini Influencers cannot create sub codes
        canAccessDashboard: true,
        canViewEarnings: true,
        canManageProfile: true
      });

      return {
        success: true,
        data: miniInfluencer
      };

    } catch (error: any) {
      console.error('Mini Influencer registration error:', error);
      
      // Handle Firebase Auth errors
      if (error.code?.startsWith('auth/')) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INVALID_INPUT,
            message: this.getAuthErrorMessage(error.code)
          }
        };
      }

      // Handle hierarchical referral errors
      if (error.code && Object.values(HierarchicalReferralErrorCode).includes(error.code)) {
        return {
          success: false,
          error: error as HierarchicalReferralError
        };
      }

      return {
        success: false,
        error: {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Registration failed. Please try again.',
          details: error
        }
      };
    }
  }

  /**
   * Authenticate Mini Influencer and verify permissions
   * Requirements: 2.5
   */
  static async authenticateMiniInfluencer(userId: string): Promise<ServiceResponse<Influencer>> {
    try {
      const influencer = await this.getMiniInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mini Influencer not found'
          }
        };
      }

      if (influencer.type !== 'mini') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'User is not a Mini Influencer'
          }
        };
      }

      if (influencer.status !== 'active') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'Mini Influencer account is not active'
          }
        };
      }

      return {
        success: true,
        data: influencer
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Authentication failed',
          details: error
        }
      };
    }
  }

  /**
   * Update Mini Influencer profile (restricted to allowed fields)
   * Requirements: 2.5
   */
  static async updateMiniInfluencerProfile(
    userId: string,
    updates: Partial<Pick<Influencer, 'name' | 'profileImage' | 'preferences' | 'payoutInfo'>>
  ): Promise<ServiceResponse<Influencer>> {
    try {
      const influencer = await this.getMiniInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mini Influencer not found'
          }
        };
      }

      // Update allowed fields only
      const allowedUpdates = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(userId)
        .update(allowedUpdates);

      // Return updated influencer
      const updatedInfluencer = await this.getMiniInfluencerById(userId);
      return {
        success: true,
        data: updatedInfluencer!
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Profile update failed',
          details: error
        }
      };
    }
  }

  /**
   * Verify Mini Influencer cannot create sub codes (permission restriction)
   * Requirements: 2.5
   */
  static async verifySubCodeCreationRestriction(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const influencer = await this.getMiniInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mini Influencer not found'
          }
        };
      }

      if (influencer.type !== 'mini') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'User is not a Mini Influencer'
          }
        };
      }

      // Mini Influencers are always restricted from creating sub codes
      return {
        success: true,
        data: false // Cannot create sub codes
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Permission verification failed',
          details: error
        }
      };
    }
  }

  /**
   * Get Mini Influencer by ID
   */
  private static async getMiniInfluencerById(id: string): Promise<Influencer | null> {
    try {
      const doc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as Influencer;
    } catch (error) {
      console.error('Error getting Mini Influencer by ID:', error);
      return null;
    }
  }

  /**
   * Get user-friendly error message for Firebase auth errors
   */
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      default:
        return 'Registration failed. Please try again.';
    }
  }
}