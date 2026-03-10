/**
 * Performance optimization utilities for Stitches Africa
 * Provides caching, lazy loading, and performance monitoring
 */

import React from 'react';

// Performance monitoring
export const trackAuthStateChange = () => {
  const startTime = performance.now();
  return (success: boolean) => {
    const duration = performance.now() - startTime;
    console.log(`Auth state change took ${duration.toFixed(2)}ms - ${success ? 'Success' : 'Failed'}`);
  };
};

export const trackPageLoad = (pageName: string) => {
  const startTime = performance.now();
  return () => {
    const duration = performance.now() - startTime;
    console.log(`${pageName} loaded in ${duration.toFixed(2)}ms`);
  };
};

// Performance monitor object for compatibility
export const performanceMonitor = {
  trackAuthStateChange,
  trackPageLoad,
  trackComponentRender: (componentName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.warn(`${componentName} took ${duration.toFixed(2)}ms to render`);
      }
    };
  }
};

// Image optimization
export const optimizeImageUrl = (url: string, width?: number, height?: number, quality = 80) => {
  if (!url) return url;
  
  // For Firebase Storage URLs, add optimization parameters
  if (url.includes('firebasestorage.googleapis.com')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    
    return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
  }
  
  return url;
};

// Bundle splitting helpers
export const preloadRoute = (route: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }
};

// Memory management
export const createMemoryEfficientState = <T>(initialValue: T) => {
  const [state, setState] = React.useState<T>(initialValue);
  
  const setStateWithCleanup = React.useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prev => {
      // Clean up previous state if it's an object with cleanup method
      if (prev && typeof prev === 'object' && 'cleanup' in prev) {
        (prev as any).cleanup();
      }
      return typeof newValue === 'function' ? (newValue as Function)(prev) : newValue;
    });
  }, []);
  
  return [state, setStateWithCleanup] as const;
};

// Debounced state updates
export const useDebouncedState = <T>(initialValue: T, delay: number) => {
  const [state, setState] = React.useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = React.useState<T>(initialValue);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedState(state);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [state, delay]);
  
  return [debouncedState, setState] as const;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 100) { // Log slow components
        console.warn(`${componentName} took ${duration.toFixed(2)}ms to unmount`);
      }
    };
  }, [componentName]);
};