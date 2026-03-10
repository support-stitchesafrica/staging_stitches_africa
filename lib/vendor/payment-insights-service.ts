/**
 * Payment Method Insights Service
 * Provides detailed analytics on payment methods, success rates, and customer preferences
 */

import { adminDb as db } from '@/lib/firebase-admin';
import {
  PaymentMethodInsights,
  PaymentMethodStats,
  PaymentMethodBySegment,
  PaymentMethodTrend,
  PaymentAbandonmentStats,
  DateRange,
  TrendDataPoint,
  CustomerSegment
} from '@/types/vendor-analytics';

export class PaymentInsightsService {
  /**
   * Gets comprehensive payment method insights for a vendor
   */
  async getPaymentInsights(
    vendorId: string,
    dateRange: DateRange
  ): Promise<PaymentMethodInsights> {
    const [methods, successVsFailure, distributionBySegment, usageTrends, abandonmentByMethod] = 
      await Promise.all([
        this.getPaymentMethodStats(vendorId, dateRange),
        this.getSuccessVsFailureRate(vendorId, dateRange),
        this.getDistributionBySegment(vendorId, dateRange),
        this.getUsageTrends(vendorId, dateRange),
        this.getAbandonmentByMethod(vendorId, dateRange)
      ]);

    return {
      vendorId,
      period: dateRange,
      methods,
      successVsFailureRate: successVsFailure,
      distributionBySegment,
      usageTrends,
      abandonmentByMethod,
      updatedAt: new Date()
    };
  }

  /**
   * Gets payment method statistics with success/failure breakdown
   */
  private async getPaymentMethodStats(
    vendorId: string,
    dateRange: DateRange
  ): Promise<PaymentMethodStats[]> {
    const ordersRef = db.collection("staging_orders");
    const ordersSnapshot = await ordersRef
      .where('vendorId', '==', vendorId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .get();

    const methodMap = new Map<string, {
      count: number;
      totalAmount: number;
      successCount: number;
      failureCount: number;
      amounts: number[];
    }>();

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const method = order.paymentMethod || 'Unknown';
      const amount = order.totalAmount || 0;
      const isSuccessful = order.paymentStatus === 'paid' || order.status === 'completed';

      if (!methodMap.has(method)) {
        methodMap.set(method, {
          count: 0,
          totalAmount: 0,
          successCount: 0,
          failureCount: 0,
          amounts: []
        });
      }

      const stats = methodMap.get(method)!;
      stats.count++;
      stats.totalAmount += amount;
      stats.amounts.push(amount);
      
      if (isSuccessful) {
        stats.successCount++;
      } else {
        stats.failureCount++;
      }
    });

    const totalOrders = ordersSnapshot.size;
    const methods: PaymentMethodStats[] = [];

    methodMap.forEach((stats, method) => {
      const successRate = stats.count > 0 
        ? (stats.successCount / stats.count) * 100 
        : 0;
      
      const averageAmount = stats.amounts.length > 0
        ? stats.amounts.reduce((sum, amt) => sum + amt, 0) / stats.amounts.length
        : 0;

      methods.push({
        method,
        count: stats.count,
        totalAmount: stats.totalAmount,
        successRate: this.roundToDecimal(successRate, 2),
        percentage: this.roundToDecimal((stats.count / totalOrders) * 100, 2),
        successCount: stats.successCount,
        failureCount: stats.failureCount,
        averageAmount: this.roundToDecimal(averageAmount, 2)
      });
    });

    // Sort by count descending
    return methods.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculates overall success vs failure rates
   */
  private async getSuccessVsFailureRate(
    vendorId: string,
    dateRange: DateRange
  ): Promise<{
    totalAttempts: number;
    successful: number;
    failed: number;
    successRate: number;
  }> {
    const ordersRef = db.collection("staging_orders");
    const ordersSnapshot = await ordersRef
      .where('vendorId', '==', vendorId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .get();

    let successful = 0;
    let failed = 0;

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const isSuccessful = order.paymentStatus === 'paid' || order.status === 'completed';
      
      if (isSuccessful) {
        successful++;
      } else if (order.paymentStatus === 'failed' || order.status === 'cancelled') {
        failed++;
      }
    });

    const totalAttempts = successful + failed;
    const successRate = totalAttempts > 0 
      ? (successful / totalAttempts) * 100 
      : 0;

