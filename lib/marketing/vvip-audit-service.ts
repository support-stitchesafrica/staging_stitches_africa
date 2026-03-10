/**
 * VVIP Audit Logging Service
 * 
 * Provides audit trail functionality for all VVIP operations including:
 * - Creating audit log entries for VVIP actions
 * - Tracking who performed actions and when
 * - Storing metadata about actions
 * 
 * Requirements: 1.10, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  VvipAction,
  VvipActionType,
  AuditLogDocument,
  VvipError,
  VvipErrorCode,
} from '@/types/vvip';

/**
 * VVIP Audit Service Class
 * Provides audit logging functionality for VVIP operations
 */
export class VvipAuditService {
  private static readonly AUDIT_LOGS_COLLECTION = 'vvip_audit_logs';
  private static readonly USERS_COLLECTION = 'users';
  private static readonly MARKETING_USERS_COLLECTION = 'marketing_users';

  /**
   * Log a VVIP action to the audit trail
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
   * 
   * @param action - The VVIP action to log
   * @returns The created audit log document ID
   * @throws VvipError if logging fails
   */
  static async logVvipAction(action: VvipAction): Promise<string> {
    try {
      // Fetch email addresses for performed_by and affected_user
      const [performedByEmail, affectedUserEmail] = await Promise.all([
        this.getUserEmail(action.performed_by),
        this.getUserEmail(action.affected_user),
      ]);

      // Create audit log document
      const auditLogRef = adminDb.collection(this.AUDIT_LOGS_COLLECTION).doc();
      
      const auditLogData: AuditLogDocument = {
        logId: auditLogRef.id,
        action_type: action.action_type,
        performed_by: action.performed_by,
        performed_by_email: performedByEmail,
        affected_user: action.affected_user,
        affected_user_email: affectedUserEmail,
        timestamp: action.timestamp || Timestamp.now(),
        metadata: action.metadata || {},
      };

      // Write to Firestore
      await auditLogRef.set(auditLogData);

      return auditLogRef.id;
    } catch (error) {
      console.error('Error logging VVIP action:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to create audit log entry',
        500
      );
    }
  }

  /**
   * Get user email from either users or marketing_users collection
   * Helper function to populate email fields in audit logs
   * 
   * @param userId - User ID to fetch email for
   * @returns User email or 'Unknown' if not found
   */
  private static async getUserEmail(userId: string): Promise<string> {
    try {
      // Try users collection first
      const userDoc = await adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData?.email || 'Unknown';
      }

      // Try marketing_users collection
      const marketingUserDoc = await adminDb
        .collection(this.MARKETING_USERS_COLLECTION)
        .doc(userId)
        .get();

      if (marketingUserDoc.exists) {
        const marketingUserData = marketingUserDoc.data();
        return marketingUserData?.email || 'Unknown';
      }

      return 'Unknown';
    } catch (error) {
      console.error('Error fetching user email:', error);
      return 'Unknown';
    }
  }

  /**
   * Get audit logs for a specific user
   * 
   * @param userId - User ID to fetch logs for
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents
   */
  static async getAuditLogsForUser(
    userId: string,
    limit: number = 50
  ): Promise<AuditLogDocument[]> {
    try {
      const snapshot = await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .where('affected_user', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as AuditLogDocument);
    } catch (error) {
      console.error('Error fetching audit logs for user:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch audit logs',
        500
      );
    }
  }

  /**
   * Get audit logs by action type
   * 
   * @param actionType - Type of action to filter by
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents
   */
  static async getAuditLogsByActionType(
    actionType: VvipActionType,
    limit: number = 50
  ): Promise<AuditLogDocument[]> {
    try {
      const snapshot = await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .where('action_type', '==', actionType)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as AuditLogDocument);
    } catch (error) {
      console.error('Error fetching audit logs by action type:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch audit logs',
        500
      );
    }
  }

  /**
   * Get audit logs performed by a specific admin
   * 
   * @param adminId - Admin user ID to filter by
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents
   */
  static async getAuditLogsByAdmin(
    adminId: string,
    limit: number = 50
  ): Promise<AuditLogDocument[]> {
    try {
      const snapshot = await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .where('performed_by', '==', adminId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as AuditLogDocument);
    } catch (error) {
      console.error('Error fetching audit logs by admin:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch audit logs',
        500
      );
    }
  }

  /**
   * Get all audit logs with optional filtering
   * 
   * @param filters - Optional filters to apply
   * @param limit - Maximum number of logs to return
   * @returns Array of audit log documents
   */
  static async getAllAuditLogs(
    filters?: {
      actionType?: VvipActionType;
      performedBy?: string;
      affectedUser?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ): Promise<AuditLogDocument[]> {
    try {
      let query = adminDb.collection(this.AUDIT_LOGS_COLLECTION);

      // Apply filters
      if (filters?.actionType) {
        query = query.where('action_type', '==', filters.actionType) as any;
      }

      if (filters?.performedBy) {
        query = query.where('performed_by', '==', filters.performedBy) as any;
      }

      if (filters?.affectedUser) {
        query = query.where('affected_user', '==', filters.affectedUser) as any;
      }

      if (filters?.startDate) {
        const startTimestamp = Timestamp.fromDate(filters.startDate);
        query = query.where('timestamp', '>=', startTimestamp) as any;
      }

      if (filters?.endDate) {
        const endTimestamp = Timestamp.fromDate(filters.endDate);
        query = query.where('timestamp', '<=', endTimestamp) as any;
      }

      // Order by timestamp and limit
      query = query.orderBy('timestamp', 'desc').limit(limit) as any;

      const snapshot = await query.get();

      return snapshot.docs.map(doc => doc.data() as AuditLogDocument);
    } catch (error) {
      console.error('Error fetching all audit logs:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch audit logs',
        500
      );
    }
  }

  /**
   * Get audit log statistics
   * 
   * @returns Statistics about audit logs
   */
  static async getAuditLogStatistics(): Promise<{
    totalLogs: number;
    logsByActionType: Map<VvipActionType, number>;
    recentLogs: AuditLogDocument[];
  }> {
    try {
      const snapshot = await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .get();

      const totalLogs = snapshot.size;
      const logsByActionType = new Map<VvipActionType, number>();

      snapshot.docs.forEach(doc => {
        const data = doc.data() as AuditLogDocument;
        const actionType = data.action_type;
        logsByActionType.set(actionType, (logsByActionType.get(actionType) || 0) + 1);
      });

      // Get recent logs (last 10)
      const recentSnapshot = await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      const recentLogs = recentSnapshot.docs.map(doc => doc.data() as AuditLogDocument);

      return {
        totalLogs,
        logsByActionType,
        recentLogs,
      };
    } catch (error) {
      console.error('Error fetching audit log statistics:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch audit log statistics',
        500
      );
    }
  }
}

// Export singleton instance methods for convenience
export const vvipAuditService = {
  logVvipAction: VvipAuditService.logVvipAction.bind(VvipAuditService),
  getAuditLogsForUser: VvipAuditService.getAuditLogsForUser.bind(VvipAuditService),
  getAuditLogsByActionType: VvipAuditService.getAuditLogsByActionType.bind(VvipAuditService),
  getAuditLogsByAdmin: VvipAuditService.getAuditLogsByAdmin.bind(VvipAuditService),
  getAllAuditLogs: VvipAuditService.getAllAuditLogs.bind(VvipAuditService),
  getAuditLogStatistics: VvipAuditService.getAuditLogStatistics.bind(VvipAuditService),
};
