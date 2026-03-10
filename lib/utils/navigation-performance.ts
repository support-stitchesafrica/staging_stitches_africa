import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { NavItem, NavigationVisibilityState, AuthState } from '@/types/navigation';

/**
 * Performance optimization utilities for navigation components
 * Implements memoization and efficient state change handling
 */

/**
 * Memoized navigation item calculation hook
 * Prevents unnecessary recalculations of navigation items
 */
export const useMemoizedNavigationItems = (
  baseItems: NavItem[],
  isAuthenticated: boolean,
  cartItemCount: number,
  wishlistItemCount: number,
  onCartClick?: () => void,
  onMenuClick?: () => void
): NavItem[] => {
  return useMemo(() => {
    return baseItems.map(item => {
      // Add dynamic properties based on item type
      if (item.label === 'Cart') {
        return {
          ...item,
          badge: cartItemCount,
          onClick: onCartClick
        };
      }
      
      if (item.label === 'Wishlist') {
        return {
          ...item,
          badge: wishlistItemCount
        };
      }
      
      if (item.label === 'Menu') {
        return {
          ...item,
          onClick: onMenuClick
        };
      }
      
      return item;
    });
  }, [baseItems, cartItemCount, wishlistItemCount, onCartClick, onMenuClick]);
};

/**
 * Memoized navigation visibility state calculation
 * Prevents unnecessary re-renders when auth state hasn't meaningfully changed
 */
export const useMemoizedNavigationVisibility = (
  items: NavItem[],
  authState: AuthState,
  previousState?: NavigationVisibilityState | null
): NavigationVisibilityState => {
  return useMemo(() => {
    const { user, loading, error, moduleLoadError } = authState;
    const isAuthenticated = !!user;
    
    // Determine if navigation should be shown
    const shouldShow = !(moduleLoadError && error?.includes('failed to initialize'));
    
    // Filter visible items based on authentication state
    const visibleItems = shouldShow ? items.filter(item => {
      // During loading or module errors, show conservative navigation
      if (loading || moduleLoadError) {
        return item.showForUnauthenticated === true || 
               (!item.requireAuth && !item.showForUnauthenticated);
      }

      // If item requires auth and user is not authenticated, hide it
      if (item.requireAuth && !isAuthenticated) {
        return false;
      }
      
      // If item is explicitly for unauthenticated users and user is authenticated, hide it
      if (item.showForUnauthenticated === true && isAuthenticated) {
        return false;
      }
      
      return true;
    }) : [];

    return {
      isAuthenticated,
      isLoading: loading,
      shouldShowNavigation: shouldShow,
      visibleItems
    };
  }, [items, authState.user, authState.loading, authState.error, authState.moduleLoadError]);
};

/**
 * Stable callback hook for navigation actions
 * Prevents unnecessary re-renders caused by callback recreation
 */
export const useStableNavigationCallbacks = () => {
  const callbacksRef = useRef<{
    onCartClick?: () => void;
    onMenuClick?: () => void;
  }>({});

  const createStableCallback = useCallback((
    setter: (value: boolean) => void,
    value: boolean
  ) => {
    return () => setter(value);
  }, []);

  const getStableCartCallback = useCallback((setIsCartOpen: (value: boolean) => void) => {
    if (!callbacksRef.current.onCartClick) {
      callbacksRef.current.onCartClick = createStableCallback(setIsCartOpen, true);
    }
    return callbacksRef.current.onCartClick;
  }, [createStableCallback]);

  const getStableMenuCallback = useCallback((setIsMenuOpen: (value: boolean) => void) => {
    if (!callbacksRef.current.onMenuClick) {
      callbacksRef.current.onMenuClick = createStableCallback(setIsMenuOpen, true);
    }
    return callbacksRef.current.onMenuClick;
  }, [createStableCallback]);

  return {
    getStableCartCallback,
    getStableMenuCallback
  };
};

/**
 * Optimized auth state change detection
 * Only triggers updates when meaningful auth state changes occur
 */
export const useOptimizedAuthStateChange = (
  authState: AuthState,
  onAuthStateChange?: (newState: AuthState) => void
) => {
  const previousAuthStateRef = useRef<AuthState | null>(null);
  
  useEffect(() => {
    const previousState = previousAuthStateRef.current;
    
    // Skip if this is the first render
    if (!previousState) {
      previousAuthStateRef.current = authState;
      return;
    }
    
    // Check if meaningful auth state properties have changed
    const hasSignificantChange = (
      previousState.user?.uid !== authState.user?.uid ||
      previousState.loading !== authState.loading ||
      previousState.moduleLoadError !== authState.moduleLoadError ||
      (previousState.error !== authState.error && 
       (authState.error?.includes('failed to initialize') || 
        previousState.error?.includes('failed to initialize')))
    );
    
    if (hasSignificantChange && onAuthStateChange) {
      onAuthStateChange(authState);
    }
    
    previousAuthStateRef.current = authState;
  }, [authState, onAuthStateChange]);
};

/**
 * Debounced state update hook
 * Prevents rapid state updates that can cause performance issues
 */
export const useDebouncedStateUpdate = <T>(
  value: T,
  delay: number = 100
): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Navigation item comparison function for React.memo
 * Optimizes re-rendering by comparing only relevant properties
 */
export const navigationItemsEqual = (
  prevItems: NavItem[],
  nextItems: NavItem[]
): boolean => {
  if (prevItems.length !== nextItems.length) {
    return false;
  }

  for (let i = 0; i < prevItems.length; i++) {
    const prev = prevItems[i];
    const next = nextItems[i];

    // Compare essential properties that affect rendering
    if (
      prev.href !== next.href ||
      prev.label !== next.label ||
      prev.badge !== next.badge ||
      prev.requireAuth !== next.requireAuth ||
      prev.showForUnauthenticated !== next.showForUnauthenticated ||
      prev.priority !== next.priority
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Navigation visibility state comparison function
 * Optimizes re-rendering by comparing only relevant state properties
 */
export const navigationVisibilityStateEqual = (
  prevState: NavigationVisibilityState,
  nextState: NavigationVisibilityState
): boolean => {
  return (
    prevState.isAuthenticated === nextState.isAuthenticated &&
    prevState.isLoading === nextState.isLoading &&
    prevState.shouldShowNavigation === nextState.shouldShowNavigation &&
    navigationItemsEqual(prevState.visibleItems, nextState.visibleItems)
  );
};

/**
 * Performance monitoring hook for navigation state changes
 * Tracks performance metrics for optimization analysis
 */
export const useNavigationPerformanceMonitoring = (
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCountRef.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTimeRef.current;

    // Log performance metrics in development
    if (renderCountRef.current > 1) {
      console.debug(`[Navigation Performance] ${componentName}:`, {
        renderCount: renderCountRef.current,
        timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    lastRenderTimeRef.current = currentTime;
  });

  return {
    renderCount: renderCountRef.current,
    resetMetrics: () => {
      renderCountRef.current = 0;
      lastRenderTimeRef.current = performance.now();
    }
  };
};