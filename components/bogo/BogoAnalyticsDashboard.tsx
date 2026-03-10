"use client";

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Award } from 'lucide-react';
import type { BogoDashboardData } from '@/types/bogo';

interface BogoAnalyticsDashboardProps {
  dashboardData: BogoDashboardData;
}

export function BogoAnalyticsDashboard({ dashboardData }: BogoAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateConversionRate = () => {
    // Mock calculation - in real app would be based on actual data
    const totalViews = dashboardData.totalRedemptions * 4.2; // Assume 4.2 views per redemption
    return dashboardData.totalRedemptions > 0 ? (dashboardData.totalRedemptions / totalViews) * 100 : 0;
  };

  const calculateAverageOrderValue = () => {
    return dashboardData.totalRedemptions > 0 
      ? dashboardData.totalRevenue / dashboardData.totalRedemptions 
      : 0;
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <div className="flex rounded-md shadow-sm">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as any)}
              className={`px-4 py-2 text-sm font-medium border ${
                selectedPeriod === period.key
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } ${
                period.key === '7d' ? 'rounded-l-md' : 
                period.key === '90d' ? 'rounded-r-md' : ''
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(dashboardData.totalRedemptions)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(dashboardData.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calculateConversionRate().toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(calculateAverageOrderValue())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">
                    {activity.redemptions} redemptions
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(activity.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Mappings */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Mappings</h3>
          <div className="space-y-3">
            {dashboardData.topPerformingMappings.length > 0 ? (
              dashboardData.topPerformingMappings.map((mapping, index) => (
                <div key={mapping.mappingId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-purple-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {mapping.mainProductName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mapping.redemptions} redemptions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(mapping.revenue)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No redemptions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Expirations */}
      {dashboardData.upcomingExpirations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Promotions Expiring Soon
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="space-y-3">
              {dashboardData.upcomingExpirations.map((expiration, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-sm font-medium text-orange-900">
                      {expiration.mainProductName}
                    </span>
                  </div>
                  <span className="text-sm text-orange-700">
                    Expires {expiration.expiresAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.activeMappings}
            </div>
            <div className="text-sm text-gray-600">Active Promotions</div>
            <div className="text-xs text-gray-500 mt-1">
              Currently running campaigns
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.totalRedemptions > 0 ? 
                (dashboardData.totalRevenue / dashboardData.activeMappings).toFixed(0) : 
                '0'
              }
            </div>
            <div className="text-sm text-gray-600">Revenue per Promotion</div>
            <div className="text-xs text-gray-500 mt-1">
              Average revenue generated
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData.activeMappings > 0 ? 
                (dashboardData.totalRedemptions / dashboardData.activeMappings).toFixed(1) : 
                '0'
              }
            </div>
            <div className="text-sm text-gray-600">Redemptions per Promotion</div>
            <div className="text-xs text-gray-500 mt-1">
              Average engagement rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}