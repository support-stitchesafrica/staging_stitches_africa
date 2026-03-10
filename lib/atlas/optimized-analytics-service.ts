/**
 * Optimized Atlas Analytics Service with caching and performance enhancements
 */

import { AtlasRole } from '@/lib/atlas/types';
import { DateRange } from '@/lib/atlas/unified-analytics/types';
import { serverCacheManager as cacheManager, withCache, cacheKeys } from '@/lib/utils/server-cache-utils';
import { optimizedFirestore } from '@/lib/firebase-wrapper';
import { analytics } from '@/lib/analytics';

interface AnalyticsMetrics {
  totalUsers: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueByDate: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

interface VendorMetrics {
  totalVendors: number;
  activeVendors: number;
  topVendors: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    rating: number;
  }>;
  vendorGrowth: Array<{
    date: string;
    newVendors: number;
    totalVendors: number;
  }>;
}

interface StorefrontMetrics {
  totalStorefronts: number;
  totalViews: number;
  totalConversions: number;
  averageConversionRate: number;
  topStorefronts: Array<{
    id: string;
    name: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
}

class OptimizedAtlasAnalyticsService {
  // Cache TTL configurations
  private readonly CACHE_TTL = {
    REAL_TIME: 1 * 60 * 1000,      // 1 minute for real-time data
    SHORT_TERM: 5 * 60 * 1000,     // 5 minutes for frequently accessed data
    MEDIUM_TERM: 15 * 60 * 1000,   // 15 minutes for moderate data
    LONG_TERM: 60 * 60 * 1000,     // 1 hour for stable data
  };

  // Get analytics overview with caching
  getAnalyticsOverview = withCache(
    async (dateRange: DateRange, userRole: AtlasRole): Promise<AnalyticsMetrics> => {
      const startTime = performance.now();
      
      try {
        // Parallel data fetching for better performance
        const [
          totalUsers,
          revenueData,
          topProducts,
          conversionData
        ] = await Promise.all([
          this.getTotalUsers(dateRange),
          this.getRevenueData(dateRange),
          this.getTopProducts(dateRange, 10),
          this.getConversionData(dateRange)
        ]);

        const metrics: AnalyticsMetrics = {
          totalUsers,
          totalRevenue: revenueData.total,
          conversionRate: conversionData.rate,
          averageOrderValue: revenueData.averageOrderValue,
          topProducts,
          revenueByDate: revenueData.byDate
        };

        // Track performance
        const duration = performance.now() - startTime;
        analytics.trackPerformance('analytics_overview_load', duration, 'atlas');

        return metrics;
      } catch (error) {
        analytics.trackError(error instanceof Error ? error : new Error('Analytics overview failed'), 'atlas');
        throw error;
      }
    },
    (dateRange: DateRange, userRole: AtlasRole) => 
      `analytics-overview:${dateRange.from.toISOString()}:${dateRange.to.toISOString()}:${userRole}`,
    this.CACHE_TTL.SHORT_TERM
  );

  // Get vendor analytics with caching
  getVendorAnalytics = withCache(
    async (dateRange: DateRange, userRole: AtlasRole): Promise<VendorMetrics> => {
      const startTime = performance.now();
      
      try {
        const [
          vendorCounts,
          topVendors,
          vendorGrowth
        ] = await Promise.all([
          this.getVendorCounts(dateRange),
          this.getTopVendors(dateRange, 10),
          this.getVendorGrowthData(dateRange)
        ]);

        const metrics: VendorMetrics = {
          totalVendors: vendorCounts.total,
          activeVendors: vendorCounts.active,
          topVendors,
          vendorGrowth
        };

        const duration = performance.now() - startTime;
        analytics.trackPerformance('vendor_analytics_load', duration, 'atlas');

        return metrics;
      } catch (error) {
        analytics.trackError(error instanceof Error ? error : new Error('Vendor analytics failed'), 'atlas');
        throw error;
      }
    },
    (dateRange: DateRange, userRole: AtlasRole) => 
      `vendor-analytics:${dateRange.from.toISOString()}:${dateRange.to.toISOString()}:${userRole}`,
    this.CACHE_TTL.MEDIUM_TERM
  );

