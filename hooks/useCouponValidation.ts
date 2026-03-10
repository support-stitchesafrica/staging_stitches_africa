"use client";

import { useState, useCallback } from 'react';
import { ValidateCouponResult } from '@/types/coupon';

interface UseCouponValidationReturn {
  validateCoupon: (code: string, userEmail: string, orderAmount: number, currency?: string) => Promise<{ success: boolean; error?: string }>;
  validationResult: ValidateCouponResult | null;
  isValidating: boolean;
  error: string | null;
  clearValidation: () => void;
}

/**
 * Hook for validating coupons at checkout
 * Handles API calls, loading states, and error handling
 */
export function useCouponValidation(): UseCouponValidationReturn {
  const [validationResult, setValidationResult] = useState<ValidateCouponResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = useCallback(async (
    code: string,
    userEmail: string,
    orderAmount: number,
    currency?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Reset previous state
    setError(null);
    setValidationResult(null);
    setIsValidating(true);

    try {
      // Get Firebase ID token for authentication
      const { getAuth } = await import('firebase/auth');
      const { getFirebaseApp } = await import('@/lib/firebase');
      const app = await getFirebaseApp();
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) {
        const errorMsg = 'You must be logged in to apply coupons';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const idToken = await user.getIdToken();

      // Call validation API
      const response = await fetch('/api/shops/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          couponCode: code.trim().toUpperCase(),
          userEmail,
          orderAmount,
          currency
        })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || 'Failed to validate coupon';
        // Ensure the error message is a string and not a translation object
        if (typeof errorMsg === 'object' && errorMsg !== null) {
          errorMsg = 'Failed to validate coupon';
        }
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!data.valid) {
        let errorMsg = data.error || 'Invalid coupon code';
        // Ensure the error message is a string and not a translation object
        if (typeof errorMsg === 'object' && errorMsg !== null) {
          errorMsg = 'Invalid coupon code';
        }
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Success - store validation result
      // Clean the data to ensure no translation objects are stored
      const cleanData = { ...data };
      if (cleanData.coupon) {
        // Ensure the coupon object doesn't contain any translation objects
        cleanData.coupon = { ...cleanData.coupon };
      }
      setValidationResult(cleanData);
      return { success: true };
    } catch (err: any) {
      console.error('Coupon validation error:', err);
      const errorMsg = err.message || 'Failed to validate coupon. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setError(null);
    setIsValidating(false);
  }, []);

  return {
    validateCoupon,
    validationResult,
    isValidating,
    error,
    clearValidation
  };
}
