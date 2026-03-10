import { 
  PayoutResult, 
  HierarchicalReferralErrorCode
} from '../../../types/hierarchical-referral';
import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { HierarchicalPayoutService } from './payout-service';

/**
 * PayoutRetryService - Service for handling payout retries with exponential backoff
 * Requirements: 8.4, 8.5
 */
export class HierarchicalPayoutRetryService {
  private static readonly PAYOUT_QUEUE_COLLECTION = 'hierarchical_payout_queue';
  private static readonly AUDIT_LOGS_COLLECTION = 'hierarchical_audit_logs';
  private static readonly ADMIN_NOTIFICATIONS_COLLECTION = 'hierarchical_admin_notifications';

  // Retry configuration
  private static readonly MAX_RETRY_ATTEMPTS = 5;
  private static readonly BASE_DELAY_MS = 1000; // 1 second
  private static readonly MAX_DELAY_MS = 300000; // 5 minutes
  private static readonly EXPONENTIAL_BASE = 2;

  /**
   * Add failed payout to retry queue
   * Requirements: 8.4
   */
  static async addToRetryQueue(
    influencerId: string, 
    amount: number, 
    error: string,
    originalTransactionId?: string
  ): Promise<void> {
    try {
      const queueItem = {
        influencerId,
        amount,
        error,
        originalTransactionId,
        attempts: 0,
        maxAttempts: this.MAX_RETRY_ATTEMPTS,
        nextRetryAt: Timestamp.fromDate(new Date(Date.now() + this.BASE_DELAY_MS)),
        createdAt: Timestamp.now(),
        status: 'queued',
        lastError: error
      };

      await adminDb
        .collection(this.PAYOUT_QUEUE_COLLECTION)
        .add(queueItem);

      console.log(`Added payout retry for influencer ${influencerId} to queue`);

      // Log the retry queue addition
      await this.logRetryEvent(influencerId, 'added_to_queue', {
        amount,
        error,
        nextRetryAt: queueItem.nextRetryAt.toDate()
      });

    } catch (error) {
      console.error('Error adding payout to retry queue:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to add payout to retry queue',
        details: error
      };
    }
  }

  /**
   * Process retry queue with exponential backoff
   * Requirements: 8.4
   */
  static async processRetryQueue(): Promise<PayoutResult[]> {
    try {
      console.log('Processing payout retry queue...');

      // Get items ready for retry
      const now = Timestamp.now();
      const queueSnapshot = await adminDb
        .collection(this.PAYOUT_QUEUE_COLLECTION)
        .where('status', '==', 'queued')
        .where('nextRetryAt', '<=', now)
        .where('attempts', '<', this.MAX_RETRY_ATTEMPTS)
        .limit(10) // Process in batches
        .get();

      if (queueSnapshot.empty) {
        console.log('No items in retry queue ready for processing');
        return [];
      }

      const results: PayoutResult[] = [];

      for (const doc of queueSnapshot.docs) {
        const queueItem = doc.data();
        
        try {
          // Update attempt count and status
          await doc.ref.update({
            attempts: queueItem.attempts + 1,
            status: 'processing',
            lastAttemptAt: Timestamp.now()
          });

          // Attempt the payout
          const payoutResults = await HierarchicalPayoutService.processPayouts([queueItem.influencerId]);
          const payoutResult = payoutResults[0];

          if (payoutResult.status === 'success') {
            // Success - remove from queue
            await doc.ref.update({
              status: 'completed',
              completedAt: Timestamp.now(),
              finalResult: payoutResult
            });

            results.push(payoutResult);

            // Log successful retry
            await this.logRetryEvent(queueItem.influencerId, 'retry_success', {
              attempt: queueItem.attempts + 1,
              amount: payoutResult.amount,
              transactionId: payoutResult.transactionId
            });

            console.log(`Retry successful for influencer ${queueItem.influencerId} on attempt ${queueItem.attempts + 1}`);

          } else {
            // Failed - schedule next retry or mark as permanently failed
            await this.handleRetryFailure(doc, queueItem, payoutResult.error || 'Unknown error');
            results.push(payoutResult);
          }

        } catch (error: any) {
          console.error(`Error processing retry for influencer ${queueItem.influencerId}:`, error);
          await this.handleRetryFailure(doc, queueItem, error.message);
          
          results.push({
            influencerId: queueItem.influencerId,
            amount: 0,
            status: 'failed',
            error: error.message,
            processedAt: Timestamp.now()
          });
        }
      }

      console.log(`Processed ${results.length} retry attempts`);
      return results;

    } catch (error) {
      console.error('Error processing retry queue:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to process retry queue',
        details: error
      };
    }
  }

