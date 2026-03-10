import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ReferralService } from "@/lib/referral/referral-service";

/**
 * Auto-Provisioning Log Entry
 * Tracks all auto-provisioning attempts for debugging and monitoring
 */
interface AutoProvisionLog {
  id: string;
  userId: string;
  email: string;
  success: boolean;
  referralCode?: string;
  error?: string;
  attempts: number;
  timestamp: Timestamp;
  source: 'login' | 'dashboard_access' | 'shop_registration';
}

/**
 * AutoProvisionService
 * Automatically creates referral user documents for existing Firebase Auth users
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2
 */
class AutoProvisionService {
  private static readonly REFERRAL_USERS_COLLECTION = 'referralUsers';
  private static readonly AUTO_PROVISION_LOGS_COLLECTION = 'autoProvisionLogs';
  private static readonly USER_PROFILES_COLLECTION = 'userProfiles';

  /**
   * Check if a user has a referral user document
   * Requirements: 1.1
   * 
   * @param userId - Firebase Auth UID
   * @returns true if referral user exists
   */
  static async hasReferralUser(userId: string): Promise<boolean> {
    try {
      const doc = await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(userId)
        .get();

      return doc.exists;
    } catch (error) {
      console.error('Error checking referral user existence:', error);
      return false;
    }
  }

  /**
   * Detect if a user is an admin
   * Checks both user profile and Firebase custom claims
   * Requirements: 10.1, 10.2
   * 
   * @param userId - Firebase Auth UID
   * @returns true if user is admin
   */
  private static async detectAdminStatus(userId: string): Promise<boolean> {
    try {
      // Check Firebase custom claims first
      const userRecord = await adminAuth.getUser(userId);
      if (userRecord.customClaims?.admin === true || userRecord.customClaims?.isAdmin === true) {
        return true;
      }

      // Check user profile document
      const profileDoc = await adminDb
        .collection(this.USER_PROFILES_COLLECTION)
        .doc(userId)
        .get();

      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        if (profileData?.isAdmin === true || profileData?.admin === true) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error detecting admin status:', error);
      // Default to non-admin on error
      return false;
    }
  }

  /**
   * Log auto-provisioning attempt
   * Requirements: 7.1
   * 
   * @param log - Auto-provision log entry
   */
  private static async logProvisionAttempt(log: Omit<AutoProvisionLog, 'id'>): Promise<void> {
    try {
      const logRef = adminDb.collection(this.AUTO_PROVISION_LOGS_COLLECTION).doc();
      await logRef.set({
        ...log,
        id: logRef.id,
      });
    } catch (error) {
      // Don't throw - logging failures shouldn't block provisioning
      console.error('Error logging auto-provision attempt:', error);
    }
  }

  /**
   * Auto-provision a referral user for an existing Firebase Auth user
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2
   * 
   * @param userId - Firebase Auth UID
   * @param email - User's email address
   * @param displayName - User's display name (optional)
   * @param source - Source of auto-provisioning request
   * @returns Created or existing ReferralUser
   */
  static async autoProvisionReferralUser(
    userId: string,
    email: string,
    displayName?: string | null,
    source: 'login' | 'dashboard_access' | 'shop_registration' = 'login'
  ) {
    let attempts = 0;
    let lastError: any = null;

    try {
      // Requirement 8.1, 8.2: Check if user already has a referral document
      const existingUser = await ReferralService.getReferrerById(userId);
      if (existingUser) {
        // Log skipped provisioning
        await this.logProvisionAttempt({
          userId,
          email,
          success: true,
          referralCode: existingUser.referralCode,
          attempts: 0,
          timestamp: Timestamp.now(),
          source,
        });

        console.log(`Auto-provisioning skipped for existing user: ${userId}`);
        return existingUser;
      }

      // Requirement 6.1: Validate document ID matches Firebase Auth UID
      if (!userId || userId.trim() === '') {
        throw new Error('Invalid user ID');
      }

      // Requirement 6.2: Validate email
      if (!email || email.trim() === '') {
        throw new Error('Invalid email');
      }

      // Requirement 1.2: Generate unique referral code
      attempts = 1;
      const referralCode = await ReferralService.generateUniqueReferralCode();

      // Requirement 10.2: Detect admin status
      const isAdmin = await this.detectAdminStatus(userId);

      // Requirement 1.3: Create referral user document with initial state
      const now = Timestamp.now();
      const referralUser = {
        userId,
        email: email.trim().toLowerCase(),
        fullName: displayName?.trim() || email.split('@')[0],
        referralCode,
        totalReferrals: 0,
        totalPoints: 0,
        totalRevenue: 0,
        isActive: true,
        isAdmin,
        autoProvisioned: true,
        provisionedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      // Requirement 6.1: Use Firebase Auth UID as document ID
      await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(userId)
        .set(referralUser);

      // Log successful provisioning
      await this.logProvisionAttempt({
        userId,
        email,
        success: true,
        referralCode,
        attempts,
        timestamp: Timestamp.now(),
        source,
      });

      console.log(`Auto-provisioned referral user: ${userId} with code: ${referralCode}`);
      return referralUser;

    } catch (error: any) {
      lastError = error;
      
      // Log failed provisioning
      await this.logProvisionAttempt({
        userId,
        email,
        success: false,
        error: error.message || 'Unknown error',
        attempts,
        timestamp: Timestamp.now(),
        source,
      });

      console.error('Auto-provisioning failed:', error);

      // Re-throw with appropriate error code
      if (error.code) {
        throw error;
      }

      throw new Error('Failed to auto-provision referral user');
    }
  }

  /**
   * Verify and auto-provision if needed
   * Convenience method that checks existence and provisions if necessary
   * Requirements: 1.1, 3.3
   * 
   * @param userId - Firebase Auth UID
   * @param email - User's email address
   * @param displayName - User's display name (optional)
   * @param source - Source of auto-provisioning request
   * @returns ReferralUser (existing or newly created)
   */
  static async verifyAndProvision(
    userId: string,
    email: string,
    displayName?: string | null,
    source: 'login' | 'dashboard_access' | 'shop_registration' = 'login'
  ) {
    const hasReferralUser = await this.hasReferralUser(userId);
    
    if (hasReferralUser) {
      const existingUser = await ReferralService.getReferrerById(userId);
      if (existingUser) {
        return existingUser;
      }
    }

    return await this.autoProvisionReferralUser(userId, email, displayName, source);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, email, displayName, referralCode } = await req.json();

    // Validate input
    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId and email" },
        { status: 400 }
      );
    }

    // Create referral user document
    const referralUser = await AutoProvisionService.autoProvisionReferralUser(
      userId,
      email,
      displayName,
      'shop_registration'
    );

    return NextResponse.json({
      success: true,
      referralUser,
    });
  } catch (error: any) {
    console.error("Shop registration error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to register shop user",
        success: false 
      },
      { status: 500 }
    );
  }
}