/**
 * Coupon Management System - Type Definitions
 * 
 * This file contains all TypeScript types and interfaces for the email-tied coupon system.
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Enums
// ============================================================================

/**
 * Discount type for coupons
 */
export type DiscountType = 'PERCENTAGE' | 'FIXED';

/**
 * Coupon status lifecycle
 */
export type CouponStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';

/**
 * Error codes for coupon validation failures
 */
export enum CouponErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  EXPIRED = 'EXPIRED',
  ALREADY_USED = 'ALREADY_USED',
  EMAIL_MISMATCH = 'EMAIL_MISMATCH',
  MIN_ORDER_NOT_MET = 'MIN_ORDER_NOT_MET',
  INACTIVE = 'INACTIVE',
  INVALID_CODE = 'INVALID_CODE',
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Record of a single coupon usage
 */
export interface CouponUsageRecord {
  orderId: string;
  usedAt: Timestamp;
  orderAmount: number;
  discountApplied: number;
  userEmail: string;
}

/**
 * Main Coupon interface - represents a coupon document in Firestore
 */
export interface Coupon {
  // Primary fields
  id: string;
  couponCode: string; // Unique, uppercase (e.g., "STIT-AJH-JHFS")
  
  // Discount configuration
  discountType: DiscountType;
  discountValue: number; // Percentage (0-100) or fixed amount
  
  // Assignment & restrictions
  assignedEmail: string; // Lowercase, validated email
  minOrderAmount?: number; // Optional minimum order requirement
  
  // Validity
  expiryDate?: Timestamp; // Optional expiration
  usageLimit: number; // Default: 1
  timesUsed: number; // Default: 0
  
  // Status
  status: CouponStatus;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user ID
  
  // Usage tracking
  usageHistory: CouponUsageRecord[];
  
  // Email tracking
  emailSent: boolean;
  emailSentAt?: Timestamp;
  emailError?: string;
}

// ============================================================================
// Input Types (for API requests)
// ============================================================================

/**
 * Input for creating a new coupon
 */
export interface CreateCouponInput {
  couponCode?: string; // Optional, auto-generated if not provided
  discountType: DiscountType;
  discountValue: number;
  assignedEmail: string;
  minOrderAmount?: number;
  expiryDate?: Date | string; // Can accept ISO string from API
  usageLimit?: number; // Default: 1
  sendEmail?: boolean; // Default: true
}

/**
 * Input for updating an existing coupon
 */
export interface UpdateCouponInput {
  status?: CouponStatus;
  expiryDate?: Date | string;
  usageLimit?: number;
}

/**
 * Input for validating a coupon
 */
export interface ValidateCouponInput {
  couponCode: string;
  userEmail: string;
  orderAmount: number;
  currency?: string; // Optional: target currency for discount calculation (defaults to USD)
}

// ============================================================================
// Result Types (for API responses)
// ============================================================================

/**
 * Result of coupon validation
 */
export interface ValidateCouponResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  discountAmountUSD?: number; // Always returned for internal USD calculations
  finalAmount?: number;
  currency?: string; // The currency in which discountAmount and finalAmount are returned
  error?: string;
  errorCode?: CouponErrorCode;
}

/**
 * Result of applying a coupon to an order
 */
export interface ApplyCouponResult {
  success: boolean;
  coupon?: Coupon;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency?: string; // The currency of the amounts
  error?: string;
}

/**
 * Coupon statistics for admin dashboard (overall stats)
 */
export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  usedCoupons: number;
  expiredCoupons: number;
  disabledCoupons: number;
  totalDiscountGiven: number;
  averageDiscountValue: number;
}

/**
 * Individual coupon statistics
 */
export interface IndividualCouponStats {
  couponId: string;
  couponCode: string;
  timesUsed: number;
  usageLimit: number;
  totalDiscountGiven: number;
  avgOrderValue: number;
  status: CouponStatus;
  createdAt: Date;
  lastUsedAt?: Date;
}

// ============================================================================
// Filter & Pagination Types
// ============================================================================

/**
 * Filters for listing coupons
 */
export interface CouponFilters {
  email?: string;
  status?: CouponStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search by coupon code
}

/**
 * Pagination parameters
 */
export interface Pagination {
  page: number;
  limit: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Response for coupon list endpoint
 */
export interface ListCouponsResponse {
  success: boolean;
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * Response for single coupon endpoint
 */
export interface CouponResponse {
  success: boolean;
  coupon?: Coupon;
  error?: string;
}

/**
 * Response for coupon code generation
 */
export interface GenerateCodeResponse {
  success: boolean;
  couponCode: string;
  error?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Coupon data for email template
 * Note: Uses Date instead of Timestamp since email templates expect JS Date objects
 */
export interface CouponEmailData {
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate?: Date;
  minOrderAmount?: number;
  recipientName?: string;
}

/**
 * Partial coupon for client-side display (excludes sensitive data)
 * Note: expiryDate should be converted to Date when sending to client
 */
export type PublicCoupon = Pick<
  Coupon,
  'couponCode' | 'discountType' | 'discountValue' | 'minOrderAmount'
> & {
  expiryDate?: Date;
};
