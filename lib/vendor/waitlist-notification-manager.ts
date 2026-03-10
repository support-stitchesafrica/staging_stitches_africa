/**
 * Waitlist Notification Manager
 * High-level service that orchestrates notification sending with error handling and retry logic
 */

import { BaseVendorService } from './base-service';
import { ServiceResponse } from '@/types/vendor-analytics';
import { WaitlistNotificationService, WaitlistNotificationData } from './waitlist-notification-service';
import { NotificationQueueService } from './notification-queue-service';

export interface NotificationOptions {
  // Delivery options
  immediate?: boolean; // If false, uses queue with retry logic
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  
  // Context metadata
  collectionId?: string;
  vendorId?: string;
  subscriptionId?: string;
  
  // Fallback options
  fallbackToQueue?: boolean; // If immediate fails, fallback to queue
}

export interface NotificationResult {
  success: boolean;
  immediate?: boolean;
  queued?: boolean;
  queueId?: string;
  error?: string;
  details?: {
    vendorSent?: boolean;
    subscriberSent?: boolean;
  };
}

export class WaitlistNotificationManager extends BaseVendorService {
  private notificationService: WaitlistNotificationService;
  private queueService: NotificationQueueService;

  constructor() {
    super('WaitlistNotificationManager');
    this.notificationService = new WaitlistNotificationService();
    this.queueService = new NotificationQueueService();
  }

  /**
   * Sends vendor notification with error handling and retry logic
   */
  async sendVendorNotification(
    data: WaitlistNotificationData['vendorNotification'],
    options: NotificationOptions = {}
  ): Promise<ServiceResponse<NotificationResult>> {
    return this.executeWithErrorHandling(async () => {
      if (!data) {
        throw new Error('Vendor notification data is required');
      }

      const {
        immediate = true,
        fallbackToQueue = true,
        priority = 'normal',
        maxRetries = 3,
        collectionId,
        vendorId
      } = options;

      if (immediate) {
        try {
          // Attempt immediate delivery
          const result = await this.notificationService.sendVendorNotification(data);
          
          if (result.success) {
            return {
              success: true,
              immediate: true,
              queued: false
            };
          } else if (fallbackToQueue) {
            // Fallback to queue
            const queueResult = await this.queueService.queueVendorNotification(data, {
              priority,
              maxRetries,
              collectionId,
              vendorId
            });

            return {
              success: queueResult.success,
              immediate: false,
              queued: true,
              queueId: queueResult.data,
              error: queueResult.error?.message || result.error?.message || result.error
            };
          } else {
            return {
              success: false,
              immediate: true,
              queued: false,
              error: result.error?.message || result.error
            };
          }
        } catch (error) {
          if (fallbackToQueue) {
            // Fallback to queue on exception
            const queueResult = await this.queueService.queueVendorNotification(data, {
              priority,
              maxRetries,
              collectionId,
              vendorId
            });

            return {
              success: queueResult.success,
              immediate: false,
              queued: true,
              queueId: queueResult.data,
              error: queueResult.error?.message || (error instanceof Error ? error.message : 'Unknown error')
            };
          } else {
            throw error;
          }
        }
      } else {
        // Queue immediately
        const queueResult = await this.queueService.queueVendorNotification(data, {
          priority,
          maxRetries,
          collectionId,
          vendorId
        });

        return {
          success: queueResult.success,
          immediate: false,
          queued: true,
          queueId: queueResult.data,
          error: queueResult.error?.message || queueResult.error
        };
      }
    }, 'sendVendorNotification');
  }

  /**
   * Sends subscriber confirmation with error handling and retry logic
   */
  async sendSubscriberConfirmation(
    data: WaitlistNotificationData['subscriberNotification'],
    options: NotificationOptions = {}
  ): Promise<ServiceResponse<NotificationResult>> {
    return this.executeWithErrorHandling(async () => {
      if (!data) {
        throw new Error('Subscriber notification data is required');
      }

      const {
        immediate = true,
        fallbackToQueue = true,
        priority = 'normal',
        maxRetries = 3,
        collectionId,
        vendorId
      } = options;

      if (immediate) {
        try {
          // Attempt immediate delivery
          const result = await this.notificationService.sendSubscriberConfirmation(data);
          
          if (result.success) {
            return {
              success: true,
              immediate: true,
              queued: false
            };
          } else if (fallbackToQueue) {
            // Fallback to queue
            const queueResult = await this.queueService.queueSubscriberConfirmation(data, {
              priority,
              maxRetries,
              collectionId,
              vendorId
            });

            return {
              success: queueResult.success,
              immediate: false,
              queued: true,
              queueId: queueResult.data,
              error: queueResult.error?.message || result.error?.message || result.error
            };
          } else {
            return {
              success: false,
              immediate: true,
              queued: false,
              error: result.error?.message || result.error
            };
          }
        } catch (error) {
          if (fallbackToQueue) {
            // Fallback to queue on exception
            const queueResult = await this.queueService.queueSubscriberConfirmation(data, {
              priority,
              maxRetries,
              collectionId,
              vendorId
            });

            return {
              success: queueResult.success,
              immediate: false,
              queued: true,
              queueId: queueResult.data,
              error: queueResult.error?.message || (error instanceof Error ? error.message : 'Unknown error')
            };
          } else {
            throw error;
          }
        }
      } else {
        // Queue immediately
        const queueResult = await this.queueService.queueSubscriberConfirmation(data, {
          priority,
          maxRetries,
          collectionId,
          vendorId
        });

        return {
          success: queueResult.success,
          immediate: false,
          queued: true,
          queueId: queueResult.data,
          error: queueResult.error?.message || queueResult.error
        };
      }
    }, 'sendSubscriberConfirmation');
  }

