/**
 * Vendor Waitlist Management Database Schema
 * Firestore collection structures and field definitions
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Collection Names (Constants)
// ============================================================================

export const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'staging_collection_waitlists',
  WAITLIST_SUBSCRIPTIONS: 'staging_waitlist_subscriptions',
  COLLECTION_ANALYTICS: 'staging_collection_analytics',
  NOTIFICATION_TEMPLATES: 'staging_waitlist_notification_templates',
} as const;

// ============================================================================
// Firestore Document Schemas
// ============================================================================

/**
 * Collection Waitlists Collection Schema
 * Path: /collection_waitlists/{waitlistId}
 */
export interface CollectionWaitlistDocument {
  // Required fields
  id: string;
  vendorId: string; // Firebase Auth UID of vendor
  name: string; // Collection name (max 100 chars)
  description: string; // Collection description (max 1000 chars)
  imageUrl: string; // Cloud Storage URL for collection image
  pairedProducts: ProductPairDocument[]; // Array of paired products
  minSubscribers: number; // Minimum subscribers to launch (min: 1, max: 10000)
  currentSubscribers: number; // Current subscriber count (auto-updated)
  status: 'draft' | 'published' | 'completed' | 'archived';
  slug: string; // URL-friendly slug (unique per vendor)
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp; // Set when status changes to 'published'
  completedAt?: Timestamp; // Set when minSubscribers reached
  
  // Optional fields
  tags?: string[]; // Array of tags (max 10 tags, 30 chars each)
  category?: string; // Product category (max 50 chars)
  estimatedLaunchDate?: Timestamp; // Estimated launch date
  maxSubscribers?: number; // Maximum subscribers (optional cap)
  
  // Computed fields (updated by Cloud Functions)
  conversionRate?: number; // Percentage of views that convert to subscriptions
  totalViews?: number; // Total page views
  uniqueViews?: number; // Unique visitor count
}

/**
 * Product Pair Sub-document Schema
 * Embedded in CollectionWaitlistDocument.pairedProducts
 */
export interface ProductPairDocument {
  primaryProductId: string; // Reference to tailor_works document
  secondaryProductId: string; // Reference to tailor_works document
  relationship: 'buy_with' | 'complete_look' | 'accessory' | 'alternative';
  displayOrder: number; // Order for display (0-based)
  
  // Optional fields
  description?: string; // Pairing description (max 200 chars)
  bundleDiscount?: number; // Discount percentage for bundle (0-100)
}

/**
 * Waitlist Subscriptions Collection Schema
 * Path: /waitlist_subscriptions/{subscriptionId}
 */
export interface WaitlistSubscriptionDocument {
  // Required fields
  id: string;
  collectionId: string; // Reference to collection_waitlists document
  fullName: string; // Subscriber full name (max 100 chars)
  email: string; // Subscriber email (validated format)
  phoneNumber: string; // Subscriber phone (E.164 format)
  userId: string; // Firebase Auth UID (auto-created)
  subscribedAt: Timestamp;
  source: 'direct' | 'social' | 'referral' | 'email' | 'search';
  status: 'active' | 'unsubscribed' | 'converted' | 'invalid';
  
  // Metadata for analytics
  metadata: {
    userAgent?: string; // Browser user agent
    referrer?: string; // Referring URL
    ipAddress?: string; // IP address (hashed for privacy)
    deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    location?: {
      country?: string; // ISO country code
      state?: string; // State/province
      city?: string; // City name
    };
    utmSource?: string; // UTM tracking parameters
    utmMedium?: string;
    utmCampaign?: string;
  };
  
  // Optional fields
  preferences?: {
    emailNotifications: boolean; // Default: true
    smsNotifications: boolean; // Default: false
    launchNotifications: boolean; // Default: true
    marketingEmails: boolean; // Default: false
    frequency: 'immediate' | 'daily' | 'weekly'; // Default: 'immediate'
  };
  
  // Unsubscribe tracking
  unsubscribedAt?: Timestamp;
  unsubscribeReason?: string; // Reason for unsubscribing (max 500 chars)
  
  // Conversion tracking
  convertedAt?: Timestamp; // When user made a purchase
  convertedOrderId?: string; // Reference to order document
  convertedAmount?: number; // Purchase amount in cents
}

/**
 * Collection Analytics Collection Schema
 * Path: /collection_analytics/{analyticsId}
 * Note: analyticsId format: {collectionId}_{period} (e.g., "abc123_2024-01")
 */
