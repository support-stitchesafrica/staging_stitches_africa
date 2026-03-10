/**
 * Performance Alerts Service
 * Detects and generates alerts for performance issues, opportunities, and critical conditions
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { BaseVendorService } from './base-service';
import {
  VendorNotification,
  ServiceResponse,
  PerformanceAlert,
  AlertType,
  AlertSeverity
} from '@/types/vendor-analytics';
import { db } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';

// Alert thresholds
const THRESHOLDS = {
  METRIC_DECLINE: 0.20, // 20% decline triggers alert
  CRITICAL_STOCK: 5, // 5 units or less is critical
  LOW_STOCK_DAYS: 7, // Alert if stock runs out in 7 days
  HIGH_RETURN_RATE: 0.15, // 15% return rate
  HIGH_COMPLAINT_RATE: 0.10, // 10% complaint rate
  RANKING_DROP: 10, // 10 position drop
  TRENDING_THRESHOLD: 0.50, // 50% increase in views/sales
  LOW_VISIBILITY: 30, // Visibility score below 30
} as const;

export class PerformanceAlertsService extends BaseVendorService {
  constructor() {
    super('PerformanceAlertsService');
  }

  /**
   * Generates all performance alerts for a vendor
   * Requirement 19.1, 19.2, 19.3, 19.4, 19.5
   */
  async generatePerformanceAlerts(
    vendorId: string
  ): Promise<ServiceResponse<PerformanceAlert[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      this.log('info', 'Generating performance alerts', { vendorId });

      const alerts: PerformanceAlert[] = [];


      // Run all alert checks in parallel
      const [
        metricDeclineAlerts,
        qualityIssueAlerts,
        criticalInventoryAlerts,
        rankingDropAlerts,
        opportunityAlerts
      ] = await Promise.all([
        this.detectMetricDeclines(vendorId),
        this.detectQualityIssues(vendorId),
        this.detectCriticalInventory(vendorId),
        this.detectRankingDrops(vendorId),
        this.detectOpportunities(vendorId)
      ]);

      // Combine all alerts
      alerts.push(
        ...metricDeclineAlerts,
        ...qualityIssueAlerts,
        ...criticalInventoryAlerts,
        ...rankingDropAlerts,
        ...opportunityAlerts
      );

      this.log('info', 'Performance alerts generated', {
        vendorId,
        alertCount: alerts.length
      });

      return alerts;
    }, 'generatePerformanceAlerts');
  }

  /**
   * Detects metric declines (sales, traffic, orders)
   * Requirement 19.1 - Property 34: Metric decline alert generation
   */
  private async detectMetricDeclines(vendorId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    try {
      // Get recent analytics data (last 2 periods)
      const analyticsQuery = query(
        collection(db, "staging_vendor_analytics"),
        where('vendorId', '==', vendorId),
        orderBy('date', 'desc'),
        firestoreLimit(2)
      );

      const snapshot = await getDocs(analyticsQuery);
      
      if (snapshot.size < 2) {
        // Not enough data for comparison
        return alerts;
      }

      const [current, previous] = snapshot.docs.map(doc => doc.data());

      // Check revenue decline
      const revenueChange = current.sales?.revenueChange || 0;
      if (revenueChange < -THRESHOLDS.METRIC_DECLINE * 100) {
        alerts.push({
          type: 'metric_decline',
          severity: 'high',
          category: 'performance',
          title: 'Revenue Decline Detected',
          message: `Your revenue has dropped by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period.`,
          actionUrl: '/vendor/analytics/sales',
          metadata: {
            metric: 'revenue',
            currentValue: current.sales?.totalRevenue || 0,
            previousValue: previous.sales?.totalRevenue || 0,
            changePercentage: revenueChange,
            threshold: -THRESHOLDS.METRIC_DECLINE * 100
          },
          createdAt: new Date()
        });
      }

      // Check order decline
      const orderChange = current.orders?.orderChange || 0;
      if (orderChange < -THRESHOLDS.METRIC_DECLINE * 100) {
        alerts.push({
          type: 'metric_decline',
          severity: 'high',
          category: 'performance',
          title: 'Order Volume Decline',
          message: `Your order count has dropped by ${Math.abs(orderChange).toFixed(1)}% compared to the previous period.`,
          actionUrl: '/vendor/analytics/orders',
          metadata: {
            metric: 'orders',
            currentValue: current.orders?.totalOrders || 0,
            previousValue: previous.orders?.totalOrders || 0,
            changePercentage: orderChange,
            threshold: -THRESHOLDS.METRIC_DECLINE * 100
          },
          createdAt: new Date()
        });
      }

      // Check traffic decline (profile visits)
      const currentVisits = current.traffic?.profileVisits || 0;
      const previousVisits = previous.traffic?.profileVisits || 0;
      if (previousVisits > 0) {
        const visitChange = ((currentVisits - previousVisits) / previousVisits) * 100;
        if (visitChange < -THRESHOLDS.METRIC_DECLINE * 100) {
          alerts.push({
            type: 'metric_decline',
            severity: 'medium',
            category: 'performance',
            title: 'Store Traffic Decline',
            message: `Your store visits have dropped by ${Math.abs(visitChange).toFixed(1)}%. Consider improving your product listings.`,
            actionUrl: '/vendor/analytics/store',
            metadata: {
              metric: 'traffic',
              currentValue: currentVisits,
              previousValue: previousVisits,
              changePercentage: visitChange,
              threshold: -THRESHOLDS.METRIC_DECLINE * 100
            },
            createdAt: new Date()
          });
        }
      }

      // Check conversion rate decline
      const currentConversion = current.sales?.conversionRate || 0;
      const previousConversion = previous.sales?.conversionRate || 0;
      if (previousConversion > 0) {
        const conversionChange = ((currentConversion - previousConversion) / previousConversion) * 100;
        if (conversionChange < -THRESHOLDS.METRIC_DECLINE * 100) {
          alerts.push({
            type: 'metric_decline',
            severity: 'medium',
            category: 'performance',
            title: 'Conversion Rate Decline',
            message: `Your conversion rate has dropped by ${Math.abs(conversionChange).toFixed(1)}%. Review product pricing and descriptions.`,
            actionUrl: '/vendor/products',
            metadata: {
              metric: 'conversion_rate',
              currentValue: currentConversion,
              previousValue: previousConversion,
              changePercentage: conversionChange,
              threshold: -THRESHOLDS.METRIC_DECLINE * 100
            },
            createdAt: new Date()
          });
        }
      }

    } catch (error) {
      this.log('warn', 'Failed to detect metric declines', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Detects quality issues (high returns, complaints)
   * Requirement 19.2
   */
  private async detectQualityIssues(vendorId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    try {
      // Get recent analytics data
      const analyticsQuery = query(
        collection(db, "staging_vendor_analytics"),
        where('vendorId', '==', vendorId),
        orderBy('date', 'desc'),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(analyticsQuery);
      
      if (snapshot.empty) {
        return alerts;
      }

      const data = snapshot.docs[0].data();

      // Check return rate
      const returnRate = (data.orders?.returnRate || 0) / 100;
      if (returnRate > THRESHOLDS.HIGH_RETURN_RATE) {
        alerts.push({
          type: 'quality_issue',
          severity: 'high',
          category: 'performance',
          title: 'High Return Rate Detected',
          message: `Your return rate is ${(returnRate * 100).toFixed(1)}%. Review product quality and descriptions to reduce returns.`,
          actionUrl: '/vendor/analytics/orders',
          metadata: {
            issueType: 'returns',
            rate: returnRate,
            threshold: THRESHOLDS.HIGH_RETURN_RATE,
            affectedProducts: [] // Would be populated with actual product data
          },
          createdAt: new Date()
        });
      }

      // Check complaint rate
      const complaintRate = (data.orders?.complaintRate || 0) / 100;
      if (complaintRate > THRESHOLDS.HIGH_COMPLAINT_RATE) {
        alerts.push({
          type: 'quality_issue',
          severity: 'high',
          category: 'performance',
          title: 'High Complaint Rate',
          message: `Your complaint rate is ${(complaintRate * 100).toFixed(1)}%. Address customer concerns promptly to maintain your reputation.`,
          actionUrl: '/vendor/analytics/orders',
          metadata: {
            issueType: 'complaints',
            rate: complaintRate,
            threshold: THRESHOLDS.HIGH_COMPLAINT_RATE,
            affectedProducts: []
          },
          createdAt: new Date()
        });
      }

      // Check cancellation rate
      const cancellationRate = (data.orders?.cancellationRate || 0) / 100;
      if (cancellationRate > 0.20) {
        alerts.push({
          type: 'quality_issue',
          severity: 'medium',
          category: 'performance',
          title: 'High Cancellation Rate',
          message: `Your cancellation rate is ${(cancellationRate * 100).toFixed(1)}%. This may affect your store ranking.`,
          actionUrl: '/vendor/analytics/orders',
          metadata: {
            issueType: 'cancellations',
            rate: cancellationRate,
            threshold: 0.20,
            topReasons: data.orders?.cancellationReasons || []
          },
          createdAt: new Date()
        });
      }

      // Check fulfillment time
      const avgFulfillmentTime = data.orders?.averageFulfillmentTime || 0;
      if (avgFulfillmentTime > 72) { // More than 3 days
        alerts.push({
          type: 'quality_issue',
          severity: 'medium',
          category: 'performance',
          title: 'Slow Fulfillment Time',
          message: `Your average fulfillment time is ${avgFulfillmentTime.toFixed(1)} hours. Faster fulfillment improves customer satisfaction and rankings.`,
          actionUrl: '/vendor/inventory',
          metadata: {
            issueType: 'fulfillment',
            averageTime: avgFulfillmentTime,
            threshold: 72
          },
          createdAt: new Date()
        });
      }

    } catch (error) {
      this.log('warn', 'Failed to detect quality issues', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Detects critical inventory warnings
   * Requirement 19.3 - Property 35: Critical stock warning urgency
   */
  private async detectCriticalInventory(vendorId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    try {
      // Get inventory alerts
      const inventoryQuery = query(
        collection(db, 'inventory_alerts'),
        where('vendorId', '==', vendorId),
        where('severity', 'in', ['critical', 'warning']),
        orderBy('createdAt', 'desc'),
        firestoreLimit(50)
      );

      const snapshot = await getDocs(inventoryQuery);
      
      // Group alerts by type
      const criticalStockProducts: any[] = [];
      const outOfStockProducts: any[] = [];
      const lowStockProducts: any[] = [];

      snapshot.docs.forEach(doc => {
        const alert = doc.data();
        
        if (alert.type === 'out_of_stock') {
          outOfStockProducts.push(alert);
        } else if (alert.type === 'low_stock') {
          const currentStock = alert.currentStock || 0;
          if (currentStock <= THRESHOLDS.CRITICAL_STOCK) {
            criticalStockProducts.push(alert);
          } else {
            lowStockProducts.push(alert);
          }
        }
      });

      // Critical stock alert (Property 35)
      if (criticalStockProducts.length > 0) {
        alerts.push({
          type: 'critical_inventory',
          severity: 'critical',
          category: 'stock',
          title: 'Critical Stock Levels',
          message: `${criticalStockProducts.length} product${criticalStockProducts.length > 1 ? 's have' : ' has'} critically low stock (≤${THRESHOLDS.CRITICAL_STOCK} units). Restock immediately to avoid lost sales.`,
          actionUrl: '/vendor/inventory/alerts',
          metadata: {
            criticalCount: criticalStockProducts.length,
            threshold: THRESHOLDS.CRITICAL_STOCK,
            products: criticalStockProducts.map(p => ({
              productId: p.productId,
              productName: p.productName,
              currentStock: p.currentStock
            }))
          },
          createdAt: new Date()
        });
      }

      // Out of stock alert
      if (outOfStockProducts.length > 0) {
        alerts.push({
          type: 'critical_inventory',
          severity: 'critical',
          category: 'stock',
          title: 'Products Out of Stock',
          message: `${outOfStockProducts.length} product${outOfStockProducts.length > 1 ? 's are' : ' is'} out of stock and not visible to customers. Restock to resume sales.`,
          actionUrl: '/vendor/inventory/alerts',
          metadata: {
            outOfStockCount: outOfStockProducts.length,
            products: outOfStockProducts.map(p => ({
              productId: p.productId,
              productName: p.productName
            }))
          },
          createdAt: new Date()
        });
      }

      // Low stock warning
      if (lowStockProducts.length > 0) {
        alerts.push({
          type: 'critical_inventory',
          severity: 'medium',
          category: 'stock',
          title: 'Low Stock Warning',
          message: `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's have' : ' has'} low stock levels. Plan restocking to avoid stockouts.`,
          actionUrl: '/vendor/inventory/alerts',
          metadata: {
            lowStockCount: lowStockProducts.length,
            products: lowStockProducts.map(p => ({
              productId: p.productId,
              productName: p.productName,
              currentStock: p.currentStock,
              recommendedStock: p.recommendedStock
            }))
          },
          createdAt: new Date()
        });
      }

    } catch (error) {
      this.log('warn', 'Failed to detect critical inventory', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Detects ranking drops
   * Requirement 19.4
   */
  private async detectRankingDrops(vendorId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    try {
      // Get vendor rankings
      const rankingsQuery = query(
        collection(db, 'vendor_rankings'),
        where('vendorId', '==', vendorId),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(rankingsQuery);
      
      if (snapshot.empty) {
        return alerts;
      }

      const data = snapshot.docs[0].data();
      const products = data.products || {};

      // Check for significant ranking drops
      const droppedProducts = Object.entries(products)
        .filter(([_, productData]: [string, any]) => 
          productData.change && productData.change < -THRESHOLDS.RANKING_DROP
        )
        .map(([productId, productData]: [string, any]) => ({
          productId,
          productName: productData.name || 'Unknown Product',
          rankingChange: productData.change,
          currentPosition: productData.rankingPosition,
          previousPosition: productData.rankingPosition - productData.change,
          visibilityScore: productData.visibilityScore
        }));

      if (droppedProducts.length > 0) {
        // Sort by biggest drop
        droppedProducts.sort((a, b) => a.rankingChange - b.rankingChange);

        alerts.push({
          type: 'ranking_drop',
          severity: 'high',
          category: 'ranking',
          title: 'Product Rankings Dropped',
          message: `${droppedProducts.length} product${droppedProducts.length > 1 ? 's have' : ' has'} dropped significantly in ranking. Review recommendations to improve visibility.`,
          actionUrl: '/vendor/products',
          metadata: {
            droppedCount: droppedProducts.length,
            threshold: THRESHOLDS.RANKING_DROP,
            products: droppedProducts.slice(0, 10) // Top 10 worst drops
          },
          createdAt: new Date()
        });
      }

      // Check for low visibility scores
      const lowVisibilityProducts = Object.entries(products)
        .filter(([_, productData]: [string, any]) => 
          productData.visibilityScore && productData.visibilityScore < THRESHOLDS.LOW_VISIBILITY
        )
        .map(([productId, productData]: [string, any]) => ({
          productId,
          productName: productData.name || 'Unknown Product',
          visibilityScore: productData.visibilityScore,
          rankingPosition: productData.rankingPosition
        }));

      if (lowVisibilityProducts.length > 0) {
        alerts.push({
          type: 'ranking_drop',
          severity: 'medium',
          category: 'ranking',
          title: 'Low Product Visibility',
          message: `${lowVisibilityProducts.length} product${lowVisibilityProducts.length > 1 ? 's have' : ' has'} low visibility scores (<${THRESHOLDS.LOW_VISIBILITY}). Optimize to increase discoverability.`,
          actionUrl: '/vendor/products',
          metadata: {
            lowVisibilityCount: lowVisibilityProducts.length,
            threshold: THRESHOLDS.LOW_VISIBILITY,
            products: lowVisibilityProducts.slice(0, 10)
          },
          createdAt: new Date()
        });
      }

      // Check store engagement score
      const storeEngagementScore = data.storeEngagementScore || 0;
      if (storeEngagementScore < 50) {
        alerts.push({
          type: 'ranking_drop',
          severity: 'medium',
          category: 'ranking',
          title: 'Low Store Engagement',
          message: `Your store engagement score is ${storeEngagementScore.toFixed(1)}. Improve product quality, response time, and customer service.`,
          actionUrl: '/vendor/analytics/store',
          metadata: {
            engagementScore: storeEngagementScore,
            threshold: 50
          },
          createdAt: new Date()
        });
      }

    } catch (error) {
      this.log('warn', 'Failed to detect ranking drops', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Detects opportunities (trending products, categories)
   * Requirement 19.5
   */
  private async detectOpportunities(vendorId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    try {
      // Get recent product analytics
      const productAnalyticsQuery = query(
        collection(db, "staging_product_analytics"),
        where('vendorId', '==', vendorId),
        orderBy('date', 'desc'),
        firestoreLimit(100)
      );

      const snapshot = await getDocs(productAnalyticsQuery);
      
      if (snapshot.empty) {
        return alerts;
      }

      // Group by product to find trending items
      const productMetrics = new Map<string, any[]>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const productId = data.productId;
        
        if (!productMetrics.has(productId)) {
          productMetrics.set(productId, []);
        }
        productMetrics.get(productId)!.push(data);
      });

      // Find trending products (significant increase in views or sales)
      const trendingProducts: any[] = [];
      
      productMetrics.forEach((metrics, productId) => {
        if (metrics.length < 2) return;

        // Sort by date
        metrics.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(a.date);
          const dateB = b.date?.toDate?.() || new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        const recent = metrics[0];
        const previous = metrics[1];

        // Check for view increase
        const viewIncrease = previous.views > 0
          ? ((recent.views - previous.views) / previous.views)
          : 0;

        // Check for sales increase
        const salesIncrease = previous.purchases > 0
          ? ((recent.purchases - previous.purchases) / previous.purchases)
          : 0;

        if (viewIncrease > THRESHOLDS.TRENDING_THRESHOLD || salesIncrease > THRESHOLDS.TRENDING_THRESHOLD) {
          trendingProducts.push({
            productId,
            productName: recent.productName || 'Unknown Product',
            viewIncrease: viewIncrease * 100,
            salesIncrease: salesIncrease * 100,
            currentViews: recent.views,
            currentSales: recent.purchases
          });
        }
      });

      if (trendingProducts.length > 0) {
        // Sort by biggest increase
        trendingProducts.sort((a, b) => 
          (b.viewIncrease + b.salesIncrease) - (a.viewIncrease + a.salesIncrease)
        );

        alerts.push({
          type: 'opportunity',
          severity: 'low',
          category: 'milestone',
          title: 'Trending Products Detected',
          message: `${trendingProducts.length} of your product${trendingProducts.length > 1 ? 's are' : ' is'} trending! Consider increasing stock and promoting these items.`,
          actionUrl: '/vendor/products',
          metadata: {
            trendingCount: trendingProducts.length,
            threshold: THRESHOLDS.TRENDING_THRESHOLD,
            products: trendingProducts.slice(0, 5) // Top 5 trending
          },
          createdAt: new Date()
        });
      }

      // Check for high-performing products that could be promoted
      const highPerformers = Array.from(productMetrics.entries())
        .map(([productId, metrics]) => {
          const recent = metrics[0];
          return {
            productId,
            productName: recent.productName || 'Unknown Product',
            conversionRate: recent.conversionRate || 0,
            revenue: recent.revenue || 0,
            rating: recent.averageRating || 0
          };
        })
        .filter(p => p.conversionRate > 0.10 && p.rating >= 4.5) // High conversion and rating
        .sort((a, b) => b.revenue - a.revenue);

      if (highPerformers.length > 0) {
        alerts.push({
          type: 'opportunity',
          severity: 'low',
          category: 'milestone',
          title: 'High-Performing Products',
          message: `You have ${highPerformers.length} high-performing product${highPerformers.length > 1 ? 's' : ''} with excellent conversion rates. Consider featuring these prominently.`,
          actionUrl: '/vendor/products',
          metadata: {
            highPerformerCount: highPerformers.length,
            products: highPerformers.slice(0, 5)
          },
          createdAt: new Date()
        });
      }

      // Check for milestone achievements
      const analyticsQuery = query(
        collection(db, "staging_vendor_analytics"),
        where('vendorId', '==', vendorId),
        orderBy('date', 'desc'),
        firestoreLimit(1)
      );

      const analyticsSnapshot = await getDocs(analyticsQuery);
      
      if (!analyticsSnapshot.empty) {
        const data = analyticsSnapshot.docs[0].data();
        const totalRevenue = data.sales?.totalRevenue || 0;
        const totalOrders = data.orders?.totalOrders || 0;

        // Revenue milestones
        const revenueMilestones = [10000, 50000, 100000, 500000, 1000000];
        const reachedMilestone = revenueMilestones.find(m => 
          totalRevenue >= m && totalRevenue < m * 1.1 // Within 10% of milestone
        );

        if (reachedMilestone) {
          alerts.push({
            type: 'opportunity',
            severity: 'low',
            category: 'milestone',
            title: 'Revenue Milestone Reached!',
            message: `Congratulations! You've reached $${reachedMilestone.toLocaleString()} in revenue. Keep up the great work!`,
            actionUrl: '/vendor/analytics/sales',
            metadata: {
              milestone: reachedMilestone,
              currentRevenue: totalRevenue
            },
            createdAt: new Date()
          });
        }

        // Order milestones
        const orderMilestones = [100, 500, 1000, 5000, 10000];
        const reachedOrderMilestone = orderMilestones.find(m => 
          totalOrders >= m && totalOrders < m * 1.1
        );

        if (reachedOrderMilestone) {
          alerts.push({
            type: 'opportunity',
            severity: 'low',
            category: 'milestone',
            title: 'Order Milestone Reached!',
            message: `Amazing! You've completed ${reachedOrderMilestone.toLocaleString()} orders. Thank you for being a valued vendor!`,
            actionUrl: '/vendor/analytics/orders',
            metadata: {
              milestone: reachedOrderMilestone,
              currentOrders: totalOrders
            },
            createdAt: new Date()
          });
        }
      }

    } catch (error) {
      this.log('warn', 'Failed to detect opportunities', { vendorId, error });
    }

    return alerts;
  }

  /**
   * Gets alert summary for dashboard
   */
  async getAlertSummary(vendorId: string): Promise<ServiceResponse<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  }>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const alerts = await this.generatePerformanceAlerts(vendorId);
      
      if (!alerts.success || !alerts.data) {
        return {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0
        };
      }

      const summary = {
        critical: alerts.data.filter(a => a.severity === 'critical').length,
        high: alerts.data.filter(a => a.severity === 'high').length,
        medium: alerts.data.filter(a => a.severity === 'medium').length,
        low: alerts.data.filter(a => a.severity === 'low').length,
        total: alerts.data.length
      };

      return summary;
    }, 'getAlertSummary');
  }
}
