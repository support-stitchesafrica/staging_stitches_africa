import { adminDb, adminAuth } from '../firebase-admin';
import { cartRepository } from '../firestore';
import { 
  ReferralUser, 
  RegisterData, 
  RefereeData,
  Referral,
  ReferrerStats,
  GlobalStats,
  ReferralErrorCode,
  ReferralCartStats
} from './types';
import { generateReferralCode, isValidReferralCodeFormat, getSignupPoints } from './utils';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * ReferralService - Core service for managing referral program
 * Handles user registration, code generation, validation, and tracking
 */
export class ReferralService {
  private static readonly REFERRAL_USERS_COLLECTION = 'referralUsers';
  private static readonly REFERRALS_COLLECTION = 'referrals';
  private static readonly MAX_CODE_GENERATION_ATTEMPTS = 10;

  /**
   * Register a new referrer
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  static async registerReferrer(data: RegisterData): Promise<ReferralUser> {
    try {
      // Create Firebase Auth user
      const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
      });

      // Generate unique referral code
      const referralCode = await this.generateUniqueReferralCode();

      // Create referral user document
      const referralUser: ReferralUser = {
        userId: userRecord.uid,
        email: data.email,
        fullName: data.fullName,
        referralCode,
        totalReferrals: 0,
        totalPoints: 0,
        totalRevenue: 0,
        isActive: true,
        isAdmin: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Store in Firestore
      await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(userRecord.uid)
        .set(referralUser);

      return referralUser;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw {
          code: ReferralErrorCode.INVALID_INPUT,
          message: 'Email already exists',
          details: error,
        };
      }
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to register referrer',
        details: error,
      };
    }
  }

  /**
   * Create profile for existing Firebase Auth user
   * Requirements: Legacy User Support
   */
  static async createProfileForExistingUser(
    userId: string, 
    email: string, 
    fullName: string
  ): Promise<ReferralUser> {
    try {
      // Check if profile already exists
      const existingProfile = await this.getReferrerById(userId);
      if (existingProfile) {
        return existingProfile;
      }

      // Generate unique referral code
      const referralCode = await this.generateUniqueReferralCode();

      // Create referal user document
      const referralUser: ReferralUser = {
        userId,
        email,
        fullName,
        referralCode,
        totalReferrals: 0,
        totalPoints: 0,
        totalRevenue: 0,
        isActive: true,
        isAdmin: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Store in Firestore
      await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(userId)
        .set(referralUser);

      return referralUser;
    } catch (error: any) {
      console.error('Error creating profile for existing user:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to create profile for existing user',
        details: error,
      };
    }
  }

  /**
   * Get referrer by referral code
   * Requirements: 1.2, 8.2
   */
  static async getReferrerByCode(code: string): Promise<ReferralUser | null> {
    try {
      if (!isValidReferralCodeFormat(code)) {
        return null;
      }

      const snapshot = await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .where('referralCode', '==', code)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as ReferralUser;
    } catch (error) {
      console.error('Error getting referrer by code:', error);
      return null;
    }
  }

  /**
   * Get referrer by user ID
   * Requirements: 2.1
   */
  static async getReferrerById(userId: string): Promise<ReferralUser | null> {
    try {
      const doc = await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as ReferralUser;
    } catch (error) {
      console.error('Error getting referrer by ID:', error);
      return null;
    }
  }

  /**
   * Generate a unique referral code
   * Requirements: 1.4, 7.2
   */
  static async generateUniqueReferralCode(): Promise<string> {
    let attempts = 0;
    const attemptedCodes: string[] = [];

    while (attempts < this.MAX_CODE_GENERATION_ATTEMPTS) {
      attempts++;
      const code = generateReferralCode();
      attemptedCodes.push(code);
      
      // Check if code already exists
      const existing = await this.getReferrerByCode(code);
      
      if (!existing) {
        if (attempts > 1) {
          console.log(`Generated unique referral code after ${attempts} attempts`);
        }
        return code;
      }

      console.warn(`Referral code collision detected: ${code} (attempt ${attempts}/${this.MAX_CODE_GENERATION_ATTEMPTS})`);
    }

    // Requirement 7.2: Log the number of attempts and final error
    const errorMessage = `Failed to generate unique referral code after ${attempts} attempts`;
    console.error(errorMessage, {
      attempts,
      maxAttempts: this.MAX_CODE_GENERATION_ATTEMPTS,
      attemptedCodes: attemptedCodes.slice(0, 5), // Log first 5 attempted codes
      timestamp: new Date().toISOString(),
    });

    throw {
      code: ReferralErrorCode.CODE_ALREADY_EXISTS,
      message: errorMessage,
      details: {
        attempts,
        maxAttempts: this.MAX_CODE_GENERATION_ATTEMPTS,
      },
    };
  }

  /**
   * Validate if a referral code exists and is active
   * Requirements: 3.1, 8.2
   */
  static async validateReferralCode(code: string): Promise<boolean> {
    if (!isValidReferralCodeFormat(code)) {
      return false;
    }

    const referrer = await this.getReferrerByCode(code);
    return referrer !== null && referrer.isActive;
  }

  /**
   * Create a new referral relationship
   * Requirements: 8.3, 8.4
   */
  static async createReferral(
    referrerId: string,
    refereeData: RefereeData
  ): Promise<Referral> {
    try {
      // Get referrer to validate and get referral code
      const referrer = await this.getReferrerById(referrerId);
      
      if (!referrer) {
        throw {
          code: ReferralErrorCode.USER_NOT_FOUND,
          message: 'Referrer not found',
        };
      }

      // Check if referral already exists
      const existingReferral = await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .where('refereeId', '==', refereeData.userId)
        .limit(1)
        .get();

      if (!existingReferral.empty) {
        throw {
          code: ReferralErrorCode.REFERRAL_EXISTS,
          message: 'Referee already has a referrer',
        };
      }

      // Create referral document
      const referralRef = adminDb.collection(this.REFERRALS_COLLECTION).doc();
      
      const referral: Referral = {
        id: referralRef.id,
        referrerId,
        refereeId: refereeData.userId,
        refereeEmail: refereeData.email,
        refereeName: refereeData.name,
        referralCode: referrer.referralCode,
        status: 'active',
        signUpDate: Timestamp.now(),
        totalPurchases: 0,
        totalSpent: 0,
        pointsEarned: getSignupPoints(),
        createdAt: Timestamp.now(),
      };

      await referralRef.set(referral);

      // Update referrer's total referrals
      await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(referrerId)
        .update({
          totalReferrals: (referrer.totalReferrals || 0) + 1,
          updatedAt: Timestamp.now(),
        });

      return referral;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to create referral',
        details: error,
      };
    }
  }

