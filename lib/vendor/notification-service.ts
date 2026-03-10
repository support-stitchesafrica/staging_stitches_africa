/**
 * Notification Service
 * Handles vendor notifications, alerts, and monitoring
 */

import { BaseVendorService } from './base-service';
import {
  VendorNotification,
  NotificationPreferences,
  ServiceResponse,
  VendorAnalytics,
  InventoryAlert,
  ProductRanking
} from '@/types/vendor-analytics';
import { db } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Notification thresholds
const THRESHOLDS = {
  HIGH_CANCELLATION_RATE: 0.20, // 20%
  LOW_RATING: 4.0,
  RANKING_DROP: 10, // positions
  LOW_STOCK_DAYS: 7,
  HIGH_RETURN_RATE: 0.15, // 15%
  METRIC_DECLINE: 0.20, // 20% decline
} as const;

export class NotificationService extends BaseVendorService {
  constructor() {
    super('NotificationService');
  }

  /**
   * Creates and sends a notification to a vendor
   */
  async sendNotification(
    vendorId: string,
    notification: Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>
  ): Promise<ServiceResponse<VendorNotification>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);
      this.validateRequired({
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message
      });

      // Create notification document
      const notificationDoc = {
        vendorId,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl || null,
        metadata: notification.metadata || {},
        isRead: false,
        createdAt: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(
        collection(db, 'vendor_notifications'),
        notificationDoc
      );

      this.log('info', 'Notification sent', {
        vendorId,
        notificationId: docRef.id,
        type: notification.type,
        category: notification.category
      });

      // Optionally send email notification
      if (this.shouldSendEmail(notification.type, notification.category)) {
        await this.sendEmailNotification(vendorId, notification);
      }

      // Return the created notification
      return {
        id: docRef.id,
        vendorId,
        ...notification,
        isRead: false,
        createdAt: new Date()
      };
    }, 'sendNotification');
  }

  /**
   * Gets all notifications for a vendor
   */
  async getVendorNotifications(
    vendorId: string,
    options?: {
      unreadOnly?: boolean;
      category?: VendorNotification['category'];
      limit?: number;
    }
  ): Promise<ServiceResponse<VendorNotification[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      // Build query
      let notificationsQuery = query(
        collection(db, 'vendor_notifications'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      );

      // Add filters
      if (options?.unreadOnly) {
        notificationsQuery = query(
          notificationsQuery,
          where('isRead', '==', false)
        );
      }

      if (options?.category) {
        notificationsQuery = query(
          notificationsQuery,
          where('category', '==', options.category)
        );
      }

      // Add limit
      if (options?.limit) {
        notificationsQuery = query(
          notificationsQuery,
          firestoreLimit(options.limit)
        );
      }

      const snapshot = await getDocs(notificationsQuery);
      
      const notifications: VendorNotification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        vendorId: doc.data().vendorId,
        type: doc.data().type,
        category: doc.data().category,
        title: doc.data().title,
        message: doc.data().message,
        actionUrl: doc.data().actionUrl,
        metadata: doc.data().metadata || {},
        isRead: doc.data().isRead || false,
        createdAt: this.parseDate(doc.data().createdAt)
      }));

      return notifications;
    }, 'getVendorNotifications');
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(
    notificationId: string,
    vendorId: string
  ): Promise<ServiceResponse<void>> {
    return this.executeWithErrorHandling(async () => {
      this.validateRequired({ notificationId, vendorId });

      const notificationRef = doc(db, 'vendor_notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });

      this.log('info', 'Notification marked as read', {
        notificationId,
        vendorId
      });
    }, 'markAsRead');
  }

  /**
   * Marks all notifications as read for a vendor
   */
  async markAllAsRead(vendorId: string): Promise<ServiceResponse<void>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const notificationsQuery = query(
        collection(db, 'vendor_notifications'),
        where('vendorId', '==', vendorId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(notificationsQuery);
      
      // Update all unread notifications
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          isRead: true,
          readAt: serverTimestamp()
        })
      );

      await Promise.all(updatePromises);

      this.log('info', 'All notifications marked as read', {
        vendorId,
        count: snapshot.size
      });
    }, 'markAllAsRead');
  }

  /**
   * Gets notification preferences for a vendor
   */
  async getNotificationPreferences(
    vendorId: string
  ): Promise<ServiceResponse<NotificationPreferences>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const prefsQuery = query(
        collection(db, 'notification_preferences'),
        where('vendorId', '==', vendorId),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(prefsQuery);
      
      if (snapshot.empty) {
        // Return default preferences
        return this.getDefaultPreferences(vendorId);
      }

      const doc = snapshot.docs[0];
      return {
        vendorId: doc.data().vendorId,
        emailNotifications: doc.data().emailNotifications ?? true,
        pushNotifications: doc.data().pushNotifications ?? true,
        categories: doc.data().categories || {
          stock: true,
          payout: true,
          performance: true,
          ranking: true,
          milestone: true
        },
        updatedAt: this.parseDate(doc.data().updatedAt)
      };
    }, 'getNotificationPreferences');
  }

  /**
   * Updates notification preferences for a vendor
   */
  async updateNotificationPreferences(
    vendorId: string,
    preferences: Partial<Omit<NotificationPreferences, 'vendorId' | 'updatedAt'>>
  ): Promise<ServiceResponse<NotificationPreferences>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const prefsQuery = query(
        collection(db, 'notification_preferences'),
        where('vendorId', '==', vendorId),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(prefsQuery);
      
      const updateData = {
        ...preferences,
        updatedAt: serverTimestamp()
      };

      if (snapshot.empty) {
        // Create new preferences
        const newPrefs = {
          vendorId,
          emailNotifications: preferences.emailNotifications ?? true,
          pushNotifications: preferences.pushNotifications ?? true,
          categories: preferences.categories || {
            stock: true,
            payout: true,
            performance: true,
            ranking: true,
            milestone: true
          },
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'notification_preferences'), newPrefs);
      } else {
        // Update existing preferences
        await updateDoc(snapshot.docs[0].ref, updateData);
      }

      this.log('info', 'Notification preferences updated', { vendorId });

      // Return updated preferences
      return this.getNotificationPreferences(vendorId).then(r => r.data!);
    }, 'updateNotificationPreferences');
  }

  /**
   * Monitors vendor metrics and triggers alerts
   */
  async monitorAndAlert(vendorId: string): Promise<ServiceResponse<VendorNotification[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      this.log('info', 'Starting monitoring and alert check', { vendorId });

      const notifications: VendorNotification[] = [];

      // Check various alert conditions in parallel
      const [
        inventoryAlerts,
        performanceAlerts,
        rankingAlerts,
        payoutAlerts
      ] = await Promise.all([
        this.checkInventoryAlerts(vendorId),
        this.checkPerformanceAlerts(vendorId),
        this.checkRankingAlerts(vendorId),
        this.checkPayoutAlerts(vendorId)
      ]);

      // Send notifications for each alert
      for (const alert of [...inventoryAlerts, ...performanceAlerts, ...rankingAlerts, ...payoutAlerts]) {
        const result = await this.sendNotification(vendorId, alert);
        if (result.success && result.data) {
          notifications.push(result.data);
        }
      }

      this.log('info', 'Monitoring complete', {
        vendorId,
        alertsGenerated: notifications.length
      });

      return notifications;
    }, 'monitorAndAlert');
  }

  // ============================================================================
  // Alert Checking Methods
  // ============================================================================

  /**
   * Checks for inventory-related alerts
   */
  private async checkInventoryAlerts(
    vendorId: string
  ): Promise<Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>>> {
    const alerts: Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>> = [];

    try {
      // Query inventory alerts (would typically come from InventoryService)
      const inventoryAlertsQuery = query(
        collection(db, 'inventory_alerts'),
        where('vendorId', '==', vendorId),
        where('severity', 'in', ['critical', 'warning']),
        orderBy('createdAt', 'desc'),
        firestoreLimit(10)
      );

      const snapshot = await getDocs(inventoryAlertsQuery);
      
      // Check for out of stock products
      const outOfStockCount = snapshot.docs.filter(
        doc => doc.data().type === 'out_of_stock'
      ).length;

      if (outOfStockCount > 0) {
        alerts.push({
          type: 'alert',
          category: 'stock',
          title: 'Products Out of Stock',
          message: `${outOfStockCount} product${outOfStockCount > 1 ? 's are' : ' is'} out of stock and not visible to customers`,
          actionUrl: '/vendor/inventory/alerts',
          metadata: { outOfStockCount }
        });
      }

      // Check for low stock products
      const lowStockCount = snapshot.docs.filter(
        doc => doc.data().type === 'low_stock'
      ).length;

      if (lowStockCount > 0) {
        alerts.push({
          type: 'warning',
          category: 'stock',
          title: 'Low Stock Alert',
          message: `${lowStockCount} product${lowStockCount > 1 ? 's have' : ' has'} low stock levels`,
          actionUrl: '/vendor/inventory/alerts',
          metadata: { lowStockCount }
        });
      }
    } catch (error) {
      this.log('warn', 'Failed to check inventory alerts', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Checks for performance-related alerts
   */
  private async checkPerformanceAlerts(
    vendorId: string
  ): Promise<Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>>> {
    const alerts: Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>> = [];

    try {
      // Query recent analytics to check performance metrics
      const analyticsQuery = query(
        collection(db, "staging_vendor_analytics"),
        where('vendorId', '==', vendorId),
        orderBy('date', 'desc'),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(analyticsQuery);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();

        // Check cancellation rate
        const cancellationRate = data.orders?.cancellationRate || 0;
        if (cancellationRate > THRESHOLDS.HIGH_CANCELLATION_RATE * 100) {
          alerts.push({
            type: 'warning',
            category: 'performance',
            title: 'High Cancellation Rate',
            message: `Your cancellation rate is ${cancellationRate.toFixed(1)}%. This may affect your store ranking.`,
            actionUrl: '/vendor/analytics/orders',
            metadata: { cancellationRate }
          });
        }

        // Check return rate
        const returnRate = data.orders?.returnRate || 0;
        if (returnRate > THRESHOLDS.HIGH_RETURN_RATE * 100) {
          alerts.push({
            type: 'warning',
            category: 'performance',
            title: 'High Return Rate',
            message: `Your return rate is ${returnRate.toFixed(1)}%. Consider reviewing product quality and descriptions.`,
            actionUrl: '/vendor/analytics/orders',
            metadata: { returnRate }
          });
        }

        // Check for metric decline
        const revenueChange = data.sales?.revenueChange || 0;
        if (revenueChange < -THRESHOLDS.METRIC_DECLINE * 100) {
          alerts.push({
            type: 'alert',
            category: 'performance',
            title: 'Revenue Decline Detected',
            message: `Your revenue has dropped by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period.`,
            actionUrl: '/vendor/analytics/sales',
            metadata: { revenueChange }
          });
        }
      }
    } catch (error) {
      this.log('warn', 'Failed to check performance alerts', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Checks for ranking-related alerts
   */
  private async checkRankingAlerts(
    vendorId: string
  ): Promise<Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>>> {
    const alerts: Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>> = [];

    try {
      // Query vendor rankings
      const rankingsQuery = query(
        collection(db, 'vendor_rankings'),
        where('vendorId', '==', vendorId),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(rankingsQuery);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const products = data.products || {};

        // Check for products with significant ranking drops
        const droppedProducts = Object.entries(products).filter(
          ([_, productData]: [string, any]) => 
            productData.change && productData.change < -THRESHOLDS.RANKING_DROP
        );

        if (droppedProducts.length > 0) {
          alerts.push({
            type: 'warning',
            category: 'ranking',
            title: 'Product Ranking Dropped',
            message: `${droppedProducts.length} product${droppedProducts.length > 1 ? 's have' : ' has'} dropped in ranking. Review recommendations to improve visibility.`,
            actionUrl: '/vendor/products',
            metadata: { droppedProductsCount: droppedProducts.length }
          });
        }

        // Check for low visibility scores
        const lowVisibilityProducts = Object.entries(products).filter(
          ([_, productData]: [string, any]) => 
            productData.visibilityScore && productData.visibilityScore < 30
        );

        if (lowVisibilityProducts.length > 0) {
          alerts.push({
            type: 'info',
            category: 'ranking',
            title: 'Low Product Visibility',
            message: `${lowVisibilityProducts.length} product${lowVisibilityProducts.length > 1 ? 's have' : ' has'} low visibility scores. Optimize to increase discoverability.`,
            actionUrl: '/vendor/products',
            metadata: { lowVisibilityCount: lowVisibilityProducts.length }
          });
        }
      }
    } catch (error) {
      this.log('warn', 'Failed to check ranking alerts', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Checks for payout-related alerts
   */
  private async checkPayoutAlerts(
    vendorId: string
  ): Promise<Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>>> {
    const alerts: Array<Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>> = [];

    try {
      // Query recent payouts
      const payoutsQuery = query(
        collection(db, 'vendor_payouts'),
        where('vendorId', '==', vendorId),
        orderBy('transferDate', 'desc'),
        firestoreLimit(5)
      );

      const snapshot = await getDocs(payoutsQuery);
      
      // Check for completed payouts
      const recentCompletedPayouts = snapshot.docs.filter(
        doc => doc.data().status === 'paid'
      );

      if (recentCompletedPayouts.length > 0) {
        const latestPayout = recentCompletedPayouts[0].data();
        const payoutDate = this.parseDate(latestPayout.transferDate);
        const daysSinceNotification = Math.floor(
          (Date.now() - payoutDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only notify if payout was within last 2 days
        if (daysSinceNotification <= 2) {
          alerts.push({
            type: 'info',
            category: 'payout',
            title: 'Payout Processed',
            message: `Your payout of $${latestPayout.netAmount?.toLocaleString() || '0'} has been processed successfully.`,
            actionUrl: '/vendor/payouts',
            metadata: {
              payoutId: recentCompletedPayouts[0].id,
              amount: latestPayout.netAmount
            }
          });
        }
      }

      // Check for failed payouts
      const failedPayouts = snapshot.docs.filter(
        doc => doc.data().status === 'failed'
      );

      if (failedPayouts.length > 0) {
        const latestFailed = failedPayouts[0].data();
        alerts.push({
          type: 'alert',
          category: 'payout',
          title: 'Payout Failed',
          message: `Your payout of $${latestFailed.amount?.toLocaleString() || '0'} failed. ${latestFailed.failureReason || 'Please check your account details.'}`,
          actionUrl: '/vendor/payouts',
          metadata: {
            payoutId: failedPayouts[0].id,
            failureReason: latestFailed.failureReason
          }
        });
      }
    } catch (error) {
      this.log('warn', 'Failed to check payout alerts', { vendorId, error });
    }

    return alerts;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Determines if email notification should be sent
   */
  private shouldSendEmail(
    type: VendorNotification['type'],
    category: VendorNotification['category']
  ): boolean {
    // Send email for critical alerts and important info
    if (type === 'alert') {
      return true;
    }

    // Send email for payout notifications
    if (category === 'payout') {
      return true;
    }

    // Send email for milestone celebrations
    if (type === 'celebration') {
      return true;
    }

    return false;
  }

  /**
   * Sends email notification (placeholder)
   */
  private async sendEmailNotification(
    vendorId: string,
    notification: Omit<VendorNotification, 'id' | 'vendorId' | 'isRead' | 'createdAt'>
  ): Promise<void> {
    try {
      // TODO: Implement email sending via email service
      // This would integrate with your email provider (SendGrid, AWS SES, etc.)
      this.log('info', 'Email notification queued', {
        vendorId,
        title: notification.title,
        type: notification.type
      });

      // Placeholder for email sending logic
      // await emailService.send({
      //   to: vendorEmail,
      //   subject: notification.title,
      //   body: notification.message,
      //   template: 'vendor-notification'
      // });
    } catch (error) {
      this.log('warn', 'Failed to send email notification', { vendorId, error });
      // Don't throw - email failure shouldn't break notification creation
    }
  }

  /**
   * Gets default notification preferences
   */
  private getDefaultPreferences(vendorId: string): NotificationPreferences {
    return {
      vendorId,
      emailNotifications: true,
      pushNotifications: true,
      categories: {
        stock: true,
        payout: true,
        performance: true,
        ranking: true,
        milestone: true
      },
      updatedAt: new Date()
    };
  }

  /**
   * Gets unread notification count
   */
  async getUnreadCount(vendorId: string): Promise<ServiceResponse<number>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const notificationsQuery = query(
        collection(db, 'vendor_notifications'),
        where('vendorId', '==', vendorId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.size;
    }, 'getUnreadCount');
  }

  /**
   * Deletes old notifications (cleanup utility)
   */
  async cleanupOldNotifications(
    vendorId: string,
    daysOld: number = 90
  ): Promise<ServiceResponse<number>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const notificationsQuery = query(
        collection(db, 'vendor_notifications'),
        where('vendorId', '==', vendorId),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(notificationsQuery);
      
      // Delete old notifications
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      this.log('info', 'Old notifications cleaned up', {
        vendorId,
        deletedCount: snapshot.size
      });

      return snapshot.size;
    }, 'cleanupOldNotifications');
  }
}
