/**
 * Sales Dashboard Component
 * 
 * Displays sales analytics including orders, revenue, top vendors, and regional sales.
 * Integrates with orderAnalytics service for comprehensive sales data.
 * 
 * Requirements: 6.3, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Users,
  Package,
  Globe,
  Calendar,
  Award
} from 'lucide-react';
import StatsCard from '../StatsCard';
import DashboardCard from '../DashboardCard';
import {
  getOrderAnalytics,
  getTopSellingVendors,
  getTopSellingProducts,
  getSalesByRegion,
  getDailyOrdersTrend,
  OrderAnalytics,
  TopVendor,
  TopProduct,
  RegionalSales
} from '@/services/orderAnalytics';

interface SalesData {
  analytics: OrderAnalytics;
  topVendors: TopVendor[];
  topProducts: TopProduct[];
  regionalSales: RegionalSales[];
  dailyTrend: Array<{
    day: number;
    orders: number;
    sales: number;
    date: string;
  }>;
}

export default function SalesDashboard() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        let startDate: Date | undefined;
        let endDate: Date | undefined;
        
        if (dateRange !== 'all') {
          endDate = new Date();
          startDate = new Date();
          startDate.setDate(startDate.getDate() - (dateRange === '7d' ? 7 : 30));
        }

        const [
          analytics,
          topVendors,
          topProducts,
          regionalSales,
          dailyTrend
        ] = await Promise.all([
          getOrderAnalytics(startDate, endDate),
          getTopSellingVendors(10, startDate, endDate),
          getTopSellingProducts(10, startDate, endDate),
          getSalesByRegion(startDate, endDate),
          getDailyOrdersTrend(dateRange === '7d' ? 7 : 30)
        ]);

        setData({
          analytics,
          topVendors,
          topProducts,
          regionalSales: regionalSales.slice(0, 10),
          dailyTrend
        });
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Failed to load sales analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-48"></div>
          <div className="h-10 bg-gray-200 animate-pulse rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Error" description={error}>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Orders and revenue tracking</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          value={formatCurrency(data.analytics.totalSales)}
          label="Total Revenue"
          icon={DollarSign}
          variant="success"
        />
        
        <StatsCard
          value={formatNumber(data.analytics.totalOrders)}
          label="Total Orders"
          icon={ShoppingCart}
          variant="primary"
        />
        
        <StatsCard
          value={formatCurrency(data.analytics.averageOrderValue)}
          label="Average Order Value"
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <DashboardCard
          title="Top Vendors"
          description="Best performing vendors by sales"
          icon={Award}
        >
          <div className="space-y-3">
            {data.topVendors.slice(0, 8).map((vendor, index) => (
              <div key={vendor.tailor_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {vendor.tailor_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {vendor.order_count} orders
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-2">
                  {formatCurrency(vendor.total_sales)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Top Products */}
        <DashboardCard
          title="Top Products"
          description="Best selling products by units"
          icon={Package}
        >
          <div className="space-y-3">
            {data.topProducts.slice(0, 8).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(product.total_sales)} revenue
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-2">
                  {product.units_sold} sold
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Regional Sales */}
        <DashboardCard
          title="Sales by Region"
          description="Revenue by country"
          icon={Globe}
        >
          <div className="space-y-3">
            {data.regionalSales.slice(0, 8).map((region, index) => (
              <div key={region.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {region.country}
                    </div>
                    <div className="text-xs text-gray-500">
                      {region.order_count} orders
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(region.total_sales)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Sales Summary */}
        <DashboardCard
          title="Sales Summary"
          description="Key performance indicators"
          icon={TrendingUp}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Vendors</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.topVendors.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Products Sold</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatNumber(data.topProducts.reduce((sum, p) => sum + p.units_sold, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Countries Served</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.regionalSales.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Top Vendor Revenue</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.topVendors.length > 0 ? formatCurrency(data.topVendors[0].total_sales) : '$0'}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Sales Trend */}
      <DashboardCard
        title="Sales Trend"
        description={`Daily orders and revenue over the last ${dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : 'period'}`}
        icon={Calendar}
      >
        <div className="mt-4">
          <div className="flex items-end justify-between h-40 gap-1">
            {data.dailyTrend.map((day, index) => {
              const maxSales = Math.max(...data.dailyTrend.map(d => d.sales));
              const maxOrders = Math.max(...data.dailyTrend.map(d => d.orders));
              const salesHeight = maxSales > 0 ? (day.sales / maxSales) * 70 : 0;
              const ordersHeight = maxOrders > 0 ? (day.orders / maxOrders) * 30 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1">
                    {/* Sales bar */}
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm"
                      style={{ height: `${salesHeight}%`, minHeight: salesHeight > 0 ? '4px' : '2px' }}
                      title={`${day.date}: ${formatCurrency(day.sales)} revenue`}
                    />
                    {/* Orders bar */}
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                      style={{ height: `${ordersHeight}%`, minHeight: ordersHeight > 0 ? '4px' : '2px' }}
                      title={`${day.date}: ${day.orders} orders`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {day.date}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">Orders</span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-600">
              Total: {formatCurrency(data.dailyTrend.reduce((sum, day) => sum + day.sales, 0))} revenue, {' '}
              {formatNumber(data.dailyTrend.reduce((sum, day) => sum + day.orders, 0))} orders
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

export default memo(SalesDashboard);