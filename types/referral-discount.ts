import { Timestamp } from "firebase/firestore";

export interface ReferralDiscount {
  id?: string;
  userId: string;
  referralCode: string;
  percentage: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReferralPurchase {
  id?: string;
  orderId: string;
  buyerId: string;
  referrerId: string;
  referralCode: string;
  originalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: "paid";
  createdAt: Timestamp;
}

export interface ReferralDiscountRow extends ReferralDiscount {
  fullname: string;
  email: string;
  totalUsage: number;
  totalSales: number;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  referrer?: { name: string; code: string };
  discountPercentage: number | null;
  referrerId: string | null;
  error?: { code: string; message: string };
}
