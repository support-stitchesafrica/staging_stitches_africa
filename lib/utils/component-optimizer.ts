/**
 * Component optimization utilities
 * Provides React.memo wrappers and performance optimizations
 */

import React, { ComponentType, memo, useMemo, useCallback, ReactNode } from 'react';

/**
 * Higher-order component that adds React.memo with custom comparison
 */
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Shallow comparison for props (useful for memo)
 */
export function shallowEqual<T extends Record<string, any>>(
  obj1: T,
  obj2: T
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for complex props
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Optimized component wrapper for lists
 */
export function withListOptimization<T, P extends { items: T[]; renderItem: (item: T, index: number) => ReactNode }>(
  Component: ComponentType<P>
) {
  return memo((props: P) => {
    const memoizedItems = useMemo(() => props.items, [props.items]);
    const memoizedRenderItem = useCallback(props.renderItem, [props.renderItem]);
    
    return React.createElement(Component, {
      ...props,
      items: memoizedItems,
      renderItem: memoizedRenderItem,
    });
  });
}

/**
 * Performance monitoring HOC
 */
export function withPerformanceMonitoring<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
) {
  return memo((props: P) => {
    const name = componentName || Component.displayName || Component.name;
    
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // More than one frame (16ms)
          console.warn(`Slow render detected: ${name} took ${renderTime.toFixed(2)}ms`);
        }
      };
    });
    
    return React.createElement(Component, props);
  });
}

/**
 * Lazy loading wrapper for components
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ComponentType
) {
  const LazyComponent = React.lazy(importFn);
  
  return (props: P) => React.createElement(
    React.Suspense,
    { 
      fallback: fallback 
        ? React.createElement(fallback) 
        : React.createElement('div', null, 'Loading...')
    },
    React.createElement(LazyComponent, props)
  );
}

/**
 * Intersection Observer HOC for viewport-based rendering
 */
export function withIntersectionObserver<P extends object>(
  Component: ComponentType<P>,
  options?: IntersectionObserverInit
) {
  return memo((props: P) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1, ...options }
      );
      
      if (ref.current) {
        observer.observe(ref.current);
      }
      
      return () => observer.disconnect();
    }, []);
    
    return React.createElement(
      'div',
      { ref },
      isVisible 
        ? React.createElement(Component, props)
        : React.createElement('div', { style: { minHeight: '200px' } })
    );
  });
}

/**
 * Debounced props HOC
 */
export function withDebouncedProps<P extends object>(
  Component: ComponentType<P>,
  delay: number = 300,
  propsToDebounce: (keyof P)[] = []
) {
  return memo((props: P) => {
    const [debouncedProps, setDebouncedProps] = React.useState(props);
    
    React.useEffect(() => {
      const timer = setTimeout(() => {
        const newProps = { ...props };
        propsToDebounce.forEach(key => {
          newProps[key] = props[key];
        });
        setDebouncedProps(newProps);
      }, delay);
      
      return () => clearTimeout(timer);
    }, [props, delay]);
    
    return React.createElement(Component, debouncedProps);
  });
}

/**
 * Error boundary HOC
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ComponentType<{ error: Error }>
) {
  class ErrorBoundary extends React.Component<
    P & { children: ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: P & { children: ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component error:', error, errorInfo);
    }
    
    render() {
      if (this.state.hasError) {
        if (fallback && this.state.error) {
          return React.createElement(fallback, { error: this.state.error });
        }
        return React.createElement('div', null, 'Something went wrong.');
      }
      
      return this.props.children;
    }
  }
  
  return (props: P) => React.createElement(
    ErrorBoundary,
    props as P & { children: ReactNode },
    React.createElement(Component, props)
  );
}

/**
 * Combine multiple HOCs
 */
export function compose<P extends object>(
  ...hocs: Array<(component: ComponentType<P>) => ComponentType<P>>
) {
  return (Component: ComponentType<P>) => {
    return hocs.reduceRight((acc, hoc) => hoc(acc), Component);
  };
}

/**
 * Pre-configured optimization combinations
 */
export const optimizations = {
  // Basic optimization with memo
  basic: <P extends object>(Component: ComponentType<P>) =>
    withMemo(Component, shallowEqual),
  
  // Full optimization with performance monitoring
  full: <P extends object>(Component: ComponentType<P>) =>
    compose<P>(
      withMemo,
      withPerformanceMonitoring,
      withErrorBoundary
    )(Component),
  
  // Lazy loading optimization
  lazy: <P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    fallback?: ComponentType
  ) => withLazyLoading(importFn, fallback),
  
  // Viewport optimization
  viewport: <P extends object>(Component: ComponentType<P>) =>
    compose<P>(
      withIntersectionObserver,
      withMemo
    )(Component)
};