/**
 * Marketing Notification Service
 * Handles email notifications and in-app notifications for marketing activities
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase';
import { UserService } from './user-service';
import { MarketingEmailService } from './email-service';
import type { Notification, NotificationPreferences, MarketingRole } from './types';

export interface VendorAssignmentNotificationData {
  assignmentId: string;
  vendorId: string;
  vendorName: string;
  assignedToUserId: string;
  assignedByUserId: string;
  assignedByName: string;
}

export interface VendorReassignmentNotificationData {
  assignmentId: string;
  vendorId: string;
  vendorName: string;
  fromUserId: string;
  toUserId: string;
  reassignedByUserId: string;
  reassignedByName: string;
  reason?: string;
}

export interface BulkAssignmentSummaryData {
  assignedByUserId: string;
  assignedByName: string;
  successfulCount: number;
  failedCount: number;
  totalCount: number;
}

export interface BulkReassignmentSummaryData {
  reassignedByUserId: string;
  reassignedByName: string;
  successfulCount: number;
  failedCount: number;
  totalCount: number;
}

export interface SystemAlertData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  actionLink?: string;
  actionText?: string;
  details?: any;
}

export interface TaskUpdateNotificationData {
  taskId: string;
  taskTitle: string;
  vendorName: string;
  vendorId: string;
  assignedToUserId: string;
  updatedByUserId: string;
  updatedByName: string;
  status?: string;
  priority?: string;
  dueDate?: Date;
}

export interface TaskAssignmentNotificationData {
  taskId: string;
  taskTitle: string;
  vendorName: string;
  vendorId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  assignedByName: string;
  dueDate: Date;
}

const COLLECTIONS = {
  NOTIFICATIONS: 'marketing_notifications',
  NOTIFICATION_PREFERENCES: 'marketing_notification_preferences'
} as const;

export class NotificationService {
  /**
   * Send task update notification to the assigned user
   */
  static async sendTaskUpdateNotification(data: TaskUpdateNotificationData): Promise<void> {
    try {
      // Get assigned user details
      const assignedUser = await UserService.getUserById(data.assignedToUserId);
      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.assignedToUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.taskUpdates) {
        await MarketingEmailService.sendTaskUpdateEmail(
          assignedUser.email,
          assignedUser.name,
          data.taskTitle,
          data.vendorName,
          data.updatedByName,
          data.status,
          data.priority
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.taskUpdates) {
        await this.createInAppNotification(
          data.assignedToUserId,
          'task_update',
          'Task Updated',
          `${data.updatedByName} has updated task "${data.taskTitle}" for vendor "${data.vendorName}".`,
          '/marketing/tasks',
          'View Task',
          {
            taskId: data.taskId,
            taskTitle: data.taskTitle,
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            updatedBy: data.updatedByName,
            status: data.status,
            priority: data.priority
          }
        );
      }

      console.log(`Task update notification sent to ${assignedUser.email}`);
    } catch (error) {
      console.error('Error sending task update notification:', error);
      throw error;
    }
  }

  /**
   * Send task assignment notification to the assigned user
   */
  static async sendTaskAssignmentNotification(data: TaskAssignmentNotificationData): Promise<void> {
    try {
      // Get assigned user details
      const assignedUser = await UserService.getUserById(data.assignedToUserId);
      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.assignedToUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.taskAssignments) {
        await MarketingEmailService.sendTaskAssignmentEmail(
          assignedUser.email,
          assignedUser.name,
          data.taskTitle,
          data.vendorName,
          data.assignedByName,
          data.dueDate
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.taskAssignments) {
        await this.createInAppNotification(
          data.assignedToUserId,
          'task_assignment',
          'New Task Assigned',
          `${data.assignedByName} has assigned task "${data.taskTitle}" for vendor "${data.vendorName}" to you.`,
          '/marketing/tasks',
          'View Task',
          {
            taskId: data.taskId,
            taskTitle: data.taskTitle,
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            assignedBy: data.assignedByName,
            dueDate: data.dueDate
          }
        );
      }

      console.log(`Task assignment notification sent to ${assignedUser.email}`);
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
      throw error;
    }
  }

  /**
   * Send task reminder notification to the assigned user
   */
  static async sendTaskReminderNotification(data: TaskAssignmentNotificationData): Promise<void> {
    try {
      // Get assigned user details
      const assignedUser = await UserService.getUserById(data.assignedToUserId);
      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.assignedToUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.taskUpdates) {
        await MarketingEmailService.sendTaskReminderEmail(
          assignedUser.email,
          assignedUser.name,
          data.taskTitle,
          data.vendorName,
          data.dueDate
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.taskUpdates) {
        await this.createInAppNotification(
          data.assignedToUserId,
          'task_reminder',
          'Task Reminder',
          `Reminder: Task "${data.taskTitle}" for vendor "${data.vendorName}" is due soon.`,
          '/marketing/tasks',
          'View Task',
          {
            taskId: data.taskId,
            taskTitle: data.taskTitle,
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            dueDate: data.dueDate
          }
        );
      }

      console.log(`Task reminder notification sent to ${assignedUser.email}`);
    } catch (error) {
      console.error('Error sending task reminder notification:', error);
      throw error;
    }
  }
  /**
   * Create an in-app notification
   */
  private static async createInAppNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    actionLink?: string,
    actionText?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    const notificationId = doc(collection(db, COLLECTIONS.NOTIFICATIONS)).id;
    const now = Timestamp.now();

    const notification: Notification = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      read: false,
      actionLink,
      actionText,
      metadata,
      createdAt: now
    };

    await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), notification);
    return notification;
  }

  /**
   * Get notification preferences for a user
   */
  private static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const prefsDoc = await getDoc(doc(db, COLLECTIONS.NOTIFICATION_PREFERENCES, userId));
    
    if (!prefsDoc.exists()) {
      // Return default preferences
      return {
        userId,
        emailNotifications: {
          invitations: true,
          vendorAssignments: true,
          vendorReassignments: true,
          systemAlerts: true,
          roleChanges: true,
          teamAssignments: true,
          taskUpdates: true,
          taskAssignments: true
        },
        inAppNotifications: {
          invitations: true,
          vendorAssignments: true,
          vendorReassignments: true,
          systemAlerts: true,
          roleChanges: true,
          teamAssignments: true,
          taskUpdates: true,
          taskAssignments: true
        },
        updatedAt: Timestamp.now()
      };
    }

    return { id: prefsDoc.id, ...(prefsDoc.data() as any) } as NotificationPreferences;
  }

  /**
   * Send vendor assignment notification to the assigned user
   */
  static async sendVendorAssignmentNotification(data: VendorAssignmentNotificationData): Promise<void> {
    try {
      // Get assigned user details
      const assignedUser = await UserService.getUserById(data.assignedToUserId);
      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.assignedToUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.vendorAssignments) {
        await MarketingEmailService.sendVendorAssignmentEmail(
          assignedUser.email,
          assignedUser.name,
          data.vendorName,
          data.vendorId,
          data.assignedByName
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.vendorAssignments) {
        await this.createInAppNotification(
          data.assignedToUserId,
          'vendor_assignment',
          'New Vendor Assigned',
          `${data.assignedByName} has assigned vendor "${data.vendorName}" to you.`,
          '/marketing/vendors',
          'View Vendor',
          {
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            assignedBy: data.assignedByName,
            assignmentId: data.assignmentId
          }
        );
      }

      console.log(`Vendor assignment notification sent to ${assignedUser.email}`);
    } catch (error) {
      console.error('Error sending vendor assignment notification:', error);
      throw error;
    }
  }

  /**
   * Send vendor reassignment notification to the new assignee
   */
  static async sendVendorReassignmentNotification(data: VendorReassignmentNotificationData): Promise<void> {
    try {
      // Get new assignee details
      const newAssignee = await UserService.getUserById(data.toUserId);
      if (!newAssignee) {
        throw new Error('New assignee user not found');
      }

      // Get previous assignee details for context
      const previousAssignee = await UserService.getUserById(data.fromUserId);

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.toUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.vendorReassignments) {
        await MarketingEmailService.sendVendorReassignmentEmail(
          newAssignee.email,
          newAssignee.name,
          data.vendorName,
          data.vendorId,
          data.reassignedByName,
          previousAssignee?.name
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.vendorReassignments) {
        await this.createInAppNotification(
          data.toUserId,
          'vendor_reassignment',
          'Vendor Reassigned to You',
          `${data.reassignedByName} has reassigned vendor "${data.vendorName}" to you${previousAssignee ? ` from ${previousAssignee.name}` : ''}.${data.reason ? ` Reason: ${data.reason}` : ''}`,
          '/marketing/vendors',
          'View Vendor',
          {
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            reassignedBy: data.reassignedByName,
            previousAssignee: previousAssignee?.name,
            reason: data.reason,
            assignmentId: data.assignmentId
          }
        );
      }

      console.log(`Vendor reassignment notification sent to ${newAssignee.email}`);
    } catch (error) {
      console.error('Error sending vendor reassignment notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk assignment summary notification to the assigner
   */
  static async sendBulkAssignmentSummaryNotification(data: BulkAssignmentSummaryData): Promise<void> {
    try {
      // Get assigner details
      const assigner = await UserService.getUserById(data.assignedByUserId);
      if (!assigner) {
        throw new Error('Assigner user not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.assignedByUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.vendorAssignments) {
        await MarketingEmailService.sendBulkAssignmentSummaryEmail(
          assigner.email,
          assigner.name,
          data.successfulCount,
          data.failedCount,
          data.totalCount
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.vendorAssignments) {
        const alertType = data.failedCount === 0 ? 'success' : data.failedCount < data.totalCount ? 'warning' : 'error';
        await this.createInAppNotification(
          data.assignedByUserId,
          'system_alert',
          'Bulk Assignment Complete',
          `Successfully assigned ${data.successfulCount} of ${data.totalCount} vendors. ${data.failedCount > 0 ? `${data.failedCount} failed.` : ''}`,
          '/marketing/vendors',
          'View Vendors',
          {
            successfulCount: data.successfulCount,
            failedCount: data.failedCount,
            totalCount: data.totalCount,
            alertType
          }
        );
      }

      console.log(`Bulk assignment summary notification sent to ${assigner.email}`);
    } catch (error) {
      console.error('Error sending bulk assignment summary notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk reassignment summary notification to the reassigner
   */
  static async sendBulkReassignmentSummaryNotification(data: BulkReassignmentSummaryData): Promise<void> {
    try {
      // Get reassigner details
      const reassigner = await UserService.getUserById(data.reassignedByUserId);
      if (!reassigner) {
        throw new Error('Reassigner user not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(data.reassignedByUserId);

      // Send email notification if enabled
      if (prefs.emailNotifications.vendorReassignments) {
        await MarketingEmailService.sendBulkAssignmentSummaryEmail(
          reassigner.email,
          reassigner.name,
          data.successfulCount,
          data.failedCount,
          data.totalCount
        );
      }

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.vendorReassignments) {
        const alertType = data.failedCount === 0 ? 'success' : data.failedCount < data.totalCount ? 'warning' : 'error';
        await this.createInAppNotification(
          data.reassignedByUserId,
          'system_alert',
          'Bulk Reassignment Complete',
          `Successfully reassigned ${data.successfulCount} of ${data.totalCount} vendors. ${data.failedCount > 0 ? `${data.failedCount} failed.` : ''}`,
          '/marketing/vendors',
          'View Vendors',
          {
            successfulCount: data.successfulCount,
            failedCount: data.failedCount,
            totalCount: data.totalCount,
            alertType
          }
        );
      }

      console.log(`Bulk reassignment summary notification sent to ${reassigner.email}`);
    } catch (error) {
      console.error('Error sending bulk reassignment summary notification:', error);
      throw error;
    }
  }

  /**
   * Send system alert notification to Super Admins
   */
  static async sendSystemAlertNotification(alertData: SystemAlertData): Promise<void> {
    try {
      // Get all Super Admins
      const superAdmins = await UserService.getUsersByRole('super_admin');
      
      for (const admin of superAdmins) {
        try {
          // Get notification preferences
          const prefs = await this.getNotificationPreferences(admin.id);

          // Send email notification if enabled
          if (prefs.emailNotifications.systemAlerts) {
            await MarketingEmailService.sendSystemAlertEmail(
              admin.email,
              admin.name,
              alertData.title,
              alertData.message,
              alertData.type,
              alertData.actionLink,
              alertData.actionText
            );
          }

          // Create in-app notification if enabled
          if (prefs.inAppNotifications.systemAlerts) {
            await this.createInAppNotification(
              admin.id,
              'system_alert',
              alertData.title,
              alertData.message,
              alertData.actionLink,
              alertData.actionText,
              {
                alertType: alertData.type,
                ...alertData.details
              }
            );
          }
        } catch (error) {
          console.error(`Failed to send system alert to ${admin.email}:`, error);
        }
      }

      console.log(`System alert notification sent to ${superAdmins.length} Super Admins`);
    } catch (error) {
      console.error('Error sending system alert notification:', error);
      throw error;
    }
  }

  /**
   * Send invitation notification
   */
  static async sendInvitationNotification(
    email: string,
    fullName: string,
    role: MarketingRole,
    inviteToken: string,
    invitedByName: string
  ): Promise<void> {
    try {
      const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketing/invite/${inviteToken}`;

      // Send email notification
      await MarketingEmailService.sendInvitationEmail(
        email,
        fullName,
        role,
        invitationLink,
        invitedByName
      );

      console.log(`Invitation notification sent to ${email}`);
    } catch (error) {
      console.error('Error sending invitation notification:', error);
      throw error;
    }
  }

  /**
   * Send team assignment notification
   */
  static async sendTeamAssignmentNotification(userId: string, teamId: string, assignedByUserId: string): Promise<void> {
    try {
      const user = await UserService.getUserById(userId);
      const assigner = await UserService.getUserById(assignedByUserId);
      
      if (!user || !assigner) {
        throw new Error('User or assigner not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(userId);

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.teamAssignments) {
        await this.createInAppNotification(
          userId,
          'team_assignment',
          'Team Assignment',
          `${assigner.name} has assigned you to a team.`,
          '/marketing/team',
          'View Team',
          {
            teamId,
            assignedBy: assigner.name
          }
        );
      }

      console.log(`Team assignment notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending team assignment notification:', error);
      throw error;
    }
  }

  /**
   * Send role change notification
   */
  static async sendRoleChangeNotification(userId: string, oldRole: string, newRole: string, changedByUserId: string): Promise<void> {
    try {
      const user = await UserService.getUserById(userId);
      const changer = await UserService.getUserById(changedByUserId);
      
      if (!user || !changer) {
        throw new Error('User or role changer not found');
      }

      // Get notification preferences
      const prefs = await this.getNotificationPreferences(userId);

      // Create in-app notification if enabled
      if (prefs.inAppNotifications.roleChanges) {
        await this.createInAppNotification(
          userId,
          'role_change',
          'Role Updated',
          `${changer.name} has updated your role from ${oldRole} to ${newRole}.`,
          '/marketing/dashboard',
          'View Dashboard',
          {
            oldRole,
            newRole,
            changedBy: changer.name
          }
        );
      }

      console.log(`Role change notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending role change notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true,
        readAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          read: true,
          readAt: Timestamp.now()
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences for a user
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'userId' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const prefsRef = doc(db, COLLECTIONS.NOTIFICATION_PREFERENCES, userId);
      const currentPrefs = await this.getNotificationPreferences(userId);

      await setDoc(prefsRef, {
        ...currentPrefs,
        ...preferences,
        userId,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user (public method)
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.getNotificationPreferences(userId);
  }
}

// Export for convenience
export const notificationService = NotificationService;