  // Get storefront analytics with caching
  getStorefrontAnalytics = withCache(
    async (dateRange: DateRange, userRole: AtlasRole): Promise<StorefrontMetrics> => {
      const startTime = performance.now();
      
      try {
        const [
          storefrontCounts,
          viewsData,
          conversionsData,
          topStorefronts
        ] = await Promise.all([
          this.getStorefrontCounts(),
          this.getStorefrontViews(dateRange),
          this.getStorefrontConversions(dateRange),
          this.getTopStorefronts(dateRange, 10)
        ]);

        const metrics: StorefrontMetrics = {
          totalStorefronts: storefrontCounts,
          totalViews: viewsData.total,
          totalConversions: conversionsData.total,
          averageConversionRate: conversionsData.total / viewsData.total,
          topStorefronts
        };

        const duration = performance.now() - startTime;
        analytics.trackPerformance('storefront_analytics_load', duration, 'atlas');

        return metrics;
      } catch (error) {
        analytics.trackError(error instanceof Error ? error : new Error('Storefront analytics failed'), 'atlas');
        throw error;
      }
    },
    (dateRange: DateRange, userRole: AtlasRole) => 
      `storefront-analytics:${dateRange.from.toISOString()}:${dateRange.to.toISOString()}:${userRole}`,
    this.CACHE_TTL.MEDIUM_TERM
  );

  // Optimized data fetching methods
  private async getTotalUsers(dateRange: DateRange): Promise<number> {
    try {
      // Use optimized Firestore operations
      const users = await optimizedFirestore.getCollection(
        'users',
        [
          // Add appropriate Firestore constraints here
        ],
        this.CACHE_TTL.MEDIUM_TERM
      );
      return users.length;
    } catch (error) {
      console.error('Error fetching total users:', error);
      return 0;
    }
  }

  private async getRevenueData(dateRange: DateRange): Promise<{
    total: number;
    averageOrderValue: number;
    byDate: Array<{ date: string; revenue: number; orders: number; }>;
  }> {
    try {
      // Simulate revenue data - replace with actual Firestore queries
      const orders = await optimizedFirestore.getCollection(
        'orders',
        [
          // Add date range constraints
        ],
        this.CACHE_TTL.SHORT_TERM
      );

      const total = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
      const averageOrderValue = orders.length > 0 ? total / orders.length : 0;

      // Group by date
      const byDate = this.groupOrdersByDate(orders);

      return { total, averageOrderValue, byDate };
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return { total: 0, averageOrderValue: 0, byDate: [] };
    }
  }

  private async getTopProducts(dateRange: DateRange, limit: number): Promise<Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>> {
    try {
      // Simulate top products data
      const products = await optimizedFirestore.getCollection(
        'tailor_works',
        [
          // Add appropriate constraints
        ],
        this.CACHE_TTL.MEDIUM_TERM
      );

      return products.slice(0, limit).map((product: any) => ({
        id: product.id,
        name: product.title || 'Unknown Product',
        sales: Math.floor(Math.random() * 100),
        revenue: Math.floor(Math.random() * 10000)
      }));
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  private async getConversionData(dateRange: DateRange): Promise<{ rate: number }> {
    try {
      // Simulate conversion data
      return { rate: 0.025 + Math.random() * 0.05 }; // 2.5% - 7.5%
    } catch (error) {
      console.error('Error fetching conversion data:', error);
      return { rate: 0 };
    }
  }

  private async getVendorCounts(dateRange: DateRange): Promise<{ total: number; active: number }> {
    try {
      const vendors = await optimizedFirestore.getCollection(
        'tailors',
        [],
        this.CACHE_TTL.LONG_TERM
      );

      const total = vendors.length;
      const active = vendors.filter((vendor: any) => vendor.isActive !== false).length;

      return { total, active };
    } catch (error) {
      console.error('Error fetching vendor counts:', error);
      return { total: 0, active: 0 };
    }
  }

  private async getTopVendors(dateRange: DateRange, limit: number): Promise<Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    rating: number;
  }>> {
    try {
      const vendors = await optimizedFirestore.getCollection(
        'tailors',
        [],
        this.CACHE_TTL.MEDIUM_TERM
      );

      return vendors.slice(0, limit).map((vendor: any) => ({
        id: vendor.id,
        name: vendor.brandName || `${vendor.first_name} ${vendor.last_name}`,
        revenue: Math.floor(Math.random() * 50000),
        orders: Math.floor(Math.random() * 200),
        rating: 4 + Math.random()
      }));
    } catch (error) {
      console.error('Error fetching top vendors:', error);
      return [];
    }
  }

  private async getVendorGrowthData(dateRange: DateRange): Promise<Array<{
    date: string;
    newVendors: number;
    totalVendors: number;
  }>> {
    try {
      // Simulate vendor growth data
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const growthData = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date(dateRange.from.getTime() + i * 24 * 60 * 60 * 1000);
        growthData.push({
          date: date.toISOString().split('T')[0],
          newVendors: Math.floor(Math.random() * 5),
          totalVendors: 100 + i * 2
        });
      }

      return growthData;
    } catch (error) {
      console.error('Error fetching vendor growth data:', error);
      return [];
    }
  }

