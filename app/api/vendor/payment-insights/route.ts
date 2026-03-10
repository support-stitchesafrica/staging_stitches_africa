import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, dateRange } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    // Fetch orders for the vendor in the date range
    const ordersRef = collection(db, "staging_orders");
    const ordersQuery = query(
      ordersRef,
      where('tailor_id', '==', vendorId),
      where('created_at', '>=', Timestamp.fromDate(startDate)),
      where('created_at', '<=', Timestamp.fromDate(endDate))
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Aggregate payment method statistics
    const paymentMethodMap = new Map<string, {
      count: number;
      totalAmount: number;
      successCount: number;
      failureCount: number;
      abandonedCount: number;
    }>();

    let totalTransactions = 0;
    let totalSuccessful = 0;
    let totalAbandoned = 0;

    orders.forEach((order: any) => {
      const paymentMethod = order.payment_method || 'Unknown';
      const amount = order.total_amount || 0;
      const status = order.order_status || '';
      const paymentStatus = order.payment_status || '';

      if (!paymentMethodMap.has(paymentMethod)) {
        paymentMethodMap.set(paymentMethod, {
          count: 0,
          totalAmount: 0,
          successCount: 0,
          failureCount: 0,
          abandonedCount: 0
        });
      }

      const stats = paymentMethodMap.get(paymentMethod)!;
      stats.count++;
      stats.totalAmount += amount;
      totalTransactions++;

      if (paymentStatus === 'paid' || status === 'completed' || status === 'delivered') {
        stats.successCount++;
        totalSuccessful++;
      } else if (paymentStatus === 'failed' || status === 'cancelled') {
        stats.failureCount++;
      } else if (status === 'abandoned' || paymentStatus === 'abandoned') {
        stats.abandonedCount++;
        totalAbandoned++;
      }
    });

    // Convert to array and calculate percentages
    const methods = Array.from(paymentMethodMap.entries()).map(([method, stats]) => ({
      method,
      count: stats.count,
      totalAmount: stats.totalAmount,
      averageAmount: stats.count > 0 ? stats.totalAmount / stats.count : 0,
      successRate: stats.count > 0 ? Math.round((stats.successCount / stats.count) * 100) : 0,
      failureRate: stats.count > 0 ? Math.round((stats.failureCount / stats.count) * 100) : 0,
      abandonmentRate: stats.count > 0 ? Math.round((stats.abandonedCount / stats.count) * 100) : 0,
      percentage: totalTransactions > 0 ? Math.round((stats.count / totalTransactions) * 100) : 0,
      successCount: stats.successCount,
      failureCount: stats.failureCount,
      abandonedCount: stats.abandonedCount
    }));

    // Sort by transaction count
    methods.sort((a, b) => b.count - a.count);

    // Calculate overall statistics
    const overallSuccessRate = totalTransactions > 0 
      ? Math.round((totalSuccessful / totalTransactions) * 100) 
      : 0;
    
    const overallAbandonmentRate = totalTransactions > 0
      ? Math.round((totalAbandoned / totalTransactions) * 100)
      : 0;

    const mostPopular = methods.length > 0 ? methods[0].method : 'N/A';

    // Calculate trends (compare with previous period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = startDate;

    const previousOrdersQuery = query(
      ordersRef,
      where('tailor_id', '==', vendorId),
      where('created_at', '>=', Timestamp.fromDate(previousStartDate)),
      where('created_at', '<=', Timestamp.fromDate(previousEndDate))
    );

    const previousOrdersSnapshot = await getDocs(previousOrdersQuery);
    const previousOrders = previousOrdersSnapshot.docs.map(doc => doc.data());

    // Calculate trends for each method
    const previousMethodMap = new Map<string, number>();
    previousOrders.forEach((order: any) => {
      const method = order.payment_method || 'Unknown';
      previousMethodMap.set(method, (previousMethodMap.get(method) || 0) + 1);
    });

    const trends = methods.map(method => {
      const previousCount = previousMethodMap.get(method.method) || 0;
      const change = previousCount > 0 
        ? Math.round(((method.count - previousCount) / previousCount) * 100)
        : method.count > 0 ? 100 : 0;

      return {
        method: method.method,
        currentCount: method.count,
        previousCount,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    });

    // Calculate segment distribution (mock for now - would need customer data)
    const segmentDistribution = methods.map(method => ({
      method: method.method,
      segments: {
        new: Math.round(method.count * 0.3),
        returning: Math.round(method.count * 0.4),
        frequent: Math.round(method.count * 0.2),
        highValue: Math.round(method.count * 0.1)
      }
    }));

    return NextResponse.json({
      methods,
      summary: {
        totalMethods: methods.length,
        totalTransactions,
        overallSuccessRate,
        mostPopular,
        overallAbandonmentRate
      },
      trends,
      segmentDistribution
    });

  } catch (error: any) {
    console.error('Error in payment insights API:', error);
    
    if (error.code === 'permission-denied') {
      return NextResponse.json(
        { error: 'Permission denied. Unable to access payment data.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment insights' },
      { status: 500 }
    );
  }
}
