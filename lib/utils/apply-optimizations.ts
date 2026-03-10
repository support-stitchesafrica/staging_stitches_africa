/**
 * Utility to apply optimizations to existing components
 */

import { ComponentType } from 'react';
import { optimizations } from './component-optimizer';

/**
 * Apply basic optimization (React.memo with shallow comparison)
 */
export function optimizeComponent<P extends object>(Component: ComponentType<P>) {
  return optimizations.basic(Component);
}

/**
 * Apply full optimization (memo + performance monitoring + error boundary)
 */
export function fullyOptimizeComponent<P extends object>(Component: ComponentType<P>) {
  return optimizations.full(Component);
}

/**
 * Apply viewport-based optimization (intersection observer + memo)
 */
export function optimizeForViewport<P extends object>(Component: ComponentType<P>) {
  return optimizations.viewport(Component);
}

/**
 * Create lazy-loaded component
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ComponentType
) {
  return optimizations.lazy(importFn, fallback);
}

/**
 * Optimization presets for common use cases
 */
export const presets = {
  // For dashboard components that render frequently
  dashboard: fullyOptimizeComponent,
  
  // For components that are below the fold
  belowFold: optimizeForViewport,
  
  // For simple UI components
  ui: optimizeComponent,
  
  // For heavy components that should be lazy loaded
  heavy: createLazyComponent,
} as const;

/**
 * Example usage:
 * 
 * // Basic optimization
 * const OptimizedButton = optimizeComponent(Button);
 * 
 * // Full optimization for dashboard
 * const OptimizedDashboard = fullyOptimizeComponent(Dashboard);
 * 
 * // Viewport optimization for below-fold content
 * const OptimizedFooter = optimizeForViewport(Footer);
 * 
 * // Lazy loading for heavy components
 * const LazyChart = createLazyComponent(() => import('./HeavyChart'));
 */