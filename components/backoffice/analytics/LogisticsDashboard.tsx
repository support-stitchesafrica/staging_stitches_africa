/**
 * Logistics Dashboard Component
 * 
 * Displays logistics analytics including shipments, weight, destinations, and delivery status.
 * Integrates with logisticsAnalytics service for comprehensive shipping data.
 * 
 * Requirements: 8.3, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Globe,
  MapPin,
  Weight,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import StatsCard from '../StatsCard';
import DashboardCard from '../DashboardCard';
import {
  getWeightAnalytics,
  getShipmentsByRegion,
  getAllOrdersByRegion,
  getTopDestinations,
  getTopCityDestinations,
  getShipmentStatusBreakdown,
  getDeliveredOrdersCount,
  formatWeight,
  WeightAnalytics,
  ShipmentByRegion,
  TopDestination
} from '@/services/logisticsAnalytics';

interface LogisticsData {
  weightAnalytics: WeightAnalytics;
  shipmentsByRegion: ShipmentByRegion[];
  allOrdersByRegion: ShipmentByRegion[];
  topDestinations: TopDestination[];
  topCityDestinations: TopDestination[];
  statusBreakdown: { [status: string]: number };
  deliveredCount: number;
}

export default function LogisticsDashboard() {
  const [data, setData] = useState<LogisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'delivered' | 'all'>('all');

  useEffect(() => {
    async function fetchLogisticsData() {
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
          weightAnalytics,
          shipmentsByRegion,
          allOrdersByRegion,
          topDestinations,
          topCityDestinations,
          statusBreakdown,
          deliveredCount
        ] = await Promise.all([
          getWeightAnalytics(startDate, endDate),
          getShipmentsByRegion(startDate, endDate),
          getAllOrdersByRegion(startDate, endDate),
          getTopDestinations(10, viewMode === 'delivered', startDate, endDate),
          getTopCityDestinations(8, viewMode === 'delivered'),
          getShipmentStatusBreakdown(),
          getDeliveredOrdersCount()
        ]);

        setData({
          weightAnalytics,
          shipmentsByRegion,
          allOrdersByRegion,
          topDestinations,
          topCityDestinations,
          statusBreakdown,
          deliveredCount
        });
      } catch (err) {
        console.error('Error fetching logistics data:', err);
        setError('Failed to load logistics analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchLogisticsData();
  }, [dateRange, viewMode]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-48"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 animate-pulse rounded w-32"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

  const deliveryRate = data.weightAnalytics.totalShipments > 0 
    ? (data.deliveredCount / data.weightAnalytics.totalShipments) * 100 
    : 0;

  const currentRegionData = viewMode === 'delivered' ? data.shipmentsByRegion : data.allOrdersByRegion;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Analytics</h1>
          <p className="text-gray-600 mt-1">Shipping and delivery metrics</p>
        </div>
        
        <div className="flex gap-2">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'delivered'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'all' ? 'All Orders' : 'Delivered Only'}
              </button>
            ))}
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
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          value={formatNumber(data.weightAnalytics.totalShipments)}
          label="Total Shipments"
          icon={Package}
          variant="primary"
        />
        
        <StatsCard
          value={formatWeight(data.weightAnalytics.totalWeight)}
          label="Total Weight"
          icon={Weight}
          variant="success"
        />
        
        <StatsCard
          value={formatNumber(data.deliveredCount)}
          label="Delivered Orders"
          icon={CheckCircle}
          variant="purple"
        />
        
        <StatsCard
          value={`${deliveryRate.toFixed(1)}%`}
          label="Delivery Rate"
          icon={Truck}
          variant="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          value={formatWeight(data.weightAnalytics.averageWeight)}
          label="Average Weight"
          icon={BarChart3}
          variant="secondary"
        />
        
        <StatsCard
          value={formatWeight(data.weightAnalytics.largestWeight)}
          label="Largest Shipment"
          icon={Package}
          variant="pink"
        />
        
        <StatsCard
          value={formatNumber(data.weightAnalytics.shipmentsWithWeight)}
          label="Tracked Shipments"
          icon={Truck}
          variant="primary"
        />
        
        <StatsCard
          value={formatNumber(currentRegionData.length)}
          label="Countries Served"
          icon={Globe}
          variant="success"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Destinations */}
        <DashboardCard
          title="Top Destinations"
          description={`${viewMode === 'delivered' ? 'Delivered shipments' : 'All orders'} by country`}
          icon={Globe}
        >
          <div className="space-y-3">
            {data.topDestinations.slice(0, 8).map((destination, index) => (
              <div key={destination.location} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {destination.location}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatWeight(destination.total_weight)} total weight
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatNumber(destination.shipment_count)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Top Cities */}
        <DashboardCard
          title="Top Cities"
          description={`${viewMode === 'delivered' ? 'Delivered shipments' : 'All orders'} by city`}
          icon={MapPin}
        >
          <div className="space-y-3">
            {data.topCityDestinations.slice(0, 8).map((city, index) => (
              <div key={city.location} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {city.location}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatWeight(city.total_weight)} total weight
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-2">
                  {formatNumber(city.shipment_count)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Shipment Status */}
        <DashboardCard
          title="Shipment Status"
          description="Order status breakdown"
          icon={CheckCircle}
        >
          <div className="space-y-4">
            {Object.entries(data.statusBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([status, count]) => {
                const percentage = data.weightAnalytics.totalShipments > 0 
                  ? (count / data.weightAnalytics.totalShipments) * 100 
                  : 0;
                const statusIcon = status === 'delivered' ? CheckCircle : Clock;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {React.createElement(statusIcon, { className: "w-4 h-4 text-gray-500" })}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatNumber(count)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          status === 'delivered' 
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </DashboardCard>

        {/* Weight Analytics */}
        <DashboardCard
          title="Weight Analytics"
          description="Shipping weight statistics"
          icon={Weight}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Weight Shipped</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatWeight(data.weightAnalytics.totalWeight)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average per Shipment</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatWeight(data.weightAnalytics.averageWeight)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Largest Shipment</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatWeight(data.weightAnalytics.largestWeight)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Smallest Shipment</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatWeight(data.weightAnalytics.smallestWeight)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shipments with Weight Data</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatNumber(data.weightAnalytics.shipmentsWithWeight)} / {formatNumber(data.weightAnalytics.totalShipments)}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Regional Distribution */}
      <DashboardCard
        title="Regional Distribution"
        description={`${viewMode === 'delivered' ? 'Delivered shipments' : 'All orders'} by weight across regions`}
        icon={BarChart3}
      >
        <div className="mt-4">
          {currentRegionData.length > 0 ? (
            <div className="flex items-end justify-between h-32 gap-1">
              {currentRegionData.slice(0, 15).map((region, index) => {
                const maxWeight = Math.max(...currentRegionData.map(r => r.total_weight));
                const height = maxWeight > 0 ? (region.total_weight / maxWeight) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '2px' }}
                      title={`${region.country}: ${formatWeight(region.total_weight)}, ${region.shipment_count} shipments`}
                    />
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left truncate w-full">
                      {region.country.slice(0, 8)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No shipment data available
            </div>
          )}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Total: {formatWeight(currentRegionData.reduce((sum, region) => sum + region.total_weight, 0))} across {currentRegionData.length} countries
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

export default memo(LogisticsDashboard);