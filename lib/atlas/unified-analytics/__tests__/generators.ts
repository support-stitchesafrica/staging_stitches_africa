import * as fc from 'fast-check';
import { AtlasRole } from '@/lib/atlas/types';
import {
  DateRange,
  VendorAnalyticsData,
  BogoAnalyticsData,
  StorefrontAnalyticsData,
  CrossAnalyticsInsights,
  VendorPerformanceMetric,
  CampaignPerformanceMetric,
  StorefrontPerformanceMetric
} from '../types';

/**
 * Property-based testing generators for unified analytics
 * These generators create random but valid test data for property tests
 */

// Basic generators
export const atlasRoleArb = fc.constantFrom<AtlasRole>(
  'superadmin',
  'founder', 
  'sales_lead',
  'brand_lead',
  'logistics_lead'
);

export const dateRangeArb = fc.record({
  from: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
  to: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
}).filter(({ from, to }) => from <= to);

// Vendor analytics generators
export const vendorPerformanceMetricArb = fc.record({
  vendorId: fc.string({ minLength: 1, maxLength: 20 }),
  vendorName: fc.string({ minLength: 5, maxLength: 50 }),
  visits: fc.integer({ min: 0, max: 100000 }),
  conversions: fc.integer({ min: 0, max: 10000 }),
  conversionRate: fc.float({ min: 0, max: 1, noNaN: true }),
  revenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
  rank: fc.integer({ min: 1, max: 1000 })
});

export const vendorAnalyticsDataArb = fc.record({
  totalVendors: fc.integer({ min: 0, max: 1000 }),
  totalVisits: fc.integer({ min: 0, max: 1000000 }),
  topVendors: fc.array(vendorPerformanceMetricArb, { minLength: 0, maxLength: 10 }),
  trendingVendors: fc.array(fc.record({
    vendorId: fc.string({ minLength: 1, maxLength: 20 }),
    vendorName: fc.string({ minLength: 5, maxLength: 50 }),
    currentPeriodVisits: fc.integer({ min: 0, max: 10000 }),
    previousPeriodVisits: fc.integer({ min: 0, max: 10000 }),
    trendPercentage: fc.float({ min: -100, max: 500, noNaN: true }),
    trendDirection: fc.constantFrom('up', 'down', 'stable')
  }), { minLength: 0, maxLength: 10 }),
  conversionRates: fc.array(fc.record({
    vendorId: fc.string({ minLength: 1, maxLength: 20 }),
    vendorName: fc.string({ minLength: 5, maxLength: 50 }),
    totalVisits: fc.integer({ min: 0, max: 100000 }),
    conversions: fc.integer({ min: 0, max: 10000 }),
    conversionRate: fc.float({ min: 0, max: 1, noNaN: true })
  }), { minLength: 0, maxLength: 20 }),
  revenueMetrics: fc.array(fc.record({
    vendorId: fc.string({ minLength: 1, maxLength: 20 }),
    vendorName: fc.string({ minLength: 5, maxLength: 50 }),
    totalRevenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
    averageOrderValue: fc.float({ min: 0, max: 10000, noNaN: true }),
    orderCount: fc.integer({ min: 0, max: 10000 })
  }), { minLength: 0, maxLength: 20 }),
  visitsBySource: fc.record({
    direct: fc.integer({ min: 0, max: 100000 }),
    search: fc.integer({ min: 0, max: 100000 }),
    social: fc.integer({ min: 0, max: 100000 }),
    referral: fc.integer({ min: 0, max: 100000 }),
    other: fc.integer({ min: 0, max: 100000 })
  })
});

// BOGO analytics generators
export const campaignPerformanceMetricArb = fc.record({
  campaignId: fc.string({ minLength: 1, maxLength: 20 }),
  campaignName: fc.string({ minLength: 5, maxLength: 50 }),
  redemptions: fc.integer({ min: 0, max: 10000 }),
  conversionRate: fc.float({ min: 0, max: 1, noNaN: true }),
  revenueImpact: fc.float({ min: 0, max: 1000000, noNaN: true }),
  startDate: fc.record({
    seconds: fc.integer({ min: 1577836800, max: 1735689600 }), // 2020-2025
    nanoseconds: fc.integer({ min: 0, max: 999999999 })
  }),
  endDate: fc.record({
    seconds: fc.integer({ min: 1577836800, max: 1735689600 }), // 2020-2025
    nanoseconds: fc.integer({ min: 0, max: 999999999 })
  }),
  status: fc.constantFrom('active', 'completed', 'paused')
});

export const bogoAnalyticsDataArb = fc.record({
  activeCampaigns: fc.integer({ min: 0, max: 100 }),
  totalRedemptions: fc.integer({ min: 0, max: 100000 }),
  conversionRate: fc.float({ min: 0, max: 1, noNaN: true }),
  revenueImpact: fc.float({ min: 0, max: 10000000, noNaN: true }),
  topCampaigns: fc.array(campaignPerformanceMetricArb, { minLength: 0, maxLength: 10 }),
  popularCombinations: fc.array(fc.record({
    primaryProductId: fc.string({ minLength: 1, maxLength: 20 }),
    primaryProductName: fc.string({ minLength: 5, maxLength: 50 }),
    secondaryProductId: fc.string({ minLength: 1, maxLength: 20 }),
    secondaryProductName: fc.string({ minLength: 5, maxLength: 50 }),
    combinationCount: fc.integer({ min: 0, max: 1000 }),
    conversionRate: fc.float({ min: 0, max: 1, noNaN: true })
  }), { minLength: 0, maxLength: 10 }),
  campaignComparisons: fc.array(fc.record({
    campaignId: fc.string({ minLength: 1, maxLength: 20 }),
    campaignName: fc.string({ minLength: 5, maxLength: 50 }),
    currentPeriodRedemptions: fc.integer({ min: 0, max: 10000 }),
    previousPeriodRedemptions: fc.integer({ min: 0, max: 10000 }),
    performanceChange: fc.float({ min: -100, max: 500, noNaN: true }),
    performanceDirection: fc.constantFrom('up', 'down', 'stable')
  }), { minLength: 0, maxLength: 10 })
});

