'use client';

/**
 * Performance Alerts List Component
 * Displays performance alerts with severity indicators and actions
 */

import React from 'react';
import { PerformanceAlert } from '@/types/vendor-analytics';
import { AlertCircle, AlertTriangle, Info, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';

interface PerformanceAlertsListProps {
  alerts: PerformanceAlert[];
  onDismiss?: (alert: PerformanceAlert) => void;
}

export function PerformanceAlertsList({ alerts, onDismiss }: PerformanceAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No performance alerts at this time</p>
        <p className="text-sm mt-2">Your store is performing well!</p>
      </div>
    );
  }

  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Critical Alerts ({criticalAlerts.length})
          </h3>
          <div className="space-y-3">
            {criticalAlerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Alerts */}
      {highAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            High Priority ({highAlerts.length})
          </h3>
          <div className="space-y-3">
            {highAlerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Alerts */}
      {mediumAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Medium Priority ({mediumAlerts.length})
          </h3>
          <div className="space-y-3">
            {mediumAlerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {lowAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Opportunities ({lowAlerts.length})
          </h3>
          <div className="space-y-3">
            {lowAlerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCard({ 
  alert, 
  onDismiss 
}: { 
  alert: PerformanceAlert; 
  onDismiss?: (alert: PerformanceAlert) => void;
}) {
  const severityStyles = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50'
  };

  const iconStyles = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'metric_decline':
        return <AlertTriangle className={`w-5 h-5 ${iconStyles[alert.severity]}`} />;
      case 'quality_issue':
        return <AlertCircle className={`w-5 h-5 ${iconStyles[alert.severity]}`} />;
      case 'critical_inventory':
        return <Package className={`w-5 h-5 ${iconStyles[alert.severity]}`} />;
      case 'ranking_drop':
        return <AlertTriangle className={`w-5 h-5 ${iconStyles[alert.severity]}`} />;
      case 'opportunity':
        return <TrendingUp className={`w-5 h-5 ${iconStyles[alert.severity]}`} />;
      default:
        return <Info className={`w-5 h-5 ${iconStyles[alert.severity]}`} />;
    }
  };

  return (
    <div className={`border-l-4 ${severityStyles[alert.severity]} p-4 rounded-r-lg shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">
            {alert.title}
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            {alert.message}
          </p>

          {/* Metadata */}
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div className="text-xs text-gray-600 mb-3 space-y-1">
              {alert.metadata.metric && (
                <div>Metric: <span className="font-medium">{alert.metadata.metric}</span></div>
              )}
              {alert.metadata.currentValue !== undefined && (
                <div>Current: <span className="font-medium">{alert.metadata.currentValue}</span></div>
              )}
              {alert.metadata.previousValue !== undefined && (
                <div>Previous: <span className="font-medium">{alert.metadata.previousValue}</span></div>
              )}
              {alert.metadata.changePercentage !== undefined && (
                <div>Change: <span className="font-medium">{alert.metadata.changePercentage.toFixed(1)}%</span></div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {alert.actionUrl && (
              <Link
                href={alert.actionUrl}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Details →
              </Link>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
