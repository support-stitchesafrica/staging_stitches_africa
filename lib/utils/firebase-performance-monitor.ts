/**
 * Firebase Performance Monitor
 * 
 * Tracks and reports Firebase query performance
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  cached: boolean;
  collection?: string;
  documentCount?: number;
}

class FirebasePerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Track a Firebase operation
   */
  track(metric: PerformanceMetric) {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`⚠️ Slow Firebase operation: ${metric.operation} took ${metric.duration}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        slowOperations: 0,
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const cachedOperations = this.metrics.filter(m => m.cached).length;
    const slowOperations = this.metrics.filter(m => m.duration > 1000).length;

    return {
      totalOperations: this.metrics.length,
      averageDuration: Math.round(totalDuration / this.metrics.length),
      cacheHitRate: Math.round((cachedOperations / this.metrics.length) * 100),
      slowOperations,
      fastestOperation: Math.min(...this.metrics.map(m => m.duration)),
      slowestOperation: Math.max(...this.metrics.map(m => m.duration)),
    };
  }

  /**
   * Get metrics by collection
   */
  getMetricsByCollection() {
    const collectionMetrics = new Map<string, {
      count: number;
      totalDuration: number;
      cached: number;
    }>();

    this.metrics.forEach(metric => {
      if (!metric.collection) return;

      const existing = collectionMetrics.get(metric.collection) || {
        count: 0,
        totalDuration: 0,
        cached: 0,
      };

      collectionMetrics.set(metric.collection, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + metric.duration,
        cached: existing.cached + (metric.cached ? 1 : 0),
      });
    });

    return Array.from(collectionMetrics.entries()).map(([collection, stats]) => ({
      collection,
      operations: stats.count,
      averageDuration: Math.round(stats.totalDuration / stats.count),
      cacheHitRate: Math.round((stats.cached / stats.count) * 100),
    }));
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(threshold: number = 1000) {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(m => ({
        operation: m.operation,
        duration: m.duration,
        collection: m.collection,
        timestamp: m.timestamp,
      }));
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    return {
      stats: this.getStats(),
      byCollection: this.getMetricsByCollection(),
      slowOperations: this.getSlowOperations(),
      recentMetrics: this.metrics.slice(-20),
    };
  }

  /**
   * Print performance report to console
   */
  printReport() {
    console.group('📊 Firebase Performance Report');
    
    const stats = this.getStats();
    console.log('Overall Stats:', stats);
    
    const byCollection = this.getMetricsByCollection();
    console.log('By Collection:', byCollection);
    
    const slowOps = this.getSlowOperations();
    if (slowOps.length > 0) {
      console.warn('Slow Operations:', slowOps);
    }
    
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new FirebasePerformanceMonitor();

/**
 * Decorator to track function performance
 */
export function trackPerformance(operation: string, collection?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let cached = false;

      try {
        const result = await originalMethod.apply(this, args);
        
        // Check if result came from cache
        if (result && typeof result === 'object' && 'fromCache' in result) {
          cached = result.fromCache;
        }

        const duration = Date.now() - startTime;
        
        performanceMonitor.track({
          operation: `${operation}.${propertyKey}`,
          duration,
          timestamp: new Date(),
          cached,
          collection,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        performanceMonitor.track({
          operation: `${operation}.${propertyKey} (error)`,
          duration,
          timestamp: new Date(),
          cached: false,
          collection,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Measure async function performance
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  collection?: string
): Promise<T> {
  const startTime = Date.now();
  let cached = false;

  try {
    const result = await fn();
    
    // Check if result came from cache
    if (result && typeof result === 'object' && 'fromCache' in result) {
      cached = (result as any).fromCache;
    }

    const duration = Date.now() - startTime;
    
    performanceMonitor.track({
      operation,
      duration,
      timestamp: new Date(),
      cached,
      collection,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    performanceMonitor.track({
      operation: `${operation} (error)`,
      duration,
      timestamp: new Date(),
      cached: false,
      collection,
    });

    throw error;
  }
}

/**
 * Auto-print performance report every 5 minutes in development
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = performanceMonitor.getStats();
    if (stats.totalOperations > 0) {
      performanceMonitor.printReport();
    }
  }, 5 * 60 * 1000);
}

/**
 * Expose performance monitor globally in development
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).firebasePerformance = {
    getStats: () => performanceMonitor.getStats(),
    getByCollection: () => performanceMonitor.getMetricsByCollection(),
    getSlowOps: () => performanceMonitor.getSlowOperations(),
    printReport: () => performanceMonitor.printReport(),
    export: () => performanceMonitor.exportMetrics(),
    clear: () => performanceMonitor.clear(),
  };

  console.log('💡 Firebase Performance Monitor available at window.firebasePerformance');
}
