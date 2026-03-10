/**
 * Performance Alerts Integration Example
 * Shows how to integrate the performance alerts system into the vendor dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertSummaryWidget } from '@/components/vendor/alerts/AlertSummaryWidget';
import { PerformanceAlert } from '@/types/vendor-analytics';
import { Bell, X } from 'lucide-react';
import Link from 'next/link';

/**
 * Example 1: Dashboard Integration
 * Shows alert summary widget on the main dashboard
 */
export function VendorDashboardWithAlerts({ vendorId }: { vendorId: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Vendor Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main metrics */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
            {/* Sales charts and metrics */}
          </div>
        </div>
        
        {/* Alert Summary Widget */}
        <div>
          <AlertSummaryWidget vendorId={vendorId} />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Alert Banner
 * Shows critical alerts as a banner at the top of pages
 */
export function CriticalAlertBanner({ vendorId }: { vendorId: string }) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/vendor/performance-alerts?vendorId=${vendorId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Only show critical and high priority alerts
            const urgentAlerts = result.data.filter(
              (a: PerformanceAlert) => a.severity === 'critical' || a.severity === 'high'
            );
            setAlerts(urgentAlerts);
          }
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
  }, [vendorId]);

  const visibleAlerts = alerts.filter((_, index) => !dismissed.has(index));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      {visibleAlerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-center justify-between p-4 rounded-lg ${
            alert.severity === 'critical'
              ? 'bg-red-50 border border-red-200'
              : 'bg-orange-50 border border-orange-200'
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <Bell className={`w-5 h-5 ${
              alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
            }`} />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{alert.title}</div>
              <div className="text-sm text-gray-700">{alert.message}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {alert.actionUrl && (
              <Link
                href={alert.actionUrl}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View Details
              </Link>
            )}
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(index))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 3: Alert Badge in Navigation
 * Shows alert count badge in the navigation menu
 */
export function NavigationWithAlertBadge({ vendorId }: { vendorId: string }) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const response = await fetch(`/api/vendor/performance-alerts/summary?vendorId=${vendorId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Count critical and high priority alerts
            const urgentCount = result.data.critical + result.data.high;
            setAlertCount(urgentCount);
          }
        }
      } catch (error) {
        console.error('Error fetching alert count:', error);
      }
    };

    fetchAlertCount();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlertCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [vendorId]);

  return (
    <nav className="flex items-center gap-6">
      <Link href="/vendor/dashboard" className="text-gray-700 hover:text-gray-900">
        Dashboard
      </Link>
      <Link href="/vendor/products" className="text-gray-700 hover:text-gray-900">
        Products
      </Link>
      <Link href="/vendor/orders" className="text-gray-700 hover:text-gray-900">
        Orders
      </Link>
      <Link href="/vendor/alerts" className="relative text-gray-700 hover:text-gray-900">
        Alerts
        {alertCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </Link>
    </nav>
  );
}

/**
 * Example 4: Automated Alert Monitoring
 * Background service that checks for alerts and sends notifications
 */
export async function monitorAndNotify(vendorId: string) {
  try {
    // Fetch alerts
    const response = await fetch(`/api/vendor/performance-alerts?vendorId=${vendorId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      const alerts: PerformanceAlert[] = result.data;
      
      // Filter critical alerts
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      
      if (criticalAlerts.length > 0) {
        // Send push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Critical Alert', {
            body: `You have ${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's' : ''} requiring immediate attention`,
            icon: '/icon-alert.png',
            tag: 'vendor-critical-alert'
          });
        }
        
        // Could also send email notification via API
        await fetch('/api/vendor/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            type: 'critical_alerts',
            alerts: criticalAlerts
          })
        });
      }
    }
  } catch (error) {
    console.error('Error monitoring alerts:', error);
  }
}

/**
 * Example 5: Alert Filtering and Sorting
 * Component that allows filtering alerts by type and severity
 */
export function FilterableAlertsList({ vendorId }: { vendorId: string }) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch(`/api/vendor/performance-alerts?vendorId=${vendorId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAlerts(result.data);
        }
      }
    };
    fetchAlerts();
  }, [vendorId]);

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="metric_decline">Metric Decline</option>
          <option value="quality_issue">Quality Issue</option>
          <option value="critical_inventory">Critical Inventory</option>
          <option value="ranking_drop">Ranking Drop</option>
          <option value="opportunity">Opportunity</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alert count */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredAlerts.length} of {alerts.length} alerts
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.map((alert, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold">{alert.title}</div>
            <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 6: Real-time Alert Updates
 * Uses polling or websockets to show alerts in real-time
 */
export function RealTimeAlerts({ vendorId }: { vendorId: string }) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/vendor/performance-alerts?vendorId=${vendorId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setAlerts(result.data);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll every 2 minutes
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [vendorId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Live Alerts</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in">
            <div className="font-semibold">{alert.title}</div>
            <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