  private async getStorefrontCounts(): Promise<number> {
    try {
      const storefronts = await optimizedFirestore.getCollection(
        'storefronts',
        [],
        this.CACHE_TTL.LONG_TERM
      );
      return storefronts.length;
    } catch (error) {
      console.error('Error fetching storefront counts:', error);
      return 0;
    }
  }

  private async getStorefrontViews(dateRange: DateRange): Promise<{ total: number }> {
    try {
      // Simulate storefront views
      return { total: Math.floor(Math.random() * 100000) };
    } catch (error) {
      console.error('Error fetching storefront views:', error);
      return { total: 0 };
    }
  }

  private async getStorefrontConversions(dateRange: DateRange): Promise<{ total: number }> {
    try {
      // Simulate storefront conversions
      return { total: Math.floor(Math.random() * 5000) };
    } catch (error) {
      console.error('Error fetching storefront conversions:', error);
      return { total: 0 };
    }
  }

  private async getTopStorefronts(dateRange: DateRange, limit: number): Promise<Array<{
    id: string;
    name: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>> {
    try {
      // Simulate top storefronts
      const storefronts = [];
      for (let i = 0; i < limit; i++) {
        const views = Math.floor(Math.random() * 10000);
        const conversions = Math.floor(views * (0.01 + Math.random() * 0.05));
        storefronts.push({
          id: `storefront-${i}`,
          name: `Storefront ${i + 1}`,
          views,
          conversions,
          conversionRate: conversions / views
        });
      }
      return storefronts;
    } catch (error) {
      console.error('Error fetching top storefronts:', error);
      return [];
    }
  }

  private groupOrdersByDate(orders: any[]): Array<{ date: string; revenue: number; orders: number; }> {
    const grouped = orders.reduce((acc: any, order: any) => {
      const date = new Date(order.createdAt || Date.now()).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total || 0;
      acc[date].orders += 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, data]: [string, any]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }));
  }

  // Preload critical data
  async preloadCriticalData(userRole: AtlasRole): Promise<void> {
    const defaultDateRange: DateRange = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    };

    try {
      // Preload in parallel for better performance
      await Promise.allSettled([
        this.getAnalyticsOverview(defaultDateRange, userRole),
        this.getVendorAnalytics(defaultDateRange, userRole),
        this.getStorefrontAnalytics(defaultDateRange, userRole)
      ]);
    } catch (error) {
      console.warn('Failed to preload critical data:', error);
    }
  }

  // Clear cache for specific data type
  clearCache(dataType?: string): void {
    if (dataType) {
      // Clear specific cache entries
      const keys = cacheManager.getStats();
      // Implementation would depend on cache manager capabilities
    } else {
      // Clear all analytics cache
      cacheManager.clear();
    }
  }
}

export const optimizedAtlasAnalyticsService = new OptimizedAtlasAnalyticsService();