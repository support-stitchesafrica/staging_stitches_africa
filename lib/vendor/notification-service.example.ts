/**
 * NotificationService Usage Examples
 * Demonstrates how to use the NotificationService for vendor notifications
 */

import { NotificationService } from './notification-service';
import { VendorNotification } from '@/types/vendor-analytics';

// Initialize the service
const notificationService = new NotificationService();

/**
 * Example 1: Send a low stock alert
 */
async function sendLowStockAlert(vendorId: string, productName: string, currentStock: number) {
  const result = await notificationService.sendNotification(vendorId, {
    type: 'alert',
    category: 'stock',
    title: 'Low Stock Alert',
    message: `${productName} has only ${currentStock} units remaining`,
    actionUrl: '/vendor/inventory/alerts',
    metadata: {
      productName,
      currentStock
    }
  });

  if (result.success) {
    console.log('Low stock alert sent successfully');
  } else {
    console.error('Failed to send alert:', result.error);
  }
}

/**
 * Example 2: Send a payout notification
 */
async function sendPayoutNotification(vendorId: string, amount: number, payoutId: string) {
  const result = await notificationService.sendNotification(vendorId, {
    type: 'info',
    category: 'payout',
    title: 'Payout Processed',
    message: `Your payout of $${amount.toLocaleString()} has been processed successfully`,
    actionUrl: `/vendor/payouts/statements/${payoutId}`,
    metadata: {
      amount,
      payoutId
    }
  });

  if (result.success) {
    console.log('Payout notification sent successfully');
  }
}

/**
 * Example 3: Send a high cancellation rate warning
 */
async function sendHighCancellationWarning(vendorId: string, cancellationRate: number) {
  const result = await notificationService.sendNotification(vendorId, {
    type: 'warning',
    category: 'performance',
    title: 'High Cancellation Rate',
    message: `Your cancellation rate is ${cancellationRate.toFixed(1)}%. This may affect your store ranking.`,
    actionUrl: '/vendor/analytics/orders',
    metadata: {
      cancellationRate
    }
  });

  if (result.success) {
    console.log('Warning notification sent successfully');
  }
}

/**
 * Example 4: Send a milestone celebration
 */
async function sendMilestoneCelebration(vendorId: string, milestone: string) {
  const result = await notificationService.sendNotification(vendorId, {
    type: 'celebration',
    category: 'milestone',
    title: 'Milestone Achieved! 🎉',
    message: `Congratulations! You've reached ${milestone}`,
    actionUrl: '/vendor/analytics',
    metadata: {
      milestone
    }
  });

  if (result.success) {
    console.log('Celebration notification sent successfully');
  }
}

/**
 * Example 5: Get all notifications for a vendor
 */
async function getVendorNotifications(vendorId: string) {
  const result = await notificationService.getVendorNotifications(vendorId, {
    limit: 20
  });

  if (result.success && result.data) {
    console.log(`Found ${result.data.length} notifications`);
    result.data.forEach(notification => {
      console.log(`- [${notification.type}] ${notification.title}`);
    });
  }
}

/**
 * Example 6: Get unread notifications only
 */
async function getUnreadNotifications(vendorId: string) {
  const result = await notificationService.getVendorNotifications(vendorId, {
    unreadOnly: true,
    limit: 10
  });

  if (result.success && result.data) {
    console.log(`You have ${result.data.length} unread notifications`);
  }
}

/**
 * Example 7: Get notifications by category
 */
async function getStockNotifications(vendorId: string) {
  const result = await notificationService.getVendorNotifications(vendorId, {
    category: 'stock',
    limit: 10
  });

  if (result.success && result.data) {
    console.log(`Found ${result.data.length} stock notifications`);
  }
}

/**
 * Example 8: Mark a notification as read
 */
async function markNotificationAsRead(notificationId: string, vendorId: string) {
  const result = await notificationService.markAsRead(notificationId, vendorId);

  if (result.success) {
    console.log('Notification marked as read');
  }
}

/**
 * Example 9: Mark all notifications as read
 */
async function markAllNotificationsAsRead(vendorId: string) {
  const result = await notificationService.markAllAsRead(vendorId);

  if (result.success) {
    console.log('All notifications marked as read');
  }
}

