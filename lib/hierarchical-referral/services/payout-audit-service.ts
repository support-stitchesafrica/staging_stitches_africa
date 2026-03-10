import { adminDb } from '../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { HierarchicalReferralErrorCode } from '../../../types/hierarchical-referral';

/**
 * PayoutAuditService - Service for maintaining detailed transaction history and audit trails
 * Requirements: 8.5
 */
export class HierarchicalPayoutAuditService {
  private static readonly AUDIT_LOGS_COLLECTION = 'hierarchical_audit_logs';
  private static readonly TRANSACTION_HISTORY_COLLECTION = 'hierarchical_transaction_history';
  private static readonly PAYOUT_RECONCILIATION_COLLECTION = 'hierarchical_payout_reconciliation';

  /**
   * Create detailed transaction history record
   * Requirements: 8.5
   */
  static async createTransactionHistory(transactionData: {
    transactionId: string;
    influencerId: string;
    type: 'payout' | 'commission' | 'adjustment' | 'refund';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    metadata: any;
    relatedTransactions?: string[];
  }): Promise<void> {
    try {
      const historyRecord = {
        ...transactionData,
        createdAt: Timestamp.now(),
        version: 1,
        auditTrail: [{
          action: 'created',
          timestamp: Timestamp.now(),
          source: 'payout_audit_service',
          details: { initialStatus: transactionData.status }
        }]
      };

      await adminDb
        .collection(this.TRANSACTION_HISTORY_COLLECTION)
        .doc(transactionData.transactionId)
        .set(historyRecord);

      console.log(`Transaction history created for ${transactionData.transactionId}`);

    } catch (error) {
      console.error('Error creating transaction history:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to create transaction history',
        details: error
      };
    }
  }

  /**
   * Update transaction history with status changes
   * Requirements: 8.5
   */
  static async updateTransactionHistory(
    transactionId: string,
    updates: {
      status?: string;
      metadata?: any;
      error?: string;
      completedAt?: Timestamp;
    },
    auditDetails: {
      action: string;
      source: string;
      userId?: string;
      details?: any;
    }
  ): Promise<void> {
    try {
      const transactionRef = adminDb
        .collection(this.TRANSACTION_HISTORY_COLLECTION)
        .doc(transactionId);

      await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(transactionRef);
        
        if (!doc.exists) {
          throw new Error('Transaction history not found');
        }

        const currentData = doc.data();
        const currentAuditTrail = currentData?.auditTrail || [];

        // Add new audit trail entry
        const newAuditEntry = {
          ...auditDetails,
          timestamp: Timestamp.now(),
          previousStatus: currentData?.status,
          newStatus: updates.status || currentData?.status
        };

        const updatedData = {
          ...updates,
          updatedAt: Timestamp.now(),
          version: (currentData?.version || 1) + 1,
          auditTrail: [...currentAuditTrail, newAuditEntry]
        };

        transaction.update(transactionRef, updatedData);
      });

