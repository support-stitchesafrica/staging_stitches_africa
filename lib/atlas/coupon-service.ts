/**
 * Coupon Service
 * Handles CRUD operations and validation for email-tied coupons
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
  ValidateCouponResult,
  ApplyCouponResult,
  CouponFilters,
  Pagination,
  PaginatedResult,
  CouponStats,
  IndividualCouponStats,
  CouponErrorCode,
  CouponStatus,
  DiscountType
} from '@/types/coupon';

// Collection name
const COUPONS_COLLECTION = 'staging_coupons';

// Code generation constants
const CODE_PREFIX = 'STIT';
const CODE_LENGTH = 12;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
const MAX_GENERATION_ATTEMPTS = 5;

/**
 * Helper function to convert Date or string to Timestamp
 */
function toTimestamp(date: Date | string): Timestamp {
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  return Timestamp.fromDate(date);
}

/**
 * Coupon Management Service
 */
export class CouponService {
  /**
   * Generate a unique coupon code
   */
  static async generateCouponCode(length: number = CODE_LENGTH): Promise<string> {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      // Generate random code
      const randomPart = Array.from({ length: length - CODE_PREFIX.length - 1 }, () =>
        CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
      ).join('');

      const code = `${CODE_PREFIX}-${randomPart}`;

      // Check uniqueness
      const existing = await this.getCouponByCode(code);
      if (!existing) {
        return code;
      }
    }

