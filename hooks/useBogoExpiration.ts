// Hook for managing BOGO promotion expiration
'use client';

import { useEffect, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { bogoDurationService } from '@/lib/bogo/duration-service';

interface UseBogoExpirationOptions {
  checkInterval?: number; // Check interval in milliseconds (default: 60000 = 1 minute)
  onItemsExpired?: (expiredItems: string[]) => void;
}

export const useBogoExpiration = (options: UseBogoExpirationOptions = {}) => {
  const { 
    items, 
    cleanupExpiredBogoItems,
    validateBogoCart 
  } = useCart();
  
  const {
    checkInterval = 60000, // Default: check every minute
    onItemsExpired
  } = options;

  const checkForExpiredItems = useCallback(async () => {
    try {
      if (items.length === 0) return;

      // Check for expired BOGO items
      const expiredItems = await bogoDurationService.cleanupExpiredBogoItems(items);
      
      if (expiredItems.length > 0) {
        console.log(`Found ${expiredItems.length} expired BOGO items:`, expiredItems);
        
        // Clean up expired items from cart
        await cleanupExpiredBogoItems();
        
        // Notify callback if provided
        if (onItemsExpired) {
          onItemsExpired(expiredItems);
        }
      }
    } catch (error) {
      console.error('Error checking for expired BOGO items:', error);
    }
  }, [items, cleanupExpiredBogoItems, onItemsExpired]);

  const validateCartOnCheckout = useCallback(async () => {
    try {
      if (items.length === 0) {
        return { isValid: true, expiredItems: [], errors: [] };
      }

      // Validate cart for checkout
      const validation = await bogoDurationService.validateCheckoutExpiration(items);
      
      if (!validation.isValid) {
        console.warn('Cart validation failed:', validation.errors);
        
        // Clean up expired items
        if (validation.expiredItems.length > 0) {
          await cleanupExpiredBogoItems();
        }
      }
      
      return validation;
    } catch (error) {
      console.error('Error validating cart for checkout:', error);
      return {
        isValid: false,
        expiredItems: [],
        errors: ['Failed to validate cart. Please try again.']
      };
    }
  }, [items, cleanupExpiredBogoItems]);

  // Set up periodic checking for expired items
  useEffect(() => {
    if (items.length === 0) return;

    // Initial check
    checkForExpiredItems();

    // Set up interval for periodic checks
    const interval = setInterval(checkForExpiredItems, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [checkForExpiredItems, checkInterval, items.length]);

  // Check for expired items when cart items change
  useEffect(() => {
    if (items.length > 0) {
      // Debounce the check to avoid excessive calls
      const timeoutId = setTimeout(checkForExpiredItems, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [items, checkForExpiredItems]);

  return {
    checkForExpiredItems,
    validateCartOnCheckout,
  };
};

export default useBogoExpiration;