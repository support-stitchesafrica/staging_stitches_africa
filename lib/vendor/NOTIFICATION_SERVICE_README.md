# NotificationService Documentation

## Overview

The `NotificationService` handles all vendor notifications, alerts, and monitoring for the Stitches Africa marketplace. It provides a comprehensive system for creating, managing, and delivering notifications to vendors about important events, performance metrics, and opportunities.

## Features

- ✅ **Notification Creation**: Send notifications with different types and categories
- ✅ **Notification Management**: Retrieve, filter, and mark notifications as read
- ✅ **Automated Monitoring**: Automatically check metrics and trigger alerts
- ✅ **Preference Management**: Allow vendors to customize notification settings
- ✅ **Email Integration**: Optional email notifications for critical alerts
- ✅ **Cleanup Utilities**: Remove old notifications to maintain database health

## Notification Types

The service supports four notification types:

1. **Alert** (`alert`) - Critical issues requiring immediate attention
2. **Info** (`info`) - Informational updates and confirmations
3. **Warning** (`warning`) - Important issues that need attention
4. **Celebration** (`celebration`) - Positive milestones and achievements

## Notification Categories

Notifications are organized into five categories:

1. **Stock** (`stock`) - Inventory and stock-related alerts
2. **Payout** (`payout`) - Payment and payout notifications
3. **Performance** (`performance`) - Performance metrics and warnings
4. **Ranking** (`ranking`) - Product ranking changes and visibility
5. **Milestone** (`milestone`) - Achievements and celebrations

## Installation

```typescript
import { NotificationService } from '@/lib/vendor/notification-service';

const notificationService = new NotificationService();
```

## Core Methods

### 1. Send Notification

Send a notification to a vendor:

```typescript
const result = await notificationService.sendNotification(vendorId, {
  type: 'alert',
  category: 'stock',
  title: 'Low Stock Alert',
  message: 'Product X has only 5 units remaining',
  actionUrl: '/vendor/inventory/alerts',
  metadata: {
    productId: 'prod-123',
    currentStock: 5
  }
});
```

### 2. Get Notifications

Retrieve notifications with optional filters:

```typescript
// Get all notifications
const allNotifications = await notificationService.getVendorNotifications(vendorId);

// Get unread notifications only
const unreadNotifications = await notificationService.getVendorNotifications(vendorId, {
  unreadOnly: true,
  limit: 10
});

// Get notifications by category
const stockNotifications = await notificationService.getVendorNotifications(vendorId, {
  category: 'stock',
  limit: 20
});
```

### 3. Mark as Read

Mark notifications as read:

```typescript
// Mark single notification as read
await notificationService.markAsRead(notificationId, vendorId);

// Mark all notifications as read
await notificationService.markAllAsRead(vendorId);
```

### 4. Get Unread Count

Get the count of unread notifications:

```typescript
const result = await notificationService.getUnreadCount(vendorId);
console.log(`Unread notifications: ${result.data}`);
```

### 5. Notification Preferences

Manage vendor notification preferences:

```typescript
// Get preferences
const prefs = await notificationService.getNotificationPreferences(vendorId);

// Update preferences
await notificationService.updateNotificationPreferences(vendorId, {
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
```

### 6. Automated Monitoring

Run automated monitoring to check for alert conditions:

```typescript
const result = await notificationService.monitorAndAlert(vendorId);
console.log(`Generated ${result.data?.length} alerts`);
```

This method automatically checks:
- Inventory levels (out of stock, low stock)
- Performance metrics (cancellation rate, return rate, revenue decline)
- Product rankings (ranking drops, low visibility)
- Payout status (completed payouts, failed payouts)

### 7. Cleanup Old Notifications

Remove old notifications to maintain database health:

```typescript
// Delete notifications older than 90 days
const result = await notificationService.cleanupOldNotifications(vendorId, 90);
console.log(`Deleted ${result.data} old notifications`);
```

## Alert Thresholds

The service uses the following thresholds for automated alerts:

- **High Cancellation Rate**: 20%
- **Low Rating**: Below 4.0
- **Ranking Drop**: 10 positions or more
- **Low Stock**: 7 days until stockout
- **High Return Rate**: 15%
- **Metric Decline**: 20% decline from previous period

## Email Notifications

Email notifications are automatically sent for:
- All `alert` type notifications
- All `payout` category notifications
- All `celebration` type notifications