    throw new Error('Failed to generate unique coupon code after multiple attempts');
  }

  /**
   * Calculate discount amount
   * Note: For FIXED discounts, assumes value is in NGN.
   * If targetCurrency is NGN, returns the value directly.
   * If targetCurrency is USD, converts NGN to USD using a more accurate rate.
   * For PERCENTAGE discounts, applies percentage to order amount.
   */
  private static calculateDiscount(
    coupon: Coupon,
    orderAmount: number,
    targetCurrency: string = 'USD'
  ): number {
    if (coupon.discountType === 'PERCENTAGE') {
      const discount = (orderAmount * coupon.discountValue) / 100;
      return Math.round(Math.min(discount, orderAmount) * 100) / 100;
    } else {
      // FIXED discount: coupon.discountValue is always in NGN
      if (targetCurrency === 'NGN') {
        return Math.round(Math.min(coupon.discountValue, orderAmount) * 100) / 100;
      }

      // If target is USD, convert NGN to USD
      // Note: In a production system, we'd use the real-time rate.
      // For consistency with the rest of the dashboard, we'll use a standard rate
      // or ideally the client would have already handled this.
      // But here we'll use 1500 for USD conversion if not in NGN mode.
      const NGN_TO_USD_RATE = 1500;
      const discountInUSD = coupon.discountValue / NGN_TO_USD_RATE;
      return Math.round(Math.min(discountInUSD, orderAmount) * 100) / 100;
    }
  }

  /**
   * Validate coupon input data
   */
  private static validateCreateInput(input: CreateCouponInput): { valid: boolean; error?: string } {
    // Validate discount type
    if (!['PERCENTAGE', 'FIXED'].includes(input.discountType)) {
      return { valid: false, error: 'Invalid discount type' };
    }

    // Validate discount value
    if (input.discountValue <= 0) {
      return { valid: false, error: 'Discount value must be greater than 0' };
    }

    if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) {
      return { valid: false, error: 'Percentage discount cannot exceed 100%' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.assignedEmail)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Validate minimum order amount
    if (input.minOrderAmount !== undefined && input.minOrderAmount < 0) {
      return { valid: false, error: 'Minimum order amount cannot be negative' };
    }

    // Validate expiry date
    if (input.expiryDate && input.expiryDate <= new Date()) {
      return { valid: false, error: 'Expiry date must be in the future' };
    }

    // Validate usage limit
    if (input.usageLimit !== undefined && input.usageLimit < 1) {
      return { valid: false, error: 'Usage limit must be at least 1' };
    }

    return { valid: true };
  }

  /**
   * Create a new coupon
   */
  static async createCoupon(input: CreateCouponInput, adminId: string): Promise<Coupon> {
    // Validate input
    const validation = this.validateCreateInput(input);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid coupon data');
    }

    // Generate or validate coupon code
    let couponCode: string;
    if (input.couponCode) {
      // Validate custom code
      couponCode = input.couponCode.toUpperCase().trim();
      
      // Check uniqueness
      const existing = await this.getCouponByCode(couponCode);
      if (existing) {
        throw new Error('Coupon code already exists');
      }
    } else {
      // Auto-generate code
      couponCode = await this.generateCouponCode();
    }

    // Create coupon object
    const now = Timestamp.now();
    const couponId = adminDb.collection(COUPONS_COLLECTION).doc().id;

    const coupon: Coupon = {
      id: couponId,
      couponCode,
      discountType: input.discountType,
      discountValue: input.discountValue,
      assignedEmail: input.assignedEmail.toLowerCase().trim(),
      minOrderAmount: input.minOrderAmount,
      expiryDate: input.expiryDate ? toTimestamp(input.expiryDate) : undefined,
      usageLimit: input.usageLimit || 1,
      timesUsed: 0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: adminId,
      usageHistory: [],
      emailSent: false
    };

    // Save to Firestore
    await adminDb.collection(COUPONS_COLLECTION).doc(couponId).set(coupon);

    return coupon;
  }

  /**
   * Get coupon by ID
   */
  static async getCoupon(couponId: string): Promise<Coupon | null> {
    const doc = await adminDb.collection(COUPONS_COLLECTION).doc(couponId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Coupon;
  }

  /**
   * Get coupon by code (case-insensitive)
   */
  static async getCouponByCode(code: string): Promise<Coupon | null> {
    const normalizedCode = code.toUpperCase().trim();
    
    const snapshot = await adminDb.collection(COUPONS_COLLECTION)
      .where('couponCode', '==', normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Coupon;
  }

  /**
   * Update coupon
   */
  static async updateCoupon(couponId: string, input: UpdateCouponInput): Promise<Coupon> {
    const existing = await this.getCoupon(couponId);
    if (!existing) {
      throw new Error('Coupon not found');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Timestamp.now()
    };

    // Update allowed fields
    if (input.status) {
      updateData.status = input.status;
    }
    if (input.expiryDate) {
      updateData.expiryDate = toTimestamp(input.expiryDate);
    }
    if (input.usageLimit !== undefined) {
      updateData.usageLimit = input.usageLimit;
    }

    // Update in Firestore
    await adminDb.collection(COUPONS_COLLECTION).doc(couponId).update(updateData);

    return { ...existing, ...updateData } as Coupon;
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await this.getCoupon(couponId);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    await adminDb.collection(COUPONS_COLLECTION).doc(couponId).delete();
  }

  /**
   * List coupons with filtering and pagination
   */
  static async listCoupons(
    filters: CouponFilters = {},
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Coupon>> {
    let query = adminDb.collection(COUPONS_COLLECTION).orderBy('createdAt', 'desc');

    // Apply filters
    if (filters.email) {
      query = query.where('assignedEmail', '==', filters.email.toLowerCase().trim()) as any;
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status) as any;
    }
    if (filters.search) {
      // Note: Firestore doesn't support full-text search, so we'll filter in memory
      // For production, consider using Algolia or similar
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    const paginatedQuery = query.limit(pagination.limit).offset(offset);

    const snapshot = await paginatedQuery.get();
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Coupon[];

    // Apply search filter in memory if needed
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(coupon =>
        coupon.couponCode.toLowerCase().includes(searchLower) ||
        coupon.assignedEmail.toLowerCase().includes(searchLower)
      );
    }

    return {
      data: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  /**
   * Validate coupon for use
   */
  static async validateCoupon(input: ValidateCouponInput): Promise<ValidateCouponResult> {
    // Get coupon by code
    const coupon = await this.getCouponByCode(input.couponCode);

    if (!coupon) {
      return {
        valid: false,
        error: 'Coupon code not found. Please check and try again.',
        errorCode: CouponErrorCode.NOT_FOUND
      };
    }

    // Check status
    if (coupon.status !== 'ACTIVE') {
      if (coupon.status === 'EXPIRED') {
        return {
          valid: false,
          error: 'This coupon has expired.',
          errorCode: CouponErrorCode.EXPIRED
        };
      }
      return {
        valid: false,
        error: 'This coupon is no longer active.',
        errorCode: CouponErrorCode.INACTIVE
      };
    }

    // Check expiry date
    if (coupon.expiryDate && coupon.expiryDate.toMillis() <= Date.now()) {
      return {
        valid: false,
        error: 'This coupon has expired.',
        errorCode: CouponErrorCode.EXPIRED
      };
    }

    // Check usage limit
    if (coupon.timesUsed >= coupon.usageLimit) {
      return {
        valid: false,
        error: 'This coupon has already been used.',
        errorCode: CouponErrorCode.ALREADY_USED
      };
    }

    // Check email match (case-insensitive)
    if (coupon.assignedEmail.toLowerCase() !== input.userEmail.toLowerCase().trim()) {
      return {
        valid: false,
        error: 'This coupon is not valid for your account.',
        errorCode: CouponErrorCode.EMAIL_MISMATCH
      };
    }

    // Check minimum order amount
    if (coupon.minOrderAmount) {
      // If currency is NGN, check against raw minOrderAmount
      if (input.currency === 'NGN') {
        if (input.orderAmount < coupon.minOrderAmount) {
          return {
            valid: false,
            error: `Order total must be at least ₦${coupon.minOrderAmount.toLocaleString()} to use this coupon.`,
            errorCode: CouponErrorCode.MIN_ORDER_NOT_MET
          };
        }
      } else {
        // Convert NGN minimum to USD for comparison if in USD mode
        const NGN_TO_USD_RATE = 1500;
        const minOrderUSD = coupon.minOrderAmount / NGN_TO_USD_RATE;
        if (input.orderAmount < minOrderUSD) {
          return {
            valid: false,
            error: `Order total must be at least $${minOrderUSD.toFixed(2)} to use this coupon.`,
            errorCode: CouponErrorCode.MIN_ORDER_NOT_MET
          };
        }
      }
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(coupon, input.orderAmount, input.currency);
    const finalAmount = Math.max(0, input.orderAmount - discountAmount);

    // Calculate USD equivalent for internal tracking
    let discountAmountUSD = discountAmount;
    if (input.currency && input.currency !== 'USD') {
      const NGN_TO_USD_RATE = 1500;
      discountAmountUSD = discountAmount / NGN_TO_USD_RATE;
    }

    return {
      valid: true,
      coupon,
      discountAmount,
      discountAmountUSD,
      finalAmount,
      currency: input.currency || 'USD'
    };
  }

  /**
   * Apply coupon to an order (validates and marks as used)
   */
  static async applyCoupon(
    code: string,
    orderId: string,
    orderAmount: number,
    userEmail: string,
    currency: string = 'USD'
  ): Promise<ApplyCouponResult> {
    try {
      // 1. Validate one last time
      const validation = await this.validateCoupon({
        couponCode: code,
        userEmail,
        orderAmount,
        currency
      });

      if (!validation.valid || !validation.coupon) {
        return {
          success: false,
          error: validation.error || 'Invalid coupon',
          originalAmount: orderAmount,
          discountAmount: 0,
          finalAmount: orderAmount
        };
      }

      // 2. Mark as used
      await this.markCouponAsUsed(
        validation.coupon.id,
        orderId,
        orderAmount,
        userEmail,
        currency
      );

      return {
        success: true,
        coupon: validation.coupon,
        originalAmount: orderAmount,
        discountAmount: validation.discountAmount || 0,
        finalAmount: validation.finalAmount || orderAmount,
        currency
      };
    } catch (error: any) {
      console.error('Error in applyCoupon:', error);
      return {
        success: false,
        error: error.message || 'Failed to apply coupon',
        originalAmount: orderAmount,
        discountAmount: 0,
        finalAmount: orderAmount
      };
    }
  }

  /**
   * Mark coupon as used (internal helper called after validation)
   */
  private static async markCouponAsUsed(
    couponId: string,
    orderId: string,
    orderAmount: number,
    userEmail: string,
    currency: string = 'USD'
  ): Promise<void> {
    const coupon = await this.getCoupon(couponId);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Calculate discount applied
    const discountApplied = this.calculateDiscount(coupon, orderAmount, currency);

    // Create usage record
    const usageRecord = {
      orderId,
      usedAt: Timestamp.now(),
      orderAmount,
      discountApplied,
      userEmail: userEmail.toLowerCase().trim()
    };

    // Update coupon atomically
    await adminDb.collection(COUPONS_COLLECTION).doc(couponId).update({
      timesUsed: FieldValue.increment(1),
      usageHistory: FieldValue.arrayUnion(usageRecord),
      status: coupon.timesUsed + 1 >= coupon.usageLimit ? 'USED' : 'ACTIVE',
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Expire old coupons (cron job)
   */
  static async expireCoupons(): Promise<number> {
    const now = Timestamp.now();
    
    // Find active coupons with expiry date in the past
    const snapshot = await adminDb.collection(COUPONS_COLLECTION)
      .where('status', '==', 'ACTIVE')
      .where('expiryDate', '<=', now)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    // Update in batch
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'EXPIRED',
        updatedAt: now
      });
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Get coupon statistics
   */
  static async getCouponStats(couponId: string): Promise<IndividualCouponStats> {
    const coupon = await this.getCoupon(couponId);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Calculate total discount given
    const totalDiscountGiven = coupon.usageHistory.reduce(
      (sum, record) => sum + record.discountApplied,
      0
    );

    // Calculate average order value
    const avgOrderValue = coupon.usageHistory.length > 0
      ? coupon.usageHistory.reduce((sum, record) => sum + record.orderAmount, 0) / coupon.usageHistory.length
      : 0;

    return {
      couponId,
      couponCode: coupon.couponCode,
      timesUsed: coupon.timesUsed,
      usageLimit: coupon.usageLimit,
      totalDiscountGiven,
      avgOrderValue,
      status: coupon.status,
      createdAt: coupon.createdAt.toDate(),
      lastUsedAt: coupon.usageHistory.length > 0
        ? coupon.usageHistory[coupon.usageHistory.length - 1].usedAt.toDate()
        : undefined
    };
  }

  /**
   * Update email sent status
   */
  static async updateEmailStatus(
    couponId: string,
    sent: boolean,
    error?: string
  ): Promise<void> {
    const updateData: any = {
      emailSent: sent,
      updatedAt: Timestamp.now()
    };

    if (sent) {
      updateData.emailSentAt = Timestamp.now();
      updateData.emailError = FieldValue.delete();
    } else if (error) {
      updateData.emailError = error;
    }

    await adminDb.collection(COUPONS_COLLECTION).doc(couponId).update(updateData);
  }
}