  /**
   * Handle retry failure with exponential backoff
   * Requirements: 8.4
   */
  private static async handleRetryFailure(
    doc: FirebaseFirestore.QueryDocumentSnapshot,
    queueItem: any,
    error: string
  ): Promise<void> {
    try {
      const newAttempts = queueItem.attempts + 1;

      if (newAttempts >= this.MAX_RETRY_ATTEMPTS) {
        // Max attempts reached - mark as permanently failed
        await doc.ref.update({
          status: 'permanently_failed',
          failedAt: Timestamp.now(),
          lastError: error,
          attempts: newAttempts
        });

        // Notify admin of persistent failure
        await this.notifyAdminOfPersistentFailure(queueItem.influencerId, queueItem.amount, error, newAttempts);

        // Log permanent failure
        await this.logRetryEvent(queueItem.influencerId, 'permanent_failure', {
          attempts: newAttempts,
          error,
          amount: queueItem.amount
        });

        console.log(`Payout permanently failed for influencer ${queueItem.influencerId} after ${newAttempts} attempts`);

      } else {
        // Calculate next retry time with exponential backoff
        const delay = Math.min(
          this.BASE_DELAY_MS * Math.pow(this.EXPONENTIAL_BASE, newAttempts - 1),
          this.MAX_DELAY_MS
        );
        
        const nextRetryAt = Timestamp.fromDate(new Date(Date.now() + delay));

        await doc.ref.update({
          status: 'queued',
          attempts: newAttempts,
          lastError: error,
          nextRetryAt,
          lastFailedAt: Timestamp.now()
        });

        // Log retry scheduled
        await this.logRetryEvent(queueItem.influencerId, 'retry_scheduled', {
          attempt: newAttempts,
          error,
          nextRetryAt: nextRetryAt.toDate(),
          delayMs: delay
        });

        console.log(`Scheduled retry ${newAttempts} for influencer ${queueItem.influencerId} in ${delay}ms`);
      }

    } catch (error) {
      console.error('Error handling retry failure:', error);
    }
  }

  /**
   * Notify admin of persistent payout failures
   * Requirements: 8.4
   */
  private static async notifyAdminOfPersistentFailure(
    influencerId: string,
    amount: number,
    error: string,
    attempts: number
  ): Promise<void> {
    try {
      const notification = {
        type: 'persistent_payout_failure',
        priority: 'high',
        influencerId,
        data: {
          amount,
          error,
          attempts,
          maxAttempts: this.MAX_RETRY_ATTEMPTS
        },
        message: `Payout of $${amount.toFixed(2)} for influencer ${influencerId} has failed ${attempts} times. Manual intervention required.`,
        createdAt: Timestamp.now(),
        acknowledged: false,
        actionRequired: true
      };

      await adminDb
        .collection(this.ADMIN_NOTIFICATIONS_COLLECTION)
        .add(notification);

      console.log(`Admin notification created for persistent payout failure: influencer ${influencerId}`);

    } catch (error) {
      console.error('Error notifying admin of persistent failure:', error);
    }
  }

