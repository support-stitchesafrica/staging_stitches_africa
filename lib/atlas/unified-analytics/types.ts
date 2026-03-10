import { Timestamp } from 'firebase/firestore';
import { AtlasRole } from '@/lib/atlas/types';

/**
 * Date range interface for analytics filtering
 */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Data freshness indicator for real-time sync status
 */
export interface DataFreshnessIndicator {
  lastUpdated: Timestamp;
  isStale: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';
}

/**
 * Vendor performance metric interface
 */
export interface VendorPerformanceMetric {
  vendorId: string;
  vendorName: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  rank: number;
}

/**
 * Vendor trend data interface
 */
export interface VendorTrendData {
  vendorId: string;
  vendorName: string;
  currentPeriodVisits: number;
  previousPeriodVisits: number;
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
}

/**
 * Vendor conversion data interface
 */
export interface VendorConversionData {
  vendorId: string;
  vendorName: string;
  totalVisits: number;
  conversions: number;
  conversionRate: number;
}

/**
 * Vendor revenue data interface
 */
export interface VendorRevenueData {
  vendorId: string;
  vendorName: string;
  totalRevenue: number;
  averageOrderValue: number;
  orderCount: number;
}

/**
 * Vendor visit source data interface
 */
export interface VendorVisitSourceData {
  direct: number;
  search: number;
  social: number;
  referral: number;
  other: number;
}

/**
 * Vendor activity data interface
 */
export interface VendorActivityData {
  vendorId: string;
  vendorName: string;
  activityType: 'visit' | 'conversion' | 'milestone';
  timestamp: Date;
  description: string;
}

/**
 * Vendor insights data interface
 */
export interface VendorInsightsData {
  topPerformer: string;
  averageEngagement: number;
  conversionLeader: string;
  growthOpportunities: number;
}

/**
 * Vendor geographic data interface
 */
export interface VendorGeographicData {
  city: string;
  vendorCount: number;
  percentage: number;
  averagePerformance: number;
}

/**
 * Vendor category performance interface
 */
export interface VendorCategoryPerformance {
  category: string;
  visits: number;
  vendors: number;
  averageVisitsPerVendor: number;
  conversionRate: number;
}

/**
 * Vendor onboarding metrics interface
 */
export interface VendorOnboardingMetrics {
  newThisMonth: number;
  activeVendors: number;
  completionRate: number;
  averageOnboardingTime: number;
}

/**
 * Vendor analytics data interface
 */
export interface VendorAnalyticsData {
  totalVendors: number;
  totalVisits: number;
  topVendors: VendorPerformanceMetric[];
  trendingVendors: VendorTrendData[];
  conversionRates: VendorConversionData[];
  revenueMetrics: VendorRevenueData[];
  visitsBySource: VendorVisitSourceData;
  recentActivity?: VendorActivityData[];
  performanceInsights?: VendorInsightsData;
  geographicDistribution?: VendorGeographicData[];
  categoryPerformance?: VendorCategoryPerformance[];
  onboardingMetrics?: VendorOnboardingMetrics;
}

/**
 * Campaign performance metric interface
 */
export interface CampaignPerformanceMetric {
  campaignId: string;
  campaignName: string;
  redemptions: number;
  conversionRate: number;
  revenueImpact: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'completed' | 'paused';
}

/**
 * Product combination data interface
 */
export interface ProductCombinationData {
  primaryProductId: string;
  primaryProductName: string;
  secondaryProductId: string;
  secondaryProductName: string;
  combinationCount: number;
  conversionRate: number;
}

/**
 * Campaign comparison data interface
 */
export interface CampaignComparisonData {
  campaignId: string;
  campaignName: string;
  currentPeriodRedemptions: number;
  previousPeriodRedemptions: number;
  performanceChange: number;
  performanceDirection: 'up' | 'down' | 'stable';
}

/**
 * BOGO analytics data interface
 */
export interface BogoAnalyticsData {
  activeCampaigns: number;
  totalRedemptions: number;
  conversionRate: number;
  revenueImpact: number;
  topCampaigns: CampaignPerformanceMetric[];
  popularCombinations: ProductCombinationData[];
  campaignComparisons: CampaignComparisonData[];
}

