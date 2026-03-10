import { 
  PayoutResult, 
  PayoutEligibility, 
  Influencer,
  Commission,
  HierarchicalReferralErrorCode
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { validatePayoutAmount } from '../utils/validation';

/**
 * PayoutService - Service for automated payout processing
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */
export class HierarchicalPayoutService {
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';
  private static readonly COMMISSIONS_COLLECTION = 'hierarchical_commissions';
  private static readonly PAYOUTS_COLLECTION = 'hierarchical_payouts';
  private static readonly PAYOUT_QUEUE_COLLECTION = 'hierarchical_payout_queue';
  private static readonly AUDIT_LOGS_COLLECTION = 'hierarchical_audit_logs';

  // Payout configuration
  private static readonly DEFAULT_MINIMUM_THRESHOLD = 50;
  private static readonly STRIPE_FEE_PERCENTAGE = 2.9; // 2.9% + $0.30
  private static readonly STRIPE_FIXED_FEE = 0.30;
  private static readonly MAX_RETRY_ATTEMPTS = 5;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

  /**
   * Process threshold-based payout triggers
   * Requirements: 8.1
   */
  static async processThresholdBasedPayouts(): Promise<PayoutResult[]> {
    try {
      console.log('Starting threshold-based payout processing...');
      
      // Get all active influencers
      const influencersSnapshot = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .where('status', '==', 'active')
        .get();

      const eligibleInfluencers: string[] = [];

      // Check each influencer for payout eligibility
      for (const doc of influencersSnapshot.docs) {
        const influencer = doc.data() as Influencer;
        const eligibility = await this.checkPayoutEligibility(influencer.id);
        
        if (eligibility.isEligible) {
          eligibleInfluencers.push(influencer.id);
          console.log(`Influencer ${influencer.id} eligible for payout: $${eligibility.amount}`);
        }
      }

      if (eligibleInfluencers.length === 0) {
        console.log('No influencers eligible for payout');
        return [];
      }

      // Process payouts for eligible influencers
      const results = await this.processPayouts(eligibleInfluencers);
      
      console.log(`Processed ${results.length} payouts`);
      return results;
    } catch (error) {
      console.error('Error in threshold-based payout processing:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to process threshold-based payouts',
        details: error
      };
    }
  }

  /**
   * Check payout eligibility for an influencer
   * Requirements: 8.1
   */
  static async checkPayoutEligibility(influencerId: string): Promise<PayoutEligibility> {
    try {
      // Get influencer data
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

      const influencer = influencerDoc.data() as Influencer;

      // Check if influencer is active
      if (influencer.status !== 'active') {
        return {
          isEligible: false,
          amount: 0,
          reason: 'Influencer account is not active'
        };
      }

      // Check if payout information is verified
      if (!influencer.payoutInfo?.isVerified) {
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
        .where('status', '==', 'approved')
        .get();

      const pendingCommissions = pendingCommissionsSnapshot.docs.map(doc => doc.data() as Commission);
      const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

      // Check minimum threshold
      const minimumThreshold = influencer.payoutInfo.minimumThreshold || this.DEFAULT_MINIMUM_THRESHOLD;
      
      if (pendingAmount < minimumThreshold) {
        return {
          isEligible: false,
          amount: pendingAmount,
          reason: `Amount $${pendingAmount.toFixed(2)} below minimum threshold of $${minimumThreshold}`
        };
      }

      // Check for recent failed payouts (cooling off period)
      const recentFailedPayout = await this.getRecentFailedPayout(influencerId);
      if (recentFailedPayout) {
        const coolOffPeriod = 24 * 60 * 60 * 1000; // 24 hours
        const nextEligibleTime = new Date(recentFailedPayout.processedAt.toDate().getTime() + coolOffPeriod);
        
        if (new Date() < nextEligibleTime) {
          return {
            isEligible: false,
            amount: pendingAmount,
            reason: 'Recent payout failure - cooling off period active',
            nextEligibleDate: Timestamp.fromDate(nextEligibleTime)
          };
        }
      }

      return {
        isEligible: true,
        amount: pendingAmount
      };
    } catch (error) {
      console.error('Error checking payout eligibility:', error);
      return {
        isEligible: false,
        amount: 0,
        reason: 'Eligibility check failed'
      };
    }
  }

  /**
   * Process payouts for multiple influencers
   * Requirements: 8.1, 8.2
   */
  static async processPayouts(influencerIds: string[]): Promise<PayoutResult[]> {
    try {
      const results: PayoutResult[] = [];

      for (const influencerId of influencerIds) {
        try {
          // Double-check eligibility before processing
          const eligibility = await this.checkPayoutEligibility(influencerId);
          
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

          // Calculate final payout amount with fees
          const finalAmount = await this.calculatePayoutAmount(influencerId, eligibility.amount);
          
          // Execute the payout
          const payoutResult = await this.executePayout(influencerId, finalAmount);
          results.push(payoutResult);

          // Send notification (will be handled by notification service)
          await this.triggerPayoutNotification(influencerId, payoutResult);

        } catch (error: any) {
          console.error(`Error processing payout for influencer ${influencerId}:`, error);
          results.push({
            influencerId,
            amount: 0,
            status: 'failed',
            error: error.message || 'Payout processing failed',
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
   * Calculate final payout amount including fees and adjustments
   * Requirements: 8.2
   */
  static async calculatePayoutAmount(influencerId: string, grossAmount: number): Promise<{
    grossAmount: number;
    fees: number;
    adjustments: number;
    netAmount: number;
  }> {
    try {
      // Validate amount
      const validationError = validatePayoutAmount(grossAmount);
      if (validationError) {
        throw validationError;
      }

      // Calculate Stripe fees (2.9% + $0.30)
      const percentageFee = (grossAmount * this.STRIPE_FEE_PERCENTAGE) / 100;
      const totalFees = percentageFee + this.STRIPE_FIXED_FEE;

      // Check for any adjustments (bonuses, penalties, etc.)
      const adjustments = await this.getPayoutAdjustments(influencerId);
      
      // Calculate net amount
      const netAmount = grossAmount - totalFees + adjustments;

      // Ensure net amount is positive
      if (netAmount <= 0) {
        throw new Error('Net payout amount must be positive after fees and adjustments');
      }

      return {
        grossAmount,
        fees: totalFees,
        adjustments,
        netAmount
      };
    } catch (error) {
      console.error('Error calculating payout amount:', error);
      throw error;
    }
  }

  /**
   * Execute payout with Stripe Connect integration
   * Requirements: 8.2
   */
  private static async executePayout(influencerId: string, payoutDetails: {
    grossAmount: number;
    fees: number;
    adjustments: number;
    netAmount: number;
  }): Promise<PayoutResult> {
    try {
      // Get influencer payout information
      const influencerDoc = await adminDb
        .collection(this.INFLUENCERS_COLLECTION)
        .doc(influencerId)
        .get();

      if (!influencerDoc.exists) {
        throw new Error('Influencer not found');
      }

      const influencer = influencerDoc.data() as Influencer;
      const stripeAccountId = influencer.payoutInfo?.stripeAccountId;

      if (!stripeAccountId) {
        throw new Error('Stripe account ID not found');
      }

      // Generate transaction ID
      const transactionId = `payout_${Date.now()}_${influencerId}`;

      // TODO: Integrate with Stripe Connect
      // For now, we'll simulate the payout process
      const stripePayoutResult = await this.processStripeConnect(
        stripeAccountId,
        payoutDetails.netAmount,
        influencer.payoutInfo.currency || 'USD',
        transactionId
      );

      if (!stripePayoutResult.success) {
        throw new Error(stripePayoutResult.error || 'Stripe payout failed');
      }

      // Update commission statuses to 'paid'
      await this.markCommissionsAsPaid(influencerId, transactionId);

      // Record payout in database
      const payoutRecord = {
        influencerId,
        transactionId,
        stripePayoutId: stripePayoutResult.stripePayoutId,
        grossAmount: payoutDetails.grossAmount,
        fees: payoutDetails.fees,
        adjustments: payoutDetails.adjustments,
        netAmount: payoutDetails.netAmount,
        currency: influencer.payoutInfo.currency || 'USD',
        status: 'success',
        processedAt: Timestamp.now(),
        stripeAccountId,
        metadata: {
          commissionCount: await this.getCommissionCount(influencerId),
          processingMethod: 'stripe_connect'
        }
      };

      await adminDb
        .collection(this.PAYOUTS_COLLECTION)
        .doc(transactionId)
        .set(payoutRecord);

      // Update influencer's total earnings
      await this.updateInfluencerEarnings(influencerId, payoutDetails.netAmount);

      // Log successful payout
      await this.logPayoutEvent(influencerId, 'payout_success', payoutRecord);

      return {
        influencerId,
        amount: payoutDetails.netAmount,
        status: 'success',
        transactionId,
        processedAt: Timestamp.now()
      };

    } catch (error: any) {
      console.error(`Error executing payout for ${influencerId}:`, error);

      // Log failed payout
      await this.logPayoutEvent(influencerId, 'payout_failed', { error: error.message });

      return {
        influencerId,
        amount: 0,
        status: 'failed',
        error: error.message,
        processedAt: Timestamp.now()
      };
    }
  }

  /**
   * Process Stripe Connect payout (placeholder for actual Stripe integration)
   * Requirements: 8.2
   */
  private static async processStripeConnect(
    stripeAccountId: string,
    amount: number,
    currency: string,
    transactionId: string
  ): Promise<{ success: boolean; stripePayoutId?: string; error?: string }> {
    try {
      // TODO: Replace with actual Stripe Connect integration
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // 
      // const payout = await stripe.transfers.create({
      //   amount: Math.round(amount * 100), // Convert to cents
      //   currency: currency.toLowerCase(),
      //   destination: stripeAccountId,
      //   transfer_group: transactionId,
      // });
      // 
      // return {
      //   success: true,
      //   stripePayoutId: payout.id
      // };

      // Simulate successful payout for now
      console.log(`Simulating Stripe payout: $${amount} to account ${stripeAccountId}`);
      
      return {
        success: true,
        stripePayoutId: `tr_simulated_${Date.now()}`
      };

    } catch (error: any) {
      console.error('Stripe Connect payout failed:', error);
      return {
        success: false,
        error: error.message || 'Stripe payout failed'
      };
    }
  }

  /**
   * Mark commissions as paid
   * Requirements: 8.5
   */
  private static async markCommissionsAsPaid(influencerId: string, transactionId: string): Promise<void> {
    try {
      const pendingCommissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', influencerId)
        .where('status', '==', 'approved')
        .get();

      const batch = adminDb.batch();
      
      pendingCommissionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'paid',
          paidAt: Timestamp.now(),
          payoutTransactionId: transactionId
        });
      });

      await batch.commit();
      console.log(`Marked ${pendingCommissionsSnapshot.docs.length} commissions as paid for influencer ${influencerId}`);
    } catch (error) {
      console.error('Error marking commissions as paid:', error);
      throw error;
    }
  }

  /**
   * Get payout adjustments (bonuses, penalties, etc.)
   * Requirements: 8.2
   */
  private static async getPayoutAdjustments(influencerId: string): Promise<number> {
    try {
      // Check for any pending adjustments
      const adjustmentsSnapshot = await adminDb
        .collection('hierarchical_payout_adjustments')
        .where('influencerId', '==', influencerId)
        .where('status', '==', 'pending')
        .get();

      let totalAdjustments = 0;
      const batch = adminDb.batch();

      adjustmentsSnapshot.docs.forEach(doc => {
        const adjustment = doc.data();
        totalAdjustments += adjustment.amount;
        
        // Mark adjustment as applied
        batch.update(doc.ref, {
          status: 'applied',
          appliedAt: Timestamp.now()
        });
      });

      if (adjustmentsSnapshot.docs.length > 0) {
        await batch.commit();
        console.log(`Applied ${adjustmentsSnapshot.docs.length} adjustments totaling $${totalAdjustments} for influencer ${influencerId}`);
      }

      return totalAdjustments;
    } catch (error) {
      console.error('Error getting payout adjustments:', error);
      return 0; // Return 0 if unable to get adjustments
    }
  }

  /**
   * Update influencer's total earnings
   * Requirements: 8.5
   */
  private static async updateInfluencerEarnings(influencerId: string, amount: number): Promise<void> {
    try {
      const influencerRef = adminDb.collection(this.INFLUENCERS_COLLECTION).doc(influencerId);
      
      await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(influencerRef);
        if (!doc.exists) {
          throw new Error('Influencer not found');
        }

        const currentEarnings = doc.data()?.totalEarnings || 0;
        transaction.update(influencerRef, {
          totalEarnings: currentEarnings + amount,
          updatedAt: Timestamp.now()
        });
      });
    } catch (error) {
      console.error('Error updating influencer earnings:', error);
      throw error;
    }
  }

  /**
   * Get commission count for an influencer
   * Requirements: 8.5
   */
  private static async getCommissionCount(influencerId: string): Promise<number> {
    try {
      const commissionsSnapshot = await adminDb
        .collection(this.COMMISSIONS_COLLECTION)
        .where('motherInfluencerId', '==', influencerId)
        .where('status', '==', 'approved')
        .get();

      return commissionsSnapshot.docs.length;
    } catch (error) {
      console.error('Error getting commission count:', error);
      return 0;
    }
  }

  /**
   * Get recent failed payout for cooling off period
   * Requirements: 8.4
   */
  private static async getRecentFailedPayout(influencerId: string): Promise<any | null> {
    try {
      const failedPayoutsSnapshot = await adminDb
        .collection(this.PAYOUTS_COLLECTION)
        .where('influencerId', '==', influencerId)
        .where('status', '==', 'failed')
        .orderBy('processedAt', 'desc')
        .limit(1)
        .get();

      if (failedPayoutsSnapshot.empty) {
        return null;
      }

      return failedPayoutsSnapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting recent failed payout:', error);
      return null;
    }
  }

  /**
   * Trigger payout notification
   * Requirements: 8.3
   */
  private static async triggerPayoutNotification(influencerId: string, payoutResult: PayoutResult): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { HierarchicalNotificationService } = await import('./notification-service');
      
      // Handle payout event through notification service
      await HierarchicalNotificationService.handlePayoutEvent(payoutResult);

      console.log(`Payout notification triggered for influencer ${influencerId}`);
    } catch (error) {
      console.error('Error triggering payout notification:', error);
      // Don't throw error as notification failure shouldn't fail the payout
    }
  }

  /**
   * Log payout events for audit trail
   * Requirements: 8.5
   */
  private static async logPayoutEvent(
    influencerId: string, 
    eventType: string, 
    eventData: any
  ): Promise<void> {
    try {
      const auditLog = {
        type: 'payout_event',
        eventType,
        influencerId,
        data: eventData,
        timestamp: Timestamp.now(),
        source: 'payout_service'
      };

      await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .add(auditLog);
    } catch (error) {
      console.error('Error logging payout event:', error);
      // Don't throw error as audit logging failure shouldn't fail the payout
    }
  }

  /**
   * Get payout history for an influencer
   * Requirements: 8.5
   */
  static async getPayoutHistory(influencerId: string, limit: number = 20): Promise<any[]> {
    try {
      const payoutsSnapshot = await adminDb
        .collection(this.PAYOUTS_COLLECTION)
        .where('influencerId', '==', influencerId)
        .orderBy('processedAt', 'desc')
        .limit(limit)
        .get();

      return payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        processedAt: doc.data().processedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting payout history:', error);
      return [];
    }
  }

  /**
   * Get system-wide payout statistics
   * Requirements: 8.5
   */
  static async getPayoutStatistics(period?: { start: Date; end: Date }): Promise<{
    totalPayouts: number;
    totalAmount: number;
    successfulPayouts: number;
    failedPayouts: number;
    averagePayoutAmount: number;
  }> {
    try {
      let query = adminDb.collection(this.PAYOUTS_COLLECTION);

      if (period) {
        query = query
          .where('processedAt', '>=', Timestamp.fromDate(period.start))
          .where('processedAt', '<=', Timestamp.fromDate(period.end));
      }

      const payoutsSnapshot = await query.get();
      const payouts = payoutsSnapshot.docs.map(doc => doc.data());

      const totalPayouts = payouts.length;
      const totalAmount = payouts.reduce((sum, p) => sum + (p.netAmount || 0), 0);
      const successfulPayouts = payouts.filter(p => p.status === 'success').length;
      const failedPayouts = payouts.filter(p => p.status === 'failed').length;
      const averagePayoutAmount = totalPayouts > 0 ? totalAmount / successfulPayouts : 0;

      return {
        totalPayouts,
        totalAmount,
        successfulPayouts,
        failedPayouts,
        averagePayoutAmount
      };
    } catch (error) {
      console.error('Error getting payout statistics:', error);
      return {
        totalPayouts: 0,
        totalAmount: 0,
        successfulPayouts: 0,
        failedPayouts: 0,
        averagePayoutAmount: 0
      };
    }
  }
}