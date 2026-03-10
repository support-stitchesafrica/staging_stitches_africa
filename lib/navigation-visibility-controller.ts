import { NavItem, NavigationVisibilityState, AuthState } from '@/types/navigation';

/**
 * Navigation visibility controller utility
 * Handles authentication-based navigation visibility logic with loading states and error conditions
 */

/**
 * Interface for navigation visibility controller
 */
export interface NavigationVisibilityController {
  getVisibleItems(items: NavItem[], authState: AuthState): NavItem[];
  shouldShowNavigation(authState: AuthState): boolean;
  getNavigationLayout(authState: AuthState): 'full' | 'limited' | 'hidden';
  getNavigationVisibilityState(items: NavItem[], authState: AuthState): NavigationVisibilityState;
}

/**
 * Determines which navigation items should be visible based on authentication state
 * @param items - Array of navigation items to filter
 * @param authState - Current authentication state
 * @returns Filtered array of visible navigation items
 */
export const getVisibleNavigationItems = (
  items: NavItem[], 
  authState: AuthState
): NavItem[] => {
  const { user, loading, moduleLoadError } = authState;
  const isAuthenticated = !!user;

  // During loading or module errors, show conservative navigation
  if (loading || moduleLoadError) {
    return items.filter(item => {
      // Show only public items during loading/error states
      return item.showForUnauthenticated === true || 
             (!item.requireAuth && !item.showForUnauthenticated);
    });
  }

  return items.filter(item => {
    // If item requires auth and user is not authenticated, hide it
    if (item.requireAuth && !isAuthenticated) {
      return false;
    }
    
    // If item is explicitly for unauthenticated users and user is authenticated, hide it
    if (item.showForUnauthenticated === true && isAuthenticated) {
      return false;
    }
    
    return true;
  });
};

/**
 * Determines if navigation should be shown based on authentication state
 * @param authState - Current authentication state
 * @returns Boolean indicating if navigation should be visible
 */
export const shouldShowNavigation = (authState: AuthState): boolean => {
  const { moduleLoadError, error } = authState;
  
  // Hide navigation only in severe error conditions
  if (moduleLoadError && error?.includes('failed to initialize')) {
    return false;
  }
  
  // Show navigation in all other cases (loading, authenticated, unauthenticated)
  return true;
};

/**
 * Determines the navigation layout based on authentication state
 * @param authState - Current authentication state
 * @returns Navigation layout type
 */
export const getNavigationLayout = (authState: AuthState): 'full' | 'limited' | 'hidden' => {
  const { user, loading, moduleLoadError, error } = authState;
  
  // Hide navigation in severe error conditions
  if (moduleLoadError && error?.includes('failed to initialize')) {
    return 'hidden';
  }
  
  // Show limited navigation during loading or module errors
  if (loading || moduleLoadError) {
    return 'limited';
  }
  
  // Show full navigation for authenticated users
  if (user) {
    return 'full';
  }
  
  // Show limited navigation for unauthenticated users
  return 'limited';
};

/**
 * Gets complete navigation visibility state
 * @param items - Array of navigation items
 * @param authState - Current authentication state
 * @returns Complete navigation visibility state
 */
export const getNavigationVisibilityState = (
  items: NavItem[], 
  authState: AuthState
): NavigationVisibilityState => {
  const { user, loading } = authState;
  const isAuthenticated = !!user;
  const shouldShow = shouldShowNavigation(authState);
  const visibleItems = shouldShow ? getVisibleNavigationItems(items, authState) : [];

  return {
    isAuthenticated,
    isLoading: loading,
    shouldShowNavigation: shouldShow,
    visibleItems
  };
};

/**
 * Handles authentication state transitions with smooth updates
 * @param previousState - Previous navigation visibility state
 * @param currentAuthState - Current authentication state
 * @param items - Array of navigation items
 * @returns Updated navigation visibility state with transition handling
 */
export const handleAuthStateTransition = (
  previousState: NavigationVisibilityState | null,
  currentAuthState: AuthState,
  items: NavItem[]
): NavigationVisibilityState => {
  const newState = getNavigationVisibilityState(items, currentAuthState);
  
  // If this is the first state or authentication status changed, return new state
  if (!previousState || previousState.isAuthenticated !== newState.isAuthenticated) {
    return newState;
  }
  
  // If still loading and previous state was stable, maintain previous visible items
  // to prevent flickering during authentication state transitions
  if (newState.isLoading && !previousState.isLoading) {
    return {
      ...newState,
      visibleItems: previousState.visibleItems
    };
  }
  
  return newState;
};

/**
 * Gets fallback navigation for error conditions
 * @param authState - Current authentication state
 * @returns Basic navigation items for error recovery
 */
export const getFallbackNavigation = (authState: AuthState): NavItem[] => {
  const { moduleLoadError } = authState;
  
  // Minimal navigation for module load errors
  if (moduleLoadError) {
    return [
      {
        href: '/',
        icon: null, // Will be handled by component
        label: 'Home',
        showForUnauthenticated: true,
        priority: 1
      }
    ];
  }
  
  // Basic public navigation for other errors
  return [
    {
      href: '/',
      icon: null,
      label: 'Home',
      showForUnauthenticated: true,
      priority: 1
    },
    {
      href: '/search',
      icon: null,
      label: 'Search',
      showForUnauthenticated: true,
      priority: 2
    }
  ];
};

/**
 * Navigation visibility controller implementation
 */
export const navigationVisibilityController: NavigationVisibilityController = {
  getVisibleItems: getVisibleNavigationItems,
  shouldShowNavigation,
  getNavigationLayout,
  getNavigationVisibilityState
};

/**
 * Hook-like utility for managing navigation visibility state
 * @param items - Array of navigation items
 * @param authState - Current authentication state
 * @param previousState - Previous navigation visibility state (optional)
 * @returns Navigation visibility state with transition handling
 */
export const useNavigationVisibility = (
  items: NavItem[],
  authState: AuthState,
  previousState?: NavigationVisibilityState | null
): NavigationVisibilityState => {
  // Handle authentication state transitions
  if (previousState) {
    return handleAuthStateTransition(previousState, authState, items);
  }
  
  // Return initial state
  return getNavigationVisibilityState(items, authState);
};

/**
 * Memoized version of navigation visibility state calculation
 * Optimizes performance by preventing unnecessary recalculations
 */
export const useMemoizedNavigationVisibility = (
  items: NavItem[],
  authState: AuthState,
  previousState?: NavigationVisibilityState | null
): NavigationVisibilityState => {
  // Create a stable key for memoization based on relevant auth state properties
  const authStateKey = `${!!authState.user}-${authState.loading}-${authState.moduleLoadError}-${authState.error?.includes('failed to initialize')}`;
  
  // Create a stable key for items based on their essential properties
  const itemsKey = items.map(item => 
    `${item.href || 'no-href'}-${item.label}-${item.requireAuth}-${item.showForUnauthenticated}-${item.priority}`
  ).join('|');
  
  // Use a simple memoization approach
  const memoKey = `${authStateKey}-${itemsKey}`;
  
  // For now, return the regular calculation - full memoization would require a cache
  // This provides the structure for future optimization
  return useNavigationVisibility(items, authState, previousState);
};