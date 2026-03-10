// Voucher Payment Integration Service
import { 
  SureGiftsVoucher, 
  PaymentWithVoucher, 
  VoucherPaymentBreakdown,
  VoucherTransaction 
} from '@/types/suregifts';
import { SureGiftsService } from './suregifts-service';
import { VoucherRepository } from './voucher-repository';
import { PaymentService, PaymentData, PaymentResult } from '@/lib/payment-service';

export class VoucherPaymentService {
  /**
   * Calculate payment breakdown with voucher
   */
  static calculatePaymentBreakdown(
    totalAmount: number,
    voucher: SureGiftsVoucher | null,
    currency: string
  ): VoucherPaymentBreakdown {
    if (!voucher || voucher.balance <= 0) {
      return {
        totalAmount,
        voucherAmount: 0,
        remainingAmount: totalAmount,
        currency
      };
    }

    const voucherAmount = Math.min(voucher.balance, totalAmount);
    const remainingAmount = Math.max(0, totalAmount - voucherAmount);

    return {
      totalAmount,
      voucherAmount,
      remainingAmount,
      voucherCode: voucher.code,
      currency
    };
  }

  /**
   * Process payment with voucher (full or partial)
   */
  static async processVoucherPayment(
    voucher: SureGiftsVoucher,
    totalAmount: number,
    orderId: string,
    userId: string,
    customerEmail: string,
    customerName: string,
    additionalPaymentData?: PaymentData
  ): Promise<{
    success: boolean;
    voucherRedeemed: boolean;
    voucherAmount: number;
    remainingAmount: number;
    voucherTransactionId?: string;
    paymentResult?: PaymentResult;
    error?: string;
  }> {
    const breakdown = this.calculatePaymentBreakdown(totalAmount, voucher, 'USD');
    
    try {
      // Step 1: Redeem voucher
      console.log(`[VoucherPayment] Redeeming voucher ${voucher.code} for ${breakdown.voucherAmount}`);
      
      const voucherRedemption = await SureGiftsService.redeemVoucher(
        voucher.code,
        breakdown.voucherAmount,
        orderId,
        customerEmail,
        customerName
      );

      if (!voucherRedemption.success) {
        return {
          success: false,
          voucherRedeemed: false,
          voucherAmount: 0,
          remainingAmount: totalAmount,
          error: voucherRedemption.error || 'Voucher redemption failed'
        };
      }

      // Save voucher transaction
      const voucherTransaction: Omit<VoucherTransaction, 'id'> = {
        voucherCode: voucher.code,
        orderId,
        userId,
        amountRedeemed: voucherRedemption.amountRedeemed,
        remainingBalance: voucherRedemption.remainingBalance,
        transactionId: voucherRedemption.transactionId || `voucher_${Date.now()}`,
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date()
      };

      const voucherTransactionId = await VoucherRepository.saveTransaction(voucherTransaction);

      // Save admin log
      await VoucherRepository.saveAdminLog({
        voucherCode: voucher.code,
        orderId,
        customerEmail,
        amountRedeemed: voucherRedemption.amountRedeemed,
        transactionId: voucherRedemption.transactionId || '',
        timestamp: new Date(),
        status: 'success'
      });

      console.log(`[VoucherPayment] Voucher redeemed successfully: ${voucherRedemption.amountRedeemed}`);

      // Step 2: Process additional payment if needed
      if (breakdown.remainingAmount > 0 && additionalPaymentData) {
        console.log(`[VoucherPayment] Processing additional payment: ${breakdown.remainingAmount}`);
        
        const paymentData: PaymentData = {
          ...additionalPaymentData,
          amount: breakdown.remainingAmount,
          description: `${additionalPaymentData.description} (Partial payment after voucher)`
        };

        const paymentResult = await PaymentService.initializePayment(paymentData);

        return {
          success: paymentResult.success,
          voucherRedeemed: true,
          voucherAmount: voucherRedemption.amountRedeemed,
          remainingAmount: breakdown.remainingAmount,
          voucherTransactionId,
          paymentResult,
          error: paymentResult.success ? undefined : paymentResult.error
        };
      }

      // Voucher covers full amount
      return {
        success: true,
        voucherRedeemed: true,
        voucherAmount: voucherRedemption.amountRedeemed,
        remainingAmount: 0,
        voucherTransactionId
      };

    } catch (error) {
      console.error('[VoucherPayment] Payment processing failed:', error);
      
      // Try to save failed transaction for tracking
      try {
        const failedTransaction: Omit<VoucherTransaction, 'id'> = {
          voucherCode: voucher.code,
          orderId,
          userId,
          amountRedeemed: 0,
          remainingBalance: voucher.balance,
          transactionId: `failed_${Date.now()}`,
          status: 'failed',
          createdAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        await VoucherRepository.saveTransaction(failedTransaction);

        await VoucherRepository.saveAdminLog({
          voucherCode: voucher.code,
          orderId,
          customerEmail,
          amountRedeemed: 0,
          transactionId: failedTransaction.transactionId,
          timestamp: new Date(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('[VoucherPayment] Failed to save error log:', logError);
      }

      return {
        success: false,
        voucherRedeemed: false,
        voucherAmount: 0,
        remainingAmount: totalAmount,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Validate voucher for payment
   */
  static async validateVoucherForPayment(
    voucherCode: string,
    totalAmount: number
  ): Promise<{
    valid: boolean;
    voucher?: SureGiftsVoucher;
    canCoverFull: boolean;
    coverageAmount: number;
    error?: string;
  }> {
    try {
      const validation = await SureGiftsService.validateVoucher(voucherCode);

      if (!validation.success || !validation.voucher) {
        return {
          valid: false,
          canCoverFull: false,
          coverageAmount: 0,
          error: validation.error || 'Invalid voucher'
        };
      }

      const voucher = validation.voucher;
      const coverageAmount = Math.min(voucher.balance, totalAmount);
      const canCoverFull = voucher.balance >= totalAmount;

      return {
        valid: true,
        voucher,
        canCoverFull,
        coverageAmount
      };
    } catch (error) {
      return {
        valid: false,
        canCoverFull: false,
        coverageAmount: 0,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Get payment options based on voucher coverage
   */
  static getPaymentOptions(
    totalAmount: number,
    voucher: SureGiftsVoucher | null,
    currency: string
  ): {
    voucherOnly: boolean;
    hybridPayment: boolean;
    regularPayment: boolean;
    breakdown: VoucherPaymentBreakdown;
  } {
    const breakdown = this.calculatePaymentBreakdown(totalAmount, voucher, currency);

    return {
      voucherOnly: breakdown.remainingAmount === 0,
      hybridPayment: breakdown.voucherAmount > 0 && breakdown.remainingAmount > 0,
      regularPayment: breakdown.voucherAmount === 0,
      breakdown
    };
  }

  /**
   * Format payment summary for display
   */
  static formatPaymentSummary(breakdown: VoucherPaymentBreakdown): string {
    if (breakdown.voucherAmount === 0) {
      return `Total: ${breakdown.currency} ${breakdown.totalAmount.toFixed(2)}`;
    }

    if (breakdown.remainingAmount === 0) {
      return `Paid with voucher: ${breakdown.currency} ${breakdown.voucherAmount.toFixed(2)}`;
    }

    return `Voucher: ${breakdown.currency} ${breakdown.voucherAmount.toFixed(2)}, Remaining: ${breakdown.currency} ${breakdown.remainingAmount.toFixed(2)}`;
  }
}