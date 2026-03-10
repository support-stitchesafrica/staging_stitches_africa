/**
 * Vendor Services Index
 * Exports all vendor analytics services
 */

export { BaseVendorService } from './base-service';
export { VendorAnalyticsService } from './analytics-service';
export { ProductRankingService } from './product-ranking-service';
export { CustomerInsightsService } from './customer-insights-service';
export { PayoutService } from './payout-service';
export { InventoryService } from './inventory-service';
export { NotificationService } from './notification-service';
export { WaitlistNotificationService } from './waitlist-notification-service';
export { NotificationQueueService } from './notification-queue-service';
export { WaitlistNotificationManager } from './waitlist-notification-manager';

// Re-export types for convenience
export type {
  VendorAnalytics,
  SalesMetrics,
  OrderMetrics,
  ProductMetrics,
  CustomerMetrics,
  PayoutMetrics,
  StoreMetrics,
  ProductAnalytics,
  RankingFactors,
  ProductRanking,
  CustomerSegment,
  AnonymizedCustomer,
  PayoutRecord,
  FeeBreakdown,
  InventoryAlert,
  InventoryForecast,
  VendorNotification,
  NotificationPreferences,
  DateRange,
  ServiceResponse,
  ServiceError,
  ExportOptions,
  ExportResult
} from '@/types/vendor-analytics';
