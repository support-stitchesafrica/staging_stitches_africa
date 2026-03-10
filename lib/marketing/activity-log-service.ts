/**
 * Marketing Dashboard Activity Logging Service
 * Handles activity log creation, storage, and audit trail for all user actions
 * Requirements: 13.1, 13.2, 13.3
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/firebase';

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
  timestamp: Timestamp;
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
  lastDoc?: DocumentSnapshot;
}

// Activity Log Search Options
export interface ActivityLogSearchOptions {
  searchTerm?: string;
  userId?: string;
  actions?: ActivityAction[];
  entityTypes?: EntityType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Activity Log Statistics
export interface ActivityLogStats {
  totalLogs: number;
  logsByAction: Record<ActivityAction, number>;
  logsByEntityType: Record<EntityType, number>;
  logsByUser: Record<string, number>;
  recentActivity: ActivityLog[];
}

/**
 * Activity Log Service Class
 */
export class ActivityLogService {
  private static readonly COLLECTION_NAME = 'marketing_activity_logs';
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 500;

  /**
   * Create a new activity log entry
   */
  static async createLog(data: CreateActivityLogData): Promise<ActivityLog> {
    try {
      const now = Timestamp.now();
      
      const logEntry = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userRole: data.userRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        details: data.details || {},
        timestamp: now,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata || {}
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), logEntry);
      
