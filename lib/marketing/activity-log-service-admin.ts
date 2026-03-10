/**
 * Marketing Dashboard Activity Logging Service (Admin SDK Version)
 * Server-side only - uses Firebase Admin SDK to bypass security rules
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Activity Action Types
export type ActivityAction = 
  | 'vendor_assignment'
  | 'vendor_update'
  | 'vendor_creation'
  | 'vendor_deletion'
  | 'login'
  | 'logout'
  | 'reassignment'
  | 'invite_sent'
  | 'invite_accepted'
  | 'invite_revoked'
  | 'role_update'
  | 'user_created'
  | 'user_updated'
  | 'user_deactivated'
  | 'user_activated'
  | 'team_created'
  | 'team_updated'
  | 'team_member_added'
  | 'team_member_removed'
  | 'team_leadership_transferred'
  | 'team_deleted'
  | 'team_members_bulk_added'
  | 'data_export'
  | 'settings_updated'
  | 'password_changed'
  | 'profile_updated';

export type EntityType = 
  | 'vendor'
  | 'user'
  | 'team'
  | 'invitation'
  | 'assignment'
  | 'settings'
  | 'profile';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface CreateActivityLogData {
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Activity Log Service (Admin SDK Version)
 * For server-side operations only
 */
export class ActivityLogServiceAdmin {
  private static readonly COLLECTION_NAME = 'marketing_activity_logs';

  /**
   * Create a new activity log entry using Admin SDK
   */
  static async createLog(data: CreateActivityLogData): Promise<ActivityLog> {
    try {
      const now = Timestamp.now();
      
      const logEntry = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail || '',
        userRole: data.userRole || '',
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || '',
        entityName: data.entityName || '',
        details: data.details || {},
        timestamp: now,
        ipAddress: data.ipAddress || '',
        userAgent: data.userAgent || '',
        metadata: data.metadata || {}
      };

      const docRef = await adminDb.collection(this.COLLECTION_NAME).add(logEntry);
      
      return {
        id: docRef.id,
        ...logEntry
      };
    } catch (error) {
      console.error('❌ Error creating activity log (Admin SDK):', error);
      // Don't throw - just log the error so it doesn't break the main operation
      throw new Error('Failed to create activity log');
    }
  }

  /**
   * Log invitation sent
   */
  static async logInvitationSent(
    userId: string,
    userName: string,
    invitationId: string,
    inviteeEmail: string,
    inviteeRole: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'invite_sent',
      entityType: 'invitation',
      entityId: invitationId,
      details: {
        inviteeEmail,
        inviteeRole
      }
    });
  }

  /**
   * Log invitation accepted
   */
  static async logInvitationAccepted(
    userId: string,
    userName: string,
    userEmail: string,
    invitationId: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      userEmail,
      action: 'invite_accepted',
      entityType: 'invitation',
      entityId: invitationId
    });
  }

  /**
   * Log invitation revoked
   */
  static async logInvitationRevoked(
    userId: string,
    userName: string,
    invitationId: string,
    inviteeEmail: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'invite_revoked',
      entityType: 'invitation',
      entityId: invitationId,
      entityName: inviteeEmail,
      details: {
        inviteeEmail
      }
    });
  }
}