      console.log(`Transaction history updated for ${transactionId}`);

    } catch (error) {
      console.error('Error updating transaction history:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to update transaction history',
        details: error
      };
    }
  }

  /**
   * Get comprehensive transaction history for an influencer
   * Requirements: 8.5
   */
  static async getInfluencerTransactionHistory(
    influencerId: string,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      transactionTypes?: string[];
      includeAuditTrail?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      let query = adminDb
        .collection(this.TRANSACTION_HISTORY_COLLECTION)
        .where('influencerId', '==', influencerId);

      // Apply filters
      if (options.startDate) {
        query = query.where('createdAt', '>=', Timestamp.fromDate(options.startDate));
      }

      if (options.endDate) {
        query = query.where('createdAt', '<=', Timestamp.fromDate(options.endDate));
      }

      if (options.transactionTypes && options.transactionTypes.length > 0) {
        query = query.where('type', 'in', options.transactionTypes);
      }

      query = query.orderBy('createdAt', 'desc');

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        const result = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        };

        // Include audit trail if requested
        if (options.includeAuditTrail && data.auditTrail) {
          result.auditTrail = data.auditTrail.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate()
          }));
        } else {
          delete result.auditTrail;
        }

        return result;
      });

    } catch (error) {
      console.error('Error getting influencer transaction history:', error);
      return [];
    }
  }

  /**
   * Get system-wide transaction audit log
   * Requirements: 8.5
   */
  static async getSystemAuditLog(
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      eventTypes?: string[];
      influencerId?: string;
    } = {}
  ): Promise<any[]> {
    try {
      let query = adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .where('type', 'in', ['payout_event', 'payout_retry_event', 'transaction_event']);

      // Apply filters
      if (options.startDate) {
        query = query.where('timestamp', '>=', Timestamp.fromDate(options.startDate));
      }

      if (options.endDate) {
        query = query.where('timestamp', '<=', Timestamp.fromDate(options.endDate));
      }

      if (options.influencerId) {
        query = query.where('influencerId', '==', options.influencerId);
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        query = query.where('eventType', 'in', options.eventTypes);
      }

      query = query.orderBy('timestamp', 'desc');

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

    } catch (error) {
      console.error('Error getting system audit log:', error);
      return [];
    }
  }

  /**
   * Create payout reconciliation record
   * Requirements: 8.5
   */
  static async createPayoutReconciliation(reconciliationData: {
    period: { start: Date; end: Date };
    totalPayouts: number;
    totalAmount: number;
    successfulPayouts: number;
    failedPayouts: number;
    discrepancies: any[];
    reconciliationStatus: 'pending' | 'completed' | 'failed';
    performedBy: string;
  }): Promise<string> {
    try {
      const reconciliationId = `reconciliation_${Date.now()}`;
      
      const reconciliationRecord = {
        id: reconciliationId,
        ...reconciliationData,
        period: {
          start: Timestamp.fromDate(reconciliationData.period.start),
          end: Timestamp.fromDate(reconciliationData.period.end)
        },
        createdAt: Timestamp.now(),
        version: 1
      };

      await adminDb
        .collection(this.PAYOUT_RECONCILIATION_COLLECTION)
        .doc(reconciliationId)
        .set(reconciliationRecord);

      // Log reconciliation creation
      await this.logAuditEvent('reconciliation_created', {
        reconciliationId,
        period: reconciliationData.period,
        performedBy: reconciliationData.performedBy
      });

      console.log(`Payout reconciliation created: ${reconciliationId}`);
      return reconciliationId;

    } catch (error) {
      console.error('Error creating payout reconciliation:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to create payout reconciliation',
        details: error
      };
    }
  }

  /**
   * Perform automated payout reconciliation
   * Requirements: 8.5
   */
  static async performPayoutReconciliation(
    period: { start: Date; end: Date },
    performedBy: string = 'system'
  ): Promise<{
    reconciliationId: string;
    summary: {
      totalPayouts: number;
      totalAmount: number;
      successfulPayouts: number;
      failedPayouts: number;
      discrepancies: any[];
    };
  }> {
    try {
      console.log('Starting payout reconciliation for period:', period);

      // Get all payouts in the period
      const payoutsSnapshot = await adminDb
        .collection('hierarchical_payouts')
        .where('processedAt', '>=', Timestamp.fromDate(period.start))
        .where('processedAt', '<=', Timestamp.fromDate(period.end))
        .get();

      const payouts = payoutsSnapshot.docs.map(doc => doc.data());

      // Get all commissions that should have been paid in the period
      const commissionsSnapshot = await adminDb
        .collection('hierarchical_commissions')
        .where('paidAt', '>=', Timestamp.fromDate(period.start))
        .where('paidAt', '<=', Timestamp.fromDate(period.end))
        .where('status', '==', 'paid')
        .get();

      const commissions = commissionsSnapshot.docs.map(doc => doc.data());

      // Calculate summary
      const totalPayouts = payouts.length;
      const totalAmount = payouts.reduce((sum, p) => sum + (p.netAmount || 0), 0);
      const successfulPayouts = payouts.filter(p => p.status === 'success').length;
      const failedPayouts = payouts.filter(p => p.status === 'failed').length;

      // Check for discrepancies
      const discrepancies = await this.findPayoutDiscrepancies(payouts, commissions);

      const summary = {
        totalPayouts,
        totalAmount,
        successfulPayouts,
        failedPayouts,
        discrepancies
      };

      // Create reconciliation record
      const reconciliationId = await this.createPayoutReconciliation({
        period,
        ...summary,
        reconciliationStatus: discrepancies.length > 0 ? 'pending' : 'completed',
        performedBy
      });

      console.log(`Payout reconciliation completed: ${reconciliationId}`);

      return {
        reconciliationId,
        summary
      };

    } catch (error) {
      console.error('Error performing payout reconciliation:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to perform payout reconciliation',
        details: error
      };
    }
  }

  /**
   * Find discrepancies between payouts and commissions
   * Requirements: 8.5
   */
  private static async findPayoutDiscrepancies(payouts: any[], commissions: any[]): Promise<any[]> {
    try {
      const discrepancies: any[] = [];

      // Group commissions by payout transaction ID
      const commissionsByPayout: { [key: string]: any[] } = {};
      commissions.forEach(commission => {
        const payoutId = commission.payoutTransactionId;
        if (payoutId) {
          if (!commissionsByPayout[payoutId]) {
            commissionsByPayout[payoutId] = [];
          }
          commissionsByPayout[payoutId].push(commission);
        }
      });

      // Check each payout against its commissions
      for (const payout of payouts) {
        if (payout.status !== 'success') continue;

        const relatedCommissions = commissionsByPayout[payout.transactionId] || [];
        const expectedAmount = relatedCommissions.reduce((sum, c) => sum + c.amount, 0);
        const actualAmount = payout.grossAmount || 0;

        // Check for amount discrepancies (allowing for small rounding differences)
        const difference = Math.abs(expectedAmount - actualAmount);
        if (difference > 0.01) {
          discrepancies.push({
            type: 'amount_mismatch',
            payoutId: payout.transactionId,
            influencerId: payout.influencerId,
            expectedAmount,
            actualAmount,
            difference,
            description: `Payout amount ${actualAmount} does not match expected commission total ${expectedAmount}`
          });
        }

        // Check for missing commissions
        if (relatedCommissions.length === 0 && actualAmount > 0) {
          discrepancies.push({
            type: 'missing_commissions',
            payoutId: payout.transactionId,
            influencerId: payout.influencerId,
            payoutAmount: actualAmount,
            description: `Payout exists but no related commissions found`
          });
        }
      }

      // Check for orphaned commissions (commissions without payouts)
      const payoutIds = new Set(payouts.map(p => p.transactionId));
      const orphanedCommissions = commissions.filter(c => 
        c.payoutTransactionId && !payoutIds.has(c.payoutTransactionId)
      );

      orphanedCommissions.forEach(commission => {
        discrepancies.push({
          type: 'orphaned_commission',
          commissionId: commission.id,
          influencerId: commission.motherInfluencerId,
          amount: commission.amount,
          payoutTransactionId: commission.payoutTransactionId,
          description: `Commission references non-existent payout ${commission.payoutTransactionId}`
        });
      });

      return discrepancies;

    } catch (error) {
      console.error('Error finding payout discrepancies:', error);
      return [];
    }
  }

  /**
   * Get reconciliation history
   * Requirements: 8.5
   */
  static async getReconciliationHistory(limit: number = 20): Promise<any[]> {
    try {
      const snapshot = await adminDb
        .collection(this.PAYOUT_RECONCILIATION_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          period: {
            start: data.period?.start?.toDate(),
            end: data.period?.end?.toDate()
          }
        };
      });

    } catch (error) {
      console.error('Error getting reconciliation history:', error);
      return [];
    }
  }

  /**
   * Export audit data for compliance
   * Requirements: 8.5
   */
  static async exportAuditData(
    options: {
      startDate: Date;
      endDate: Date;
      influencerId?: string;
      format: 'json' | 'csv';
    }
  ): Promise<{ data: any; filename: string }> {
    try {
      // Get transaction history
      const transactions = await this.getInfluencerTransactionHistory(
        options.influencerId || '',
        {
          startDate: options.startDate,
          endDate: options.endDate,
          includeAuditTrail: true
        }
      );

      // Get audit logs
      const auditLogs = await this.getSystemAuditLog({
        startDate: options.startDate,
        endDate: options.endDate,
        influencerId: options.influencerId
      });

      const exportData = {
        exportMetadata: {
          generatedAt: new Date().toISOString(),
          period: {
            start: options.startDate.toISOString(),
            end: options.endDate.toISOString()
          },
          influencerId: options.influencerId,
          recordCounts: {
            transactions: transactions.length,
            auditLogs: auditLogs.length
          }
        },
        transactions,
        auditLogs
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const influencerSuffix = options.influencerId ? `_${options.influencerId}` : '_all';
      const filename = `payout_audit_export_${timestamp}${influencerSuffix}.${options.format}`;

      if (options.format === 'csv') {
        // Convert to CSV format (simplified)
        const csvData = this.convertToCSV(exportData);
        return { data: csvData, filename };
      }

      return { data: exportData, filename };

    } catch (error) {
      console.error('Error exporting audit data:', error);
      throw {
        code: HierarchicalReferralErrorCode.PAYOUT_ERROR,
        message: 'Failed to export audit data',
        details: error
      };
    }
  }

  /**
   * Convert audit data to CSV format
   * Requirements: 8.5
   */
  private static convertToCSV(data: any): string {
    try {
      const headers = [
        'Type',
        'ID',
        'Influencer ID',
        'Amount',
        'Status',
        'Created At',
        'Description'
      ];

      const rows: string[][] = [headers];

      // Add transaction rows
      data.transactions.forEach((transaction: any) => {
        rows.push([
          'Transaction',
          transaction.id,
          transaction.influencerId,
          transaction.amount?.toString() || '0',
          transaction.status,
          transaction.createdAt?.toISOString() || '',
          `${transaction.type} transaction`
        ]);
      });

      // Add audit log rows
      data.auditLogs.forEach((log: any) => {
        rows.push([
          'Audit Log',
          log.id,
          log.influencerId || '',
          '',
          log.eventType,
          log.timestamp?.toISOString() || '',
          log.eventType
        ]);
      });

      // Convert to CSV string
      return rows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');

    } catch (error) {
      console.error('Error converting to CSV:', error);
      return '';
    }
  }

  /**
   * Log audit events
   * Requirements: 8.5
   */
  private static async logAuditEvent(eventType: string, eventData: any): Promise<void> {
    try {
      const auditLog = {
        type: 'audit_event',
        eventType,
        data: eventData,
        timestamp: Timestamp.now(),
        source: 'payout_audit_service'
      };

      await adminDb
        .collection(this.AUDIT_LOGS_COLLECTION)
        .add(auditLog);

    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error as audit logging failure shouldn't fail the main operation
    }
  }

  /**
   * Get audit statistics for monitoring
   * Requirements: 8.5
   */
  static async getAuditStatistics(period?: { start: Date; end: Date }): Promise<{
    totalTransactions: number;
    totalAuditEvents: number;
    reconciliationsPerformed: number;
    discrepanciesFound: number;
    dataIntegrityScore: number;
  }> {
    try {
      let transactionQuery = adminDb.collection(this.TRANSACTION_HISTORY_COLLECTION);
      let auditQuery = adminDb.collection(this.AUDIT_LOGS_COLLECTION);
      let reconciliationQuery = adminDb.collection(this.PAYOUT_RECONCILIATION_COLLECTION);

      if (period) {
        const startTimestamp = Timestamp.fromDate(period.start);
        const endTimestamp = Timestamp.fromDate(period.end);

        transactionQuery = transactionQuery
          .where('createdAt', '>=', startTimestamp)
          .where('createdAt', '<=', endTimestamp);

        auditQuery = auditQuery
          .where('timestamp', '>=', startTimestamp)
          .where('timestamp', '<=', endTimestamp);

        reconciliationQuery = reconciliationQuery
          .where('createdAt', '>=', startTimestamp)
          .where('createdAt', '<=', endTimestamp);
      }

      const [transactionSnapshot, auditSnapshot, reconciliationSnapshot] = await Promise.all([
        transactionQuery.get(),
        auditQuery.get(),
        reconciliationQuery.get()
      ]);

      const totalTransactions = transactionSnapshot.docs.length;
      const totalAuditEvents = auditSnapshot.docs.length;
      const reconciliationsPerformed = reconciliationSnapshot.docs.length;

      // Count discrepancies from reconciliations
      const discrepanciesFound = reconciliationSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.discrepancies?.length || 0);
      }, 0);

      // Calculate data integrity score (simplified)
      const dataIntegrityScore = totalTransactions > 0 
        ? Math.max(0, 100 - (discrepanciesFound / totalTransactions * 100))
        : 100;

      return {
        totalTransactions,
        totalAuditEvents,
        reconciliationsPerformed,
        discrepanciesFound,
        dataIntegrityScore
      };

    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalTransactions: 0,
        totalAuditEvents: 0,
        reconciliationsPerformed: 0,
        discrepanciesFound: 0,
        dataIntegrityScore: 0
      };
    }
  }
}