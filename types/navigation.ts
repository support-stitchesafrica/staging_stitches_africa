import React from 'react';

/**
 * Enhanced navigation item interface with authentication-based visibility controls
 */
export interface NavItem {
  href?: string;
  icon: React.ReactNode;
  label: string;
  requireAuth?: boolean;
  showForUnauthenticated?: boolean; // New: explicitly show for unauthenticated users
  badge?: number;
  onClick?: () => void;
  priority?: number; // New: for ordering items when space is limited
}

/**
 * Navigation configuration for different authentication states
 */
export interface NavigationConfig {
  unauthenticatedItems: NavItem[];
  authenticatedItems: NavItem[];
}

/**
 * Navigation visibility state for managing authentication-based display
 */
export interface NavigationVisibilityState {
  isAuthenticated: boolean;
  isLoading: boolean;
  shouldShowNavigation: boolean;
  visibleItems: NavItem[];
}

/**
 * Authentication state interface for navigation visibility logic
 */
export interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  moduleLoadError?: boolean;
}