    return {
      totalAttempts,
      successful,
      failed,
      successRate: this.roundToDecimal(successRate, 2)
    };
  }

  /**
   * Gets payment method distribution by customer segment
   */
  private async getDistributionBySegment(
    vendorId: string,
    dateRange: DateRange
  ): Promise<PaymentMethodBySegment[]> {
    // Get customer segments
    const segmentsRef = db.collection('customer_segments');
    const segmentsSnapshot = await segmentsRef
      .where('vendorId', '==', vendorId)
      .get();

    const customerSegmentMap = new Map<string, CustomerSegment['type']>();
    segmentsSnapshot.forEach(doc => {
      const data = doc.data();
      customerSegmentMap.set(data.customerId, data.segment);
    });

    // Get orders with payment methods
    const ordersRef = db.collection("staging_orders");
    const ordersSnapshot = await ordersRef
      .where('vendorId', '==', vendorId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .get();

    const segmentMethodMap = new Map<CustomerSegment['type'], Map<string, number>>();

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const customerId = order.customerId;
      const segment = customerSegmentMap.get(customerId) || 'new';
      const method = order.paymentMethod || 'Unknown';

      if (!segmentMethodMap.has(segment)) {
        segmentMethodMap.set(segment, new Map());
      }

      const methodMap = segmentMethodMap.get(segment)!;
      methodMap.set(method, (methodMap.get(method) || 0) + 1);
    });

    const distribution: PaymentMethodBySegment[] = [];

    segmentMethodMap.forEach((methodMap, segment) => {
      const totalForSegment = Array.from(methodMap.values()).reduce((sum, count) => sum + count, 0);
      const methods = Array.from(methodMap.entries()).map(([method, count]) => ({
        method,
        count,
        percentage: this.roundToDecimal((count / totalForSegment) * 100, 2)
      }));

      distribution.push({
        segment,
        methods: methods.sort((a, b) => b.count - a.count)
      });
    });

    return distribution;
  }

  /**
   * Gets payment method usage trends over time
   */
  private async getUsageTrends(
    vendorId: string,
    dateRange: DateRange
  ): Promise<PaymentMethodTrend[]> {
    const ordersRef = db.collection("staging_orders");
    const ordersSnapshot = await ordersRef
      .where('vendorId', '==', vendorId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .orderBy('createdAt', 'asc')
      .get();

    // Group by method and date
    const methodDateMap = new Map<string, Map<string, number>>();

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const method = order.paymentMethod || 'Unknown';
      const date = new Date(order.createdAt.toDate());
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!methodDateMap.has(method)) {
        methodDateMap.set(method, new Map());
      }

      const dateMap = methodDateMap.get(method)!;
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    });

    const trends: PaymentMethodTrend[] = [];

    methodDateMap.forEach((dateMap, method) => {
      const trendData: TrendDataPoint[] = Array.from(dateMap.entries())
        .map(([dateStr, count]) => ({
          date: new Date(dateStr),
          value: count
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate growth rate (first vs last)
      const firstValue = trendData[0]?.value || 0;
      const lastValue = trendData[trendData.length - 1]?.value || 0;
      const growthRate = firstValue > 0 
        ? ((lastValue - firstValue) / firstValue) * 100 
        : 0;

      trends.push({
        method,
        trend: trendData,
        growthRate: this.roundToDecimal(growthRate, 2)
      });
    });

    return trends.sort((a, b) => b.trend.length - a.trend.length);
  }

  /**
   * Gets payment abandonment statistics by method
   */
  private async getAbandonmentByMethod(
    vendorId: string,
    dateRange: DateRange
  ): Promise<PaymentAbandonmentStats[]> {
    // Get all cart sessions that reached checkout
    const cartsRef = db.collection('carts');
    const cartsSnapshot = await cartsRef
      .where('vendorId', '==', vendorId)
      .where('updatedAt', '>=', dateRange.start)
      .where('updatedAt', '<=', dateRange.end)
      .where('reachedCheckout', '==', true)
      .get();

    const methodAbandonmentMap = new Map<string, {
      attempts: number;
      completed: number;
    }>();

    // Get completed orders
    const ordersRef = db.collection("staging_orders");
    const ordersSnapshot = await ordersRef
      .where('vendorId', '==', vendorId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .get();

    const completedOrdersByCart = new Set<string>();
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.cartId) {
        completedOrdersByCart.add(order.cartId);
      }
    });

    // Analyze cart abandonment
    cartsSnapshot.forEach(doc => {
      const cart = doc.data();
      const method = cart.selectedPaymentMethod || 'Unknown';
      
      if (!methodAbandonmentMap.has(method)) {
        methodAbandonmentMap.set(method, {
          attempts: 0,
          completed: 0
        });
      }

      const stats = methodAbandonmentMap.get(method)!;
      stats.attempts++;

      if (completedOrdersByCart.has(doc.id)) {
        stats.completed++;
      }
    });

    const abandonmentStats: PaymentAbandonmentStats[] = [];

    methodAbandonmentMap.forEach((stats, method) => {
      const abandoned = stats.attempts - stats.completed;
      const abandonmentRate = stats.attempts > 0 
        ? (abandoned / stats.attempts) * 100 
        : 0;

      abandonmentStats.push({
        method,
        attempts: stats.attempts,
        completed: stats.completed,
        abandoned,
        abandonmentRate: this.roundToDecimal(abandonmentRate, 2)
      });
    });

    return abandonmentStats.sort((a, b) => b.abandonmentRate - a.abandonmentRate);
  }

  /**
   * Rounds a number to specified decimal places
   */
  private roundToDecimal(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

export const paymentInsightsService = new PaymentInsightsService();
