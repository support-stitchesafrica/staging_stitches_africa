/**
 * Notification Queue Service
 * Handles queuing, retry logic, and error handling for failed notifications
 */

import { BaseVendorService } from './base-service';
import { ServiceResponse } from '@/types/vendor-analytics';
import { WaitlistNotificationService, WaitlistNotificationData } from './waitlist-notification-service';
import { db } from '@/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Queue item status
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'max_retries_exceeded';

// Queue item interface
export interface NotificationQueueItem {
  id: string;
  type: 'vendor_notification' | 'subscriber_confirmation' | 'both_notifications';
  data: WaitlistNotificationData;
  status: QueueStatus;
  attempts: number;
  maxRetries: number;
  nextRetryAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: {
    collectionId?: string;
    vendorId?: string;
    subscriberEmail?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class NotificationQueueService extends BaseVendorService {
  private notificationService: WaitlistNotificationService;
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000, // 1 second
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2
  };

  constructor() {
    super('NotificationQueueService');
    this.notificationService = new WaitlistNotificationService();
  }

  /**
   * Adds a notification to the queue
   */
  async queueNotification(
    type: NotificationQueueItem['type'],
    data: WaitlistNotificationData,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
      collectionId?: string;
      vendorId?: string;
    }
  ): Promise<ServiceResponse<string>> {
    return this.executeWithErrorHandling(async () => {
      this.validateRequired({ type, data });

      const queueItem = {
        type,
        data,
        status: 'pending' as QueueStatus,
        attempts: 0,
        maxRetries: options?.maxRetries || this.defaultRetryConfig.maxRetries,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          collectionId: options?.collectionId,
          vendorId: options?.vendorId,
          subscriberEmail: data.subscriberNotification?.subscriberEmail,
          priority: options?.priority || 'normal'
        }
      };

      const docRef = await addDoc(collection(db, 'notification_queue'), queueItem);

      this.log('info', 'Notification queued', {
        queueId: docRef.id,
        type,
        priority: options?.priority || 'normal'
      });

      return docRef.id;
    }, 'queueNotification');
  }

  /**
   * Processes pending notifications in the queue
   */
  async processQueue(batchSize: number = 10): Promise<ServiceResponse<{
    processed: number;
    successful: number;
    failed: number;
    retried: number;
  }>> {
    return this.executeWithErrorHandling(async () => {
      const stats = {
        processed: 0,
        successful: 0,
        failed: 0,
        retried: 0
      };

      // Get pending notifications, prioritizing high priority and older items
      const now = Timestamp.now();
      const pendingQuery = query(
        collection(db, 'notification_queue'),
        where('status', 'in', ['pending', 'failed']),
        orderBy('createdAt', 'asc'),
        firestoreLimit(batchSize)
      );

      const snapshot = await getDocs(pendingQuery);
      
      if (snapshot.empty) {
        this.log('info', 'No pending notifications to process');
        return stats;
      }

      // Filter items that are ready for processing (no nextRetryAt or nextRetryAt <= now)
      const readyItems = snapshot.docs.filter(doc => {
        const data = doc.data();
        const nextRetryAt = data.nextRetryAt;
        return !nextRetryAt || nextRetryAt.toMillis() <= now.toMillis();
      });

      // Process each notification
      for (const docSnap of readyItems) {
        const queueItem = this.parseQueueItem(docSnap.id, docSnap.data());
        stats.processed++;

        try {
          await this.processQueueItem(queueItem);
          stats.successful++;
        } catch (error) {
          stats.failed++;
          this.log('warn', 'Failed to process queue item', {
            queueId: queueItem.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      this.log('info', 'Queue processing completed', stats);
      return stats;
    }, 'processQueue');
  }

  /**
   * Processes a single queue item
   */
  private async processQueueItem(queueItem: NotificationQueueItem): Promise<void> {
    const queueRef = doc(db, 'notification_queue', queueItem.id);

    try {
      // Mark as processing
      await updateDoc(queueRef, {
        status: 'processing',
        updatedAt: serverTimestamp()
      });

      // Attempt to send notification
      let success = false;
      let error: string | undefined;

      switch (queueItem.type) {
        case 'vendor_notification':
          if (queueItem.data.vendorNotification) {
            const result = await this.notificationService.sendVendorNotification(
              queueItem.data.vendorNotification
            );
            success = result.success;
            error = result.error;
          }
          break;

        case 'subscriber_confirmation':
          if (queueItem.data.subscriberNotification) {
            const result = await this.notificationService.sendSubscriberConfirmation(
              queueItem.data.subscriberNotification
            );
            success = result.success;
            error = result.error;
          }
          break;

        case 'both_notifications':
          const result = await this.notificationService.sendBothNotifications(queueItem.data);
          success = result.success && result.data?.vendorSent && result.data?.subscriberSent;
          error = result.error;
          break;

        default:
          throw new Error(`Unknown notification type: ${queueItem.type}`);
      }

      if (success) {
        // Mark as completed
        await updateDoc(queueRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        this.log('info', 'Notification sent successfully', {
          queueId: queueItem.id,
          type: queueItem.type,
          attempts: queueItem.attempts + 1
        });
      } else {
        // Handle failure
        await this.handleFailure(queueItem, error || 'Unknown error');
      }
    } catch (error) {
      // Handle unexpected errors
      await this.handleFailure(
        queueItem,
        error instanceof Error ? error.message : 'Unexpected error'
      );
      throw error;
    }
  }

  /**
   * Handles notification failure and retry logic
   */
  private async handleFailure(queueItem: NotificationQueueItem, errorMessage: string): Promise<void> {
    const queueRef = doc(db, 'notification_queue', queueItem.id);
    const newAttempts = queueItem.attempts + 1;

    if (newAttempts >= queueItem.maxRetries) {
      // Max retries exceeded
      await updateDoc(queueRef, {
        status: 'max_retries_exceeded',
        attempts: newAttempts,
        lastError: errorMessage,
        updatedAt: serverTimestamp()
      });

      this.log('error', 'Notification max retries exceeded', {
        queueId: queueItem.id,
        attempts: newAttempts,
        maxRetries: queueItem.maxRetries,
        error: errorMessage
      });
    } else {
      // Schedule retry
      const nextRetryDelay = this.calculateRetryDelay(newAttempts);
      const nextRetryAt = new Date(Date.now() + nextRetryDelay);

      await updateDoc(queueRef, {
        status: 'failed',
        attempts: newAttempts,
        lastError: errorMessage,
        nextRetryAt: Timestamp.fromDate(nextRetryAt),
        updatedAt: serverTimestamp()
      });

      this.log('warn', 'Notification failed, scheduled for retry', {
        queueId: queueItem.id,
        attempts: newAttempts,
        nextRetryAt: nextRetryAt.toISOString(),
        error: errorMessage
      });
    }
  }

  /**
   * Calculates retry delay using exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const delay = this.defaultRetryConfig.baseDelayMs * 
      Math.pow(this.defaultRetryConfig.backoffMultiplier, attemptNumber - 1);
    
    return Math.min(delay, this.defaultRetryConfig.maxDelayMs);
  }

  /**
   * Gets queue statistics
   */
  async getQueueStats(): Promise<ServiceResponse<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    maxRetriesExceeded: number;
    total: number;
  }>> {
    return this.executeWithErrorHandling(async () => {
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        maxRetriesExceeded: 0,
        total: 0
      };

      // Count items by status
      const statuses: QueueStatus[] = ['pending', 'processing', 'completed', 'failed', 'max_retries_exceeded'];
      
      for (const status of statuses) {
        const statusQuery = query(
          collection(db, 'notification_queue'),
          where('status', '==', status)
        );
        
        const snapshot = await getDocs(statusQuery);
        const count = snapshot.size;
        
        switch (status) {
          case 'pending':
            stats.pending = count;
            break;
          case 'processing':
            stats.processing = count;
            break;
          case 'completed':
            stats.completed = count;
            break;
          case 'failed':
            stats.failed = count;
            break;
          case 'max_retries_exceeded':
            stats.maxRetriesExceeded = count;
            break;
        }
        
        stats.total += count;
      }

      return stats;
    }, 'getQueueStats');
  }

  /**
   * Gets failed notifications for manual review
   */
  async getFailedNotifications(limit: number = 50): Promise<ServiceResponse<NotificationQueueItem[]>> {
    return this.executeWithErrorHandling(async () => {
      const failedQuery = query(
        collection(db, 'notification_queue'),
        where('status', 'in', ['failed', 'max_retries_exceeded']),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(failedQuery);
      
      const failedItems = snapshot.docs.map(doc => 
        this.parseQueueItem(doc.id, doc.data())
      );

      return failedItems;
    }, 'getFailedNotifications');
  }

  /**
   * Retries a specific failed notification
   */
  async retryNotification(queueId: string): Promise<ServiceResponse<void>> {
    return this.executeWithErrorHandling(async () => {
      const queueRef = doc(db, 'notification_queue', queueId);
      
      // Reset status and schedule for immediate retry
      await updateDoc(queueRef, {
        status: 'pending',
        nextRetryAt: Timestamp.now(),
        updatedAt: serverTimestamp()
      });

      this.log('info', 'Notification manually queued for retry', { queueId });
    }, 'retryNotification');
  }

  /**
   * Cleans up old completed notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<ServiceResponse<number>> {
    return this.executeWithErrorHandling(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldQuery = query(
        collection(db, 'notification_queue'),
        where('status', '==', 'completed'),
        where('completedAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(oldQuery);
      
      // Delete old notifications
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      this.log('info', 'Old notifications cleaned up', {
        deletedCount: snapshot.size,
        cutoffDate: cutoffDate.toISOString()
      });

      return snapshot.size;
    }, 'cleanupOldNotifications');
  }

  /**
   * Parses Firestore document data into NotificationQueueItem
   */
  private parseQueueItem(id: string, data: any): NotificationQueueItem {
    return {
      id,
      type: data.type,
      data: data.data,
      status: data.status,
      attempts: data.attempts || 0,
      maxRetries: data.maxRetries || this.defaultRetryConfig.maxRetries,
      nextRetryAt: data.nextRetryAt ? this.parseDate(data.nextRetryAt) : undefined,
      lastError: data.lastError,
      createdAt: this.parseDate(data.createdAt),
      updatedAt: this.parseDate(data.updatedAt),
      completedAt: data.completedAt ? this.parseDate(data.completedAt) : undefined,
      metadata: data.metadata || {}
    };
  }

  /**
   * Convenience method to queue vendor notification
   */
  async queueVendorNotification(
    data: WaitlistNotificationData['vendorNotification'],
    options?: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
      collectionId?: string;
      vendorId?: string;
    }
  ): Promise<ServiceResponse<string>> {
    return this.queueNotification(
      'vendor_notification',
      { vendorNotification: data },
      options
    );
  }

  /**
   * Convenience method to queue subscriber confirmation
   */
  async queueSubscriberConfirmation(
    data: WaitlistNotificationData['subscriberNotification'],
    options?: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
      collectionId?: string;
      vendorId?: string;
    }
  ): Promise<ServiceResponse<string>> {
    return this.queueNotification(
      'subscriber_confirmation',
      { subscriberNotification: data },
      options
    );
  }

  /**
   * Convenience method to queue both notifications
   */
  async queueBothNotifications(
    data: WaitlistNotificationData,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
      collectionId?: string;
      vendorId?: string;
    }
  ): Promise<ServiceResponse<string>> {
    return this.queueNotification('both_notifications', data, options);
  }
}