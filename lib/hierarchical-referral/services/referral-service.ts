import { 
  Influencer, 
  ReferralCode, 
  ReferralCodeValidation, 
  ReferralTree,
  ServiceResponse,
  HierarchicalReferralError,
  HierarchicalReferralErrorCode,
  FirestoreTimestamp
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { generateMasterCode, generateSubCode, isValidCodeFormat, getCodeType } from '../utils/code-generator';
import { validateInfluencer, validateReferralCode } from '../utils/validation';

/**
 * ReferralService - Core service for managing hierarchical referral codes and relationships
 */
export class HierarchicalReferralService {
  private static readonly INFLUENCERS_COLLECTION = 'influencers';
  private static readonly REFERRAL_CODES_COLLECTION = 'referralCodes';
  private static readonly MAX_CODE_GENERATION_ATTEMPTS = 10;

  /**
   * Generate a unique master referral code for Mother Influencer registration
   * This version doesn't require the influencer to exist in the database yet
   * Requirements: 1.1
   */
  static async generateMasterCodeForRegistration(influencerId: string): Promise<string> {
    try {
      // Generate unique code without checking influencer existence
      let attempts = 0;
      while (attempts < this.MAX_CODE_GENERATION_ATTEMPTS) {
        attempts++;
        const code = generateMasterCode();
        
        // Check if code already exists
        const existing = await this.getCodeByValue(code);
        if (!existing) {
          return code;
        }
      }

      throw {
        code: HierarchicalReferralErrorCode.CODE_ALREADY_EXISTS,
        message: `Failed to generate unique master code after ${attempts} attempts`
      };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to generate master code for registration',
        details: error
      };
    }
  }

  /**
   * Generate a unique master referral code for Mother Influencer
   * Requirements: 1.1
   */
  static async generateMasterCode(influencerId: string): Promise<string> {
    try {
      // Verify influencer exists and is a Mother Influencer
      const influencer = await this.getInfluencerById(influencerId);
      if (!influencer) {
        throw {
          code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
          message: 'Influencer not found'
        };
      }

      if (influencer.type !== 'mother') {
        throw {
          code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
          message: 'Only Mother Influencers can have master codes'
        };
      }

      // Check if already has a master code
      if (influencer.masterReferralCode) {
        return influencer.masterReferralCode;
      }

      // Generate unique code
      let attempts = 0;
      while (attempts < this.MAX_CODE_GENERATION_ATTEMPTS) {
        attempts++;
        const code = generateMasterCode();
        
        // Check if code already exists
        const existing = await this.getCodeByValue(code);
        if (!existing) {
          // Create referral code record
          const referralCode: ReferralCode = {
            id: code,
            code,
            type: 'master',
            createdBy: influencerId,
            status: 'active',
            usageCount: 0,
            createdAt: Timestamp.now(),
            metadata: {}
          };

          await adminDb
            .collection(this.REFERRAL_CODES_COLLECTION)
            .doc(code)
            .set(referralCode);

          // Update influencer with master code
          await adminDb
            .collection(this.INFLUENCERS_COLLECTION)
            .doc(influencerId)
            .update({
              masterReferralCode: code,
              updatedAt: Timestamp.now()
            });

          return code;
        }
      }

      throw {
        code: HierarchicalReferralErrorCode.CODE_ALREADY_EXISTS,
        message: `Failed to generate unique master code after ${attempts} attempts`
      };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to generate master code',
        details: error
      };
    }
  }

  /**
   * Generate a unique sub referral code for Mini Influencer onboarding
   * Requirements: 1.2
   */
  static async generateSubCode(motherInfluencerId: string, metadata?: object): Promise<string> {
    try {
      // Verify Mother Influencer exists and has master code
      const motherInfluencer = await this.getInfluencerById(motherInfluencerId);
      if (!motherInfluencer) {
        throw {
          code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
          message: 'Mother Influencer not found'
        };
      }

      if (motherInfluencer.type !== 'mother') {
        throw {
          code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
          message: 'Only Mother Influencers can generate sub codes'
        };
      }

      if (!motherInfluencer.masterReferralCode) {
        throw {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Mother Influencer must have a master code first'
        };
      }

      // Generate unique sub code
      let attempts = 0;
      while (attempts < this.MAX_CODE_GENERATION_ATTEMPTS) {
        attempts++;
        const code = generateSubCode(motherInfluencer.masterReferralCode);
        
        // Check if code already exists
        const existing = await this.getCodeByValue(code);
        if (!existing) {
          // Create referral code record
          const referralCode: ReferralCode = {
            id: code,
            code,
            type: 'sub',
            createdBy: motherInfluencerId,
            status: 'active',
            usageCount: 0,
            createdAt: Timestamp.now(),
            metadata: metadata || {}
          };

          await adminDb
            .collection(this.REFERRAL_CODES_COLLECTION)
            .doc(code)
            .set(referralCode);

          return code;
        }
      }

      throw {
        code: HierarchicalReferralErrorCode.CODE_ALREADY_EXISTS,
        message: `Failed to generate unique sub code after ${attempts} attempts`
      };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to generate sub code',
        details: error
      };
    }
  }

  /**
   * Validate a referral code and return validation result
   * Requirements: 1.4, 2.4
   */
  static async validateCode(code: string): Promise<ReferralCodeValidation> {
    try {
      if (!isValidCodeFormat(code)) {
        return {
          isValid: false,
          error: 'Invalid code format'
        };
      }

      const referralCode = await this.getCodeByValue(code);
      if (!referralCode) {
        return {
          isValid: false,
          error: 'Code not found'
        };
      }

      if (referralCode.status !== 'active') {
        return {
          isValid: false,
          error: 'Code is not active'
        };
      }

      // Check expiration
      if (referralCode.expiresAt && referralCode.expiresAt.toDate() < new Date()) {
        return {
          isValid: false,
          error: 'Code has expired'
        };
      }

      // Check usage limits
      if (referralCode.maxUsage && referralCode.usageCount >= referralCode.maxUsage) {
        return {
          isValid: false,
          error: 'Code usage limit exceeded'
        };
      }

      return {
        isValid: true,
        code: referralCode
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Validation failed'
      };
    }
  }

  /**
   * Link a Mini Influencer to a Mother Influencer using sub code
   * Requirements: 1.4, 2.2
   */
  static async linkInfluencer(code: string, newInfluencerId: string): Promise<void> {
    try {
      // Validate the code
      const validation = await this.validateCode(code);
      if (!validation.isValid || !validation.code) {
        throw {
          code: HierarchicalReferralErrorCode.INVALID_CODE,
          message: validation.error || 'Invalid code'
        };
      }

      const referralCode = validation.code;

      // Only sub codes can be used for linking
      if (referralCode.type !== 'sub') {
        throw {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Only sub codes can be used for Mini Influencer registration'
        };
      }

      // Check if code is already assigned
      if (referralCode.assignedTo) {
        throw {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Code is already assigned to another Mini Influencer'
        };
      }

      // Get the new influencer
      const newInfluencer = await this.getInfluencerById(newInfluencerId);
      if (!newInfluencer) {
        throw {
          code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
          message: 'New influencer not found'
        };
      }

      if (newInfluencer.type !== 'mini') {
        throw {
          code: HierarchicalReferralErrorCode.INVALID_INPUT,
          message: 'Only Mini Influencers can be linked using sub codes'
        };
      }

      // Update the referral code
      await adminDb
        .collection(this.REFERRAL_CODES_COLLECTION)
        .doc(referralCode.id)
        .update({
          assignedTo: newInfluencerId,
          usageCount: referralCode.usageCount + 1,
          status: 'inactive' // Mark as used
        });

      // Update the Mini Influencer with parent relationship
      await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(newInfluencerId)
        .update({
          parentInfluencerId: referralCode.createdBy,
          updatedAt: Timestamp.now()
        });

    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to link influencer',
        details: error
      };
    }
  }

  /**
   * Get referral tree for a Mother Influencer
   */
  static async getReferralTree(motherInfluencerId: string): Promise<ReferralTree> {
    try {
      const motherInfluencer = await this.getInfluencerById(motherInfluencerId);
      if (!motherInfluencer) {
        throw {
          code: HierarchicalReferralErrorCode.INFLUENCER_NOT_FOUND,
          message: 'Mother Influencer not found'
        };
      }

      if (motherInfluencer.type !== 'mother') {
        throw {
          code: HierarchicalReferralErrorCode.PERMISSION_DENIED,
          message: 'Only Mother Influencers have referral trees'
        };
      }

      // Get all Mini Influencers under this Mother Influencer
      const miniInfluencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('parentInfluencerId', '==', motherInfluencerId)
        .get();

      const miniInfluencers = miniInfluencersSnapshot.docs.map(doc => doc.data() as Influencer);

      // Calculate totals
      const totalNetworkEarnings = motherInfluencer.totalEarnings + 
        miniInfluencers.reduce((sum, mini) => sum + mini.totalEarnings, 0);

      return {
        motherInfluencer,
        miniInfluencers,
        totalNetworkEarnings,
        totalNetworkActivities: 0 // Will be calculated by analytics service
      };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get referral tree',
        details: error
      };
    }
  }

  /**
   * Deactivate a referral code
   */
  static async deactivateCode(codeId: string): Promise<void> {
    try {
      await adminDb
        .collection(this.REFERRAL_CODES_COLLECTION)
        .doc(codeId)
        .update({
          status: 'inactive'
        });
    } catch (error) {
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to deactivate code',
        details: error
      };
    }
  }

  /**
   * Helper method to get influencer by ID
   */
  private static async getInfluencerById(id: string): Promise<Influencer | null> {
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
      console.error('Error getting influencer by ID:', error);
      return null;
    }
  }

  /**
   * Helper method to get referral code by value
   */
  private static async getCodeByValue(code: string): Promise<ReferralCode | null> {
    try {
      const doc = await adminDb
        .collection(this.REFERRAL_CODES_COLLECTION)
        .doc(code)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as ReferralCode;
    } catch (error) {
      console.error('Error getting code by value:', error);
      return null;
    }
  }
}