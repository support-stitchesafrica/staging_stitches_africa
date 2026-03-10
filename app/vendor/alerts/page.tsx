'use client';

/**
 * Performance Alerts Page
 * Displays all performance alerts for the vendor
 */

import React, { useState, useEffect } from 'react';
import { PerformanceAlert } from '@/types/vendor-analytics';
import { PerformanceAlertsList } from '@/components/vendor/alerts/PerformanceAlertsList';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PerformanceAlertsPage() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Get actual vendor ID from auth context
  const vendorId = 'demo-vendor-id';

  const fetchAlerts = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/vendor/performance-alerts?vendorId=${vendorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setAlerts(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to load alerts');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = (alert: PerformanceAlert) => {
    // Remove alert from list (in production, would also update backend)
    setAlerts(prev => prev.filter(a => a !== alert));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-blue-600" />
              Performance Alerts
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor critical issues, quality concerns, and opportunities for your store
            </p>
          </div>
          
          <button
            onClick={fetchAlerts}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium">Critical</div>
            <div className="text-2xl font-bold text-red-700 mt-1">
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium">High Priority</div>
            <div className="text-2xl font-bold text-orange-700 mt-1">
              {alerts.filter(a => a.severity === 'high').length}
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium">Medium Priority</div>
            <div className="text-2xl font-bold text-yellow-700 mt-1">
              {alerts.filter(a => a.severity === 'medium').length}
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Opportunities</div>
            <div className="text-2xl font-bold text-green-700 mt-1">
              {alerts.filter(a => a.severity === 'low').length}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading alerts</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <PerformanceAlertsList alerts={alerts} onDismiss={handleDismiss} />
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">About Performance Alerts</h3>
        <p className="text-sm text-blue-800">
          Performance alerts help you stay on top of your store's health by notifying you of:
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
          <li><strong>Metric Declines:</strong> Sudden drops in sales, traffic, or orders</li>
          <li><strong>Quality Issues:</strong> High return rates, complaints, or cancellations</li>
          <li><strong>Critical Inventory:</strong> Out-of-stock or critically low stock levels</li>
          <li><strong>Ranking Drops:</strong> Decreases in product visibility and rankings</li>
          <li><strong>Opportunities:</strong> Trending products and milestone achievements</li>
        </ul>
      </div>
    </div>
  );
}
