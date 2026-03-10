/**
 * Products Dashboard Component
 * 
 * Displays product analytics including views, top products, categories, and trends.
 * Integrates with productAnalytics service for comprehensive product data.
 * 
 * Requirements: 7.3, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  Package, 
  Eye, 
  TrendingUp,
  Star,
  Tag,
  BarChart3,
  Calendar,
  Award
} from 'lucide-react';
import StatsCard from '../StatsCard';
import DashboardCard from '../DashboardCard';
import {
  getTopViewedProducts,
  getTotalProductViews,
  getProductViewsByCategory,
  getTrendingProducts,
  ProductViewData
} from '@/services/productAnalytics';

interface ProductsData {
  totalViews: number;
  topProducts: ProductViewData[];
  trendingProducts: ProductViewData[];
  categoryBreakdown: { [category: string]: number };
}

export default function ProductsDashboard() {
  const [data, setData] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    async function fetchProductsData() {
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
          totalViews,
          topProducts,
          trendingProducts,
          categoryBreakdown
        ] = await Promise.all([
          getTotalProductViews(),
          getTopViewedProducts(15, startDate, endDate),
          getTrendingProducts(dateRange === '7d' ? 7 : 30, 10),
          getProductViewsByCategory()
        ]);

        setData({
          totalViews,
          topProducts,
          trendingProducts,
          categoryBreakdown
        });
      } catch (err) {
        console.error('Error fetching products data:', err);
        setError('Failed to load product analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchProductsData();
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

  // Calculate stats
  const totalProducts = data.topProducts.length;
  const averageViewsPerProduct = totalProducts > 0 ? Math.round(data.totalViews / totalProducts) : 0;
  const topCategories = Object.entries(data.categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
          <p className="text-gray-600 mt-1">Product views and performance</p>
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
          value={formatNumber(data.totalViews)}
          label="Total Product Views"
          icon={Eye}
          variant="primary"
        />
        
        <StatsCard
          value={formatNumber(totalProducts)}
          label="Products Tracked"
          icon={Package}
          variant="success"
        />
        
        <StatsCard
          value={formatNumber(averageViewsPerProduct)}
          label="Avg Views per Product"
          icon={BarChart3}
          variant="purple"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <DashboardCard
          title="Top Viewed Products"
          description="Most popular products by views"
          icon={Award}
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
                      {product.product_title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {product.vendor_name ? `by ${product.vendor_name}` : 'Unknown vendor'}
                      {product.price && ` • ${formatCurrency(product.price)}`}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-2">
                  {formatNumber(product.total_views)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Trending Products */}
        <DashboardCard
          title="Trending Products"
          description={`Hot products in the last ${dateRange === '7d' ? '7 days' : '30 days'}`}
          icon={TrendingUp}
        >
          <div className="space-y-3">
            {data.trendingProducts.slice(0, 8).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.product_title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {product.vendor_name ? `by ${product.vendor_name}` : 'Unknown vendor'}
                      {product.category && ` • ${product.category}`}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-2">
                  {formatNumber(product.total_views)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Categories */}
        <DashboardCard
          title="Top Categories"
          description="Most viewed product categories"
          icon={Tag}
        >
          <div className="space-y-4">
            {topCategories.map(([category, views], index) => {
              const percentage = data.totalViews > 0 ? (views / data.totalViews) * 100 : 0;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-4">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatNumber(views)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        {/* Product Performance Summary */}
        <DashboardCard
          title="Performance Summary"
          description="Key product metrics"
          icon={Star}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Categories</span>
              <span className="text-sm font-semibold text-gray-900">
                {Object.keys(data.categoryBreakdown).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Most Viewed Product</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.topProducts.length > 0 ? formatNumber(data.topProducts[0].total_views) : '0'} views
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Top Category</span>
              <span className="text-sm font-semibold text-gray-900">
                {topCategories.length > 0 ? topCategories[0][0] : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Products with Views</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.topProducts.filter(p => p.total_views > 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trending Products</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.trendingProducts.length}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Product Views Distribution */}
      <DashboardCard
        title="Product Views Distribution"
        description="View count distribution across all products"
        icon={Calendar}
      >
        <div className="mt-4">
          {data.topProducts.length > 0 ? (
            <div className="flex items-end justify-between h-32 gap-1">
              {data.topProducts.slice(0, 20).map((product, index) => {
                const maxViews = Math.max(...data.topProducts.map(p => p.total_views));
                const height = maxViews > 0 ? (product.total_views / maxViews) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm transition-all duration-300 hover:from-purple-600 hover:to-purple-500"
                      style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '2px' }}
                      title={`${product.product_title}: ${formatNumber(product.total_views)} views`}
                    />
                    <div className="text-xs text-gray-500 mt-2 text-center truncate w-full">
                      {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No product view data available
            </div>
          )}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Showing top {Math.min(20, data.topProducts.length)} products by views
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

export default memo(ProductsDashboard);