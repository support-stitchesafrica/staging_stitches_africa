// SureGifts API Service
import { 
  SureGiftsVoucher, 
  VoucherValidationRequest, 
  VoucherValidationResponse,
  VoucherRedemptionRequest,
  VoucherRedemptionResponse,
  VoucherTransaction,
  VoucherErrorCode,
  VoucherError
} from '@/types/suregifts';

export class SureGiftsService {
  private static readonly API_BASE_URL = process.env.SUREGIFTS_API_URL || 'https://api.suregifts.com.ng/v1';
  private static readonly API_KEY = process.env.SUREGIFTS_API_KEY;
  private static readonly SECRET_KEY = process.env.SUREGIFTS_SECRET_KEY;

  /**
   * Validate SureGifts configuration
   */
  private static validateConfig(): void {
    if (!this.API_KEY || !this.SECRET_KEY) {
      throw new VoucherError(
        VoucherErrorCode.API_ERROR,
        'SureGifts API credentials not configured'
      );
    }
  }

  /**
   * Generate API signature for request authentication
   */
  private static generateSignature(payload: string): string {
    if (!this.SECRET_KEY) {
      throw new VoucherError(
        VoucherErrorCode.API_ERROR,
        'SureGifts secret key not configured'
      );
    }

    // In a real implementation, you would use HMAC-SHA256
    // For now, we'll use a simple hash (replace with proper HMAC in production)
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(payload)
      .digest('hex');
  }

  /**
   * Make authenticated API request to SureGifts
   */
  private static async makeApiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any
  ): Promise<T> {
    this.validateConfig();

    const url = `${this.API_BASE_URL}${endpoint}`;
    const payload = data ? JSON.stringify(data) : '';
    const signature = this.generateSignature(payload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
      'X-Signature': signature,
      'X-Timestamp': Date.now().toString(),
    };

    try {
      console.log(`[SureGifts] Making ${method} request to ${endpoint}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? payload : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new VoucherError(
          VoucherErrorCode.API_ERROR,
          errorData.message || `API request failed with status ${response.status}`,
          { status: response.status, errorData }
        );
      }

      const result = await response.json();
      console.log(`[SureGifts] API response:`, result);
      
      return result;
    } catch (error) {
      console.error(`[SureGifts] API request failed:`, error);
      
      if (error instanceof VoucherError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VoucherError(
          VoucherErrorCode.NETWORK_ERROR,
          'Network error while connecting to SureGifts API'
        );
      }

      throw new VoucherError(
        VoucherErrorCode.API_ERROR,
        error instanceof Error ? error.message : 'Unknown API error'
      );
    }
  }

  /**
   * Validate a voucher code
   */
  static async validateVoucher(voucherCode: string): Promise<VoucherValidationResponse> {
    try {
      if (!voucherCode || voucherCode.trim().length === 0) {
        return {
          success: false,
          error: 'Voucher code is required',
          errorCode: VoucherErrorCode.VALIDATION_ERROR
        };
      }

      const request: VoucherValidationRequest = {
        voucherCode: voucherCode.trim().toUpperCase()
      };

      const response = await this.makeApiRequest<any>('/vouchers/validate', 'POST', request);

      if (response.success && response.voucher) {
        const voucher: SureGiftsVoucher = {
          code: response.voucher.code,
          balance: parseFloat(response.voucher.balance),
          currency: response.voucher.currency || 'NGN',
          expiryDate: response.voucher.expiryDate,
          status: response.voucher.status,
          isValid: response.voucher.isValid
        };

        return {
          success: true,
          voucher
        };
      }

      return {
        success: false,
        error: response.message || 'Invalid voucher code',
        errorCode: response.errorCode || VoucherErrorCode.INVALID_CODE
      };
    } catch (error) {
      console.error('[SureGifts] Voucher validation failed:', error);
      
      if (error instanceof VoucherError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code
        };
      }

      return {
        success: false,
        error: 'Failed to validate voucher. Please try again.',
        errorCode: VoucherErrorCode.API_ERROR
      };
    }
  }

  /**
   * Redeem a voucher for payment
   */
  static async redeemVoucher(
    voucherCode: string,
    amount: number,
    orderId: string,
    customerEmail: string,
    customerName: string
  ): Promise<VoucherRedemptionResponse> {
    try {
      if (!voucherCode || !orderId || !customerEmail || amount <= 0) {
        return {
          success: false,
          amountRedeemed: 0,
          remainingBalance: 0,
          error: 'Invalid redemption parameters',
          errorCode: VoucherErrorCode.VALIDATION_ERROR
        };
      }

      const request: VoucherRedemptionRequest = {
        voucherCode: voucherCode.trim().toUpperCase(),
        amount,
        orderId,
        customerEmail,
        customerName
      };

      const response = await this.makeApiRequest<any>('/vouchers/redeem', 'POST', request);

      if (response.success) {
        return {
          success: true,
          transactionId: response.transactionId,
          amountRedeemed: parseFloat(response.amountRedeemed),
          remainingBalance: parseFloat(response.remainingBalance || 0)
        };
      }

      return {
        success: false,
        amountRedeemed: 0,
        remainingBalance: 0,
        error: response.message || 'Voucher redemption failed',
        errorCode: response.errorCode || VoucherErrorCode.REDEMPTION_FAILED
      };
    } catch (error) {
      console.error('[SureGifts] Voucher redemption failed:', error);
      
      if (error instanceof VoucherError) {
        return {
          success: false,
          amountRedeemed: 0,
          remainingBalance: 0,
          error: error.message,
          errorCode: error.code
        };
      }

      return {
        success: false,
        amountRedeemed: 0,
        remainingBalance: 0,
        error: 'Failed to redeem voucher. Please try again.',
        errorCode: VoucherErrorCode.API_ERROR
      };
    }
  }

  /**
   * Get voucher balance (alternative to validation for balance-only checks)
   */
  static async getVoucherBalance(voucherCode: string): Promise<{ success: boolean; balance?: number; currency?: string; error?: string }> {
    try {
      const validation = await this.validateVoucher(voucherCode);
      
      if (validation.success && validation.voucher) {
        return {
          success: true,
          balance: validation.voucher.balance,
          currency: validation.voucher.currency
        };
      }

      return {
        success: false,
        error: validation.error || 'Failed to get voucher balance'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if SureGifts service is available
   */
  static async healthCheck(): Promise<{ available: boolean; error?: string }> {
    try {
      this.validateConfig();
      
      // Make a simple API call to check service availability
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        timeout: 5000 // 5 second timeout
      } as any);

      return {
        available: response.ok
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Service unavailable'
      };
    }
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(errorCode: string, defaultMessage: string): string {
    const errorMessages: Record<string, string> = {
      [VoucherErrorCode.INVALID_CODE]: 'The voucher code you entered is invalid. Please check and try again.',
      [VoucherErrorCode.EXPIRED]: 'This voucher has expired and can no longer be used.',
      [VoucherErrorCode.INSUFFICIENT_BALANCE]: 'The voucher balance is insufficient for this purchase amount.',
      [VoucherErrorCode.ALREADY_USED]: 'This voucher has already been fully redeemed.',
      [VoucherErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
      [VoucherErrorCode.API_ERROR]: 'Service temporarily unavailable. Please try again later.',
      [VoucherErrorCode.VALIDATION_ERROR]: 'Please enter a valid voucher code.',
      [VoucherErrorCode.REDEMPTION_FAILED]: 'Failed to redeem voucher. Please contact support if this continues.'
    };

    return errorMessages[errorCode] || defaultMessage;
  }
}