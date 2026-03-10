'use client';

import { useCallback } from 'react';
import { analytics } from '@/lib/analytics';

/**
 * Hook for tracking user interactions and analytics events
 */
export const useAnalytics = () => {
  /**
   * Track button clicks and user interactions
   */
  const trackClick = useCallback((elementName: string, additionalData?: Record<string, any>) => {
    analytics.track({
      action: 'button_click',
      category: 'user_interaction',
      label: elementName,
      page: window.location.pathname,
      element: elementName,
      success: true,
      ...additionalData,
    });
  }, []);

  /**
   * Track form submissions
   */
  const trackFormSubmit = useCallback((formName: string, success: boolean, errorMessage?: string) => {
    analytics.track({
      action: 'form_submit',
      category: 'user_interaction',
      label: formName,
      page: window.location.pathname,
      element: formName,
      success,
      errorMessage,
    });
  }, []);

  /**
   * Track feature usage
   */
  const trackFeatureUsage = useCallback((featureName: string, additionalData?: Record<string, any>) => {
    analytics.track({
      action: 'feature_used',
      category: 'feature_usage',
      label: featureName,
      page: window.location.pathname,
      element: featureName,
      success: true,
      ...additionalData,
    });
  }, []);

  /**
   * Track errors encountered by users
   */
  const trackError = useCallback((errorType: string, errorMessage: string, element?: string) => {
    analytics.track({
      action: 'error_encountered',
      category: 'errors',
      label: `${errorType}: ${errorMessage}`,
      page: window.location.pathname,
      element: element || 'unknown',
      success: false,
      errorMessage: `${errorType}: ${errorMessage}`,
      errorType,
    });
  }, []);

  /**
   * Track authentication attempts
   */
  const trackAuthAttempt = useCallback((action: 'login' | 'registration', method?: string) => {
    const startTime = performance.now();
    
    analytics.trackAuth({
      action: `${action}_attempt`,
      method: method as 'email' | 'google' | 'facebook',
      timestamp: new Date().toISOString(),
    });

    // Return a function to track the result
    return (success: boolean, errorType?: string) => {
      const duration = performance.now() - startTime;
      
      analytics.trackAuth({
        action: success ? `${action}_success` : `${action}_failure`,
        method: method as 'email' | 'google' | 'facebook',
        duration,
        errorType,
        timestamp: new Date().toISOString(),
      });
    };
  }, []);

  /**
   * Track payment attempts
   */
  const trackPaymentAttempt = useCallback((
    provider: 'stripe' | 'flutterwave' | 'paystack',
    currency: 'USD' | 'NGN' | 'EUR',
    amount: number,
    orderId: string
  ) => {
    const startTime = performance.now();
    
    // Track the attempt
    analytics.track({
      action: 'payment_attempt',
      category: 'ecommerce',
      label: `${provider}_${currency}`,
      value: amount,
      provider,
      currency,
      orderId,
    });
    
    // Return a function to track the result
    return (success: boolean, errorType?: string, errorCode?: string, transactionId?: string) => {
      const duration = performance.now() - startTime;
      
      analytics.trackPayment({
        provider,
        currency,
        amount,
        success,
        errorType,
        errorCode,
        duration,
        timestamp: new Date().toISOString(),
        orderId,
      });
    };
  }, []);

  /**
   * Track custom events
   */
  const trackCustomEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.track({
      action: eventName,
      category: 'custom',
      ...properties,
    });
  }, []);

  /**
   * Get current analytics metrics
   */
  const getMetrics = useCallback(() => {
    return analytics.getAllMetrics();
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackFeatureUsage,
    trackError,
    trackAuthAttempt,
    trackPaymentAttempt,
    trackCustomEvent,
    getMetrics,
  };
};