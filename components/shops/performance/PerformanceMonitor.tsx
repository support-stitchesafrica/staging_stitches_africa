'use client';

import { useEffect } from 'react';
import { useWebVitals } from '@/hooks/usePerformanceMonitoring';
import { analytics } from '@/lib/analytics';

/**
 * Performance monitoring component that tracks Core Web Vitals
 * and other performance metrics in production
 */
export const PerformanceMonitor: React.FC = () => {
  useWebVitals();

  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          domComplete: navigation.domComplete - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        };

        console.log('Page Load Metrics:', metrics);
        
        // Track performance metrics
        analytics.trackPerformance({
          pageLoadTime: metrics.loadComplete,
          timeToInteractive: metrics.domInteractive,
          resourceLoadTimes: {
            dns: metrics.dns,
            tcp: metrics.tcp,
            ttfb: metrics.ttfb,
            download: metrics.download,
          },
          componentRenderTimes: {},
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
        });
      }
    };

    // Track resource loading performance
    const trackResourcePerformance = () => {
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources.filter((resource: any) => resource.duration > 1000);
      
      if (slowResources.length > 0) {
        console.warn('Slow loading resources detected:', slowResources.map((r: any) => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize
        })));

        // Track slow resources as user experience events
        slowResources.forEach((resource: any) => {
          analytics.trackUserExperience({
            event: 'error_encountered',
            page: window.location.pathname,
            element: 'resource_loading',
            duration: resource.duration,
            success: false,
            errorMessage: `Slow resource: ${resource.name} (${resource.duration}ms)`,
            timestamp: new Date().toISOString(),
            sessionId: analytics['sessionId'],
          });
        });
      }
    };

    // Run performance tracking after page load
    if (document.readyState === 'complete') {
      trackPageLoad();
      trackResourcePerformance();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          trackPageLoad();
          trackResourcePerformance();
        }, 0);
      });
    }

    // Track memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryMetrics = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };
      
      console.log('Memory Usage:', {
        used: memoryMetrics.used + ' MB',
        total: memoryMetrics.total + ' MB',
        limit: memoryMetrics.limit + ' MB'
      });

      // Track memory usage in performance metrics
      analytics.trackPerformance({
        pageLoadTime: 0,
        timeToInteractive: 0,
        resourceLoadTimes: {},
        componentRenderTimes: {},
        memoryUsage: memoryMetrics,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
      });
    }

    // Track page view
    analytics.trackUserExperience({
      event: 'page_view',
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      sessionId: analytics['sessionId'],
    });

  }, []);

  // This component doesn't render anything visible
  return null;
};