  /**
   * Get retry queue status
   * Requirements: 8.5
   */
  static async getRetryQueueStatus(): Promise<{
    queued: number;
    processing: number;
    completed: number;
    permanentlyFailed: number;
    totalAmount: number;
  }> {
    try {
      const queueSnapshot = await adminDb
        .collection(this.PAYOUT_QUEUE_COLLECTION)
        .get();

      const items = queueSnapshot.docs.map(doc => doc.data());

      const queued = items.filter(item => item.status === 'queued').length;
      const processing = items.filter(item => item.status === 'processing').length;
      const completed = items.filter(item => item.status === 'completed').length;
      const permanentlyFailed = items.filter(item => item.status === 'permanently_failed').length;
      const totalAmount = items
        .filter(item => item.status === 'queued' || item.status === 'processing')
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        queued,
        processing,
        completed,
        permanentlyFailed,
        totalAmount
      };

    } catch (error) {
      console.error('Error getting retry queue status:', error);
      return {
        queued: 0,
        processing: 0,
        completed: 0,
        permanentlyFailed: 0,
        totalAmount: 0
      };
    }
  }

  /**
   * Get failed payouts requiring admin attention
   * Requirements: 8.4
   */
  static async getFailedPayoutsForAdmin(limit: number = 20): Promise<any[]> {
    try {
      const failedPayoutsSnapshot = await adminDb
        .collection(this.PAYOUT_QUEUE_COLLECTION)
        .where('status', '==', 'permanently_failed')
        .orderBy('failedAt', 'desc')
        .limit(limit)
        .get();

      return failedPayoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        failedAt: doc.data().failedAt?.toDate(),
        lastAttemptAt: doc.data().lastAttemptAt?.toDate()
      }));

    } catch (error) {
      console.error('Error getting failed payouts for admin:', error);
      return [];
    }
  }

  /**
   * Manually retry a permanently failed payout (admin action)
   * Requirements: 8.4
   */
  static async manualRetry(queueItemId: string, adminUserId: string): Promise<PayoutResult> {
    try {
      const queueItemDoc = await adminDb
        .collection(this.PAYOUT_QUEUE_COLLECTION)
        .doc(queueItemId)
        .get();

      if (!queueItemDoc.exists) {
        throw new Error('Queue item not found');
      }

      const queueItem = queueItemDoc.data();

      if (queueItem?.status !== 'permanently_failed') {
        throw new Error('Can only manually retry permanently failed payouts');
      }

      // Reset the queue item for manual retry
      await queueItemDoc.ref.update({
        status: 'queued',
        attempts: 0,
        nextRetryAt: Timestamp.now(),
        manualRetryBy: adminUserId,
        manualRetryAt: Timestamp.now(),
        lastError: null
      });

      // Log manual retry initiation
      await this.logRetryEvent(queueItem.influencerId, 'manual_retry_initiated', {
        adminUserId,
        originalFailureReason: queueItem.lastError,
        originalAttempts: queueItem.attempts
      });

      // Process the retry immediately
      const payoutResults = await HierarchicalPayoutService.processPayouts([queueItem.influencerId]);
      const result = payoutResults[0];

      if (result.status === 'success') {
        await queueItemDoc.ref.update({
          status: 'completed',
          completedAt: Timestamp.now(),
          finalResult: result
        });
      }

      return result;

    } catch (error: any) {
      console.error('Error in manual retry:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Manual retry failed',
        details: error
      };
    }
  }

  /**
   * Clean up old completed and failed queue items
   * Requirements: 8.5
   */
  static async cleanupOldQueueItems(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldItemsSnapshot = await adminDb
        .collection(this.PAYOUT_QUEUE_COLLECTION)
        .where('status', 'in', ['completed', 'permanently_failed'])
        .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
        .limit(100) // Process in batches
        .get();

      if (oldItemsSnapshot.empty) {
        return 0;
      }

      const batch = adminDb.batch();
      oldItemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Cleaned up ${oldItemsSnapshot.docs.length} old queue items`);
      return oldItemsSnapshot.docs.length;

    } catch (error) {
      console.error('Error cleaning up old queue items:', error);
      return 0;
    }
  }

  /**
   * Log retry events for audit trail
   * Requirements: 8.5
   */
  private static async logRetryEvent(
    influencerId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      const auditLog = {
        type: 'payout_retry_event',
        eventType,
        influencerId,
        data: eventData,
        timestamp: Timestamp.now(),
        source: 'payout_retry_service'
      };

      await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .add(auditLog);

    } catch (error) {
      console.error('Error logging retry event:', error);
      // Don't throw error as audit logging failure shouldn't fail the retry process
    }
  }

  /**
   * Get retry statistics for monitoring
   * Requirements: 8.5
   */
  static async getRetryStatistics(period?: { start: Date; end: Date }): Promise<{
    totalRetries: number;
    successfulRetries: number;
    permanentFailures: number;
    averageAttemptsToSuccess: number;
    commonFailureReasons: { reason: string; count: number }[];
  }> {
    try {
      let query = adminDb.collection(this.PAYOUT_QUEUE_COLLECTION);

      if (period) {
        query = query
          .where('createdAt', '>=', Timestamp.fromDate(period.start))
          .where('createdAt', '<=', Timestamp.fromDate(period.end));
      }

      const queueSnapshot = await query.get();
      const items = queueSnapshot.docs.map(doc => doc.data());

      const totalRetries = items.length;
      const successfulRetries = items.filter(item => item.status === 'completed').length;
      const permanentFailures = items.filter(item => item.status === 'permanently_failed').length;

      // Calculate average attempts to success
      const successfulItems = items.filter(item => item.status === 'completed');
      const averageAttemptsToSuccess = successfulItems.length > 0
        ? successfulItems.reduce((sum, item) => sum + item.attempts, 0) / successfulItems.length
        : 0;

      // Get common failure reasons
      const failureReasons: { [key: string]: number } = {};
      items.filter(item => item.lastError).forEach(item => {
        const reason = item.lastError;
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      });

      const commonFailureReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalRetries,
        successfulRetries,
        permanentFailures,
        averageAttemptsToSuccess,
        commonFailureReasons
      };

    } catch (error) {
      console.error('Error getting retry statistics:', error);
      return {
        totalRetries: 0,
        successfulRetries: 0,
        permanentFailures: 0,
        averageAttemptsToSuccess: 0,
        commonFailureReasons: []
      };
    }
  }
}