export interface CollectionAnalyticsDocument {
  // Identifiers
  id: string;
  collectionId: string; // Reference to collection_waitlists document
  vendorId: string; // Firebase Auth UID of vendor
  
  // Time period
  periodStart: Timestamp; // Start of analytics period
  periodEnd: Timestamp; // End of analytics period
  periodType: 'daily' | 'weekly' | 'monthly' | 'all_time';
  
  // Subscription metrics
  totalSubscriptions: number; // Total subscriptions in period
  activeSubscriptions: number; // Currently active subscriptions
  unsubscriptions: number; // Unsubscriptions in period
  conversionRate: number; // Percentage (0-100)
  subscriptionTrend: AnalyticsDataPointDocument[]; // Daily trend data
  
  // Engagement metrics
  pageViews: number; // Total page views
  uniqueVisitors: number; // Unique visitors
  bounceRate: number; // Percentage (0-100)
  averageTimeOnPage: number; // Seconds
  
  // Source breakdown
  subscriptionSources: SourceAnalyticsDocument[]; // Source distribution
  topReferrers: ReferrerDataDocument[]; // Top referring domains
  
  // Geographic data
  topLocations: LocationDataDocument[]; // Top countries/states/cities
  
  // Device analytics
  deviceBreakdown: DeviceDataDocument[]; // Device type distribution
  
  // Time-based patterns
  peakSubscriptionTimes: TimeDataDocument[]; // Peak hours/days
  
  // Metadata
  lastUpdated: Timestamp;
  dataVersion: string; // Schema version for migrations
}

/**
 * Analytics Data Point Sub-document Schema
 */
export interface AnalyticsDataPointDocument {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number; // Metric value
  label?: string; // Optional label for display
}

/**
 * Source Analytics Sub-document Schema
 */
export interface SourceAnalyticsDocument {
  source: 'direct' | 'social' | 'referral' | 'email' | 'search';
  count: number; // Number of subscriptions
  percentage: number; // Percentage of total (0-100)
  conversionRate: number; // Source-specific conversion rate (0-100)
}

/**
 * Referrer Data Sub-document Schema
 */
export interface ReferrerDataDocument {
  domain: string; // Referring domain
  count: number; // Number of referrals
  percentage: number; // Percentage of total (0-100)
}

/**
 * Location Data Sub-document Schema
 */
export interface LocationDataDocument {
  country: string; // ISO country code
  state?: string; // State/province
  city?: string; // City name
  count: number; // Number of subscriptions
  percentage: number; // Percentage of total (0-100)
}

/**
 * Device Data Sub-document Schema
 */
export interface DeviceDataDocument {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  count: number; // Number of subscriptions
  percentage: number; // Percentage of total (0-100)
}

/**
 * Time Data Sub-document Schema
 */
export interface TimeDataDocument {
  hour: number; // Hour of day (0-23)
  day: string; // Day of week (Monday, Tuesday, etc.)
  count: number; // Number of subscriptions
}

/**
 * Notification Templates Collection Schema
 * Path: /waitlist_notification_templates/{templateId}
 */
export interface NotificationTemplateDocument {
  // Required fields
  id: string;
  type: 'vendor_new_subscription' | 'subscriber_confirmation' | 'collection_launch' | 'milestone_reached' | 'collection_completed';
  subject: string; // Email subject line (max 200 chars)
  htmlContent: string; // HTML email template
  textContent: string; // Plain text email template
  variables: string[]; // Array of template variables (e.g., ['{{name}}', '{{collection}}'])
  isActive: boolean; // Whether template is currently active
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Optional fields
  description?: string; // Template description (max 500 chars)
  previewData?: Record<string, string>; // Sample data for preview
  version?: number; // Template version number
  createdBy?: string; // Admin user who created template
}

// ============================================================================
// Database Constraints and Validation Rules
// ============================================================================

/**
 * Field validation constraints
 */
