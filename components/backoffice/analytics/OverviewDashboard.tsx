/**
 * Overview Dashboard Component
 * 
 * Main analytics dashboard showing key metrics across all departments.
 * Displays traffic, sales, products, and logistics overview.
 * 
 * Requirements: 5.2, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  Eye,
  DollarSign,
  Truck
} from 'lucide-react';
import StatsCard from '../StatsCard';
import DashboardCard from '../DashboardCard';
import { getWebTrafficStats } from '@/services/webTrafficAnalytics';
import { getOrderAnalytics } from '@/services/orderAnalytics';
import { getTotalProductViews } from '@/services/productAnalytics';
import { getWeightAnalytics } from '@/services/logisticsAnalytics';

interface OverviewStats {
  traffic: {
    totalHits: number;
    uniqueVisitors: number;
    uniqueSessions: number;
  };
  sales: {
    totalOrders: number;
    totalSales: number;
    averageOrderValue: number;
  };
  products: {
    totalViews: number;
  };
  logistics: {
    totalWeight: number;
    totalShipments: number;
  };
}

export default function OverviewDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverviewStats() {
      try {
        setLoading(true);
        setError(null);

        const [trafficStats, salesStats, productViews, logisticsStats] = await Promise.all([
          getWebTrafficStats(),
          getOrderAnalytics(),
          getTotalProductViews(),
          getWeightAnalytics(),
        ]);

        setStats({
          traffic: trafficStats,
          sales: salesStats,
          products: { totalViews: productViews },
          logistics: {
            totalWeight: logisticsStats.totalWeight,
            totalShipments: logisticsStats.totalShipments,
          },
        });
      } catch (err) {
        console.error('Error fetching overview stats:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchOverviewStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardCard
        title="Error"
        description="Failed to load analytics data"
        icon={BarChart3}
      >
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </DashboardCard>
    );
  }

  if (!stats) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="text-gray-600 mt-1">
          Key metrics across all departments
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value={formatNumber(stats.traffic.totalHits)}
          label="Total Page Views"
          icon={Eye}
          variant="primary"
        />
        
        <StatsCard
          value={formatNumber(stats.traffic.uniqueVisitors)}
          label="Unique Visitors"
          icon={Users}
          variant="success"
        />
        
        <StatsCard
          value={formatCurrency(stats.sales.totalSales)}
          label="Total Sales"
          icon={DollarSign}
          variant="warning"
        />
        
        <StatsCard
          value={formatNumber(stats.sales.totalOrders)}
          label="Total Orders"
          icon={ShoppingCart}
          variant="purple"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value={formatNumber(stats.products.totalViews)}
          label="Product Views"
          icon={Package}
          variant="pink"
        />
        
        <StatsCard
          value={formatNumber(stats.traffic.uniqueSessions)}
          label="Sessions"
          icon={TrendingUp}
          variant="secondary"
        />
        
        <StatsCard
          value={formatCurrency(stats.sales.averageOrderValue)}
          label="Avg Order Value"
          icon={BarChart3}
          variant="success"
        />
        
        <StatsCard
          value={`${stats.logistics.totalWeight.toFixed(1)} kg`}
          label="Total Weight Shipped"
          icon={Truck}
          variant="primary"
        />
      </div>

      {/* Department Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Traffic Analytics"
          description="Website visits and user behavior"
          icon={Users}
          hoverable
          onClick={() => window.location.href = '/backoffice/analytics/traffic'}
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Page Views</span>
              <span className="text-sm font-semibold">{formatNumber(stats.traffic.totalHits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Visitors</span>
              <span className="text-sm font-semibold">{formatNumber(stats.traffic.uniqueVisitors)}</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Sales Analytics"
          description="Orders and revenue tracking"
          icon={ShoppingCart}
          hoverable
          onClick={() => window.location.href = '/backoffice/analytics/sales'}
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-semibold">{formatCurrency(stats.sales.totalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Orders</span>
              <span className="text-sm font-semibold">{formatNumber(stats.sales.totalOrders)}</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Product Analytics"
          description="Product views and performance"
          icon={Package}
          hoverable
          onClick={() => window.location.href = '/backoffice/analytics/products'}
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Views</span>
              <span className="text-sm font-semibold">{formatNumber(stats.products.totalViews)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg per Product</span>
              <span className="text-sm font-semibold">
                {stats.products.totalViews > 0 ? Math.round(stats.products.totalViews / 100) : 0}
              </span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Logistics Analytics"
          description="Shipping and delivery metrics"
          icon={Truck}
          hoverable
          onClick={() => window.location.href = '/backoffice/analytics/logistics'}
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Shipments</span>
              <span className="text-sm font-semibold">{formatNumber(stats.logistics.totalShipments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Weight</span>
              <span className="text-sm font-semibold">{stats.logistics.totalWeight.toFixed(1)} kg</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

export default memo(OverviewDashboard);