// Voucher Transaction Repository for Firestore
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase';
import { VoucherTransaction, VoucherAdminLog } from '@/types/suregifts';

export class VoucherRepository {
  private static readonly TRANSACTIONS_COLLECTION = 'voucher_transactions';
  private static readonly ADMIN_LOGS_COLLECTION = 'voucher_admin_logs';

  /**
   * Save voucher transaction to Firestore
   */
  static async saveTransaction(transaction: Omit<VoucherTransaction, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.TRANSACTIONS_COLLECTION), {
        ...transaction,
        createdAt: Timestamp.fromDate(transaction.createdAt),
        completedAt: transaction.completedAt ? Timestamp.fromDate(transaction.completedAt) : null
      });

      console.log('[VoucherRepository] Transaction saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[VoucherRepository] Failed to save transaction:', error);
      throw new Error('Failed to save voucher transaction');
    }
  }

  /**
   * Update voucher transaction status
   */
  static async updateTransactionStatus(
    transactionId: string, 
    status: VoucherTransaction['status'],
    error?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.TRANSACTIONS_COLLECTION, transactionId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
      }

      if (error) {
        updateData.error = error;
      }

      await updateDoc(docRef, updateData);
      console.log('[VoucherRepository] Transaction status updated:', transactionId, status);
    } catch (error) {
      console.error('[VoucherRepository] Failed to update transaction:', error);
      throw new Error('Failed to update voucher transaction');
    }
  }

  /**
   * Get user's voucher transactions
   */
  static async getUserTransactions(userId: string, limitCount: number = 10): Promise<VoucherTransaction[]> {
    try {
      const q = query(
        collection(db, this.TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transactions: VoucherTransaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          voucherCode: data.voucherCode,
          orderId: data.orderId,
          userId: data.userId,
          amountRedeemed: data.amountRedeemed,
          remainingBalance: data.remainingBalance,
          transactionId: data.transactionId,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          error: data.error
        });
      });

      return transactions;
    } catch (error) {
      console.error('[VoucherRepository] Failed to get user transactions:', error);
      throw new Error('Failed to retrieve voucher transactions');
    }
  }

  /**
   * Get transactions by order ID
   */
  static async getTransactionsByOrder(orderId: string): Promise<VoucherTransaction[]> {
    try {
      const q = query(
        collection(db, this.TRANSACTIONS_COLLECTION),
        where('orderId', '==', orderId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions: VoucherTransaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          voucherCode: data.voucherCode,
          orderId: data.orderId,
          userId: data.userId,
          amountRedeemed: data.amountRedeemed,
          remainingBalance: data.remainingBalance,
          transactionId: data.transactionId,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          error: data.error
        });
      });

      return transactions;
    } catch (error) {
      console.error('[VoucherRepository] Failed to get order transactions:', error);
      throw new Error('Failed to retrieve order voucher transactions');
    }
  }

  /**
   * Save admin log entry
   */
  static async saveAdminLog(log: Omit<VoucherAdminLog, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.ADMIN_LOGS_COLLECTION), {
        ...log,
        timestamp: Timestamp.fromDate(log.timestamp)
      });

      console.log('[VoucherRepository] Admin log saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[VoucherRepository] Failed to save admin log:', error);
      throw new Error('Failed to save voucher admin log');
    }
  }

  /**
   * Get admin logs for reporting
   */
  static async getAdminLogs(limitCount: number = 50): Promise<VoucherAdminLog[]> {
    try {
      const q = query(
        collection(db, this.ADMIN_LOGS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const logs: VoucherAdminLog[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          voucherCode: data.voucherCode,
          orderId: data.orderId,
          customerEmail: data.customerEmail,
          amountRedeemed: data.amountRedeemed,
          transactionId: data.transactionId,
          timestamp: data.timestamp.toDate(),
          status: data.status,
          error: data.error
        });
      });

      return logs;
    } catch (error) {
      console.error('[VoucherRepository] Failed to get admin logs:', error);
      throw new Error('Failed to retrieve voucher admin logs');
    }
  }

  /**
   * Get voucher analytics data
   */
  static async getVoucherAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalRedemptions: number;
    totalAmountRedeemed: number;
    successfulRedemptions: number;
    failedRedemptions: number;
  }> {
    try {
      let q = query(collection(db, this.TRANSACTIONS_COLLECTION));

      if (startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
      
      let totalRedemptions = 0;
      let totalAmountRedeemed = 0;
      let successfulRedemptions = 0;
      let failedRedemptions = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalRedemptions++;
        
        if (data.status === 'completed') {
          successfulRedemptions++;
          totalAmountRedeemed += data.amountRedeemed || 0;
        } else if (data.status === 'failed') {
          failedRedemptions++;
        }
      });

      return {
        totalRedemptions,
        totalAmountRedeemed,
        successfulRedemptions,
        failedRedemptions
      };
    } catch (error) {
      console.error('[VoucherRepository] Failed to get analytics:', error);
      throw new Error('Failed to retrieve voucher analytics');
    }
  }
}