// Storefront analytics generators
export const storefrontPerformanceMetricArb = fc.record({
  storefrontId: fc.string({ minLength: 1, maxLength: 20 }),
  storefrontName: fc.string({ minLength: 5, maxLength: 50 }),
  views: fc.integer({ min: 0, max: 100000 }),
  conversions: fc.integer({ min: 0, max: 10000 }),
  conversionRate: fc.float({ min: 0, max: 1, noNaN: true }),
  revenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
  rank: fc.integer({ min: 1, max: 1000 })
});

export const storefrontAnalyticsDataArb = fc.record({
  totalStorefronts: fc.integer({ min: 0, max: 1000 }),
  aggregatedViews: fc.integer({ min: 0, max: 1000000 }),
  aggregatedConversions: fc.integer({ min: 0, max: 100000 }),
  averageConversionRate: fc.float({ min: 0, max: 1, noNaN: true }),
  topPerformingStorefronts: fc.array(storefrontPerformanceMetricArb, { minLength: 0, maxLength: 10 }),
  customerJourneyMetrics: fc.array(fc.record({
    stage: fc.constantFrom('landing', 'browsing', 'cart', 'checkout', 'purchase'),
    visitors: fc.integer({ min: 0, max: 100000 }),
    conversionRate: fc.float({ min: 0, max: 1, noNaN: true }),
    dropOffRate: fc.float({ min: 0, max: 1, noNaN: true })
  }), { minLength: 0, maxLength: 5 }),
  sessionAnalytics: fc.record({
    averageSessionDuration: fc.integer({ min: 0, max: 3600 }),
    bounceRate: fc.float({ min: 0, max: 1, noNaN: true }),
    pagesPerSession: fc.float({ min: 0, max: 20, noNaN: true }),
    newVsReturningVisitors: fc.record({
      new: fc.integer({ min: 0, max: 100000 }),
      returning: fc.integer({ min: 0, max: 100000 })
    })
  })
});

// Cross-analytics generators
export const crossAnalyticsInsightsArb = fc.record({
  vendorBogoCorrelation: fc.record({
    correlation: fc.float({ min: -1, max: 1, noNaN: true }),
    strength: fc.constantFrom('weak', 'moderate', 'strong'),
    significance: fc.float({ min: 0, max: 1, noNaN: true })
  }),
  storefrontVendorCorrelation: fc.record({
    correlation: fc.float({ min: -1, max: 1, noNaN: true }),
    strength: fc.constantFrom('weak', 'moderate', 'strong'),
    significance: fc.float({ min: 0, max: 1, noNaN: true })
  }),
  campaignStorefrontImpact: fc.array(fc.record({
    campaignId: fc.string({ minLength: 1, maxLength: 20 }),
    campaignName: fc.string({ minLength: 5, maxLength: 50 }),
    storefrontImpact: fc.array(fc.record({
      storefrontId: fc.string({ minLength: 1, maxLength: 20 }),
      storefrontName: fc.string({ minLength: 5, maxLength: 50 }),
      impactScore: fc.float({ min: 0, max: 1, noNaN: true }),
      revenueIncrease: fc.float({ min: 0, max: 1000000, noNaN: true })
    }), { minLength: 0, maxLength: 5 })
  }), { minLength: 0, maxLength: 10 }),
  unifiedPerformanceScore: fc.float({ min: 0, max: 100, noNaN: true }),
  optimizationRecommendations: fc.array(fc.record({
    type: fc.constantFrom('vendor', 'bogo', 'storefront', 'cross-analytics'),
    priority: fc.constantFrom('high', 'medium', 'low'),
    title: fc.string({ minLength: 10, maxLength: 100 }),
    description: fc.string({ minLength: 20, maxLength: 200 }),
    expectedImpact: fc.string({ minLength: 10, maxLength: 100 }),
    actionItems: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 })
  }), { minLength: 0, maxLength: 10 })
});

// Export options generator
export const exportOptionsArb = fc.record({
  sections: fc.array(fc.constantFrom('vendor', 'bogo', 'storefront', 'cross-analytics'), { minLength: 1, maxLength: 4 }),
  format: fc.constantFrom('csv', 'json', 'pdf'),
  dateRange: dateRangeArb,
  includeCharts: fc.boolean()
});

// Unified analytics data generator
export const unifiedAnalyticsDataArb = fc.record({
  vendorAnalytics: vendorAnalyticsDataArb,
  bogoAnalytics: bogoAnalyticsDataArb,
  storefrontAnalytics: storefrontAnalyticsDataArb,
  crossAnalyticsInsights: crossAnalyticsInsightsArb,
  lastUpdated: fc.record({
    seconds: fc.integer({ min: 1577836800, max: 1735689600 }),
    nanoseconds: fc.integer({ min: 0, max: 999999999 })
  }),
  dataFreshness: fc.record({
    lastUpdated: fc.record({
      seconds: fc.integer({ min: 1577836800, max: 1735689600 }),
      nanoseconds: fc.integer({ min: 0, max: 999999999 })
    }),
    isStale: fc.boolean(),
    syncStatus: fc.constantFrom('synced', 'syncing', 'error')
  })
});