  /**
   * Get all referrals for a referrer
   * Requirements: 6.1
   */
  static async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    try {
      const snapshot = await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .where('referrerId', '==', referrerId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Referral);
    } catch (error) {
      console.error('Error getting referrals:', error);
      return [];
    }
  }

  /**
   * Get referral by referee ID
   * Used to check if a user was referred and by whom
   * Requirements: 9.3
   */
  static async getReferralByRefereeId(refereeId: string): Promise<Referral | null> {
    try {
      const snapshot = await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .where('refereeId', '==', refereeId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as Referral;
    } catch (error) {
      console.error('Error getting referral by referee ID:', error);
      return null;
    }
  }

  /**
   * Update referral status
   * Requirements: 8.4
   */
  static async updateReferralStatus(
    referralId: string,
    status: 'pending' | 'active' | 'converted'
  ): Promise<void> {
    try {
      await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .doc(referralId)
        .update({
          status,
        });
    } catch (error) {
      console.error('Error updating referral status:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to update referral status',
        details: error,
      };
    }
  }

  /**
   * Get statistics for a specific referrer
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  static async getReferrerStats(referrerId: string): Promise<ReferrerStats> {
    try {
      const referrer = await this.getReferrerById(referrerId);
      
      if (!referrer) {
        throw {
          code: ReferralErrorCode.USER_NOT_FOUND,
          message: 'Referrer not found',
        };
      }

      const referrals = await this.getReferralsByReferrer(referrerId);

      // Calculate stats
      const activeReferrals = referrals.filter(r => r.status === 'active').length;
      const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
      const convertedReferrals = referrals.filter(r => r.status === 'converted' || r.totalPurchases > 0).length;
      
      const conversionRate = referrals.length > 0 
        ? (convertedReferrals / referrals.length) * 100 
        : 0;

      return {
        totalReferrals: referrer.totalReferrals,
        totalPoints: referrer.totalPoints,
        totalRevenue: referrer.totalRevenue,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        activeReferrals,
        pendingReferrals,
      };
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get referrer stats',
        details: error,
      };
    }
  }

  /**
   * Get global statistics for the entire referral program
   * Requirements: 11.1, 11.2
   */
  static async getGlobalStats(): Promise<GlobalStats> {
    try {
      // Get all referrers
      const referrersSnapshot = await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .get();

      const referrers = referrersSnapshot.docs.map(doc => doc.data() as ReferralUser);

      // Get all referrals
      const referralsSnapshot = await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .get();

      const referrals = referralsSnapshot.docs.map(doc => doc.data() as Referral);

      // Calculate totals
      const totalReferrers = referrers.length;
      const totalReferees = referrals.length;
      const totalPoints = referrers.reduce((sum, r) => sum + (r.totalPoints || 0), 0);
      const totalRevenue = referrers.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);

      // Calculate averages
      const averageReferralsPerReferrer = totalReferrers > 0 
        ? totalReferees / totalReferrers 
        : 0;

      // Calculate overall conversion rate
      const convertedReferrals = referrals.filter(
        r => r.status === 'converted' || r.totalPurchases > 0
      ).length;
      const overallConversionRate = totalReferees > 0 
        ? (convertedReferrals / totalReferees) * 100 
        : 0;

      return {
        totalReferrers,
        totalReferees,
        totalPoints,
        totalRevenue,
        averageReferralsPerReferrer: parseFloat(averageReferralsPerReferrer.toFixed(2)),
        overallConversionRate: parseFloat(overallConversionRate.toFixed(2)),
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get global stats',
        details: error,
      };
    }
  }

  /**
   * Get all referrals with their cart statistics
   * Requirements: Referral Activity Dashboard
   */
  static async getReferralsWithCartStats(referrerId: string): Promise<ReferralCartStats[]> {
    try {
      // 1. Get all referrals
      const referrals = await this.getReferralsByReferrer(referrerId);
      
      if (referrals.length === 0) {
        return [];
      }

      // 2. Enhance with cart data
      const referralsWithCart = await Promise.all(referrals.map(async (referral) => {
        try {
          // Fetch cart items for the referee using Admin SDK to bypass permissions
          // Path: users_cart_items/{userId}/user_cart_items
          const cartSnapshot = await adminDb
            .collection('users_cart_items')
            .doc(referral.refereeId)
            .collection('user_cart_items')
            .get();
          
          const cartItems = cartSnapshot.docs.map(doc => doc.data() as any);
          
          // Calculate stats
          const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
          const cartTotalValue = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
          
          // Get last update time if any
          let lastCartUpdate: any = undefined;
          if (cartItems.length > 0) {
            // Find most recent update
            lastCartUpdate = cartItems.reduce((latest, item) => {
              const itemDate = item.updatedAt instanceof Date ? item.updatedAt : 
                (item.updatedAt as any)?.toDate ? (item.updatedAt as any).toDate() : 
                (item.updatedAt && typeof item.updatedAt === 'string') ? new Date(item.updatedAt) : new Date();
              
              if (!latest) return itemDate;
              return itemDate > latest ? itemDate : latest;
            }, undefined as Date | undefined);
          }

          const stats: ReferralCartStats = {
            ...referral,
            cartItemCount,
            cartTotalValue,
            lastCartUpdate
          };

          return stats;
        } catch (error) {
          console.error(`Error fetching cart for referee ${referral.refereeId}:`, error);
          // Return base referral with 0 stats on error
          return {
            ...referral,
            cartItemCount: 0,
            cartTotalValue: 0
          } as ReferralCartStats;
        }
      }));

      return referralsWithCart;
    } catch (error) {
      console.error('Error getting referrals with cart stats:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get referrals with cart stats',
        details: error,
      };
    }
  }
  /**
   * Track referral event (click or download)
   * Requirements: Mobile App Feature
   */
  static async trackReferralEvent(
    code: string,
    eventType: 'click' | 'download',
    eventData: {
      sessionId: string;
      deviceType: 'android' | 'ios' | 'desktop' | 'unknown';
      userAgent?: string;
      ipHash?: string;
      ipAddress?: string; // Added for probabilistic attribution
    }
  ): Promise<boolean> {
    try {
      if (!isValidReferralCodeFormat(code)) {
        return false;
      }

      // Check if referrer exists
      const referrer = await this.getReferrerByCode(code);
      if (!referrer) {
        console.warn(`Attempted to track event for invalid code: ${code}`);
        return false;
      }

      // 0. Check for duplicate event (same session, same type)
      const duplicateQuery = await adminDb
        .collection('referralEvents')
        .where('sessionId', '==', eventData.sessionId)
        .where('eventType', '==', eventType)
        .where('referralCode', '==', code)
        .limit(1)
        .get();

      if (!duplicateQuery.empty) {
        console.log(`Skipping duplicate ${eventType} event for session: ${eventData.sessionId}`);
        return true; // Return success but don't increment
      }

      const now = Timestamp.now();
      
      // 1. Log the event
      const eventRef = adminDb.collection('referralEvents').doc();
      await eventRef.set({
        id: eventRef.id,
        eventType,
        referralCode: code,
        referrerId: referrer.userId,
        ...eventData,
        createdAt: now,
      });

      // 1.5 Store Pending Install for Probabilistic Attribution (Only for Downloads)
      if (eventType === 'download' && eventData.ipAddress) {
        try {
          await adminDb.collection('pending_ref_installs').add({
            referral_code: code,
            ip_address: eventData.ipAddress,
            user_agent: eventData.userAgent || 'unknown',
            device_type: eventData.deviceType,
            timestamp: now,
            expires_at: Timestamp.fromMillis(now.toMillis() + (24 * 60 * 60 * 1000)), // 24h expiration
            session_id: eventData.sessionId
          });
          console.log(`Stored pending install for IP: ${eventData.ipAddress}`);
        } catch (e) {
          console.error("Failed to store pending install:", e);
          // Don't fail the main tracking flow
        }
      }

      // 2. Increment stats on referrer
      const updateData: any = {
        updatedAt: now,
      };

      if (eventType === 'click') {
        updateData.totalClicks = (referrer.totalClicks || 0) + 1;
      } else if (eventType === 'download') {
        updateData.totalDownloads = (referrer.totalDownloads || 0) + 1;
      }

      await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(referrer.userId)
        .update(updateData);

      return true;
    } catch (error) {
      console.error('Error tracking referral event:', error);
      return false;
    }
  }
}
