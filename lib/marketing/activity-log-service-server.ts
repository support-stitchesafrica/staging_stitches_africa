/**
 * Marketing Dashboard Activity Logging Service - SERVER SIDE
 * Server-side version using Firebase Admin SDK
 * Handles activity log creation, storage, and audit trail for all user actions
 */

import { adminDb } from '../firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

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

// Entity Types
export type EntityType = 'vendor' | 'user' | 'team' | 'invitation' | 'system';

// Activity Log Interface
export interface ActivityLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details: Record<string, any>;
  timestamp: any; // Firestore Timestamp
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Create Activity Log Data
export interface CreateActivityLogData {
  userId: string;
  userName?: string;
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

// Activity Log Filters
export interface ActivityLogFilters {
  userId?: string;
  action?: ActivityAction;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// Activity Log Statistics
export interface ActivityLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntityType: Record<string, number>;
  logsByUser: Record<string, number>;
  recentActivity: ActivityLog[];
}

/**
 * Activity Log Service Class - SERVER SIDE
 */
export class ActivityLogServiceServer {
  private static readonly COLLECTION_NAME = 'marketing_activity_logs';
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 500;

  /**
   * Create a new activity log entry
   */
  static async createLog(data: CreateActivityLogData): Promise<ActivityLog> {
    try {
      console.log('[ActivityLogServiceServer] Creating log:', data.action);
      
      const now = Timestamp.now();
      
      const logEntry = {
        userId: data.userId,
        userName: data.userName || '',
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
      console.log('[ActivityLogServiceServer] Log created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...logEntry
      };
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error creating activity log:', error);
      throw new Error('Failed to create activity log');
    }
  }

  /**
   * Get activity log by ID
   */
  static async getLogById(logId: string): Promise<ActivityLog | null> {
    try {
      const docRef = adminDb.collection(this.COLLECTION_NAME).doc(logId);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ActivityLog;
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error getting activity log:', error);
      throw new Error('Failed to retrieve activity log');
    }
  }

  /**
   * Get activity logs with filtering and pagination
   */
  static async getLogs(filters: ActivityLogFilters = {}): Promise<{
    logs: ActivityLog[];
    hasMore: boolean;
  }> {
    try {
      console.log('[ActivityLogServiceServer] Getting logs with filters:', filters);
      
      const pageLimit = Math.min(
        filters.limit || this.DEFAULT_LIMIT,
        this.MAX_LIMIT
      );

      let q = adminDb.collection(this.COLLECTION_NAME)
        .orderBy('timestamp', 'desc');

      // Apply filters
      if (filters.userId) {
        q = q.where('userId', '==', filters.userId);
      }

      if (filters.action) {
        q = q.where('action', '==', filters.action);
      }

      if (filters.entityType) {
        q = q.where('entityType', '==', filters.entityType);
      }

      if (filters.entityId) {
        q = q.where('entityId', '==', filters.entityId);
      }

      if (filters.startDate) {
        q = q.where('timestamp', '>=', Timestamp.fromDate(filters.startDate));
      }

      if (filters.endDate) {
        q = q.where('timestamp', '<=', Timestamp.fromDate(filters.endDate));
      }

      // Fetch one extra to check if there are more results
      q = q.limit(pageLimit + 1);

      const querySnapshot = await q.get();
      console.log('[ActivityLogServiceServer] Found', querySnapshot.size, 'documents');
      
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageLimit;
      const logs = docs.slice(0, pageLimit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      console.log('[ActivityLogServiceServer] Returning', logs.length, 'logs, hasMore:', hasMore);

      return {
        logs,
        hasMore
      };
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error getting logs:', error);
      console.error('[ActivityLogServiceServer] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw new Error('Failed to retrieve activity logs');
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<ActivityLogStats> {
    try {
      console.log('[ActivityLogServiceServer] Getting stats for date range:', { startDate, endDate });
      
      let q = adminDb.collection(this.COLLECTION_NAME);

      if (startDate) {
        q = q.where('timestamp', '>=', Timestamp.fromDate(startDate)) as any;
      }

      if (endDate) {
        q = q.where('timestamp', '<=', Timestamp.fromDate(endDate)) as any;
      }

      const querySnapshot = await q.get();
      console.log('[ActivityLogServiceServer] Found', querySnapshot.size, 'logs for stats');
      
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      // Calculate statistics
      const logsByAction: Record<string, number> = {};
      const logsByEntityType: Record<string, number> = {};
      const logsByUser: Record<string, number> = {};

      logs.forEach(log => {
        // Count by action
        logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;
        
        // Count by entity type
        logsByEntityType[log.entityType] = (logsByEntityType[log.entityType] || 0) + 1;
        
        // Count by user
        const userKey = log.userName || log.userEmail || log.userId;
        logsByUser[userKey] = (logsByUser[userKey] || 0) + 1;
      });

      // Get recent activity (last 10)
      const recentActivity = logs
        .sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || new Date(0);
          const bTime = b.timestamp?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        })
        .slice(0, 10);

      console.log('[ActivityLogServiceServer] Stats calculated successfully');

      return {
        totalLogs: logs.length,
        logsByAction,
        logsByEntityType,
        logsByUser,
        recentActivity
      };
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error getting activity stats:', error);
      console.error('[ActivityLogServiceServer] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw new Error('Failed to retrieve activity statistics');
    }
  }

  /**
   * Get logs by user ID
   */
  static async getLogsByUser(userId: string, limitCount: number = 50): Promise<ActivityLog[]> {
    try {
      const querySnapshot = await adminDb.collection(this.COLLECTION_NAME)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error getting logs by user:', error);
      throw new Error('Failed to retrieve user activity logs');
    }
  }

  /**
   * Get logs by action type
   */
  static async getLogsByAction(action: ActivityAction, limitCount: number = 50): Promise<ActivityLog[]> {
    try {
      const querySnapshot = await adminDb.collection(this.COLLECTION_NAME)
        .where('action', '==', action)
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error getting logs by action:', error);
      throw new Error('Failed to retrieve activity logs by action');
    }
  }

  /**
   * Get logs by entity
   */
  static async getLogsByEntity(
    entityType: EntityType,
    entityId: string,
    limitCount: number = 50
  ): Promise<ActivityLog[]> {
    try {
      const querySnapshot = await adminDb.collection(this.COLLECTION_NAME)
        .where('entityType', '==', entityType)
        .where('entityId', '==', entityId)
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error getting logs by entity:', error);
      throw new Error('Failed to retrieve entity activity logs');
    }
  }

  /**
   * Delete old logs (for cleanup/archival)
   */
  static async deleteOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const querySnapshot = await adminDb.collection(this.COLLECTION_NAME)
        .where('timestamp', '<', Timestamp.fromDate(cutoffDate))
        .get();
      
      const batch = adminDb.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return querySnapshot.size;
    } catch (error) {
      console.error('[ActivityLogServiceServer] Error deleting old logs:', error);
      throw new Error('Failed to delete old activity logs');
    }
  }
}

// Export utilities
export const activityLogUtils = {
  ActivityLogServiceServer
};
