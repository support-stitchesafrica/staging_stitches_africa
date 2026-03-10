import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

// Use a union type to support both client and admin timestamps
export type FirestoreTimestamp = ClientTimestamp | AdminTimestamp;

/**
 * Referral User - Stores referrer information and their referral codes
 */
export interface ReferralUser {
  userId: string;              // Firebase Auth UID
  email: string;               // User email
  fullName: string;            // User full name
  referralCode: string;        // Unique 8-character code
  totalReferrals: number;      // Count of successful referrals
  totalPoints: number;         // Total points earned
  totalRevenue: number;        // Total revenue from referrals
  totalClicks?: number;        // Total link clicks
  totalDownloads?: number;     // Total app downloads
  isActive: boolean;           // Account status
  isAdmin: boolean;            // Admin flag
  autoProvisioned?: boolean;   // Flag indicating auto-provisioned user
  provisionedAt?: FirestoreTimestamp;   // When auto-provisioning occurred
  createdAt: FirestoreTimestamp;        // Registration date
  updatedAt: FirestoreTimestamp;        // Last update
}

/**
 * Referral - Tracks individual referral relationships
 */
export interface Referral {
  id: string;                  // Auto-generated ID
  referrerId: string;          // Referrer's userId
  refereeId: string;           // Referee's userId
  refereeEmail: string;        // Referee's email
  refereeName: string;         // Referee's name
  referralCode: string;        // Code used
  status: 'pending' | 'active' | 'converted';
  signUpDate: FirestoreTimestamp;       // When referee signed up
  firstPurchaseDate?: FirestoreTimestamp; // First purchase date
  totalPurchases: number;      // Number of purchases
  totalSpent: number;          // Total amount spent
  pointsEarned: number;        // Points earned from this referral
  createdAt: FirestoreTimestamp;
}

/**
 * Referral Cart Stats - Extension of Referral with cart activity
 */
export interface ReferralCartStats extends Referral {
  cartItemCount: number;
  cartTotalValue: number;
  lastCartUpdate?: FirestoreTimestamp | Date;
}

/**
 * Referral Event - Tracks tracking events like clicks and downloads
 */
export interface ReferralEvent {
  id: string;
  eventType: 'click' | 'download';
  referralCode: string;
  referrerId?: string; // Optional, if we can look it up efficiently
  sessionId: string;
  deviceType: 'android' | 'ios' | 'desktop' | 'unknown';
  userAgent?: string;
  ipHash?: string; // Anonymized IP for unique counting
  metadata?: any;
  createdAt: FirestoreTimestamp;
}

/**
 * Referral Transaction - Records all point-earning transactions
 */
export interface ReferralTransaction {
  id: string;                  // Auto-generated ID
  referrerId: string;          // Referrer's userId
  referralId: string;          // Related referral ID
  type: 'signup' | 'purchase'; // Transaction type
  points: number;              // Points awarded
  amount?: number;             // Purchase amount (if applicable)
  description: string;         // Transaction description
  metadata: {
    refereeEmail: string;
    refereeName: string;
    orderId?: string;          // If purchase
  };
  createdAt: FirestoreTimestamp;
}

/**
 * Referral Purchase - Tracks purchases made by referees
 */
export interface ReferralPurchase {
  id: string;                  // Auto-generated ID
  referrerId: string;          // Referrer's userId
  referralId: string;          // Related referral ID
  refereeId: string;           // Referee's userId
  orderId: string;             // Order/transaction ID
  amount: number;              // Purchase amount
  commission: number;          // Commission earned (5%)
  points: number;              // Points awarded
  status: 'pending' | 'completed' | 'refunded';
  createdAt: FirestoreTimestamp;
}

/**
 * Referral Analytics - Aggregated analytics data for performance
 */
export interface ReferralAnalytics {
  id: string;                  // Date-based ID (YYYY-MM-DD)
  date: FirestoreTimestamp;             // Analytics date
  totalSignups: number;        // Sign-ups on this date
  totalPurchases: number;      // Purchases on this date
  totalRevenue: number;        // Revenue on this date
  totalPointsAwarded: number;  // Points awarded
  activeReferrers: number;     // Active referrers
  conversionRate: number;      // Conversion percentage
}

/**
 * Supporting Types
 */

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface RefereeData {
  userId: string;
  email: string;
  name: string;
}

export interface PurchaseData {
  referralId: string;
  refereeId: string;
  orderId: string;
  amount: number;
}

export interface ReferrerStats {
  totalReferrals: number;
  totalPoints: number;
  totalRevenue: number;
  conversionRate: number;
  activeReferrals: number;
  pendingReferrals: number;
}

export interface GlobalStats {
  totalReferrers: number;
  totalReferees: number;
  totalPoints: number;
  totalRevenue: number;
  averageReferralsPerReferrer: number;
  overallConversionRate: number;
}

export interface ChartData {
  labels: string[];
  signups: number[];
  revenue: number[];
}

export interface AdminChartData {
  labels: string[];
  referrers: number[];
  referees: number[];
  revenue: number[];
  points: number[];
  topPerformers?: {
    name: string;
    referrals: number;
    revenue: number;
    points: number;
  }[];
}

export type DateRange = '7days' | '30days' | '90days' | 'all';

export interface ReportParams {
  startDate: Date;
  endDate: Date;
  type: 'referrers' | 'referrals' | 'transactions' | 'analytics';
  filters?: {
    [key: string]: any;
  };
}

export interface Report {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  data: any[];
  summary: {
    totalReferrers: number;
    totalReferees: number;
    totalRevenue: number;
    totalPoints: number;
    conversionRate: number;
  };
}

/**
 * Error Types
 */
export enum ReferralErrorCode {
  INVALID_CODE = 'INVALID_CODE',
  CODE_ALREADY_EXISTS = 'CODE_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_INPUT = 'INVALID_INPUT',
  REFERRAL_EXISTS = 'REFERRAL_EXISTS',
  PURCHASE_NOT_FOUND = 'PURCHASE_NOT_FOUND'
}

export interface ReferralError {
  code: ReferralErrorCode;
  message: string;
  details?: any;
}
