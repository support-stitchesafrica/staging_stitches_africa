/**
 * Optimized analytics service with batching and performance tracking
 */

interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    
    // Auto-flush events before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  clearUserId() {
    this.userId = null;
  }

  // Track generic events
  track(event: Omit<AnalyticsEvent, 'timestamp' | 'userId' | 'sessionId'>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      action: event.action,
      category: event.category,
      label: event.label,
      value: event.value,
      ...event,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    this.scheduleBatch();
  }

  // Track page views
  trackPageView(page: string, title?: string) {
    this.track({
      action: 'page_view',
      category: 'navigation',
      label: page,
      page,
      title,
    });
  }

  // Track user interactions
  trackInteraction(element: string, action: string, context?: string) {
    this.track({
      action: 'user_interaction',
      category: 'engagement',
      label: `${element}_${action}`,
      element,
      interactionType: action,
      context,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: string) {
    this.track({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value,
      context,
    });
  }

  // Track authentication events
  trackAuth(data: {
    action: 'login_success' | 'login_failure' | 'logout' | 'signup';
    duration?: number;
    errorType?: string;
    timestamp: string;
    userId?: string;
    isFirstTime?: boolean;
  }) {
    this.track({
      ...data,
      category: 'authentication',
    });
  }

  // Track payment events
  trackPayment(data: {
    provider: 'stripe' | 'flutterwave' | 'paystack';
    currency: 'USD' | 'NGN' | 'EUR';
    amount: number;
    success: boolean;
    errorType?: string;
    errorCode?: string;
    duration?: number;
    timestamp: string;
    orderId: string;
  }) {
    this.track({
      action: data.success ? 'payment_success' : 'payment_failure',
      category: 'ecommerce',
      label: `${data.provider}_${data.currency}`,
      value: data.amount,
      ...data,
    });
  }

  // Track errors
  trackError(error: Error, context?: string) {
    this.track({
      action: 'error',
      category: 'errors',
      label: error.message,
      errorName: error.name,
      errorStack: error.stack,
      context,
    });
  }

  // Schedule batch sending
  private scheduleBatch() {
    // Send immediately if we have many events
    if (this.events.length >= 10) {
      this.flush();
      return;
    }

    // Otherwise, batch for 5 seconds
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flush(), 5000);
    }
  }

  // Send events to analytics service
  private async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Send to Google Analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        eventsToSend.forEach(event => {
          (window as any).gtag('event', event.action, {
            event_category: event.category,
            event_label: event.label,
            value: event.value,
            custom_parameter_1: event.userId,
            custom_parameter_2: event.sessionId,
          });
        });
      }

      // Send to custom analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
      }).catch(error => {
        console.warn('Analytics send failed:', error);
        // Re-queue events for retry
        this.events.unshift(...eventsToSend);
      });

    } catch (error) {
      console.warn('Analytics flush failed:', error);
      // Re-queue events for retry
      this.events.unshift(...eventsToSend);
    }
  }

  // Manual flush
  async forceFlush() {
    await this.flush();
  }

  // Get all metrics (for debugging/monitoring)
  getAllMetrics() {
    return {
      pendingEvents: this.events.length,
      sessionId: this.sessionId,
      userId: this.userId,
      isEnabled: this.isEnabled,
    };
  }
}

export const analytics = new AnalyticsService();

// Performance tracking utilities
export const trackComponentRender = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    analytics.trackPerformance('component_render', duration, componentName);
  };
};

export const trackAsyncOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    analytics.trackPerformance('async_operation_success', duration, operationName);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    analytics.trackPerformance('async_operation_failure', duration, operationName);
    analytics.trackError(error instanceof Error ? error : new Error(String(error)), operationName);
    throw error;
  }
};

// React hook for component analytics
import { useEffect } from 'react';

export const useAnalytics = (componentName: string) => {
  useEffect(() => {
    const endTracking = trackComponentRender(componentName);
    return endTracking;
  }, [componentName]);

  return {
    trackInteraction: (element: string, action: string) => 
      analytics.trackInteraction(element, action, componentName),
    trackError: (error: Error) => 
      analytics.trackError(error, componentName),
    trackPageView: (path: string, title: string) => 
      analytics.trackPageView(path, title),
  };
};