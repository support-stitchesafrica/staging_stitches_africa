import { 
  Activity, 
  Commission, 
  CommissionRates, 
  PayoutResult, 
  EarningsHistory, 
  PayoutEligibility,
  HierarchicalReferralErrorCode
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { validateCommissionRates, validatePayoutAmount } from '../utils/validation';

/**
 * CommissionService - Service for calculating and managing commissions
 */
export class HierarchicalCommissionService {
  private static readonly COMMISSIONS_COLLECTION = 'hierarchical_commissions';
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';
  private static readonly COMMISSION_RATES_COLLECTION = 'hierarchical_commission_rates';
  private static readonly PAYOUTS_COLLECTION = 'hierarchical_payouts';

  /**
   * Calculate commission for an activity
   * Requirements: 5.1, 5.2, 5.5
   */
  static async calculateCommission(activity: Activity): Promise<Commission[]> {
    try {
      if (activity.type !== 'conversion' && activity.type !== 'purchase') {
        return []; // Only conversions and purchases generate commissions
      }

      const amount = activity.metadata.amount;
      if (!amount || amount <= 0) {
        return []; // No commission for zero-value activities
      }

      // Get commission rates (supports category/campaign-specific rates)
      const rates = await this.getApplicableCommissionRates(activity);
      
      // Get the influencer who generated this activity
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(activity.influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw new Error('Influencer not found');
      }

      const influencer = influencerDoc.data();
      const commissions: Commission[] = [];

      if (influencer?.type === 'mini') {
        // Mini Influencer commission
        const miniCommissionAmount = (amount * rates.miniInfluencerRate) / 100;
        
        const miniCommission: Commission = {
          id: `${activity.id}_mini`,
          activityId: activity.id,
          motherInfluencerId: influencer.parentInfluencerId,
          miniInfluencerId: activity.influencerId,
          amount: miniCommissionAmount,
          currency: activity.metadata.currency || 'USD',
          rate: rates.miniInfluencerRate,
          type: 'direct',
          status: 'pending',
          createdAt: Timestamp.now()
        };

        commissions.push(miniCommission);

        // Mother Influencer commission (indirect)
        if (influencer.parentInfluencerId) {
          const motherCommissionAmount = (amount * rates.motherInfluencerRate) / 100;
          
          const motherCommission: Commission = {
            id: `${activity.id}_mother`,
            activityId: activity.id,
            motherInfluencerId: influencer.parentInfluencerId,
            miniInfluencerId: activity.influencerId,
            amount: motherCommissionAmount,
            currency: activity.metadata.currency || 'USD',
            rate: rates.motherInfluencerRate,
            type: 'indirect',
            status: 'pending',
            createdAt: Timestamp.now()
          };

          commissions.push(motherCommission);
        }
      } else if (influencer?.type === 'mother') {
        // Direct Mother Influencer commission
        const motherCommissionAmount = (amount * (rates.miniInfluencerRate + rates.motherInfluencerRate)) / 100;
        
        const motherCommission: Commission = {
          id: `${activity.id}_mother_direct`,
          activityId: activity.id,
          motherInfluencerId: activity.influencerId,
          amount: motherCommissionAmount,
          currency: activity.metadata.currency || 'USD',
          rate: rates.miniInfluencerRate + rates.motherInfluencerRate,
          type: 'direct',
          status: 'pending',
          createdAt: Timestamp.now()
        };

        commissions.push(motherCommission);
      }

      // Store commissions in database
      for (const commission of commissions) {
        await adminDb
          .collection(this.COMMISSIONS_COLLECTION)
          .doc(commission.id)
          .set(commission);
      }

      return commissions;
    } catch (error) {
      console.error('Error calculating commission:', error);
      throw {
        code: HierarchicalReferralErrorCode.COMMISSION_CALCULATION_ERROR,
        message: 'Failed to calculate commission',
        details: error
      };
    }
  }

  /**
   * Process payouts for specified influencers
   * Requirements: 8.1, 8.2
   */
  static async processPayouts(influencerIds: string[]): Promise<PayoutResult[]> {
    try {
      const results: PayoutResult[] = [];

      for (const influencerId of influencerIds) {
        try {
          // Check payout eligibility
          const eligibility = await this.validatePayoutEligibility(influencerId);
          
          if (!eligibility.isEligible) {
            results.push({
              influencerId,
              amount: 0,
              status: 'failed',
              error: eligibility.reason,
              processedAt: Timestamp.now()
            });
            continue;
          }

          // Process the payout (integration with payment provider would go here)
          const payoutResult = await this.executePayout(influencerId, eligibility.amount);
          results.push(payoutResult);

        } catch (error: any) {
          results.push({
            influencerId,
            amount: 0,
            status: 'failed',
            error: error.message,
            processedAt: Timestamp.now()
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing payouts:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to process payouts',
        details: error
      };
    }
  }

  /**
   * Update commission rates with enhanced historical data preservation
   * Requirements: 5.1, 5.4, 5.5
   */
  static async updateCommissionRates(rates: CommissionRates): Promise<void> {
    try {
      // Validate rates
      const validationError = validateCommissionRates(rates);
      if (validationError) {
        throw validationError;
      }

      // Store new rates with comprehensive metadata for historical tracking
      const rateRecord = {
        ...rates,
        createdAt: Timestamp.now(),
        isActive: true,
        version: await this.getNextRateVersion(),
        updatedBy: 'system', // In a real implementation, this would be the admin user ID
        changeReason: 'Rate update', // Could be passed as parameter
        previousRates: await this.getCurrentCommissionRates() // Store previous rates for audit trail
      };

      const batch = adminDb.batch();

      // Deactivate current rates (preserve them for historical reference)
      const currentRatesSnapshot = await adminDb
        .collection(this.COMMISSION_RATES_COLLECTION)
        .where('isActive', '==', true)
        .get();

      // Mark old rates as inactive but preserve them
      currentRatesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          isActive: false,
          deactivatedAt: Timestamp.now()
        });
      });

      // Add new rates
      const newRateRef = adminDb.collection(this.COMMISSION_RATES_COLLECTION).doc();
      batch.set(newRateRef, rateRecord);

      await batch.commit();

      // Log the rate change for audit purposes
      await this.logRateChange(rateRecord);
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Failed to update commission rates',
        details: error
      };
    }
  }

  /**
   * Get next version number for commission rates
   * Requirements: 5.4
   */
  private static async getNextRateVersion(): Promise<number> {
    try {
      const snapshot = await adminDb
        .collection(this.COMMISSION_RATES_COLLECTION)
        .orderBy('version', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return 1;
      }

      const latestVersion = snapshot.docs[0].data().version || 0;
      return latestVersion + 1;
    } catch (error) {
      console.error('Error getting next rate version:', error);
      return 1;
    }
  }

  /**
   * Log commission rate changes for audit trail
   * Requirements: 5.4
   */
  private static async logRateChange(rateRecord: any): Promise<void> {
    try {
      const auditLog = {
        type: 'commission_rate_change',
        timestamp: Timestamp.now(),
        newRates: {
          miniInfluencerRate: rateRecord.miniInfluencerRate,
          motherInfluencerRate: rateRecord.motherInfluencerRate
        },
        previousRates: rateRecord.previousRates,
        version: rateRecord.version,
        updatedBy: rateRecord.updatedBy,
        changeReason: rateRecord.changeReason
      };

      await adminDb
        .collection('hierarchical_audit_logs')
        .add(auditLog);
    } catch (error) {
      console.error('Error logging rate change:', error);
      // Don't throw error here as it's just for audit purposes
    }
  }

  /**
   * Get commission rate history for transparency and auditing
   * Requirements: 5.4
   */
  static async getCommissionRateHistory(limit: number = 10): Promise<any[]> {
    try {
      const snapshot = await adminDb
        .collection(this.COMMISSION_RATES_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        deactivatedAt: doc.data().deactivatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting commission rate history:', error);
      return [];
    }
  }

  /**
   * Get audit log for commission rate changes
   * Requirements: 5.4
   */
  static async getCommissionRateAuditLog(limit: number = 20): Promise<any[]> {
    try {
      const snapshot = await adminDb
        .collection('hierarchical_audit_logs')
        .where('type', '==', 'commission_rate_change')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Error getting commission rate audit log:', error);
      return [];
    }
  }

  /**
   * Get earnings history for an influencer
   */
  static async getEarningsHistory(influencerId: string): Promise<EarningsHistory> {
    try {
      // Get all commissions for this influencer
      const commissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', influencerId)
        .orderBy('createdAt', 'desc')
        .get();

      const commissions = commissionsSnapshot.docs.map(doc => doc.data() as Commission);

      // Convert to earnings entries
      const entries = commissions.map(commission => ({
        id: commission.id,
        amount: commission.amount,
        type: 'commission' as const,
        source: commission.type === 'direct' ? 'Direct referral' : 'Mini Influencer commission',
        date: commission.createdAt,
        status: commission.status
      }));

      // Calculate totals
      const totalEarnings = commissions.reduce((sum, c) => sum + c.amount, 0);
      const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
      const pendingEarnings = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

      return {
        entries,
        totalEarnings,
        totalPaid,
        pendingEarnings
      };
    } catch (error) {
      console.error('Error getting earnings history:', error);
      throw error;
    }
  }

  /**
   * Validate payout eligibility
   */
  static async validatePayoutEligibility(influencerId: string): Promise<PayoutEligibility> {
    try {
      // Get influencer
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(influencerId)
        .get();

      if (!influencerDoc.exists) {
        return {
          isEligible: false,
          amount: 0,
          reason: 'Influencer not found'
        };
      }

      const influencer = influencerDoc.data();

      // Check if payout info is complete
      if (!influencer?.payoutInfo?.isVerified) {
        return {
          isEligible: false,
          amount: 0,
          reason: 'Payout information not verified'
        };
      }

      // Get pending commissions
      const pendingCommissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', influencerId)
        .where('status', '==', 'pending')
        .get();

      const pendingAmount = pendingCommissionsSnapshot.docs
        .map(doc => doc.data() as Commission)
        .reduce((sum, c) => sum + c.amount, 0);

      // Check minimum threshold
      const minimumThreshold = influencer.payoutInfo.minimumThreshold || 50;
      
      if (pendingAmount < minimumThreshold) {
        return {
          isEligible: false,
          amount: pendingAmount,
          reason: `Amount below minimum threshold of ${minimumThreshold}`
        };
      }

      return {
        isEligible: true,
        amount: pendingAmount
      };
    } catch (error) {
      console.error('Error validating payout eligibility:', error);
      return {
        isEligible: false,
        amount: 0,
        reason: 'Validation failed'
      };
    }
  }

  /**
   * Get current commission rates
   */
  private static async getCurrentCommissionRates(): Promise<CommissionRates> {
    try {
      const snapshot = await adminDb
        .collection(this.COMMISSION_RATES_COLLECTION)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Return default rates
        return {
          miniInfluencerRate: 5,
          motherInfluencerRate: 2
        };
      }

      return snapshot.docs[0].data() as CommissionRates;
    } catch (error) {
      console.error('Error getting current commission rates:', error);
      // Return default rates on error
      return {
        miniInfluencerRate: 5,
        motherInfluencerRate: 2
      };
    }
  }

  /**
   * Get applicable commission rates based on activity context (category/campaign)
   * Requirements: 5.5
   */
  private static async getApplicableCommissionRates(activity: Activity): Promise<CommissionRates> {
    try {
      const baseRates = await this.getCurrentCommissionRates();
      
      // Check for campaign-specific rates
      if (activity.metadata.campaignId && baseRates.campaignRates?.[activity.metadata.campaignId]) {
        return baseRates.campaignRates[activity.metadata.campaignId];
      }

      // Check for category-specific rates (if productId maps to a category)
      if (activity.metadata.productId) {
        const category = await this.getProductCategory(activity.metadata.productId);
        if (category && baseRates.categoryRates?.[category]) {
          return baseRates.categoryRates[category];
        }
      }

      // Return base rates if no specific rates found
      return {
        miniInfluencerRate: baseRates.miniInfluencerRate,
        motherInfluencerRate: baseRates.motherInfluencerRate
      };
    } catch (error) {
      console.error('Error getting applicable commission rates:', error);
      // Fallback to base rates
      return await this.getCurrentCommissionRates();
    }
  }

  /**
   * Get product category for category-specific commission rates
   * Requirements: 5.5
   */
  private static async getProductCategory(productId: string): Promise<string | null> {
    try {
      // This would typically query a products collection to get the category
      // For now, we'll return null to use base rates
      // In a real implementation, this would look up the product and return its category
      const productDoc = await adminDb
        .collection('products')
        .doc(productId)
        .get();

      if (productDoc.exists) {
        const productData = productDoc.data();
        return productData?.category || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting product category:', error);
      return null;
    }
  }

  /**
   * Get historical commission rates for a specific date
   * Requirements: 5.4
   */
  static async getHistoricalCommissionRates(date: Date): Promise<CommissionRates> {
    try {
      const snapshot = await adminDb
        .collection(this.COMMISSION_RATES_COLLECTION)
        .where('createdAt', '<=', Timestamp.fromDate(date))
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Return default rates if no historical rates found
        return {
          miniInfluencerRate: 5,
          motherInfluencerRate: 2
        };
      }

      return snapshot.docs[0].data() as CommissionRates;
    } catch (error) {
      console.error('Error getting historical commission rates:', error);
      // Return default rates on error
      return {
        miniInfluencerRate: 5,
        motherInfluencerRate: 2
      };
    }
  }

  /**
   * Recalculate historical commissions with preserved rates
   * Requirements: 5.4
   */
  static async recalculateHistoricalCommissions(activityId: string): Promise<Commission[]> {
    try {
      // Get the original activity
      const activityDoc = await adminDb
        .collection('hierarchical_activities')
        .doc(activityId)
        .get();

      if (!activityDoc.exists) {
        throw new Error('Activity not found');
      }

      const activity = activityDoc.data() as Activity;
      
      // Get the commission rates that were active at the time of the activity
      const historicalRates = await this.getHistoricalCommissionRates(activity.timestamp.toDate());
      
      // Recalculate commissions using historical rates
      const amount = activity.metadata.amount;
      if (!amount || amount <= 0) {
        return [];
      }

      // Get the influencer who generated this activity
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(activity.influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw new Error('Influencer not found');
      }

      const influencer = influencerDoc.data();
      const commissions: Commission[] = [];

      if (influencer?.type === 'mini') {
        // Mini Influencer commission with historical rates
        const miniCommissionAmount = (amount * historicalRates.miniInfluencerRate) / 100;
        
        const miniCommission: Commission = {
          id: `${activity.id}_mini_historical`,
          activityId: activity.id,
          motherInfluencerId: influencer.parentInfluencerId,
          miniInfluencerId: activity.influencerId,
          amount: miniCommissionAmount,
          currency: activity.metadata.currency || 'USD',
          rate: historicalRates.miniInfluencerRate,
          type: 'direct',
          status: 'pending',
          createdAt: activity.timestamp // Preserve original timestamp
        };

        commissions.push(miniCommission);

        // Mother Influencer commission (indirect) with historical rates
        if (influencer.parentInfluencerId) {
          const motherCommissionAmount = (amount * historicalRates.motherInfluencerRate) / 100;
          
          const motherCommission: Commission = {
            id: `${activity.id}_mother_historical`,
            activityId: activity.id,
            motherInfluencerId: influencer.parentInfluencerId,
            miniInfluencerId: activity.influencerId,
            amount: motherCommissionAmount,
            currency: activity.metadata.currency || 'USD',
            rate: historicalRates.motherInfluencerRate,
            type: 'indirect',
            status: 'pending',
            createdAt: activity.timestamp // Preserve original timestamp
          };

          commissions.push(motherCommission);
        }
      }

      return commissions;
    } catch (error) {
      console.error('Error recalculating historical commissions:', error);
      throw {
        code: HierarchicalReferralErrorCode.COMMISSION_CALCULATION_ERROR,
        message: 'Failed to recalculate historical commissions',
        details: error
      };
    }
  }

  /**
   * Execute payout (placeholder for payment provider integration)
   */
  private static async executePayout(influencerId: string, amount: number): Promise<PayoutResult> {
    try {
      // This would integrate with Stripe Connect or other payment provider
      // For now, we'll simulate a successful payout
      
      const transactionId = `payout_${Date.now()}_${influencerId}`;
      
      // Update commission statuses to 'paid'
      const pendingCommissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', influencerId)
        .where('status', '==', 'pending')
        .get();

      const batch = adminDb.batch();
      
      pendingCommissionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'paid',
          paidAt: Timestamp.now()
        });
      });

      await batch.commit();

      // Record payout
      const payoutRecord = {
        influencerId,
        amount,
        transactionId,
        status: 'success',
        processedAt: Timestamp.now()
      };

      await adminDb
        .collection(this.PAYOUTS_COLLECTION)
        .doc(transactionId)
        .set(payoutRecord);

      return {
        influencerId,
        amount,
        status: 'success',
        transactionId,
        processedAt: Timestamp.now()
      };
    } catch (error) {
      console.error('Error executing payout:', error);
      return {
        influencerId,
        amount,
        status: 'failed',
        error: 'Payout execution failed',
        processedAt: Timestamp.now()
      };
    }
  }
}