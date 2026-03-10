/**
 * Test Script for Notifications System
 * Creates sample notifications for testing
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface CreateNotificationParams {
  userId: string;
  type: 'invitation' | 'vendor_assignment' | 'vendor_reassignment' | 'system_alert' | 'role_change' | 'team_assignment' | 'task_update' | 'task_assignment';
  title: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

async function createTestNotification(params: CreateNotificationParams) {
  try {
    const notificationRef = await adminDb.collection('marketing_notifications').add({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
      actionLink: params.actionLink,
      actionText: params.actionText,
      metadata: params.metadata || {},
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(`✅ Created notification: ${notificationRef.id}`);
    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
}

async function createSampleNotifications(userId: string) {
  console.log(`Creating sample notifications for user: ${userId}\n`);

  const notifications = [
    {
      userId,
      type: 'vendor_assignment' as const,
      title: 'New Vendor Assignment',
      message: 'You have been assigned to manage Fashion House Ltd.',
      actionLink: '/marketing/my-vendors',
      actionText: 'View Vendors',
      metadata: {
        vendorId: 'vendor-123',
        vendorName: 'Fashion House Ltd.'
      }
    },
    {
      userId,
      type: 'task_assignment' as const,
      title: 'New Task Assigned',
      message: 'Complete vendor onboarding for Fashion House Ltd.',
      actionLink: '/marketing/my-tasks',
      actionText: 'View Tasks',
      metadata: {
        taskId: 'task-456',
        taskTitle: 'Vendor Onboarding'
      }
    },
    {
      userId,
      type: 'system_alert' as const,
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM',
      metadata: {
        maintenanceDate: '2024-12-08',
        duration: '2 hours'
      }
    },
    {
      userId,
      type: 'team_assignment' as const,
      title: 'Team Update',
      message: 'You have been added to the West Region team',
      actionLink: '/marketing/team',
      actionText: 'View Team',
      metadata: {
        teamId: 'team-789',
        teamName: 'West Region'
      }
    },
    {
      userId,
      type: 'invitation' as const,
      title: 'Collaboration Invitation',
      message: 'John Doe invited you to collaborate on a vendor project',
      actionLink: '/marketing/notifications',
      actionText: 'View Details',
      metadata: {
        inviterId: 'user-999',
        inviterName: 'John Doe'
      }
    }
  ];

  for (const notification of notifications) {
    await createTestNotification(notification);
    // Add small delay between notifications
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Created ${notifications.length} sample notifications`);
}

async function clearUserNotifications(userId: string) {
  console.log(`Clearing notifications for user: ${userId}\n`);

  const snapshot = await adminDb
    .collection('marketing_notifications')
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) {
    console.log('No notifications to clear');
    return;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Cleared ${snapshot.size} notifications`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const userId = args[1];

  if (!userId) {
    console.error('❌ Error: User ID is required');
    console.log('\nUsage:');
    console.log('  npm run test:notifications create <userId>  - Create sample notifications');
    console.log('  npm run test:notifications clear <userId>   - Clear all notifications');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'create':
        await createSampleNotifications(userId);
        break;
      case 'clear':
        await clearUserNotifications(userId);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('\nAvailable commands: create, clear');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createTestNotification, createSampleNotifications, clearUserNotifications };
