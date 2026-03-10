/**
 * Shop Activities Collection Schema
 * 
 * This file defines the TypeScript types for the shop_activities Firestore collection.
 * The collection tracks all user interactions in the /shops section for vendor analytics.
 * 
 * Requirements: 21.1, 21.7, 22.1
 * 
 * Data Retention Policy: Activities are archived after 12 months
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Activity types tracked in the shops section
 */
export type ActivityType = 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'search';

/**
 * Device types for activity tracking
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Traffic source types
 */
export type TrafficSource = 'direct' | 'search' | 'social' | 'referral';

/**
 * Main shop activity document structure
 * 
 * Collection: shop_activities
 * Document ID: Auto-generated
 */
export interface ShopActivity {
  /** Unique identifier for the activity */
  id: string;
  
  /** Type of activity performed */
  type: ActivityType;
  
  /** User ID (can be anonymous ID for non-logged-in users) */
  userId: string;
  
  /** Session ID for grouping activities */
  sessionId: string;
  
  /** Vendor/Tailor ID who owns the product */
  vendorId: string;
  
  /** Product ID (optional for search activities) */
  productId?: string;
  
  /** Timestamp when activity occurred */
  timestamp: Timestamp;
  
  /** Additional metadata about the activity */
  metadata: ActivityMetadata;
}

/**
 * Metadata associated with each activity
 */
export interface ActivityMetadata {
  // Product details (for cart/purchase events)
  /** Product price at time of activity */
  price?: number;
  
  /** Currency code (always USD) */
  currency?: string;
  
  /** Quantity for cart/purchase events */
  quantity?: number;
  
  // Search details (for search events)
  /** Search query string */
  searchQuery?: string;
  
  /** Number of results returned */
  resultsCount?: number;
  
  /** Position of clicked result in search */
  clickedResultPosition?: number;
  
  // Session & device info
  /** Device type used for activity */
  deviceType: DeviceType;
  
  /** User agent string */
  userAgent: string;
  
  // Location info
  /** User location data */
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
  
  // Referrer info
  /** Referring URL */
  referrer?: string;
  
  /** Traffic source category */
  source?: TrafficSource;
}

/**
 * Aggregated activity summary for analytics
 * This is computed from shop_activities collection
 */
export interface ActivitySummary {
  /** Vendor ID */
  vendorId: string;
  
  /** Product ID */
  productId: string;
  
  /** Date range for summary */
  dateRange: {
    start: Date;
    end: Date;
  };
  
  // View metrics
  /** Total number of views */
  totalViews: number;
  
  /** Unique views (distinct users) */
  uniqueViews: number;
  
  /** Average view duration in seconds */
  averageViewDuration?: number;
  
  // Cart metrics
  /** Number of add to cart actions */
  addToCartCount: number;
  
  /** Number of remove from cart actions */
  removeFromCartCount: number;
  
  /** Add to cart rate as percentage */
  addToCartRate: number; // (addToCart / views) * 100
  
  // Purchase metrics
  /** Number of purchases */
  purchaseCount: number;
  
  /** Conversion rate as percentage */
  conversionRate: number; // (purchases / views) * 100
  
  /** Cart conversion rate as percentage */
  cartConversionRate: number; // (purchases / addToCart) * 100
  
  // Revenue metrics (in USD)
  /** Total revenue from purchases */
  totalRevenue: number;
  
  /** Average order value */
  averageOrderValue: number;
}

/**
 * Firestore collection paths
 */
export const SHOP_ACTIVITIES_COLLECTION = 'shop_activities';

/**
 * Data retention policy
 */
export const DATA_RETENTION_MONTHS = 12;

/**
 * Composite indexes required for efficient querying
 * These are defined in firestore.indexes.json
 * 
 * 1. (vendorId ASC, timestamp DESC) - Vendor activity timeline
 * 2. (productId ASC, timestamp DESC) - Product activity timeline
 * 3. (type ASC, timestamp DESC) - Activity type filtering
 * 4. (vendorId ASC, type ASC, timestamp DESC) - Vendor + type filtering
 * 5. (productId ASC, type ASC, timestamp DESC) - Product + type filtering
 * 6. (userId ASC, timestamp DESC) - User activity history
 * 7. (sessionId ASC, timestamp ASC) - Session activity tracking
 * 8. (timestamp ASC) - Time-based cleanup queries
 */

/**
 * Example queries for shop_activities collection
 */
export const EXAMPLE_QUERIES = {
  // Get all activities for a vendor in date range
  vendorActivities: `
    query(
      collection(db, 'shop_activities'),
      where('vendorId', '==', vendorId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    )
  `,
  
  // Get product views
  productViews: `
    query(
      collection(db, 'shop_activities'),
      where('productId', '==', productId),
      where('type', '==', 'view'),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    )
  `,
  
  // Get cart activities for a product
  cartActivities: `
    query(
      collection(db, 'shop_activities'),
      where('productId', '==', productId),
      where('type', 'in', ['add_to_cart', 'remove_from_cart']),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    )
  `,
  
  // Get purchases for a vendor
  vendorPurchases: `
    query(
      collection(db, 'shop_activities'),
      where('vendorId', '==', vendorId),
      where('type', '==', 'purchase'),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    )
  `,
  
  // Get user session activities
  sessionActivities: `
    query(
      collection(db, 'shop_activities'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    )
  `,
  
  // Get activities for cleanup (older than 12 months)
  oldActivities: `
    query(
      collection(db, 'shop_activities'),
      where('timestamp', '<', twelveMonthsAgo),
      orderBy('timestamp', 'asc'),
      limit(500)
    )
  `
};

/**
 * Security rules summary for shop_activities
 * 
 * Read:
 * - Vendors can read activities for their products
 * - Admins can read all activities
 * 
 * Create:
 * - Anyone can create (including anonymous users for tracking)
 * 
 * Update:
 * - Not allowed (immutable once created)
 * 
 * Delete:
 * - Only admins (for data retention cleanup)
 */
