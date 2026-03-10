/**
 * Payout Service
 * Handles vendor payout calculations, history, and statement generation
 * 
 * PAYMENT PROVIDER SUPPORT:
 * - Stripe Connect: For vendors with stripeConnectAccountId configured
 * - Flutterwave: For vendors with flutterwaveSubaccount configured
 * 
 * PAYOUT FLOW:
 * 1. Customer places order and pays via Stripe or Flutterwave
 * 2. Order is fulfilled and shipped
 * 3. DHL confirms delivery via webhook (app/api/webhooks/index.ts)
 * 4. Webhook routes to Stripe Connect payout handler (app/api/stripe/connect/payout-webhook/route.ts)
 * 5. Handler verifies:
 *    - Order is paid (payment_status: 'successful' or 'paid')
 *    - Vendor has payment provider configured
 *    - Vendor KYC is complete
 *    - No duplicate payout exists
 * 6. Payout is processed:
 *    - Stripe: Transfer created to connected account
 *    - Flutterwave: Split already processed at payment time via subaccount
 * 7. Payout record saved to 'payouts' collection
 * 8. Vendor notified via email
 * 
 * SPLIT STRUCTURE:
 * - Vendor receives: 80% of order amount
 * - Platform keeps: 20% of order amount
 * - Same split for both Stripe and Flutterwave
 * 
 * DATA SOURCES:
 * - payouts: Historical payout records (created by webhook)
 * - users_orders: Order data including payment status
 * - tailors: Vendor data including payment provider config
 * - vendor_balances: Current balance (if exists)
 */

import { BaseVendorService } from './base-service';
import {
  PayoutMetrics,
  PayoutRecord,
  FeeBreakdown,
  PayoutTransaction,
  PayoutCalendarEntry,
  ServiceResponse
} from '@/types/vendor-analytics';
import { db } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';

export type PaymentProvider = 'stripe' | 'flutterwave';

export interface VendorPaymentConfig {
  provider: PaymentProvider;
  stripeConnectAccountId?: string;
  flutterwaveSubaccount?: {
    id: number;
    subaccount_id: string;
    account_bank: string;
    account_number: string;
    business_name: string;
    split_type: string;
    split_value: number;
  };
}

export class PayoutService extends BaseVendorService {
  // Platform takes 20%, vendor gets 80% (same for both Stripe and Flutterwave)
  private readonly VENDOR_SPLIT_PERCENTAGE = 0.80; // 80%
  private readonly PLATFORM_SPLIT_PERCENTAGE = 0.20; // 20%
  
  // Payment processing fees (for reference, actual fees handled by providers)
  private readonly STRIPE_PROCESSING_FEE_RATE = 0.029; // 2.9% + $0.30
  private readonly FLUTTERWAVE_PROCESSING_FEE_RATE = 0.014; // 1.4%

  constructor() {
    super('PayoutService');
  }

  /**
   * Retrieves comprehensive payout information for a vendor
   */
  async getPayoutDetails(vendorId: string): Promise<ServiceResponse<PayoutMetrics>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const [balance, history, calendar] = await Promise.all([
        this.getBalance(vendorId),
        this.getPayoutHistory(vendorId),
        this.getPayoutCalendar(vendorId)
      ]);

      const totalEarnings = this.aggregate(history.map(p => p.amount), 'sum');
      const totalFees = this.aggregate(history.map(p => p.fees.totalFees), 'sum');

