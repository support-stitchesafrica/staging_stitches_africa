import { Timestamp } from "firebase-admin/firestore";

export type PayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type PayoutProvider = "paystack" | "flutterwave" | "stripe";

export type PayoutSkipReason =
  | "kyc_incomplete"
  | "invalid_amount"
  | "unknown_provider"
  | "no_payment_account"
  | "vendor_not_found";

export interface PayoutCalculation {
  grossAmount: number;
  shippingFee: number;
  netAmount: number;
  vendorAmount: number;
  platformAmount: number;
  currency: string;
}

export interface PayoutResult {
  status: "completed" | "failed";
  reference?: string;
  error?: string;
  provider: PayoutProvider;
}

export interface VendorPayoutData {
  orderId: string;
  tailorId: string;
  calculation: PayoutCalculation;
  provider: PayoutProvider;
  reference?: string;
  error?: string;
  skipReason?: PayoutSkipReason;
  completedAt?: Timestamp;
  logId?: string;
}

export interface FlutterwaveAccountDetails {
  bank_code: string;
  account_number: string;
  account_name: string;
  currency: string;
}
