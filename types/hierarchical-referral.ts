import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

// Use a union type to support both client and admin timestamps
export type FirestoreTimestamp = ClientTimestamp | AdminTimestamp;

/**
 * Influencer Model - Core influencer data for both Mother and Mini Influencers
 */
export interface Influencer {
  id: string;
  type: 'mother' | 'mini';
  email: string;
  name: string;
  profileImage?: string;
  masterReferralCode?: string; // Only for Mother Influencers
  parentInfluencerId?: string; // Only for Mini Influencers
  status: 'active' | 'suspended' | 'pending';
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  totalEarnings: number;
  payoutInfo: PayoutInfo;
  preferences: NotificationPreferences;
  verificationData?: {
    expectedMonthlyReferrals?: number;
    businessType?: string;
    socialMediaFollowers?: number;
    referralExperience?: string;
    [key: string]: any;
  };
}

/**
 * Payout Information
 */
export interface PayoutInfo {
  method?: string | null;
  details?: any | null;
  minimumThreshold: number;
  currency?: string;
  isVerified?: boolean;
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  smsNotifications?: boolean;
  newMiniInfluencer?: boolean;
  earningsMilestones?: boolean;
  payoutNotifications?: boolean;
  systemUpdates?: boolean;
}

/**
 * Referral Code Model - Tracks both master and sub referral codes
 */
export interface ReferralCode {
  id: string;
  code: string;
  type: 'master' | 'sub';
  createdBy: string; // Influencer ID
  assignedTo?: string; // Mini Influencer ID (for sub codes)
  status: 'active' | 'inactive' | 'expired';
  usageCount: number;
  maxUsage?: number;
  createdAt: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  metadata: {
    campaign?: string;
    notes?: string;
  };
}

/**
 * Activity Model - Tracks all user activities and interactions
 */
export interface Activity {
  id: string;
  influencerId: string;
  type: 'click' | 'view' | 'conversion' | 'signup' | 'purchase';
  referralCode: string;
  metadata: {
    productId?: string;
    amount?: number;
    currency?: string;
    userAgent?: string;
    location?: string;
    sessionId?: string;
    ipHash?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    source?: 'direct' | 'search' | 'social' | 'referral';
    campaignId?: string;
    customData?: Record<string, any>;
    timestamp?: number;
  };
  timestamp: FirestoreTimestamp;
  processed: boolean;
}

/**
 * Commission Model - Tracks commission calculations and payouts
 */
export interface Commission {
  id: string;
  activityId: string;
  motherInfluencerId: string;
  miniInfluencerId?: string;
  amount: number;
  currency: string;
  rate: number;
  type: 'direct' | 'indirect';
  status: 'pending' | 'approved' | 'paid';
  createdAt: FirestoreTimestamp;
  paidAt?: FirestoreTimestamp;
}

/**
 * Supporting Types
 */

export interface ReferralCodeValidation {
  isValid: boolean;
  code?: ReferralCode;
  error?: string;
}

export interface ReferralTree {
  motherInfluencer: Influencer;
  miniInfluencers: Influencer[];
  totalNetworkEarnings: number;
  totalNetworkActivities: number;
}

export interface InfluencerMetrics {
  totalEarnings: number;
  directEarnings: number;
  indirectEarnings: number;
  totalActivities: number;
  conversionRate: number;
  clickThroughRate: number;
  activeMiniInfluencers: number;
  totalMiniInfluencers: number;
  topPerformingMiniInfluencers: MiniInfluencerPerformance[];
}

export interface MiniInfluencerPerformance {
  influencer: Influencer;
  earnings: number;
  activities: number;
  conversionRate: number;
  rank: number;
}

export interface NetworkMetrics {
  totalNetworkSize: number;
  totalNetworkEarnings: number;
  averageEarningsPerMini: number;
  topPerformers: MiniInfluencerPerformance[];
  growthRate: number;
  retentionRate: number;
}

export interface TimePeriod {
  start: Date;
  end: Date;
  granularity: 'day' | 'week' | 'month';
}

export interface AnalyticsReport {
  id: string;
  type: 'influencer' | 'network' | 'system';
  period: TimePeriod;
  data: any;
  generatedAt: FirestoreTimestamp;
  requestedBy: string;
}

export interface InfluencerRanking {
  influencer: Influencer;
  rank: number;
  score: number;
  metrics: InfluencerMetrics;
}

export interface ReportCriteria {
  influencerId?: string;
  period: TimePeriod;
  metrics: string[];
  format: 'json' | 'csv';
  includeSubInfluencers?: boolean;
}

export interface EarningsHistory {
  entries: EarningsEntry[];
  totalEarnings: number;
  totalPaid: number;
  pendingEarnings: number;
}

export interface EarningsEntry {
  id: string;
  amount: number;
  type: 'commission' | 'bonus' | 'adjustment';
  source: string;
  date: FirestoreTimestamp;
  status: 'pending' | 'approved' | 'paid';
}

export interface PayoutResult {
  influencerId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  error?: string;
  processedAt: FirestoreTimestamp;
}

export interface PayoutEligibility {
  isEligible: boolean;
  amount: number;
  reason?: string;
  nextEligibleDate?: FirestoreTimestamp;
}

export interface CommissionRates {
  miniInfluencerRate: number; // Percentage for Mini Influencer
  motherInfluencerRate: number; // Percentage for Mother Influencer
  categoryRates?: { [category: string]: CommissionRates };
  campaignRates?: { [campaign: string]: CommissionRates };
}

/**
 * Error Types
 */
export enum HierarchicalReferralErrorCode {
  INVALID_CODE = 'INVALID_CODE',
  CODE_ALREADY_EXISTS = 'CODE_ALREADY_EXISTS',
  INFLUENCER_NOT_FOUND = 'INFLUENCER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_INPUT = 'INVALID_INPUT',
  HIERARCHY_EXISTS = 'HIERARCHY_EXISTS',
  COMMISSION_CALCULATION_ERROR = 'COMMISSION_CALCULATION_ERROR',
  PAYOUT_ERROR = 'PAYOUT_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface HierarchicalReferralError {
  code: HierarchicalReferralErrorCode;
  message: string;
  details?: any;
}

/**
 * Service Response Types
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: HierarchicalReferralError;
}

/**
 * Dashboard Data Types
 */
export interface MotherInfluencerDashboardData {
  influencer: Influencer;
  metrics: InfluencerMetrics;
  networkMetrics: NetworkMetrics;
  recentActivities: Activity[];
  earningsHistory: EarningsHistory;
  referralCodes: ReferralCode[];
}

export interface MiniInfluencerDashboardData {
  influencer: Influencer;
  motherInfluencer: Influencer;
  personalMetrics: {
    totalEarnings: number;
    totalActivities: number;
    conversionRate: number;
    rank: number;
  };
  recentActivities: Activity[];
  earningsHistory: EarningsHistory;
}

export interface AdminDashboardData {
  systemMetrics: {
    totalMotherInfluencers: number;
    totalMiniInfluencers: number;
    totalEarnings: number;
    totalActivities: number;
    averageNetworkSize: number;
  };
  topPerformers: InfluencerRanking[];
  recentActivities: Activity[];
  payoutQueue: PayoutResult[];
}