      return {
        id: docRef.id,
        ...logEntry
      };
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw new Error('Failed to create activity log');
    }
  }

  /**
   * Get activity log by ID
   */
  static async getLogById(logId: string): Promise<ActivityLog | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, logId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ActivityLog;
    } catch (error) {
      console.error('Error getting activity log:', error);
      throw new Error('Failed to retrieve activity log');
    }
  }

  /**
   * Get activity logs with filtering and pagination
   */
  static async getLogs(filters: ActivityLogFilters = {}): Promise<{
    logs: ActivityLog[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
  }> {
    try {
      const pageLimit = Math.min(
        filters.limit || this.DEFAULT_LIMIT,
        this.MAX_LIMIT
      );

      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('timestamp', 'desc')
      );

      // Apply filters
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }

      if (filters.entityType) {
        q = query(q, where('entityType', '==', filters.entityType));
      }

      if (filters.entityId) {
        q = query(q, where('entityId', '==', filters.entityId));
      }

      if (filters.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Pagination
      if (filters.lastDoc) {
        q = query(q, startAfter(filters.lastDoc));
      }

      // Fetch one extra to check if there are more results
      q = query(q, limit(pageLimit + 1));

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      
      const hasMore = docs.length > pageLimit;
      const logs = docs.slice(0, pageLimit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      const lastDoc = hasMore ? docs[pageLimit - 1] : undefined;

      return {
        logs,
        hasMore,
        lastDoc
      };
    } catch (error) {
      console.error('Error getting activity logs:', error);
      throw new Error('Failed to retrieve activity logs');
    }
  }

  /**
   * Get logs by user ID
   */
  static async getLogsByUser(
    userId: string,
    limitCount: number = this.DEFAULT_LIMIT
  ): Promise<ActivityLog[]> {
    const result = await this.getLogs({ userId, limit: limitCount });
    return result.logs;
  }

  /**
   * Get logs by action type
   */
  static async getLogsByAction(
    action: ActivityAction,
    limitCount: number = this.DEFAULT_LIMIT
  ): Promise<ActivityLog[]> {
    const result = await this.getLogs({ action, limit: limitCount });
    return result.logs;
  }

  /**
   * Get logs by entity
   */
  static async getLogsByEntity(
    entityType: EntityType,
    entityId: string,
    limitCount: number = this.DEFAULT_LIMIT
  ): Promise<ActivityLog[]> {
    const result = await this.getLogs({ entityType, entityId, limit: limitCount });
    return result.logs;
  }

  /**
   * Get recent activity logs
   */
  static async getRecentLogs(limitCount: number = 20): Promise<ActivityLog[]> {
    const result = await this.getLogs({ limit: limitCount });
    return result.logs;
  }

  /**
   * Search activity logs with advanced filtering
   */
  static async searchLogs(options: ActivityLogSearchOptions): Promise<ActivityLog[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('timestamp', 'desc')
      );

      // Apply filters
      if (options.userId) {
        q = query(q, where('userId', '==', options.userId));
      }

      if (options.actions && options.actions.length > 0) {
        q = query(q, where('action', 'in', options.actions));
      }

      if (options.entityTypes && options.entityTypes.length > 0) {
        q = query(q, where('entityType', 'in', options.entityTypes));
      }

      if (options.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
      }

      if (options.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
      }

      const limitCount = Math.min(
        options.limit || this.DEFAULT_LIMIT,
        this.MAX_LIMIT
      );
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      let logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      // Client-side search term filtering (if needed)
      if (options.searchTerm) {
        const searchLower = options.searchTerm.toLowerCase();
        logs = logs.filter(log => 
          log.userName?.toLowerCase().includes(searchLower) ||
          log.userEmail?.toLowerCase().includes(searchLower) ||
          log.entityName?.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
        );
      }

      return logs;
    } catch (error) {
      console.error('Error searching activity logs:', error);
      throw new Error('Failed to search activity logs');
    }
  }

  /**
   * Get activity logs for a date range
   */
  static async getLogsByDateRange(
    startDate: Date,
    endDate: Date,
    limitCount: number = this.DEFAULT_LIMIT
  ): Promise<ActivityLog[]> {
    const result = await this.getLogs({ startDate, endDate, limit: limitCount });
    return result.logs;
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<ActivityLogStats> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      if (startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
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
        const userKey = log.userId;
        logsByUser[userKey] = (logsByUser[userKey] || 0) + 1;
      });

      // Get recent activity (last 10)
      const recentActivity = logs
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, 10);

      return {
        totalLogs: logs.length,
        logsByAction: logsByAction as Record<ActivityAction, number>,
        logsByEntityType: logsByEntityType as Record<EntityType, number>,
        logsByUser,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting activity statistics:', error);
      throw new Error('Failed to retrieve activity statistics');
    }
  }

  /**
   * Log user login
   */
  static async logLogin(
    userId: string,
    userName: string,
    userEmail: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      userEmail,
      userRole,
      action: 'login',
      entityType: 'system',
      details: {
        loginTime: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log user logout
   */
  static async logLogout(
    userId: string,
    userName: string,
    userEmail: string,
    userRole: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      userEmail,
      userRole,
      action: 'logout',
      entityType: 'system',
      details: {
        logoutTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log vendor assignment
   */
  static async logVendorAssignment(
    userId: string,
    userName: string,
    vendorId: string,
    vendorName: string,
    assignedToUserId: string,
    assignedToUserName: string,
    details?: Record<string, any>
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'vendor_assignment',
      entityType: 'vendor',
      entityId: vendorId,
      entityName: vendorName,
      details: {
        assignedToUserId,
        assignedToUserName,
        ...details
      }
    });
  }

  /**
   * Log vendor reassignment
   */
  static async logVendorReassignment(
    userId: string,
    userName: string,
    vendorId: string,
    vendorName: string,
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    toUserName: string,
    reason?: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'reassignment',
      entityType: 'vendor',
      entityId: vendorId,
      entityName: vendorName,
      details: {
        fromUserId,
        fromUserName,
        toUserId,
        toUserName,
        reason
      }
    });
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
   * Log role update
   */
  static async logRoleUpdate(
    userId: string,
    userName: string,
    targetUserId: string,
    targetUserName: string,
    oldRole: string,
    newRole: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'role_update',
      entityType: 'user',
      entityId: targetUserId,
      entityName: targetUserName,
      details: {
        oldRole,
        newRole
      }
    });
  }

  /**
   * Log data export
   */
  static async logDataExport(
    userId: string,
    userName: string,
    exportType: string,
    filters?: Record<string, any>
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'data_export',
      entityType: 'system',
      details: {
        exportType,
        filters,
        exportTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log user creation
   */
  static async logUserCreation(
    creatorUserId: string,
    creatorUserName: string,
    newUserId: string,
    newUserEmail: string,
    newUserRole: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId: creatorUserId,
      userName: creatorUserName,
      action: 'user_created',
      entityType: 'user',
      entityId: newUserId,
      entityName: newUserEmail,
      details: {
        role: newUserRole
      }
    });
  }

  /**
   * Log user deactivation
   */
  static async logUserDeactivation(
    userId: string,
    userName: string,
    targetUserId: string,
    targetUserName: string,
    reason?: string
  ): Promise<ActivityLog> {
    return this.createLog({
      userId,
      userName,
      action: 'user_deactivated',
      entityType: 'user',
      entityId: targetUserId,
      entityName: targetUserName,
      details: {
        reason
      }
    });
  }
}

// Export utility functions
export const activityLogUtils = {
  formatAction: (action: ActivityAction): string => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  },
  
  formatEntityType: (entityType: EntityType): string => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  },
  
  getActionColor: (action: ActivityAction): string => {
    const colorMap: Record<string, string> = {
      login: 'blue',
      logout: 'gray',
      vendor_assignment: 'green',
      vendor_update: 'yellow',
      reassignment: 'orange',
      invite_sent: 'purple',
      role_update: 'red',
      user_deactivated: 'red',
      data_export: 'indigo'
    };
    return colorMap[action] || 'gray';
  }
};
