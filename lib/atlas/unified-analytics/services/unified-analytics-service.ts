import { AtlasRole } from '@/lib/atlas/types';
import {
  DateRange,
  VendorAnalyticsData,
  BogoAnalyticsData,
  StorefrontAnalyticsData,
  CrossAnalyticsInsights,
  ExportOptions,
  ExportResult,
  UnifiedAnalyticsData,
  DataFreshnessIndicator
} from '../types';
import {
  IUnifiedAnalyticsService,
  IAnalyticsAggregationService,
  IRoleBasedAccessService,
  IExportService
} from '../interfaces';
import { Timestamp } from 'firebase/firestore';

/**
 * Unified analytics service implementation
 * Main service for accessing all analytics data with role-based filtering
 */
export class UnifiedAnalyticsService implements IUnifiedAnalyticsService {
  constructor(
    private aggregationService: IAnalyticsAggregationService,
    private accessService: IRoleBasedAccessService,
    private exportService: IExportService
  ) {}

  /**
   * Get vendor analytics data filtered by user role
   */
  async getVendorAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<VendorAnalyticsData> {
    // Check access permissions
    if (!this.accessService.hasAccessToSection(userRole, 'vendor')) {
      throw new Error('Insufficient permissions to access vendor analytics');
    }

    // Get aggregated data
    const aggregatedData = await this.aggregationService.aggregateVendorMetrics(dateRange);
    
    // Filter data based on role permissions
    return this.accessService.filterAnalyticsData(
      aggregatedData.metrics,
      userRole,
      'vendor'
    );
  }

  /**
   * Get BOGO analytics data filtered by user role
   */
  async getBogoAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<BogoAnalyticsData> {
    // Check access permissions
    if (!this.accessService.hasAccessToSection(userRole, 'bogo')) {
      throw new Error('Insufficient permissions to access BOGO analytics');
    }

    // Get aggregated data
    const aggregatedData = await this.aggregationService.aggregateBogoMetrics(dateRange);
    
    // Filter data based on role permissions
    return this.accessService.filterAnalyticsData(
      aggregatedData.metrics,
      userRole,
      'bogo'
    );
  }

  /**
   * Get storefront analytics data filtered by user role
   */
  async getStorefrontAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<StorefrontAnalyticsData> {
    // Check access permissions
    if (!this.accessService.hasAccessToSection(userRole, 'storefront')) {
      throw new Error('Insufficient permissions to access storefront analytics');
    }

    // Get aggregated data
    const aggregatedData = await this.aggregationService.aggregateStorefrontMetrics(dateRange);
    
    // Filter data based on role permissions
    return this.accessService.filterAnalyticsData(
      aggregatedData.metrics,
      userRole,
      'storefront'
    );
  }

  /**
   * Get cross-analytics insights filtered by user role
   */
  async getCrossAnalyticsInsights(dateRange: DateRange, userRole: AtlasRole): Promise<CrossAnalyticsInsights> {
    // Check access permissions
    if (!this.accessService.hasAccessToSection(userRole, 'cross-analytics')) {
      throw new Error('Insufficient permissions to access cross-analytics insights');
    }

    // Get data from all sources
    const [vendorData, bogoData, storefrontData] = await Promise.all([
      this.aggregationService.aggregateVendorMetrics(dateRange),
      this.aggregationService.aggregateBogoMetrics(dateRange),
      this.aggregationService.aggregateStorefrontMetrics(dateRange)
    ]);

    // Compute correlations
    const correlationData = await this.aggregationService.computeCrossAnalyticsCorrelations({
      vendorData: vendorData.metrics,
      bogoData: bogoData.metrics,
      storefrontData: storefrontData.metrics,
      dateRange
    });

    // Build cross-analytics insights
    const insights: CrossAnalyticsInsights = {
      vendorBogoCorrelation: correlationData.vendorBogoCorrelation,
      storefrontVendorCorrelation: correlationData.storefrontVendorCorrelation,
      campaignStorefrontImpact: correlationData.campaignStorefrontImpact,
      unifiedPerformanceScore: this.calculateUnifiedPerformanceScore(
        vendorData.metrics,
        bogoData.metrics,
        storefrontData.metrics
      ),
      optimizationRecommendations: this.generateOptimizationRecommendations(
        vendorData.metrics,
        bogoData.metrics,
        storefrontData.metrics,
        correlationData
      )
    };

    // Filter insights based on role permissions
    return this.accessService.filterAnalyticsData(
      insights,
      userRole,
      'cross-analytics'
    );
  }

  /**
   * Get unified analytics data combining all sources
   */
  async getUnifiedAnalytics(dateRange: DateRange, userRole: AtlasRole): Promise<UnifiedAnalyticsData> {
    const [vendorAnalytics, bogoAnalytics, storefrontAnalytics, crossAnalyticsInsights] = await Promise.all([
      this.getVendorAnalytics(dateRange, userRole).catch(() => null),
      this.getBogoAnalytics(dateRange, userRole).catch(() => null),
      this.getStorefrontAnalytics(dateRange, userRole).catch(() => null),
      this.getCrossAnalyticsInsights(dateRange, userRole).catch(() => null)
    ]);

    const dataFreshness: DataFreshnessIndicator = {
      lastUpdated: Timestamp.now(),
      isStale: false,
      syncStatus: 'synced'
    };

    return {
      vendorAnalytics: vendorAnalytics || this.getEmptyVendorAnalytics(),
      bogoAnalytics: bogoAnalytics || this.getEmptyBogoAnalytics(),
      storefrontAnalytics: storefrontAnalytics || this.getEmptyStorefrontAnalytics(),
      crossAnalyticsInsights: crossAnalyticsInsights || this.getEmptyCrossAnalyticsInsights(),
      lastUpdated: Timestamp.now(),
      dataFreshness
    };
  }

