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
 * Mother Influencer Authentication Service
 * Handles registration, verification, and authentication for Mother Influencers
 * Requirements: 1.1, 3.1
 */
export class MotherInfluencerAuthService {
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';

  /**
   * Register a new Mother Influencer with verification process
   * Requirements: 1.1, 3.1
   */
  static async registerMotherInfluencer(
    email: string,
    password: string,
    name: string,
    profileImage?: string,
    verificationData?: {
      businessName?: string;
      businessType?: string;
      socialMediaHandles?: string[];
      expectedMonthlyReferrals?: number;
    }
  ): Promise<ServiceResponse<Influencer>> {
    try {
      // Create Firebase Auth user
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create default preferences and payout info for Mother Influencer
      const defaultPreferences: NotificationPreferences = {
        email: true,
        push: true,
        sms: false,
        newMiniInfluencer: true, // Mother Influencers get notifications about new Mini Influencers
        earningsMilestones: true,
        payoutNotifications: true,
        systemUpdates: true
      };

      const defaultPayoutInfo: PayoutInfo = {
        minimumThreshold: 100, // Higher threshold for Mother Influencers
        currency: 'USD',
        isVerified: false // Requires verification
      };

      // Create Mother Influencer record
      const motherInfluencer: Influencer = {
        id: firebaseUser.uid,
        type: 'mother',
        email,
        name,
        profileImage,
        status: 'pending', // Requires verification before activation
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
        .set(motherInfluencer);

      // Generate master referral code (requirement 1.1)
      const masterCode = await HierarchicalReferralService.generateMasterCode(firebaseUser.uid);

      // Update influencer with master code
      motherInfluencer.masterReferralCode = masterCode;

      // Set custom claims for Mother Influencer with full dashboard access
      await setCustomUserClaims(firebaseUser.uid, {
        hierarchicalReferral: true,
        influencerType: 'mother',
        canCreateSubCodes: true, // Mother Influencers can create sub codes
        canAccessDashboard: true,
        canViewEarnings: true,
        canManageProfile: true
      });

      // Store verification data if provided
      if (verificationData) {
        await adminDb
          .collection(this.INFLUENCERS_COLLECTION)
          .doc(firebaseUser.uid)
          .collection('verification')
          .doc('application')
          .set({
            ...verificationData,
            submittedAt: Timestamp.now(),
            status: 'pending'
          });
      }

      return {
        success: true,
        data: motherInfluencer
      };

    } catch (error: any) {
      console.error('Mother Influencer registration error:', error);
      
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
   * Verify Mother Influencer application and activate account
   * Requirements: 3.1
   */
  static async verifyMotherInfluencer(
    userId: string,
    adminUserId: string,
    approved: boolean,
    notes?: string
  ): Promise<ServiceResponse<Influencer>> {
    try {
      const influencer = await this.getMotherInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mother Influencer not found'
          }
        };
      }

      if (influencer.type !== 'mother') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'User is not a Mother Influencer'
          }
        };
      }

      // Update verification status
      const newStatus = approved ? 'active' : 'suspended';
      
      await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(userId)
        .update({
          status: newStatus,
          updatedAt: Timestamp.now()
        });

      // Update verification record
      await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(userId)
        .collection('verification')
        .doc('application')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewedBy: adminUserId,
          reviewedAt: Timestamp.now(),
          notes: notes || ''
        });

      // Return updated influencer
      const updatedInfluencer = await this.getMotherInfluencerById(userId);
      return {
        success: true,
        data: updatedInfluencer!
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Verification failed',
          details: error
        }
      };
    }
  }

  /**
   * Authenticate Mother Influencer and verify dashboard access permissions
   * Requirements: 3.1
   */
  static async authenticateMotherInfluencer(userId: string): Promise<ServiceResponse<Influencer>> {
    try {
      const influencer = await this.getMotherInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mother Influencer not found'
          }
        };
      }

      if (influencer.type !== 'mother') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'User is not a Mother Influencer'
          }
        };
      }

      if (influencer.status !== 'active') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: `Mother Influencer account is ${influencer.status}. Dashboard access requires active status.`
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
   * Update Mother Influencer profile
   * Requirements: 3.1
   */
  static async updateMotherInfluencerProfile(
    userId: string,
    updates: Partial<Pick<Influencer, 'name' | 'profileImage' | 'preferences' | 'payoutInfo'>>
  ): Promise<ServiceResponse<Influencer>> {
    try {
      const influencer = await this.getMotherInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mother Influencer not found'
          }
        };
      }

      // Update allowed fields
      const allowedUpdates = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(userId)
        .update(allowedUpdates);

      // Return updated influencer
      const updatedInfluencer = await this.getMotherInfluencerById(userId);
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
   * Get Mother Influencer's master referral code
   * Requirements: 1.1
   */
  static async getMasterReferralCode(userId: string): Promise<ServiceResponse<string>> {
    try {
      const influencer = await this.getMotherInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mother Influencer not found'
          }
        };
      }

      if (influencer.type !== 'mother') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'Only Mother Influencers have master referral codes'
          }
        };
      }

      if (!influencer.masterReferralCode) {
        // Generate master code if it doesn't exist
        const masterCode = await HierarchicalReferralService.generateMasterCode(userId);
        return {
          success: true,
          data: masterCode
        };
      }

      return {
        success: true,
        data: influencer.masterReferralCode
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Failed to get master referral code',
          details: error
        }
      };
    }
  }

  /**
   * Generate sub referral code for Mother Influencer
   * Requirements: 1.2
   */
  static async generateSubReferralCode(
    userId: string,
    metadata?: object
  ): Promise<ServiceResponse<string>> {
    try {
      const influencer = await this.getMotherInfluencerById(userId);
      if (!influencer) {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
            message: 'Mother Influencer not found'
          }
        };
      }

      if (influencer.type !== 'mother') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'Only Mother Influencers can generate sub codes'
          }
        };
      }

      if (influencer.status !== 'active') {
        return {
          success: false,
          error: {
            code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
            message: 'Mother Influencer must be active to generate sub codes'
          }
        };
      }

      const subCode = await HierarchicalReferralService.generateSubCode(userId, metadata);
      
      return {
        success: true,
        data: subCode
      };

    } catch (error: any) {
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
          message: 'Failed to generate sub referral code',
          details: error
        }
      };
    }
  }

  /**
   * Get Mother Influencer by ID
   */
  private static async getMotherInfluencerById(id: string): Promise<Influencer | null> {
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
      console.error('Error getting Mother Influencer by ID:', error);
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