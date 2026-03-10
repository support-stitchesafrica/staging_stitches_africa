import { AtlasRole } from '@/lib/atlas/types';
import {
  DateRange,
  VendorAnalyticsData,
  BogoAnalyticsData,
  StorefrontAnalyticsData,
  CrossAnalyticsInsights,
  ExportOptions,
  ExportResult,
  AggregatedVendorData,
  AggregatedBogoData,
  AggregatedStorefrontData,
  MultiSourceAnalyticsData,
  CorrelationData,
  UnifiedAnalyticsData
} from './types';

/**
 * Unified analytics service interface
 * Main service for accessing all analytics data with role-based filtering
 */
export interface IUnifiedAnalyticsService {
  /**
   * Get vendor analytics data filtered by user role
   */
  getVendorAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<VendorAnalyticsData>;

  /**
   * Get BOGO analytics data filtered by user role
   */
  getBogoAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<BogoAnalyticsData>;

  /**
   * Get storefront analytics data filtered by user role
   */
  getStorefrontAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<StorefrontAnalyticsData>;

  /**
   * Get cross-analytics insights filtered by user role
   */
  getCrossAnalyticsInsights(dateRange: DateRange, userRole: AtlasRole): Promise<CrossAnalyticsInsights>;

  /**
   * Get unified analytics data combining all sources
   */
  getUnifiedAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<UnifiedAnalyticsData>;

  /**
   * Export unified analytics report
   */
  exportUnifiedReport(options: ExportOptions, userRole: AtlasRole): Promise<ExportResult>;
}

/**
 * Analytics aggregation service interface
 * Service for aggregating raw data from multiple sources
 */
export interface IAnalyticsAggregationService {
  /**
   * Aggregate vendor metrics from raw data sources
   */
  aggregateVendorMetrics(dateRange: DateRange): Promise<AggregatedVendorData>;

  /**
   * Aggregate BOGO metrics from raw data sources
   */
  aggregateBogoMetrics(dateRange: DateRange): Promise<AggregatedBogoData>;

  /**
   * Aggregate storefront metrics from raw data sources
   */
  aggregateStorefrontMetrics(dateRange: DateRange): Promise<AggregatedStorefrontData>;

  /**
   * Compute cross-analytics correlations
   */
  computeCrossAnalyticsCorrelations(data: MultiSourceAnalyticsData): Promise<CorrelationData>;
}

/**
 * Vendor analytics service interface
 * Specialized service for vendor-specific analytics
 */
export interface IVendorAnalyticsService {
  /**
   * Get vendor performance metrics
   */
  getVendorPerformanceMetrics(dateRange: DateRange): Promise<VendorAnalyticsData>;

  /**
   * Get real-time vendor data updates
   */
  subscribeToVendorUpdates(
    dateRange: DateRange,
    callback: (data: VendorAnalyticsData) => void
  ): () => void;

  /**
   * Get vendor analytics for specific vendors
   */
  getVendorAnalyticsById(vendorIds: string[], dateRange: DateRange): Promise<VendorAnalyticsData>;
}

/**
 * BOGO analytics service interface
 * Specialized service for BOGO campaign analytics
 */
export interface IBogoAnalyticsService {
  /**
   * Get BOGO campaign performance metrics
   */
  getBogoCampaignMetrics(dateRange: DateRange): Promise<BogoAnalyticsData>;

  /**
   * Get real-time BOGO data updates
   */
  subscribeToBogoCampaignUpdates(
    dateRange: DateRange,
    callback: (data: BogoAnalyticsData) => void
  ): () => void;

  /**
   * Get BOGO analytics for specific campaigns
   */
  getBogoCampaignAnalyticsById(campaignIds: string[], dateRange: DateRange): Promise<BogoAnalyticsData>;
}

/**
 * Storefront analytics service interface
 * Specialized service for storefront analytics
 */
export interface IStorefrontAnalyticsService {
  /**
   * Get storefront performance metrics
   */
  getStorefrontPerformanceMetrics(dateRange: DateRange): Promise<StorefrontAnalyticsData>;

