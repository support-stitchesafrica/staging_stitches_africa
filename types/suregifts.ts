// SureGifts API Integration Types
export interface SureGiftsVoucher {
  code: string;
  balance: number;
  currency: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'used' | 'invalid';
  isValid: boolean;
}

export interface VoucherValidationRequest {
  voucherCode: string;
}

export interface VoucherValidationResponse {
  success: boolean;
  voucher?: SureGiftsVoucher;
  error?: string;
  errorCode?: string;
}

export interface VoucherRedemptionRequest {
  voucherCode: string;
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
}

export interface VoucherRedemptionResponse {
  success: boolean;
  transactionId?: string;
  amountRedeemed: number;
  remainingBalance: number;
  error?: string;
  errorCode?: string;
}

export interface VoucherTransaction {
  id?: string;
  voucherCode: string;
  orderId: string;
  userId: string;
  amountRedeemed: number;
  remainingBalance: number;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface PaymentWithVoucher {
  voucherAmount: number;
  remainingAmount: number;
  voucherCode: string;
  paymentMethod?: 'stripe' | 'flutterwave' | 'paystack';
  requiresAdditionalPayment: boolean;
}

export interface VoucherPaymentBreakdown {
  totalAmount: number;
  voucherAmount: number;
  remainingAmount: number;
  voucherCode?: string;
  currency: string;
}

// Admin tracking types
export interface VoucherAdminLog {
  id?: string;
  voucherCode: string;
  orderId: string;
  customerEmail: string;
  amountRedeemed: number;
  transactionId: string;
  timestamp: Date;
  status: 'success' | 'failed';
  error?: string;
}

export interface VoucherAnalytics {
  totalRedemptions: number;
  totalAmountRedeemed: number;
  averageRedemptionAmount: number;
  redemptionsByMonth: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  topVoucherCodes: Array<{
    code: string;
    redemptions: number;
    totalAmount: number;
  }>;
}

// Error types
export enum VoucherErrorCode {
  INVALID_CODE = 'INVALID_CODE',
  EXPIRED = 'EXPIRED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ALREADY_USED = 'ALREADY_USED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REDEMPTION_FAILED = 'REDEMPTION_FAILED'
}

export class VoucherError extends Error {
  constructor(
    public code: VoucherErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VoucherError';
  }
}