export const VALIDATION_CONSTRAINTS = {
  COLLECTION: {
    NAME_MAX_LENGTH: 100,
    NAME_MIN_LENGTH: 3,
    DESCRIPTION_MAX_LENGTH: 1000,
    DESCRIPTION_MIN_LENGTH: 10,
    SLUG_MAX_LENGTH: 100,
    SLUG_MIN_LENGTH: 3,
    MIN_SUBSCRIBERS_MIN: 1,
    MIN_SUBSCRIBERS_MAX: 10000,
    MAX_TAGS: 10,
    TAG_MAX_LENGTH: 30,
    CATEGORY_MAX_LENGTH: 50,
    MAX_PAIRED_PRODUCTS: 20,
  },
  SUBSCRIPTION: {
    FULL_NAME_MAX_LENGTH: 100,
    FULL_NAME_MIN_LENGTH: 2,
    EMAIL_MAX_LENGTH: 254, // RFC 5321 limit
    PHONE_MAX_LENGTH: 20,
    UNSUBSCRIBE_REASON_MAX_LENGTH: 500,
  },
  PRODUCT_PAIR: {
    DESCRIPTION_MAX_LENGTH: 200,
    BUNDLE_DISCOUNT_MIN: 0,
    BUNDLE_DISCOUNT_MAX: 100,
  },
  NOTIFICATION_TEMPLATE: {
    SUBJECT_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 500,
    MAX_VARIABLES: 50,
  },
} as const;

/**
 * Collection status transitions (allowed state changes)
 */
export const STATUS_TRANSITIONS = {
  draft: ['published', 'archived'],
  published: ['completed', 'archived'],
  completed: ['archived'],
  archived: [], // Terminal state
} as const;

/**
 * Subscription status transitions
 */
export const SUBSCRIPTION_STATUS_TRANSITIONS = {
  active: ['unsubscribed', 'converted', 'invalid'],
  unsubscribed: ['active'], // Can resubscribe
  converted: ['unsubscribed'], // Can unsubscribe after conversion
  invalid: ['active'], // Can be reactivated by admin
} as const;

// ============================================================================
// Index Definitions (for reference)
// ============================================================================

/**
 * Required Firestore indexes for efficient querying
 * These should be defined in firestore.indexes.json
 */
export const REQUIRED_INDEXES = [
  // Collection waitlists indexes
  {
    collection: 'collection_waitlists',
    fields: ['vendorId', 'status', 'createdAt'],
    description: 'Vendor collections by status and creation date',
  },
  {
    collection: 'collection_waitlists',
    fields: ['status', 'publishedAt'],
    description: 'Published collections by publish date',
  },
  {
    collection: 'collection_waitlists',
    fields: ['vendorId', 'currentSubscribers'],
    description: 'Vendor collections by subscriber count',
  },
  {
    collection: 'collection_waitlists',
    fields: ['category', 'status', 'publishedAt'],
    description: 'Collections by category and status',
  },
  
  // Waitlist subscriptions indexes
  {
    collection: 'waitlist_subscriptions',
    fields: ['collectionId', 'status', 'subscribedAt'],
    description: 'Collection subscriptions by status and date',
  },
  {
    collection: 'waitlist_subscriptions',
    fields: ['email', 'collectionId'],
    description: 'Duplicate subscription prevention',
  },
  {
    collection: 'waitlist_subscriptions',
    fields: ['userId', 'subscribedAt'],
    description: 'User subscription history',
  },
  {
    collection: 'waitlist_subscriptions',
    fields: ['source', 'subscribedAt'],
    description: 'Subscriptions by source and date',
  },
  
  // Analytics indexes
  {
    collection: 'collection_analytics',
    fields: ['vendorId', 'lastUpdated'],
    description: 'Vendor analytics by update date',
  },
  {
    collection: 'collection_analytics',
    fields: ['collectionId', 'periodStart'],
    description: 'Collection analytics by period',
  },
] as const;

// ============================================================================
// Cloud Function Triggers (for reference)
// ============================================================================

/**
 * Required Cloud Function triggers for data consistency
 */
export const CLOUD_FUNCTION_TRIGGERS = [
  {
    trigger: 'onCreate',
    collection: 'waitlist_subscriptions',
    function: 'onSubscriptionCreate',
    description: 'Update collection subscriber count, create user account, send notifications',
  },
  {
    trigger: 'onUpdate',
    collection: 'waitlist_subscriptions',
    function: 'onSubscriptionUpdate',
    description: 'Update collection subscriber count on status changes',
  },
  {
    trigger: 'onUpdate',
    collection: 'collection_waitlists',
    function: 'onCollectionUpdate',
    description: 'Update analytics, send notifications on status changes',
  },
  {
    trigger: 'scheduled',
    schedule: '0 2 * * *', // Daily at 2 AM
    function: 'generateDailyAnalytics',
    description: 'Generate daily analytics for all collections',
  },
  {
    trigger: 'scheduled',
    schedule: '0 3 * * 1', // Weekly on Monday at 3 AM
    function: 'generateWeeklyAnalytics',
    description: 'Generate weekly analytics summaries',
  },
] as const;