/**
 * Storefront performance metric interface
 */
export interface StorefrontPerformanceMetric {
  storefrontId: string;
  storefrontName: string;
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  rank: number;
}

/**
 * Customer journey data interface
 */
export interface CustomerJourneyData {
  stage: 'landing' | 'browsing' | 'cart' | 'checkout' | 'purchase';
  visitors: number;
  conversionRate: number;
  dropOffRate: number;
}

/**
 * Session analytics data interface
 */
export interface SessionAnalyticsData {
  averageSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  newVsReturningVisitors: {
    new: number;
    returning: number;
  };
}

/**
 * Storefront analytics data interface
 */
export interface StorefrontAnalyticsData {
  totalStorefronts: number;
  aggregatedViews: number;
  aggregatedConversions: number;
  averageConversionRate: number;
  topPerformingStorefronts: StorefrontPerformanceMetric[];
  customerJourneyMetrics: CustomerJourneyData[];
  sessionAnalytics: SessionAnalyticsData;
}

/**
 * Correlation metric interface
 */
export interface CorrelationMetric {
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  significance: number;
}

/**
 * Impact analysis data interface
 */
export interface ImpactAnalysisData {
  campaignId: string;
  campaignName: string;
  storefrontImpact: {
    storefrontId: string;
    storefrontName: string;
    impactScore: number;
    revenueIncrease: number;
  }[];
}

/**
 * Optimization recommendation interface
 */
export interface OptimizationRecommendation {
  type: 'vendor' | 'bogo' | 'storefront' | 'cross-analytics';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
}

/**
 * Cross-analytics insights interface
 */
export interface CrossAnalyticsInsights {
  vendorBogoCorrelation: CorrelationMetric;
  storefrontVendorCorrelation: CorrelationMetric;
  campaignStorefrontImpact: ImpactAnalysisData[];
  unifiedPerformanceScore: number;
  optimizationRecommendations: OptimizationRecommendation[];
}

/**
 * Unified analytics data interface
 */
export interface UnifiedAnalyticsData {
  vendorAnalytics: VendorAnalyticsData;
  bogoAnalytics: BogoAnalyticsData;
  storefrontAnalytics: StorefrontAnalyticsData;
  crossAnalyticsInsights: CrossAnalyticsInsights;
  lastUpdated: Timestamp;
  dataFreshness: DataFreshnessIndicator;
}

/**
 * Export options interface
 */
export interface ExportOptions {
  sections: ('vendor' | 'bogo' | 'storefront' | 'cross-analytics')[];
  format: 'csv' | 'json' | 'pdf';
  dateRange: DateRange;
  includeCharts: boolean;
}

/**
 * Export result interface
 */
export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Role permissions for analytics access
 */
export interface RolePermissions {
  canViewVendorAnalytics: boolean;
  canViewBogoAnalytics: boolean;
  canViewStorefrontAnalytics: boolean;
  canViewCrossAnalytics: boolean;
  canExportData: boolean;
  canManageAlerts: boolean;
}

/**
 * Multi-source analytics data for correlation analysis
 */
export interface MultiSourceAnalyticsData {
  vendorData: VendorAnalyticsData;
  bogoData: BogoAnalyticsData;
  storefrontData: StorefrontAnalyticsData;
  dateRange: DateRange;
}

/**
 * Correlation data interface
 */
export interface CorrelationData {
  vendorBogoCorrelation: CorrelationMetric;
  storefrontVendorCorrelation: CorrelationMetric;
  campaignStorefrontImpact: ImpactAnalysisData[];
  insights: string[];
}

/**
 * Aggregated vendor data interface
 */
export interface AggregatedVendorData {
  metrics: VendorAnalyticsData;
  computedAt: Timestamp;
  dataQuality: 'high' | 'medium' | 'low';
}

/**
 * Aggregated BOGO data interface
 */
export interface AggregatedBogoData {
  metrics: BogoAnalyticsData;
  computedAt: Timestamp;
  dataQuality: 'high' | 'medium' | 'low';
}

/**
 * Aggregated storefront data interface
 */
export interface AggregatedStorefrontData {
  metrics: StorefrontAnalyticsData;
  computedAt: Timestamp;
  dataQuality: 'high' | 'medium' | 'low';
}