  /**
   * Sends both vendor and subscriber notifications
   */
  async sendBothNotifications(
    data: WaitlistNotificationData,
    options: NotificationOptions = {}
  ): Promise<ServiceResponse<NotificationResult>> {
    return this.executeWithErrorHandling(async () => {
      const {
        immediate = true,
        fallbackToQueue = true,
        priority = 'normal',
        maxRetries = 3,
        collectionId,
        vendorId
      } = options;

      if (immediate) {
        try {
          // Attempt immediate delivery
          const result = await this.notificationService.sendBothNotifications(data);
          
          if (result.success && result.data?.vendorSent && result.data?.subscriberSent) {
            return {
              success: true,
              immediate: true,
              queued: false,
              details: result.data
            };
          } else if (fallbackToQueue) {
            // Fallback to queue
            const queueResult = await this.queueService.queueBothNotifications(data, {
              priority,
              maxRetries,
              collectionId,
              vendorId
            });

            return {
              success: queueResult.success,
              immediate: false,
              queued: true,
              queueId: queueResult.data,
              error: queueResult.error?.message || result.error?.message || result.error,
              details: result.data
            };
          } else {
            return {
              success: false,
              immediate: true,
              queued: false,
              error: result.error?.message || result.error,
              details: result.data
            };
          }
        } catch (error) {
          if (fallbackToQueue) {
            // Fallback to queue on exception
            const queueResult = await this.queueService.queueBothNotifications(data, {
              priority,
              maxRetries,
              collectionId,
              vendorId
            });

            return {
              success: queueResult.success,
              immediate: false,
              queued: true,
              queueId: queueResult.data,
              error: queueResult.error?.message || (error instanceof Error ? error.message : 'Unknown error')
            };
          } else {
            throw error;
          }
        }
      } else {
        // Queue immediately
        const queueResult = await this.queueService.queueBothNotifications(data, {
          priority,
          maxRetries,
          collectionId,
          vendorId
        });

        return {
          success: queueResult.success,
          immediate: false,
          queued: true,
          queueId: queueResult.data,
          error: queueResult.error?.message || queueResult.error
        };
      }
    }, 'sendBothNotifications');
  }

  /**
   * Processes the notification queue
   */
  async processNotificationQueue(batchSize: number = 10): Promise<ServiceResponse<{
    processed: number;
    successful: number;
    failed: number;
    retried: number;
  }>> {
    return this.queueService.processQueue(batchSize);
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
    return this.queueService.getQueueStats();
  }

  /**
   * Gets failed notifications for manual review
   */
  async getFailedNotifications(limit: number = 50) {
    return this.queueService.getFailedNotifications(limit);
  }

  /**
   * Retries a specific failed notification
   */
  async retryFailedNotification(queueId: string): Promise<ServiceResponse<void>> {
    return this.queueService.retryNotification(queueId);
  }

  /**
   * Cleans up old completed notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<ServiceResponse<number>> {
    return this.queueService.cleanupOldNotifications(daysOld);
  }

  /**
   * Health check for notification system
   */
  async healthCheck(): Promise<ServiceResponse<{
    notificationService: boolean;
    queueService: boolean;
    queueStats: any;
    issues: string[];
  }>> {
    return this.executeWithErrorHandling(async () => {
      const issues: string[] = [];
      let notificationServiceHealthy = true;
      let queueServiceHealthy = true;
      let queueStats = null;

      // Check notification service (simplified check)
      try {
        // Just verify the service can be instantiated and has required methods
        if (!this.notificationService.sendVendorNotification || 
            !this.notificationService.sendSubscriberConfirmation ||
            !this.notificationService.sendBothNotifications) {
          notificationServiceHealthy = false;
          issues.push('Notification service missing required methods');
        }
      } catch (error) {
        notificationServiceHealthy = false;
        issues.push(`Notification service error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Check queue service
      try {
        const statsResult = await this.queueService.getQueueStats();
        if (statsResult.success) {
          queueStats = statsResult.data;
          
          // Check for concerning queue conditions
          if (queueStats && queueStats.failed > 100) {
            issues.push(`High number of failed notifications: ${queueStats.failed}`);
          }
          
          if (queueStats && queueStats.maxRetriesExceeded > 50) {
            issues.push(`High number of permanently failed notifications: ${queueStats.maxRetriesExceeded}`);
          }
        } else {
          queueServiceHealthy = false;
          issues.push('Queue service not responding');
        }
      } catch (error) {
        queueServiceHealthy = false;
        issues.push(`Queue service error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      return {
        notificationService: notificationServiceHealthy,
        queueService: queueServiceHealthy,
        queueStats,
        issues
      };
    }, 'healthCheck');
  }
}