/**
 * Example 10: Get unread count
 */
async function getUnreadCount(vendorId: string) {
  const result = await notificationService.getUnreadCount(vendorId);

  if (result.success && result.data !== undefined) {
    console.log(`You have ${result.data} unread notifications`);
  }
}

/**
 * Example 11: Get notification preferences
 */
async function getNotificationPreferences(vendorId: string) {
  const result = await notificationService.getNotificationPreferences(vendorId);

  if (result.success && result.data) {
    console.log('Notification Preferences:');
    console.log(`- Email: ${result.data.emailNotifications ? 'Enabled' : 'Disabled'}`);
    console.log(`- Push: ${result.data.pushNotifications ? 'Enabled' : 'Disabled'}`);
    console.log('Categories:');
    Object.entries(result.data.categories).forEach(([category, enabled]) => {
      console.log(`  - ${category}: ${enabled ? 'Enabled' : 'Disabled'}`);
    });
  }
}

/**
 * Example 12: Update notification preferences
 */
async function updateNotificationPreferences(vendorId: string) {
  const result = await notificationService.updateNotificationPreferences(vendorId, {
    emailNotifications: true,
    pushNotifications: false,
    categories: {
      stock: true,
      payout: true,
      performance: true,
      ranking: false,
      milestone: true
    }
  });

  if (result.success) {
    console.log('Notification preferences updated successfully');
  }
}

/**
 * Example 13: Monitor and alert (automated monitoring)
 */
async function runMonitoring(vendorId: string) {
  const result = await notificationService.monitorAndAlert(vendorId);

  if (result.success && result.data) {
    console.log(`Monitoring complete. Generated ${result.data.length} alerts`);
    result.data.forEach(notification => {
      console.log(`- [${notification.type}] ${notification.title}`);
    });
  }
}

/**
 * Example 14: Cleanup old notifications
 */
async function cleanupOldNotifications(vendorId: string) {
  const result = await notificationService.cleanupOldNotifications(vendorId, 90);

  if (result.success && result.data !== undefined) {
    console.log(`Cleaned up ${result.data} old notifications`);
  }
}

/**
 * Example 15: Complete notification workflow
 */
async function completeNotificationWorkflow(vendorId: string) {
  console.log('=== Notification Workflow Example ===\n');

  // 1. Check for unread notifications
  const unreadResult = await notificationService.getUnreadCount(vendorId);
  if (unreadResult.success && unreadResult.data !== undefined) {
    console.log(`Step 1: You have ${unreadResult.data} unread notifications\n`);
  }

  // 2. Get recent notifications
  const notificationsResult = await notificationService.getVendorNotifications(vendorId, {
    limit: 5
  });
  if (notificationsResult.success && notificationsResult.data) {
    console.log('Step 2: Recent notifications:');
    notificationsResult.data.forEach(n => {
      console.log(`  - [${n.type}] ${n.title} (${n.isRead ? 'Read' : 'Unread'})`);
    });
    console.log();
  }

  // 3. Run monitoring to check for new alerts
  console.log('Step 3: Running automated monitoring...');
  const monitoringResult = await notificationService.monitorAndAlert(vendorId);
  if (monitoringResult.success && monitoringResult.data) {
    console.log(`  Generated ${monitoringResult.data.length} new alerts\n`);
  }

  // 4. Get updated unread count
  const updatedUnreadResult = await notificationService.getUnreadCount(vendorId);
  if (updatedUnreadResult.success && updatedUnreadResult.data !== undefined) {
    console.log(`Step 4: Updated unread count: ${updatedUnreadResult.data}\n`);
  }

  // 5. Mark all as read
  console.log('Step 5: Marking all notifications as read...');
  await notificationService.markAllAsRead(vendorId);
  console.log('  Done!\n');

  console.log('=== Workflow Complete ===');
}

// Export examples for use in other files
export {
  sendLowStockAlert,
  sendPayoutNotification,
  sendHighCancellationWarning,
  sendMilestoneCelebration,
  getVendorNotifications,
  getUnreadNotifications,
  getStockNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  runMonitoring,
  cleanupOldNotifications,
  completeNotificationWorkflow
};
