/**
 * Comparison Service
 * Handles period comparisons, year-over-year analysis, and growth rate calculations
 */

import { adminDb as db } from '@/lib/firebase-admin';
import {
  DateRange,
  ComparisonMetrics,
  YearOverYearComparison,
  TrendDataPoint,
  VendorAnalytics
} from '@/types/vendor-analytics';

export class ComparisonService {
  /**
   * Calculates percentage change between current and previous values
   * Property 25: Percentage change calculation
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculates growth rate between two data points
   * Property 26: Growth rate calculation
   */
  calculateGrowthRate(initial: number, final: number): number {
    if (initial === 0) {
      return final > 0 ? 100 : 0;
    }
    return ((final - initial) / initial) * 100;
  }

  /**
   * Determines trend direction from change value
   */
  determineTrend(change: number): 'up' | 'down' | 'stable' {
    if (Math.abs(change) < 0.5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  /**
   * Creates comparison metrics for a given metric
   */
  createComparisonMetrics(current: number, previous: number): ComparisonMetrics {
    const change = this.calculatePercentageChange(current, previous);
    return {
      current,
      previous,
      change,
      trend: this.determineTrend(change)
    };
  }

  /**
   * Gets the previous period date range for comparison
   */
  getPreviousPeriod(dateRange: DateRange): DateRange {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const duration = end.getTime() - start.getTime();

    return {
      start: new Date(start.getTime() - duration),
      end: new Date(start.getTime() - 1), // Day before current period starts
      preset: 'custom'
    };
  }

  /**
   * Gets year-over-year comparison date range
   */
  getYearOverYearPeriod(dateRange: DateRange): DateRange {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    return {
      start: new Date(start.getFullYear() - 1, start.getMonth(), start.getDate()),
      end: new Date(end.getFullYear() - 1, end.getMonth(), end.getDate()),
      preset: 'custom'
    };
  }

  /**
   * Fetches analytics for a specific period
   */
  private async getAnalyticsForPeriod(
    vendorId: string,
    dateRange: DateRange
  ): Promise<Partial<VendorAnalytics>> {
    const analyticsRef = db.collection("staging_vendor_analytics");
    
    const snapshot = await analyticsRef
      .where('vendorId', '==', vendorId)
      .where('date', '>=', dateRange.start)
      .where('date', '<=', dateRange.end)
      .get();

    if (snapshot.empty) {
      return {
        sales: {
          totalRevenue: 0,
          revenueChange: 0,
          averageOrderValue: 0,
          aovChange: 0,
          topCategories: [],
          revenueByProduct: [],
          salesTrend: [],
          completedOrders: 0,
          cancelledOrders: 0,
          cancellationRate: 0,
          paymentMethods: []
        },
        orders: {
          totalOrders: 0,
          orderChange: 0,
          funnel: {
            viewed: 0,
            addedToCart: 0,
            ordered: 0,
            paid: 0,
            delivered: 0
          },
          averageFulfillmentTime: 0,
          fulfillmentChange: 0,
          cancellationReasons: [],
          abandonedCheckouts: 0,
          abandonmentRate: 0,
          returnRate: 0,
          complaintRate: 0
        }
      };
    }

    // Aggregate data from all documents in the period
    let totalRevenue = 0;
    let totalOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalRevenue += data.sales?.totalRevenue || 0;
      totalOrders += data.orders?.totalOrders || 0;
      completedOrders += data.sales?.completedOrders || 0;
      cancelledOrders += data.sales?.cancelledOrders || 0;
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      sales: {
        totalRevenue,
        revenueChange: 0,
        averageOrderValue,
        aovChange: 0,
        topCategories: [],
        revenueByProduct: [],
        salesTrend: [],
        completedOrders,
        cancelledOrders,
        cancellationRate,
        paymentMethods: []
      },
      orders: {
        totalOrders,
        orderChange: 0,
        funnel: {
          viewed: 0,
          addedToCart: 0,
          ordered: totalOrders,
          paid: completedOrders,
          delivered: 0
        },
        averageFulfillmentTime: 0,
        fulfillmentChange: 0,
        cancellationReasons: [],
        abandonedCheckouts: 0,
        abandonmentRate: 0,
        returnRate: 0,
        complaintRate: 0
      }
    };
  }

  /**
   * Compares current period with previous period
   */
  async comparePeriods(
    vendorId: string,
    currentPeriod: DateRange
  ): Promise<{
    current: Partial<VendorAnalytics>;
    previous: Partial<VendorAnalytics>;
    comparisons: {
      revenue: ComparisonMetrics;
      orders: ComparisonMetrics;
      averageOrderValue: ComparisonMetrics;
      cancellationRate: ComparisonMetrics;
    };
  }> {
    const previousPeriod = this.getPreviousPeriod(currentPeriod);

    const [current, previous] = await Promise.all([
      this.getAnalyticsForPeriod(vendorId, currentPeriod),
      this.getAnalyticsForPeriod(vendorId, previousPeriod)
    ]);

    return {
      current,
      previous,
      comparisons: {
        revenue: this.createComparisonMetrics(
          current.sales?.totalRevenue || 0,
          previous.sales?.totalRevenue || 0
        ),
        orders: this.createComparisonMetrics(
          current.orders?.totalOrders || 0,
          previous.orders?.totalOrders || 0
        ),
        averageOrderValue: this.createComparisonMetrics(
          current.sales?.averageOrderValue || 0,
          previous.sales?.averageOrderValue || 0
        ),
        cancellationRate: this.createComparisonMetrics(
          current.sales?.cancellationRate || 0,
          previous.sales?.cancellationRate || 0
        )
      }
    };
  }

  /**
   * Performs year-over-year comparison
   */
  async compareYearOverYear(
    vendorId: string,
    currentPeriod: DateRange
  ): Promise<YearOverYearComparison[]> {
    const currentYear = currentPeriod.start.getFullYear();
    const comparisons: YearOverYearComparison[] = [];

    // Get data for current year and previous 2 years
    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;
      const yearPeriod: DateRange = {
        start: new Date(year, currentPeriod.start.getMonth(), currentPeriod.start.getDate()),
        end: new Date(year, currentPeriod.end.getMonth(), currentPeriod.end.getDate()),
        preset: 'custom'
      };

      const analytics = await this.getAnalyticsForPeriod(vendorId, yearPeriod);
      const value = analytics.sales?.totalRevenue || 0;

      // Calculate change from previous year
      let change = 0;
      if (i > 0 && comparisons.length > 0) {
        const previousYearValue = comparisons[i - 1].value;
        change = this.calculateGrowthRate(previousYearValue, value);
      }

      comparisons.push({
        year,
        value,
        change
      });
    }

    return comparisons.reverse(); // Oldest to newest
  }

  /**
   * Calculates cumulative metrics over time
   * Property 30: Cumulative metric calculation
   */
  calculateCumulativeMetrics(dataPoints: TrendDataPoint[]): TrendDataPoint[] {
    let cumulative = 0;
    return dataPoints.map(point => {
      cumulative += point.value;
      return {
        ...point,
        value: cumulative
      };
    });
  }

  /**
   * Formats comparison for display
   */
  formatComparison(comparison: ComparisonMetrics): string {
    const sign = comparison.change > 0 ? '+' : '';
    return `${sign}${comparison.change.toFixed(1)}% vs previous period`;
  }

  /**
   * Gets comparison label based on trend
   */
  getComparisonLabel(comparison: ComparisonMetrics, metricName: string): string {
    const direction = comparison.trend === 'up' ? 'increase' : 
                     comparison.trend === 'down' ? 'decrease' : 'no change';
    return `${Math.abs(comparison.change).toFixed(1)}% ${direction} in ${metricName}`;
  }
}

// Export singleton instance
export const comparisonService = new ComparisonService();