Email sending is handled by the `sendEmailNotification` method (requires email service integration).

## Database Collections

The service interacts with the following Firestore collections:

### vendor_notifications
```typescript
{
  id: string
  vendorId: string
  type: 'alert' | 'info' | 'warning' | 'celebration'
  category: 'stock' | 'payout' | 'performance' | 'ranking' | 'milestone'
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, any>
  isRead: boolean
  createdAt: timestamp
  readAt?: timestamp
}
```

### notification_preferences
```typescript
{
  vendorId: string
  emailNotifications: boolean
  pushNotifications: boolean
  categories: {
    stock: boolean
    payout: boolean
    performance: boolean
    ranking: boolean
    milestone: boolean
  }
  updatedAt: timestamp
}
```

## Error Handling

All methods return a `ServiceResponse<T>` object:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  timestamp: Date;
}
```

Example error handling:

```typescript
const result = await notificationService.sendNotification(vendorId, notification);

if (result.success) {
  console.log('Notification sent:', result.data);
} else {
  console.error('Error:', result.error?.message);
}
```

## Integration with Other Services

The NotificationService integrates with:

1. **InventoryService** - For stock alerts
2. **VendorAnalyticsService** - For performance metrics
3. **ProductRankingService** - For ranking changes
4. **PayoutService** - For payout notifications

## Best Practices

1. **Use Appropriate Types**: Choose the correct notification type based on urgency
2. **Provide Action URLs**: Always include an actionUrl to help vendors take action
3. **Include Metadata**: Store relevant data in metadata for future reference
4. **Regular Monitoring**: Run `monitorAndAlert` periodically (e.g., daily)
5. **Cleanup Old Data**: Regularly cleanup old notifications to maintain performance
6. **Respect Preferences**: Check vendor preferences before sending notifications

## Example Workflows

### Daily Monitoring Workflow

```typescript
async function dailyMonitoring(vendorIds: string[]) {
  for (const vendorId of vendorIds) {
    // Run automated monitoring
    await notificationService.monitorAndAlert(vendorId);
    
    // Cleanup old notifications (older than 90 days)
    await notificationService.cleanupOldNotifications(vendorId, 90);
  }
}
```

### Real-time Stock Alert

```typescript
async function checkStockAndAlert(vendorId: string, productId: string, currentStock: number) {
  if (currentStock === 0) {
    await notificationService.sendNotification(vendorId, {
      type: 'alert',
      category: 'stock',
      title: 'Product Out of Stock',
      message: 'Your product is out of stock and not visible to customers',
      actionUrl: `/vendor/inventory/${productId}`,
      metadata: { productId, currentStock }
    });
  } else if (currentStock < 10) {
    await notificationService.sendNotification(vendorId, {
      type: 'warning',
      category: 'stock',
      title: 'Low Stock Warning',
      message: `Only ${currentStock} units remaining`,
      actionUrl: `/vendor/inventory/${productId}`,
      metadata: { productId, currentStock }
    });
  }
}
```

### Payout Notification

```typescript
async function notifyPayoutComplete(vendorId: string, payoutId: string, amount: number) {
  await notificationService.sendNotification(vendorId, {
    type: 'info',
    category: 'payout',
    title: 'Payout Processed',
    message: `Your payout of $${amount.toLocaleString()} has been processed`,
    actionUrl: `/vendor/payouts/statements/${payoutId}`,
    metadata: { payoutId, amount }
  });
}
```

## Testing

The service includes comprehensive unit tests. Run tests with:

```bash
npm test lib/vendor/notification-service.test.ts
```

## Requirements Validation

This service implements the following requirements from the design document:

- **Requirement 9.1**: Low stock alert notifications
- **Requirement 9.2**: Payout processed notifications
- **Requirement 9.3**: High cancellation rate warnings
- **Requirement 9.4**: Rating drop warnings
- **Requirement 9.5**: Trending product celebrations

## Future Enhancements

Potential future improvements:

1. Push notification support (web push, mobile push)
2. SMS notifications for critical alerts
3. Notification scheduling and batching
4. Advanced filtering and search
5. Notification templates
6. Multi-language support
7. Notification analytics and insights

## Support

For issues or questions about the NotificationService, please refer to:
- Design document: `.kiro/specs/vendor-analytics-upgrade/design.md`
- Requirements: `.kiro/specs/vendor-analytics-upgrade/requirements.md`
- Example usage: `lib/vendor/notification-service.example.ts`
