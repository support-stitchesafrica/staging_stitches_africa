'use client';

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/utils/performance-utils';
import { analytics } from '@/lib/analytics';

/**
 * Hook to monitor component render performance
 */
export const usePerformanceMonitoring = (componentName: string, props?: Record<string, any>) => {
  const renderStartTime = useRef<number>(0);
  const endTrackingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Start tracking render time
    renderStartTime.current = performance.now();
    endTrackingRef.current = performanceMonitor.startRender(componentName, props);

    // End tracking when component unmounts or re-renders
    return () => {
      if (endTrackingRef.current) {
        endTrackingRef.current();
      }
    };
  });

  // Return performance metrics for the component
  return {
    getMetrics: () => performanceMonitor.getMetrics(componentName),
    getAverageRenderTime: () => performanceMonitor.getAverageRenderTime(componentName),
  };
};

/**
 * Hook to track Core Web Vitals with enhanced analytics
 */
export const useWebVitals = () => {
  useEffect(() => {
    const webVitals: any = {};

    // Track Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      webVitals.lcp = lastEntry.startTime;
      console.log('LCP:', lastEntry.startTime);
      
      // Send to analytics if we have all vitals or this is the final LCP
      analytics.trackWebVitals({ lcp: lastEntry.startTime });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP not supported in this browser');
    }

    // Track First Input Delay (FID) / Interaction to Next Paint (INP)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        webVitals.fid = fid;
        console.log('FID:', fid);
        
        analytics.trackWebVitals({ fid });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID not supported in this browser');
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      webVitals.cls = clsValue;
      console.log('CLS:', clsValue);
      
      analytics.trackWebVitals({ cls: clsValue });
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS not supported in this browser');
    }

    // Track First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        webVitals.fcp = entry.startTime;
        console.log('FCP:', entry.startTime);
        
        analytics.trackWebVitals({ fcp: entry.startTime });
      });
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP not supported in this browser');
    }

    // Track Time to First Byte (TTFB)
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      webVitals.ttfb = ttfb;
      console.log('TTFB:', ttfb);
      
      analytics.trackWebVitals({ ttfb });
    }

    // Send comprehensive vitals after page load
    const sendFinalVitals = () => {
      setTimeout(() => {
        analytics.trackWebVitals(webVitals);
      }, 1000);
    };

    if (document.readyState === 'complete') {
      sendFinalVitals();
    } else {
      window.addEventListener('load', sendFinalVitals);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
    };
  }, []);
};