      return {
        pendingBalance: balance.pending,
        availableBalance: balance.available,
        nextPayoutDate: calendar[0]?.date || new Date(),
        nextPayoutAmount: calendar[0]?.amount || 0,
        totalEarnings,
        totalFees,
        payoutHistory: history,
        calendar
      };
    }, 'getPayoutDetails');
  }

  /**
   * Retrieves current balance information
   */
  private async getBalance(vendorId: string): Promise<{ pending: number; available: number }> {
    try {
      // Query vendor balance document
      const balanceDoc = await getDoc(doc(db, 'vendor_balances', vendorId));
      
      if (balanceDoc.exists()) {
        const data = balanceDoc.data();
        return {
          pending: data.pendingBalance || 0,
          available: data.availableBalance || 0
        };
      }

      // If no balance document exists, calculate from orders
      return this.calculateBalanceFromOrders(vendorId);
    } catch (error) {
      this.log('warn', 'Balance document not found, calculating from orders', { vendorId });
      return this.calculateBalanceFromOrders(vendorId);
    }
  }

  /**
   * Calculates balance from order data when balance document doesn't exist
   * Note: Payouts are triggered automatically when DHL confirms delivery
   */
  private async calculateBalanceFromOrders(vendorId: string): Promise<{ pending: number; available: number }> {
    const ordersQuery = query(
      collection(db, "staging_users_orders"),
      where('tailorUID', '==', vendorId),
      where('payment_status', 'in', ['successful', 'paid'])
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    let pending = 0;
    let available = 0;

    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const amount = order.price || 0;
      
      // Vendor gets 80% of order amount
      const netAmount = amount * this.VENDOR_SPLIT_PERCENTAGE;

      // Available: Delivered but payout not yet processed
      if (order.order_status === 'delivered' && !order.payoutProcessed) {
        available += netAmount;
      } 
      // Pending: Order paid but not yet delivered
      else if (order.order_status !== 'delivered' && order.order_status !== 'cancelled') {
        pending += netAmount;
      }
    });

    return { pending, available };
  }

  /**
   * Retrieves payout history for a vendor
   * Queries the 'payouts' collection which is populated by the DHL delivery webhook
   */
  async getPayoutHistory(
    vendorId: string,
    limit: number = 50
  ): Promise<PayoutRecord[]> {
    try {
      // Query the 'payouts' collection (created by webhook on delivery confirmation)
      const payoutsQuery = query(
        collection(db, "staging_payouts"),
        where('tailorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      const payoutsSnapshot = await getDocs(payoutsQuery);
      
      return payoutsSnapshot.docs.map(doc => {
        const data = doc.data();
        const paymentProvider = data.paymentProvider || 'stripe';
        
        // Calculate fees based on provider
        const fees = this.calculateFeesFromPayoutData(data);
        
        return {
          id: doc.id,
          amount: data.totalAmount || 0,
          fees,
          netAmount: data.vendorAmount || 0,
          status: data.status || 'processing',
          transferDate: data.createdAt?.toDate() || new Date(),
          paystackReference: data.stripeTransferId || data.flutterwaveSubaccountId || '',
          failureReason: data.error || data.failureDetails?.errorMessage,
          statementUrl: data.statementUrl,
          transactions: this.extractTransactionsFromPayout(data)
        };
      });
    } catch (error) {
      this.log('warn', 'Payout history not found', { vendorId, error });
      return [];
    }
  }

  /**
   * Extracts transaction details from payout data
   */
  private extractTransactionsFromPayout(payoutData: any): PayoutTransaction[] {
    // If transactions are explicitly stored, use them
    if (payoutData.transactions && Array.isArray(payoutData.transactions)) {
      return payoutData.transactions;
    }

    // Otherwise, create a single transaction from the order
    if (payoutData.orderId) {
      return [{
        orderId: payoutData.orderId,
        date: payoutData.createdAt?.toDate() || new Date(),
        amount: payoutData.totalAmount || 0,
        commission: payoutData.platformAmount || 0,
        netAmount: payoutData.vendorAmount || 0
      }];
    }

    return [];
  }

  /**
   * Calculates fees from payout data
   */
  private calculateFeesFromPayoutData(payoutData: any): FeeBreakdown {
    const totalAmount = payoutData.totalAmount || 0;
    const vendorAmount = payoutData.vendorAmount || 0;
    const platformAmount = payoutData.platformAmount || 0;
    
    // Platform commission is the difference between total and vendor amount
    const platformCommission = platformAmount;
    const commissionRate = totalAmount > 0 ? platformAmount / totalAmount : this.PLATFORM_SPLIT_PERCENTAGE;
    
    // Payment processing fees are handled by the payment provider
    // For display purposes, we estimate based on provider
    const provider = payoutData.paymentProvider || 'stripe';
    const processingFeeRate = provider === 'flutterwave' 
      ? this.FLUTTERWAVE_PROCESSING_FEE_RATE 
      : this.STRIPE_PROCESSING_FEE_RATE;
    
    const paymentProcessingFee = totalAmount * processingFeeRate;
    
    return {
      platformCommission,
      commissionRate,
      paymentProcessingFee,
      otherFees: 0,
      totalFees: platformCommission
    };
  }

  /**
   * Retrieves a specific payout record by ID
   */
  async getPayoutRecord(payoutId: string): Promise<ServiceResponse<PayoutRecord>> {
    return this.executeWithErrorHandling(async () => {
      const payoutDoc = await getDoc(doc(db, 'vendor_payouts', payoutId));
      
      if (!payoutDoc.exists()) {
        throw new Error('Payout record not found');
      }

      const data = payoutDoc.data();
      return {
        id: payoutDoc.id,
        amount: data.amount || 0,
        fees: data.fees || this.createEmptyFeeBreakdown(),
        netAmount: data.netAmount || 0,
        status: data.status || 'processing',
        transferDate: data.transferDate?.toDate() || new Date(),
        paystackReference: data.paystackReference || '',
        failureReason: data.failureReason,
        statementUrl: data.statementUrl,
        transactions: data.transactions || []
      };
    }, 'getPayoutRecord');
  }

  /**
   * Generates payout calendar showing upcoming payouts
   */
  async getPayoutCalendar(vendorId: string): Promise<PayoutCalendarEntry[]> {
    try {
      // Query scheduled payouts
      const calendarQuery = query(
        collection(db, 'payout_calendar'),
        where('vendorId', '==', vendorId),
        where('date', '>=', Timestamp.now()),
        orderBy('date', 'asc'),
        firestoreLimit(12) // Next 12 scheduled payouts
      );

      const calendarSnapshot = await getDocs(calendarQuery);
      
      return calendarSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.date?.toDate() || new Date(),
          amount: data.amount || 0,
          status: data.status || 'scheduled'
        };
      });
    } catch (error) {
      this.log('warn', 'Payout calendar not found, generating default', { vendorId });
      return this.generateDefaultPayoutCalendar(vendorId);
    }
  }

  /**
   * Generates a default payout calendar based on standard schedule
   */
  private async generateDefaultPayoutCalendar(vendorId: string): Promise<PayoutCalendarEntry[]> {
    const balance = await this.getBalance(vendorId);
    const calendar: PayoutCalendarEntry[] = [];
    
    // Generate next 3 months of bi-weekly payouts
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const payoutDate = new Date(today);
      payoutDate.setDate(today.getDate() + (i * 14)); // Every 2 weeks
      
      calendar.push({
        date: payoutDate,
        amount: i === 0 ? balance.available : 0,
        status: i === 0 ? 'scheduled' : 'scheduled'
      });
    }

    return calendar;
  }

  /**
   * Calculates fee breakdown for a given amount
   * Platform takes 20%, vendor gets 80% (same for both Stripe and Flutterwave)
   */
  calculateFees(
    grossAmount: number,
    provider: PaymentProvider = 'stripe'
  ): FeeBreakdown {
    const platformCommission = grossAmount * this.PLATFORM_SPLIT_PERCENTAGE;
    
    // Payment processing fees (for reference - actual fees handled by providers)
    const processingFeeRate = provider === 'flutterwave' 
      ? this.FLUTTERWAVE_PROCESSING_FEE_RATE 
      : this.STRIPE_PROCESSING_FEE_RATE;
    const paymentProcessingFee = grossAmount * processingFeeRate;
    
    const otherFees = 0;
    const totalFees = platformCommission;

    return {
      platformCommission,
      commissionRate: this.PLATFORM_SPLIT_PERCENTAGE,
      paymentProcessingFee,
      otherFees,
      totalFees
    };
  }

  /**
   * Gets vendor's payment provider configuration
   */
  async getVendorPaymentConfig(vendorId: string): Promise<ServiceResponse<VendorPaymentConfig>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const vendorDoc = await getDoc(doc(db, "staging_tailors", vendorId));
      
      if (!vendorDoc.exists()) {
        throw new Error('Vendor not found');
      }

      const vendorData = vendorDoc.data();
      
      // Determine which payment provider is configured
      const hasStripe = !!vendorData.stripeConnectAccountId;
      const hasFlutterwave = !!vendorData.flutterwaveSubaccount;

      if (!hasStripe && !hasFlutterwave) {
        throw new Error('No payment provider configured for vendor');
      }

      // Prefer Stripe if both are configured
      const provider: PaymentProvider = hasStripe ? 'stripe' : 'flutterwave';

      return {
        provider,
        stripeConnectAccountId: vendorData.stripeConnectAccountId,
        flutterwaveSubaccount: vendorData.flutterwaveSubaccount
      };
    }, 'getVendorPaymentConfig');
  }

  /**
   * Retrieves transactions for a specific payout
   */
  async getPayoutTransactions(payoutId: string): Promise<PayoutTransaction[]> {
    try {
      const payoutDoc = await getDoc(doc(db, 'vendor_payouts', payoutId));
      
      if (!payoutDoc.exists()) {
        return [];
      }

      const data = payoutDoc.data();
      return data.transactions || [];
    } catch (error) {
      this.log('error', 'Failed to retrieve payout transactions', { payoutId, error });
      return [];
    }
  }

  /**
   * Generates a PDF statement for a payout
   */
  async generatePayoutStatement(
    vendorId: string,
    payoutId: string
  ): Promise<ServiceResponse<Blob>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      // Get payout details
      const payoutResponse = await this.getPayoutRecord(payoutId);
      if (!payoutResponse.success || !payoutResponse.data) {
        throw new Error('Payout record not found');
      }

      const payout = payoutResponse.data;
      const transactions = await this.getPayoutTransactions(payoutId);

      // Generate PDF content
      const pdfContent = this.createPDFStatement(payout, transactions, vendorId);
      
      // Convert to Blob
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      
      return blob;
    }, 'generatePayoutStatement');
  }

  /**
   * Creates PDF statement content
   * Note: This is a simplified text version. In production, use jsPDF or PDFKit for proper PDF generation
   */
  private createPDFStatement(
    payout: PayoutRecord,
    transactions: PayoutTransaction[],
    vendorId: string
  ): string {
    const statement = `
STITCHES AFRICA - PAYOUT STATEMENT
===================================

Vendor ID: ${vendorId}
Payout ID: ${payout.id}
Transfer Date: ${payout.transferDate.toLocaleDateString()}
Status: ${payout.status.toUpperCase()}

PAYOUT SUMMARY
--------------
Gross Amount: $${payout.amount.toFixed(2)}
Platform Commission (20%): $${payout.fees.platformCommission.toFixed(2)}
Payment Processing Fee: $${payout.fees.paymentProcessingFee.toFixed(2)}
Other Fees: $${payout.fees.otherFees.toFixed(2)}
Total Deductions: $${payout.fees.totalFees.toFixed(2)}
Net Amount Paid: $${payout.netAmount.toFixed(2)}

SPLIT BREAKDOWN
---------------
Vendor Share (80%): $${payout.netAmount.toFixed(2)}
Platform Share (20%): $${payout.fees.platformCommission.toFixed(2)}

TRANSACTIONS
------------
${transactions.length > 0 ? transactions.map((t, i) => `
${i + 1}. Order ID: ${t.orderId}
   Date: ${t.date.toLocaleDateString()}
   Gross Amount: $${t.amount.toFixed(2)}
   Platform Commission: $${t.commission.toFixed(2)}
   Net to Vendor: $${t.netAmount.toFixed(2)}
`).join('\n') : 'No transaction details available'}

PAYMENT DETAILS
---------------
Payment Reference: ${payout.paystackReference || 'N/A'}
Payment Method: ${payout.paystackReference.includes('acct_') ? 'Stripe Connect' : 'Flutterwave'}
${payout.failureReason ? `\nFAILURE REASON\n--------------\n${payout.failureReason}` : ''}

NOTES
-----
- Payouts are automatically processed when DHL confirms delivery
- Platform commission is 20% of gross order amount
- Vendor receives 80% of gross order amount
- Payment processing fees are handled by the payment provider

Generated: ${new Date().toLocaleString()}
Document ID: ${payout.id}

For questions about this payout, please contact support@stitchesafrica.com
    `.trim();

    return statement;
  }

  /**
   * Exports payout history as CSV
   */
  async exportPayoutHistory(
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceResponse<Blob>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const history = await this.getPayoutHistory(vendorId, 1000);
      
      // Filter by date range if provided
      let filteredHistory = history;
      if (startDate || endDate) {
        filteredHistory = history.filter(p => {
          const date = p.transferDate;
          if (startDate && date < startDate) return false;
          if (endDate && date > endDate) return false;
          return true;
        });
      }

      // Generate CSV content
      const csvContent = this.createCSVContent(filteredHistory);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      
      return blob;
    }, 'exportPayoutHistory');
  }

  /**
   * Creates CSV content from payout history
   */
  private createCSVContent(payouts: PayoutRecord[]): string {
    const headers = [
      'Payout ID',
      'Transfer Date',
      'Status',
      'Gross Amount',
      'Platform Commission',
      'Commission Rate',
      'Payment Processing Fee',
      'Other Fees',
      'Total Fees',
      'Net Amount',
      'Paystack Reference',
      'Failure Reason'
    ];

    const rows = payouts.map(p => [
      p.id,
      p.transferDate.toISOString(),
      p.status,
      p.amount.toFixed(2),
      p.fees.platformCommission.toFixed(2),
      (p.fees.commissionRate * 100).toFixed(1) + '%',
      p.fees.paymentProcessingFee.toFixed(2),
      p.fees.otherFees.toFixed(2),
      p.fees.totalFees.toFixed(2),
      p.netAmount.toFixed(2),
      p.paystackReference,
      p.failureReason || ''
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Creates an empty fee breakdown structure
   */
  private createEmptyFeeBreakdown(): FeeBreakdown {
    return {
      platformCommission: 0,
      commissionRate: this.PLATFORM_SPLIT_PERCENTAGE,
      paymentProcessingFee: 0,
      otherFees: 0,
      totalFees: 0
    };
  }

  /**
   * Checks if vendor has payment provider configured
   */
  async hasPaymentProviderConfigured(vendorId: string): Promise<ServiceResponse<{
    hasProvider: boolean;
    provider?: PaymentProvider;
    details: {
      hasStripe: boolean;
      hasFlutterwave: boolean;
      stripeAccountId?: string;
      flutterwaveSubaccountId?: string;
    };
  }>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const vendorDoc = await getDoc(doc(db, "staging_tailors", vendorId));
      
      if (!vendorDoc.exists()) {
        throw new Error('Vendor not found');
      }

      const vendorData = vendorDoc.data();
      
      const hasStripe = !!vendorData.stripeConnectAccountId;
      const hasFlutterwave = !!vendorData.flutterwaveSubaccount?.subaccount_id;
      const hasProvider = hasStripe || hasFlutterwave;
      const provider: PaymentProvider | undefined = hasStripe ? 'stripe' : hasFlutterwave ? 'flutterwave' : undefined;

      return {
        hasProvider,
        provider,
        details: {
          hasStripe,
          hasFlutterwave,
          stripeAccountId: vendorData.stripeConnectAccountId,
          flutterwaveSubaccountId: vendorData.flutterwaveSubaccount?.subaccount_id
        }
      };
    }, 'hasPaymentProviderConfigured');
  }

  /**
   * Validates payout status
   */
  validatePayoutStatus(status: string): boolean {
    const validStatuses = ['processing', 'paid', 'failed'];
    return validStatuses.includes(status);
  }

  /**
   * Calculates net amount after fees
   */
  calculateNetAmount(grossAmount: number, fees: FeeBreakdown): number {
    return grossAmount - fees.totalFees;
  }

  /**
   * Gets payout statistics for a vendor
   */
  async getPayoutStatistics(vendorId: string): Promise<ServiceResponse<{
    totalPayouts: number;
    successfulPayouts: number;
    failedPayouts: number;
    processingPayouts: number;
    totalEarnings: number;
    totalFees: number;
    averagePayoutAmount: number;
    lastPayoutDate?: Date;
  }>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const history = await this.getPayoutHistory(vendorId, 1000);

      const stats = {
        totalPayouts: history.length,
        successfulPayouts: history.filter(p => p.status === 'paid').length,
        failedPayouts: history.filter(p => p.status === 'failed').length,
        processingPayouts: history.filter(p => p.status === 'processing').length,
        totalEarnings: this.aggregate(history.map(p => p.amount), 'sum'),
        totalFees: this.aggregate(history.map(p => p.fees.totalFees), 'sum'),
        averagePayoutAmount: history.length > 0 
          ? this.aggregate(history.map(p => p.amount), 'sum') / history.length 
          : 0,
        lastPayoutDate: history.length > 0 ? history[0].transferDate : undefined
      };

      return stats;
    }, 'getPayoutStatistics');
  }
}

// Export singleton instance
export const payoutService = new PayoutService();
