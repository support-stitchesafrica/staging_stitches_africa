/**
 * Waitlist Notification System Usage Examples
 * Demonstrates how to use the notification services for waitlist management
 */

import { WaitlistNotificationManager } from './waitlist-notification-manager';
import { WaitlistNotificationData } from './waitlist-notification-service';

// Initialize the notification manager
const notificationManager = new WaitlistNotificationManager();

/**
 * Example 1: Send notifications when a user subscribes to a waitlist
 */
export async function handleWaitlistSubscription(subscriptionData: {
  // Collection info
  collectionId: string;
  collectionName: string;
  collectionDescription: string;
  collectionSlug: string;
  minSubscribers: number;
  currentSubscribers: number;
  
  // Vendor info
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  
  // Subscriber info
  subscriberName: string;
  subscriberEmail: string;
  subscriberPhone: string;
  
  // User account info (if created)
  userAccountCreated?: boolean;
  temporaryPassword?: string;
}) {
  try {
    // Prepare notification data
    const notificationData: WaitlistNotificationData = {
      vendorNotification: {
        vendorName: subscriptionData.vendorName,
        vendorEmail: subscriptionData.vendorEmail,
        collectionName: subscriptionData.collectionName,
        subscriberName: subscriptionData.subscriberName,
        subscriberEmail: subscriptionData.subscriberEmail,
        subscriberPhone: subscriptionData.subscriberPhone,
        currentSubscribers: subscriptionData.currentSubscribers,
        minSubscribers: subscriptionData.minSubscribers,
        collectionUrl: `https://stitchesafrica.com/waitlists/${subscriptionData.collectionSlug}`
      },
      subscriberNotification: {
        subscriberName: subscriptionData.subscriberName,
        subscriberEmail: subscriptionData.subscriberEmail,
        collectionName: subscriptionData.collectionName,
        collectionDescription: subscriptionData.collectionDescription,
        vendorName: subscriptionData.vendorName,
        collectionUrl: `https://stitchesafrica.com/waitlists/${subscriptionData.collectionSlug}`,
        loginCredentials: subscriptionData.userAccountCreated ? {
          email: subscriptionData.subscriberEmail,
          temporaryPassword: subscriptionData.temporaryPassword || 'temp123'
        } : undefined
      }
    };

    // Send notifications with fallback to queue
    const result = await notificationManager.sendBothNotifications(notificationData, {
      immediate: true,
      fallbackToQueue: true,
      priority: 'normal',
      collectionId: subscriptionData.collectionId,
      vendorId: subscriptionData.vendorId
    });

    if (result.success) {
      console.log('✅ Notifications sent successfully:', {
        immediate: result.data?.immediate,
        queued: result.data?.queued,
        queueId: result.data?.queueId
      });
    } else {
      console.error('❌ Failed to send notifications:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error handling waitlist subscription notifications:', error);
    throw error;
  }
}

/**
 * Example 2: Send only vendor notification (e.g., for admin alerts)
 */
export async function sendVendorAlert(alertData: {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  collectionName: string;
  subscriberName: string;
  subscriberEmail: string;
  subscriberPhone: string;
  currentSubscribers: number;
  minSubscribers: number;
  collectionSlug: string;
}) {
  try {
    const result = await notificationManager.sendVendorNotification({
      vendorName: alertData.vendorName,
      vendorEmail: alertData.vendorEmail,
      collectionName: alertData.collectionName,
      subscriberName: alertData.subscriberName,
      subscriberEmail: alertData.subscriberEmail,
      subscriberPhone: alertData.subscriberPhone,
      currentSubscribers: alertData.currentSubscribers,
      minSubscribers: alertData.minSubscribers,
      collectionUrl: `https://stitchesafrica.com/waitlists/${alertData.collectionSlug}`
    }, {
      priority: 'high',
      vendorId: alertData.vendorId
    });

    return result;
  } catch (error) {
    console.error('❌ Error sending vendor alert:', error);
    throw error;
  }
}

/**
 * Example 3: Send only subscriber confirmation (e.g., for welcome emails)
 */
export async function sendWelcomeEmail(welcomeData: {
  subscriberName: string;
  subscriberEmail: string;
  collectionName: string;
  collectionDescription: string;
  vendorName: string;
  collectionSlug: string;
  hasAccount?: boolean;
  temporaryPassword?: string;
}) {
  try {
    const result = await notificationManager.sendSubscriberConfirmation({
      subscriberName: welcomeData.subscriberName,
      subscriberEmail: welcomeData.subscriberEmail,
      collectionName: welcomeData.collectionName,
      collectionDescription: welcomeData.collectionDescription,
      vendorName: welcomeData.vendorName,
      collectionUrl: `https://stitchesafrica.com/waitlists/${welcomeData.collectionSlug}`,
      loginCredentials: welcomeData.hasAccount ? {
        email: welcomeData.subscriberEmail,
        temporaryPassword: welcomeData.temporaryPassword || 'temp123'
      } : undefined
    }, {
      priority: 'normal'
    });

    return result;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Example 4: Process notification queue (for background jobs)
 */
export async function processNotificationQueue() {
  try {
    console.log('🔄 Processing notification queue...');
    
    const result = await notificationManager.processNotificationQueue(20);
    
    if (result.success && result.data) {
      console.log('✅ Queue processing completed:', {
        processed: result.data.processed,
        successful: result.data.successful,
        failed: result.data.failed,
        retried: result.data.retried
      });
    } else {
      console.error('❌ Queue processing failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error processing notification queue:', error);
    throw error;
  }
}

/**
 * Example 5: Monitor notification system health
 */
export async function checkNotificationHealth() {
  try {
    console.log('🔍 Checking notification system health...');
    
    const healthResult = await notificationManager.healthCheck();
    
    if (healthResult.success && healthResult.data) {
      const health = healthResult.data;
      
      console.log('📊 Notification System Health:', {
        notificationService: health.notificationService ? '✅' : '❌',
        queueService: health.queueService ? '✅' : '❌',
        queueStats: health.queueStats,
        issues: health.issues
      });

      if (health.issues.length > 0) {
        console.warn('⚠️ Issues detected:', health.issues);
      }
    } else {
      console.error('❌ Health check failed:', healthResult.error);
    }

    return healthResult;
  } catch (error) {
    console.error('❌ Error checking notification health:', error);
    throw error;
  }
}

/**
 * Example 6: Get queue statistics
 */
export async function getQueueStatistics() {
  try {
    const statsResult = await notificationManager.getQueueStats();
    
    if (statsResult.success && statsResult.data) {
      console.log('📈 Queue Statistics:', statsResult.data);
    } else {
      console.error('❌ Failed to get queue stats:', statsResult.error);
    }

    return statsResult;
  } catch (error) {
    console.error('❌ Error getting queue statistics:', error);
    throw error;
  }
}

/**
 * Example 7: Retry failed notifications
 */
export async function retryFailedNotifications() {
  try {
    console.log('🔄 Checking for failed notifications...');
    
    // Get failed notifications
    const failedResult = await notificationManager.getFailedNotifications(10);
    
    if (failedResult.success && failedResult.data) {
      const failedNotifications = failedResult.data;
      
      console.log(`Found ${failedNotifications.length} failed notifications`);
      
      // Retry each failed notification
      for (const notification of failedNotifications) {
        console.log(`Retrying notification ${notification.id}...`);
        
        const retryResult = await notificationManager.retryFailedNotification(notification.id);
        
        if (retryResult.success) {
          console.log(`✅ Notification ${notification.id} queued for retry`);
        } else {
          console.error(`❌ Failed to retry notification ${notification.id}:`, retryResult.error);
        }
      }
    } else {
      console.error('❌ Failed to get failed notifications:', failedResult.error);
    }

    return failedResult;
  } catch (error) {
    console.error('❌ Error retrying failed notifications:', error);
    throw error;
  }
}

/**
 * Example 8: Cleanup old notifications
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  try {
    console.log(`🧹 Cleaning up notifications older than ${daysOld} days...`);
    
    const cleanupResult = await notificationManager.cleanupOldNotifications(daysOld);
    
    if (cleanupResult.success && cleanupResult.data !== undefined) {
      console.log(`✅ Cleaned up ${cleanupResult.data} old notifications`);
    } else {
      console.error('❌ Cleanup failed:', cleanupResult.error);
    }

    return cleanupResult;
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    throw error;
  }
}