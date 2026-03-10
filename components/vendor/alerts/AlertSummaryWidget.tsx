'use client';

/**
 * Alert Summary Widget
 * Displays a summary of performance alerts on the vendor dashboard
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AlertSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface AlertSummaryWidgetProps {
  vendorId: string;
}

export function AlertSummaryWidget({ vendorId }: AlertSummaryWidgetProps) {
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/vendor/performance-alerts/summary?vendorId=${vendorId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setSummary(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching alert summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Alerts</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-green-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">All Clear!</p>
          <p className="text-sm text-gray-500 mt-1">No performance alerts at this time</p>
        </div>
      </div>
    );
  }

  const hasUrgentAlerts = summary.critical > 0 || summary.high > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className={`w-6 h-6 ${hasUrgentAlerts ? 'text-red-600' : 'text-blue-600'}`} />
          <h3 className="text-lg font-semibold text-gray-900">Performance Alerts</h3>
        </div>
        <Link
          href="/vendor/alerts"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {/* Critical Alerts */}
        {summary.critical > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-900">Critical</div>
                <div className="text-xs text-red-600">Requires immediate attention</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-700">{summary.critical}</div>
          </div>
        )}

        {/* High Priority Alerts */}
        {summary.high > 0 && (
          <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">High Priority</div>
                <div className="text-xs text-orange-600">Action recommended</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-700">{summary.high}</div>
          </div>
        )}

        {/* Medium Priority Alerts */}
        {summary.medium > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">Medium Priority</div>
                <div className="text-xs text-yellow-600">Monitor closely</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-700">{summary.medium}</div>
          </div>
        )}

        {/* Opportunities */}
        {summary.low > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Opportunities</div>
                <div className="text-xs text-green-600">Growth potential</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-700">{summary.low}</div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Alerts</span>
          <span className="font-bold text-gray-900">{summary.total}</span>
        </div>
      </div>
    </div>
  );
}