  /**
   * Export unified analytics report
   */
  async exportUnifiedReport(options: ExportOptions, userRole: AtlasRole): Promise<ExportResult> {
    // Validate export permissions
    if (!this.exportService.validateExportPermissions(userRole, options)) {
      return {
        success: false,
        error: 'Insufficient permissions to export analytics data'
      };
    }

    // Get unified analytics data
    const unifiedData = await this.getUnifiedAnalytics(options.dateRange, userRole);

    // Export based on format
    switch (options.format) {
      case 'csv':
        return this.exportService.exportToCSV(unifiedData, options);
      case 'json':
        return this.exportService.exportToJSON(unifiedData, options);
      case 'pdf':
        return this.exportService.exportToPDF(unifiedData, options);
      default:
        return {
          success: false,
          error: 'Unsupported export format'
        };
    }
  }

  /**
   * Calculate unified performance score
   */
  private calculateUnifiedPerformanceScore(
    vendorData: VendorAnalyticsData,
    bogoData: BogoAnalyticsData,
    storefrontData: StorefrontAnalyticsData
  ): number {
    // Simple weighted average of key metrics
    const vendorScore = vendorData.conversionRates.length > 0 
      ? vendorData.conversionRates.reduce((sum, v) => sum + v.conversionRate, 0) / vendorData.conversionRates.length
      : 0;
    
    const bogoScore = bogoData.conversionRate;
    const storefrontScore = storefrontData.averageConversionRate;

    // Weighted average (vendor: 40%, bogo: 30%, storefront: 30%)
    return (vendorScore * 0.4 + bogoScore * 0.3 + storefrontScore * 0.3) * 100;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    vendorData: VendorAnalyticsData,
    bogoData: BogoAnalyticsData,
    storefrontData: StorefrontAnalyticsData,
    correlationData: any
  ) {
    const recommendations = [];

    // Vendor optimization recommendations
    if (vendorData.conversionRates.some(v => v.conversionRate < 0.02)) {
      recommendations.push({
        type: 'vendor' as const,
        priority: 'high' as const,
        title: 'Improve Low-Converting Vendors',
        description: 'Several vendors have conversion rates below 2%',
        expectedImpact: 'Potential 15-25% increase in overall conversion rate',
        actionItems: [
          'Review vendor product quality and descriptions',
          'Optimize vendor storefront layouts',
          'Provide vendor training on best practices'
        ]
      });
    }

    // BOGO optimization recommendations
    if (bogoData.conversionRate < 0.05) {
      recommendations.push({
        type: 'bogo' as const,
        priority: 'medium' as const,
        title: 'Optimize BOGO Campaign Performance',
        description: 'BOGO campaigns are underperforming with low conversion rates',
        expectedImpact: 'Potential 20-30% increase in campaign effectiveness',
        actionItems: [
          'Review product combinations for better appeal',
          'Adjust campaign timing and duration',
          'Improve campaign visibility and promotion'
        ]
      });
    }

    // Storefront optimization recommendations
    if (storefrontData.sessionAnalytics.bounceRate > 0.6) {
      recommendations.push({
        type: 'storefront' as const,
        priority: 'high' as const,
        title: 'Reduce Storefront Bounce Rate',
        description: 'High bounce rate indicates poor user engagement',
        expectedImpact: 'Potential 10-20% increase in session duration',
        actionItems: [
          'Improve page loading speeds',
          'Enhance product discovery and navigation',
          'Optimize mobile experience'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get empty vendor analytics data
   */
  private getEmptyVendorAnalytics(): VendorAnalyticsData {
    return {
      totalVendors: 0,
      totalVisits: 0,
      topVendors: [],
      trendingVendors: [],
      conversionRates: [],
      revenueMetrics: [],
      visitsBySource: {
        direct: 0,
        search: 0,
        social: 0,
        referral: 0,
        other: 0
      }
    };
  }

  /**
   * Get empty BOGO analytics data
   */
  private getEmptyBogoAnalytics(): BogoAnalyticsData {
    return {
      activeCampaigns: 0,
      totalRedemptions: 0,
      conversionRate: 0,
      revenueImpact: 0,
      topCampaigns: [],
      popularCombinations: [],
      campaignComparisons: []
    };
  }

  /**
   * Get empty storefront analytics data
   */
  private getEmptyStorefrontAnalytics(): StorefrontAnalyticsData {
    return {
      totalStorefronts: 0,
      aggregatedViews: 0,
      aggregatedConversions: 0,
      averageConversionRate: 0,
      topPerformingStorefronts: [],
      customerJourneyMetrics: [],
      sessionAnalytics: {
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        newVsReturningVisitors: {
          new: 0,
          returning: 0
        }
      }
    };
  }

  /**
   * Get empty cross-analytics insights
   */
  private getEmptyCrossAnalyticsInsights(): CrossAnalyticsInsights {
    return {
      vendorBogoCorrelation: {
        correlation: 0,
        strength: 'weak',
        significance: 0
      },
      storefrontVendorCorrelation: {
        correlation: 0,
        strength: 'weak',
        significance: 0
      },
      campaignStorefrontImpact: [],
      unifiedPerformanceScore: 0,
      optimizationRecommendations: []
    };
  }
}