import { adminDb } from '../firebase-admin';
import { 
  ReferralTransaction,
  ReferralPurchase,
  PurchaseData,
  ReferralErrorCode 
} from './types';
import { getSignupPoints, calculatePurchasePoints, calculateCommission } from './utils';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * RewardService - Manages points calculation and awarding logic
 * Handles sign-up points, purchase commissions, and transaction tracking
 */
export class RewardService {
  private static readonly REFERRAL_USERS_COLLECTION = 'referralUsers';
  private static readonly REFERRALS_COLLECTION = 'referrals';
  private static readonly TRANSACTIONS_COLLECTION = 'referralTransactions';
  private static readonly PURCHASES_COLLECTION = 'referralPurchases';

  
  static async awardSignUpPoints(
    referrerId: string,
    referralId: string
  ): Promise<void> {
    try {
      const points = getSignupPoints();

      // Get referral details for transaction metadata
      const referralDoc = await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .doc(referralId)
        .get();

      if (!referralDoc.exists) {
        const error = {
          code: ReferralErrorCode.INVALID_INPUT,
          message: 'Referral not found',
        };
        console.error('Referral not found when awarding signup points:', {
          referrerId,
          referralId,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      const referral = referralDoc.data();

      // Create transaction record
      const transactionRef = adminDb.collection(this.TRANSACTIONS_COLLECTION).doc();
      
      const transaction: ReferralTransaction = {
        id: transactionRef.id,
        referrerId,
        referralId,
        type: 'signup',
        points,
        description: `Sign-up bonus for ${referral?.refereeName}`,
        metadata: {
          refereeEmail: referral?.refereeEmail || '',
          refereeName: referral?.refereeName || '',
        },
        createdAt: Timestamp.now(),
      };

      // Use batch write for atomicity
      const batch = adminDb.batch();

      // Add transaction
      batch.set(transactionRef, transaction);

      // Update referrer's total points
      const referrerRef = adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(referrerId);
      
      batch.update(referrerRef, {
        totalPoints: FieldValue.increment(points),
        updatedAt: Timestamp.now(),
      });

      await batch.commit();
      
      console.log(`Successfully awarded ${points} signup points to referrer ${referrerId}`);
    } catch (error: any) {
      // Requirement 7.4, 7.5: Log Firestore operation failures with full details
      if (error.code) {
        throw error;
      }
      
      console.error('Error awarding sign-up points:', {
        error: error.message || error,
        stack: error.stack,
        referrerId,
        referralId,
        timestamp: new Date().toISOString(),
      });
      
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to award sign-up points. Please try again or contact support.',
        details: error,
      };
    }
  }

  /**
   * Award purchase points to referrer
   * Awards 5% commission on referee purchases
   * Requirements: 7.2, 9.3, 9.4, 9.5
   */
  static async awardPurchasePoints(
    referrerId: string,
    purchaseData: PurchaseData
  ): Promise<void> {
    try {
      const { referralId, refereeId, orderId, amount } = purchaseData;

      // Calculate commission and points
      const commission = calculateCommission(amount);
      const points = calculatePurchasePoints(amount);

      // Get referral details
      const referralDoc = await adminDb
        .collection(this.REFERRALS_COLLECTION)
        .doc(referralId)
        .get();

      if (!referralDoc.exists) {
        throw {
          code: ReferralErrorCode.INVALID_INPUT,
          message: 'Referral not found',
        };
      }

      const referral = referralDoc.data();

      // Check if purchase already tracked (idempotency)
      const existingPurchase = await adminDb
        .collection(this.PURCHASES_COLLECTION)
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      if (!existingPurchase.empty) {
        console.log('Purchase already tracked:', orderId);
        return;
      }

      // Check if this is the first purchase by this referee
      const isFirstPurchase = !referral?.firstPurchaseDate;

      if (!isFirstPurchase) {
        console.log(`Referee ${referral?.refereeName} (${referral?.refereeEmail}) has already made their first purchase. No points awarded for subsequent purchases.`);
        
        // Still update purchase stats but don't award points or create transaction
        const batch = adminDb.batch();
        
        const referralRef = adminDb
          .collection(this.REFERRALS_COLLECTION)
          .doc(referralId);
        
        batch.update(referralRef, {
          totalPurchases: FieldValue.increment(1),
          totalSpent: FieldValue.increment(amount),
        });
        
        await batch.commit();
        return;
      }

      // This is the first purchase - award points
      console.log(`First purchase by ${referral?.refereeName}. Awarding ${points} points to referrer.`);

      // Create purchase record
      const purchaseRef = adminDb.collection(this.PURCHASES_COLLECTION).doc();
      
      const purchase: ReferralPurchase = {
        id: purchaseRef.id,
        referrerId,
        referralId,
        refereeId,
        orderId,
        amount,
        commission,
        points,
        status: 'completed',
        createdAt: Timestamp.now(),
      };

      // Create transaction record
      const transactionRef = adminDb.collection(this.TRANSACTIONS_COLLECTION).doc();
      
      const transaction: ReferralTransaction = {
        id: transactionRef.id,
        referrerId,
        referralId,
        type: 'purchase',
        points,
        amount,
        description: `Purchase commission from ${referral?.refereeName}`,
        metadata: {
          refereeEmail: referral?.refereeEmail || '',
          refereeName: referral?.refereeName || '',
          orderId,
        },
        createdAt: Timestamp.now(),
      };

      // Use batch write for atomicity
      const batch = adminDb.batch();

      // Add purchase record
      batch.set(purchaseRef, purchase);

      // Add transaction record
      batch.set(transactionRef, transaction);

      // Update referrer's total points and revenue
      const referrerRef = adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(referrerId);
      
      batch.update(referrerRef, {
        totalPoints: FieldValue.increment(points),
        totalRevenue: FieldValue.increment(amount),
        updatedAt: Timestamp.now(),
      });

      // Update referral's purchase stats and set firstPurchaseDate
      const referralRef = adminDb
        .collection(this.REFERRALS_COLLECTION)
        .doc(referralId);
      
      batch.update(referralRef, {
        totalPurchases: FieldValue.increment(1),
        totalSpent: FieldValue.increment(amount),
        pointsEarned: FieldValue.increment(points),
        status: 'converted',
        firstPurchaseDate: Timestamp.now(),
      });

      await batch.commit();
      
      console.log(`Successfully awarded ${points} purchase points to referrer ${referrerId} for order ${orderId}`);
    } catch (error: any) {
      // Requirement 7.4, 7.5: Log Firestore operation failures with full details
      if (error.code) {
        throw error;
      }
      
      console.error('Error awarding purchase points:', {
        error: error.message || error,
        stack: error.stack,
        referrerId,
        purchaseData,
        timestamp: new Date().toISOString(),
      });
      
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to award purchase points. Please try again or contact support.',
        details: error,
      };
    }
  }

  /**
   * Calculate points from purchase amount
   * Returns points equal to 5% of purchase amount
   * Requirements: 7.2
   */
  static calculatePurchasePoints(amount: number): number {
    return calculatePurchasePoints(amount);
  }

  /**
   * Calculate commission from purchase amount
   * Returns 5% of the purchase amount
   * Requirements: 9.3
   */
  static calculateCommission(amount: number): number {
    return calculateCommission(amount);
  }

  /**
   * Get points history for a referrer
   * Returns all transactions with details
   * Requirements: 7.4, 7.5
   */
  static async getPointsHistory(referrerId: string): Promise<ReferralTransaction[]> {
    try {
      const snapshot = await adminDb
        .collection(this.TRANSACTIONS_COLLECTION)
        .where('referrerId', '==', referrerId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as ReferralTransaction);
    } catch (error) {
      console.error('Error getting points history:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get points history',
        details: error,
      };
    }
  }

  /**
   * Get purchase history for a referrer
   * Returns all purchases made by referees
   * Requirements: 9.1, 9.2
   */
  static async getPurchaseHistory(referrerId: string): Promise<ReferralPurchase[]> {
    try {
      const snapshot = await adminDb
        .collection(this.PURCHASES_COLLECTION)
        .where('referrerId', '==', referrerId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as ReferralPurchase);
    } catch (error) {
      console.error('Error getting purchase history:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get purchase history',
        details: error,
      };
    }
  }

  /**
   * Get total points earned by a referrer
   * Aggregates all transaction points
   * Requirements: 4.2, 7.4
   */
  static async getTotalPoints(referrerId: string): Promise<number> {
    try {
      const referrerDoc = await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(referrerId)
        .get();

      if (!referrerDoc.exists) {
        throw {
          code: ReferralErrorCode.USER_NOT_FOUND,
          message: 'Referrer not found',
        };
      }

      const referrer = referrerDoc.data();
      return referrer?.totalPoints || 0;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      console.error('Error getting total points:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get total points',
        details: error,
      };
    }
  }

  /**
   * Get total revenue generated by a referrer
   * Aggregates all purchase amounts
   * Requirements: 4.3, 9.2
   */
  static async getTotalRevenue(referrerId: string): Promise<number> {
    try {
      const referrerDoc = await adminDb
        .collection(this.REFERRAL_USERS_COLLECTION)
        .doc(referrerId)
        .get();

      if (!referrerDoc.exists) {
        throw {
          code: ReferralErrorCode.USER_NOT_FOUND,
          message: 'Referrer not found',
        };
      }

      const referrer = referrerDoc.data();
      return referrer?.totalRevenue || 0;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      console.error('Error getting total revenue:', error);
      throw {
        code: ReferralErrorCode.INVALID_INPUT,
        message: 'Failed to get total revenue',
        details: error,
      };
    }
  }
}
