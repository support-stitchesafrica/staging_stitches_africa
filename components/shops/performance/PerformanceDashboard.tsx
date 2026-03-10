'use client';

import React, { useState, useEffect } from 'react';
import { analytics } from '@/lib/analytics';

interface DashboardMetrics {
  paymentSuccessRates: Record<string, { total: number; successful: number; rate: number }>;
  authFlowMetrics: {
    loginAttempts: number;
    loginSuccessRate: number;
    registrationAttempts: number;
    registrationSuccessRate: number;
    averageLoginDuration: number;
  };
  performanceSummary: {
    averagePageLoadTime: number;
    averageTimeToInteractive: number;
    slowestPages: Array<{ page: string; loadTime: number }>;
    webVitalsScore: number;
  };
  totalMetrics: number;
  sessionId: string;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(analytics.getAllMetrics());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial load

    return () => clearInterval(interval);
  }, []);

  // Only show in development or when explicitly enabled
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('show-performance-dashboard') === 'true';
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible || !metrics) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Performance Dashboard</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Web Vitals Score */}
        <div className="bg-gray-50 p-2 rounded">
          <div className="flex justify-between">
            <span className="text-gray-600">Web Vitals Score:</span>
            <span className={`font-semibold ${getScoreColor(metrics.performanceSummary.webVitalsScore)}`}>
              {metrics.performanceSummary.webVitalsScore}/100
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-700 font-medium mb-1">Performance</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Page Load:</span>
              <span className="font-mono">
                {metrics.performanceSummary.averagePageLoadTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time to Interactive:</span>
              <span className="font-mono">
                {metrics.performanceSummary.averageTimeToInteractive.toFixed(0)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Payment Success Rates */}
        {Object.keys(metrics.paymentSuccessRates).length > 0 && (
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-700 font-medium mb-1">Payment Success Rates</div>
            <div className="space-y-1">
              {Object.entries(metrics.paymentSuccessRates).map(([provider, data]) => (
                <div key={provider} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{provider}:</span>
                  <span className={`font-semibold ${getSuccessRateColor(data.rate)}`}>
                    {data.rate.toFixed(1)}% ({data.successful}/{data.total})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth Flow Metrics */}
        {(metrics.authFlowMetrics.loginAttempts > 0 || metrics.authFlowMetrics.registrationAttempts > 0) && (
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-700 font-medium mb-1">Authentication</div>
            <div className="space-y-1">
              {metrics.authFlowMetrics.loginAttempts > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Login Success:</span>
                  <span className={`font-semibold ${getSuccessRateColor(metrics.authFlowMetrics.loginSuccessRate)}`}>
                    {metrics.authFlowMetrics.loginSuccessRate.toFixed(1)}%
                  </span>
                </div>
              )}
              {metrics.authFlowMetrics.registrationAttempts > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Success:</span>
                  <span className={`font-semibold ${getSuccessRateColor(metrics.authFlowMetrics.registrationSuccessRate)}`}>
                    {metrics.authFlowMetrics.registrationSuccessRate.toFixed(1)}%
                  </span>
                </div>
              )}
              {metrics.authFlowMetrics.averageLoginDuration > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Login Time:</span>
                  <span className="font-mono">
                    {metrics.authFlowMetrics.averageLoginDuration.toFixed(0)}ms
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slowest Pages */}
        {metrics.performanceSummary.slowestPages.length > 0 && (
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-700 font-medium mb-1">Slowest Pages</div>
            <div className="space-y-1">
              {metrics.performanceSummary.slowestPages.slice(0, 3).map((page, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600 truncate max-w-[120px]" title={page.page}>
                    {page.page}
                  </span>
                  <span className="font-mono text-red-600">
                    {page.loadTime.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="bg-gray-50 p-2 rounded">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Metrics:</span>
            <span className="font-semibold">{metrics.totalMetrics}</span>
          </div>
          <div className="text-gray-500 text-xs mt-1 truncate" title={metrics.sessionId}>
            Session: {metrics.sessionId.slice(-8)}
          </div>
        </div>
      </div>

      {/* Toggle Instructions */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
        To hide: localStorage.removeItem('show-performance-dashboard')
      </div>
    </div>
  );
};

// Helper component to enable dashboard
export const PerformanceDashboardToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(localStorage.getItem('show-performance-dashboard') === 'true');
  }, []);

  const toggleDashboard = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      localStorage.setItem('show-performance-dashboard', 'true');
    } else {
      localStorage.removeItem('show-performance-dashboard');
    }
    
    // Reload to apply changes
    window.location.reload();
  };

  // Only show toggle in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={toggleDashboard}
      className="fixed bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg hover:bg-blue-700 z-50"
    >
      {isEnabled ? 'Hide' : 'Show'} Performance Dashboard
    </button>
  );
};