  /**
   * Get real-time storefront data updates
   */
  subscribeToStorefrontUpdates(
    dateRange: DateRange,
    callback: (data: StorefrontAnalyticsData) => void
  ): () => void;

  /**
   * Get storefront analytics for specific storefronts
   */
  getStorefrontAnalyticsById(storefrontIds: string[], dateRange: DateRange): Promise<StorefrontAnalyticsData>;
}

/**
 * Role-based access control service interface
 * Service for managing analytics access permissions
 */
export interface IRoleBasedAccessService {
  /**
   * Check if user role has access to specific analytics section
   */
  hasAccessToSection(userRole: AtlasRole, section: 'vendor' | 'bogo' | 'storefront' | 'cross-analytics'): boolean;

  /**
   * Filter analytics data based on user role permissions
   */
  filterAnalyticsData<T>(data: T, userRole: AtlasRole, dataType: string): T;

  /**
   * Get role permissions for analytics access
   */
  getRolePermissions(userRole: AtlasRole): {
    canViewVendorAnalytics: boolean;
    canViewBogoAnalytics: boolean;
    canViewStorefrontAnalytics: boolean;
    canViewCrossAnalytics: boolean;
    canExportData: boolean;
    canManageAlerts: boolean;
  };
}

/**
 * Real-time data synchronization service interface
 * Service for managing real-time data updates
 */
export interface IRealTimeDataService {
  /**
   * Subscribe to real-time analytics updates
   */
  subscribeToAnalyticsUpdates(
    sections: ('vendor' | 'bogo' | 'storefront')[],
    dateRange: DateRange,
    callback: (data: Partial<UnifiedAnalyticsData>) => void
  ): () => void;

  /**
   * Check data freshness for analytics sections
   */
  checkDataFreshness(sections: ('vendor' | 'bogo' | 'storefront')[]): Promise<{
    [key: string]: {
      lastUpdated: Date;
      isStale: boolean;
      syncStatus: 'synced' | 'syncing' | 'error';
    };
  }>;

  /**
   * Force refresh of analytics data
   */
  forceRefresh(sections: ('vendor' | 'bogo' | 'storefront')[]): Promise<void>;
}

/**
 * Export service interface
 * Service for handling analytics data exports
 */
export interface IExportService {
  /**
   * Export analytics data to CSV format
   */
  exportToCSV(data: UnifiedAnalyticsData, options: ExportOptions): Promise<ExportResult>;

  /**
   * Export analytics data to JSON format
   */
  exportToJSON(data: UnifiedAnalyticsData, options: ExportOptions): Promise<ExportResult>;

  /**
   * Export analytics data to PDF format
   */
  exportToPDF(data: UnifiedAnalyticsData, options: ExportOptions): Promise<ExportResult>;

  /**
   * Validate export permissions for user role
   */
  validateExportPermissions(userRole: AtlasRole, options: ExportOptions): boolean;
}

/**
 * Alerting service interface
 * Service for managing analytics alerts and notifications
 */
export interface IAlertingService {
  /**
   * Set up performance threshold alerts
   */
  setupPerformanceAlerts(
    thresholds: {
      vendorConversionRate?: number;
      bogoRedemptionRate?: number;
      storefrontBounceRate?: number;
    },
    userRole: AtlasRole
  ): Promise<void>;

  /**
   * Check for alert conditions
   */
  checkAlertConditions(data: UnifiedAnalyticsData): Promise<{
    alerts: Array<{
      type: 'vendor' | 'bogo' | 'storefront';
      severity: 'high' | 'medium' | 'low';
      message: string;
      data: any;
    }>;
  }>;

  /**
   * Send notifications for triggered alerts
   */
  sendAlertNotifications(
    alerts: Array<{
      type: 'vendor' | 'bogo' | 'storefront';
      severity: 'high' | 'medium' | 'low';
      message: string;
      data: any;
    }>,
    userRole: AtlasRole
  ): Promise<void>;
}