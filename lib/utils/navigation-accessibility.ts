import { useEffect, useRef } from 'react';
import { NavItem, NavigationVisibilityState } from '@/types/navigation';

/**
 * Accessibility utilities for navigation components
 * Implements ARIA labels, screen reader support, and keyboard navigation
 */

/**
 * Generate ARIA label for navigation items based on authentication state
 */
export const getNavigationItemAriaLabel = (
  item: NavItem,
  isAuthenticated: boolean,
  isActive: boolean = false
): string => {
  let baseLabel = item.label;
  
  // Add badge information to aria label
  if (item.badge && item.badge > 0) {
    baseLabel += `, ${item.badge} ${item.badge === 1 ? 'item' : 'items'}`;
  }
  
  // Add authentication context
  if (item.requireAuth && !isAuthenticated) {
    baseLabel += ', requires sign in';
  }
  
  // Add current page indicator
  if (isActive) {
    baseLabel += ', current page';
  }
  
  return baseLabel;
};

/**
 * Generate ARIA label for navigation container based on authentication state
 */
export const getNavigationContainerAriaLabel = (
  isAuthenticated: boolean,
  isLoading: boolean,
  itemCount: number
): string => {
  if (isLoading) {
    return 'Navigation menu loading';
  }
  
  const authStatus = isAuthenticated ? 'authenticated user' : 'guest user';
  return `Main navigation for ${authStatus}, ${itemCount} ${itemCount === 1 ? 'item' : 'items'} available`;
};

/**
 * Generate screen reader announcement for authentication state changes
 */
export const getAuthStateChangeAnnouncement = (
  previouslyAuthenticated: boolean | null,
  currentlyAuthenticated: boolean,
  isLoading: boolean
): string | null => {
  // Don't announce during loading states
  if (isLoading) {
    return null;
  }
  
  // Don't announce on initial load
  if (previouslyAuthenticated === null) {
    return null;
  }
  
  // Announce authentication state changes
  if (previouslyAuthenticated !== currentlyAuthenticated) {
    if (currentlyAuthenticated) {
      return 'Signed in successfully. Navigation updated with additional features.';
    } else {
      return 'Signed out. Navigation updated to show public features only.';
    }
  }
  
  return null;
};

/**
 * Generate screen reader announcement for navigation updates
 */
export const getNavigationUpdateAnnouncement = (
  previousItemCount: number,
  currentItemCount: number,
  isAuthenticated: boolean
): string | null => {
  if (previousItemCount === currentItemCount) {
    return null;
  }
  
  const authContext = isAuthenticated ? 'authenticated' : 'guest';
  return `Navigation updated for ${authContext} user. ${currentItemCount} ${currentItemCount === 1 ? 'item' : 'items'} available.`;
};

/**
 * Hook for managing screen reader announcements
 */
export const useScreenReaderAnnouncements = (
  navigationState: NavigationVisibilityState,
  isAuthenticated: boolean
) => {
  const previousStateRef = useRef<{
    isAuthenticated: boolean | null;
    itemCount: number;
  }>({
    isAuthenticated: null,
    itemCount: 0
  });
  
  const announcementRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const previousState = previousStateRef.current;
    const currentItemCount = navigationState.visibleItems.length;
    
    // Create announcement element if it doesn't exist
    if (!announcementRef.current) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.id = 'navigation-announcements';
      document.body.appendChild(announcement);
      announcementRef.current = announcement;
    }
    
    let announcementText = '';
    
    // Check for authentication state changes
    const authAnnouncement = getAuthStateChangeAnnouncement(
      previousState.isAuthenticated,
      isAuthenticated,
      navigationState.isLoading
    );
    
    if (authAnnouncement) {
      announcementText = authAnnouncement;
    } else {
      // Check for navigation updates
      const navAnnouncement = getNavigationUpdateAnnouncement(
        previousState.itemCount,
        currentItemCount,
        isAuthenticated
      );
      
      if (navAnnouncement) {
        announcementText = navAnnouncement;
      }
    }
    
    // Make announcement if there's text
    if (announcementText && announcementRef.current) {
      announcementRef.current.textContent = announcementText;
    }
    
    // Update previous state
    previousStateRef.current = {
      isAuthenticated,
      itemCount: currentItemCount
    };
    
    // Cleanup on unmount
    return () => {
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
        announcementRef.current = null;
      }
    };
  }, [navigationState, isAuthenticated]);
};

/**
 * Keyboard navigation handler for navigation items
 */
export const useKeyboardNavigation = (
  items: NavItem[],
  onItemActivate: (item: NavItem, index: number) => void
) => {
  const currentFocusRef = useRef<number>(-1);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const { key } = event;
    
    // Only handle navigation keys
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(key)) {
      return;
    }

    // Ignore if typing in an input, textarea, or contentEditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }
    
    event.preventDefault();
    
    switch (key) {
      case 'ArrowLeft':
        currentFocusRef.current = Math.max(0, currentFocusRef.current - 1);
        break;
      case 'ArrowRight':
        currentFocusRef.current = Math.min(items.length - 1, currentFocusRef.current + 1);
        break;
      case 'Home':
        currentFocusRef.current = 0;
        break;
      case 'End':
        currentFocusRef.current = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (currentFocusRef.current >= 0 && currentFocusRef.current < items.length) {
          onItemActivate(items[currentFocusRef.current], currentFocusRef.current);
        }
        return;
    }
    
    // Focus the appropriate navigation item
    const navElement = document.querySelector(`[data-nav-index="${currentFocusRef.current}"]`) as HTMLElement;
    if (navElement) {
      navElement.focus();
    }
  };
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, onItemActivate]);
  
  return {
    currentFocus: currentFocusRef.current,
    setFocus: (index: number) => {
      currentFocusRef.current = index;
    }
  };
};

/**
 * Generate role and ARIA attributes for navigation container
 */
export const getNavigationContainerAttributes = (
  isAuthenticated: boolean,
  isLoading: boolean,
  itemCount: number
) => {
  return {
    role: 'navigation' as const,
    'aria-label': getNavigationContainerAriaLabel(isAuthenticated, isLoading, itemCount),
    'aria-busy': isLoading,
    'aria-live': 'polite' as const
  };
};

/**
 * Generate ARIA attributes for navigation items
 */
export const getNavigationItemAttributes = (
  item: NavItem,
  index: number,
  isAuthenticated: boolean,
  isActive: boolean = false,
  isDisabled: boolean = false
) => {
  const attributes: Record<string, any> = {
    'aria-label': getNavigationItemAriaLabel(item, isAuthenticated, isActive),
    'data-nav-index': index,
    tabIndex: isDisabled ? -1 : 0,
    role: item.href ? 'link' : 'button'
  };
  
  if (isActive) {
    attributes['aria-current'] = 'page';
  }
  
  if (isDisabled) {
    attributes['aria-disabled'] = true;
  }
  
  if (item.badge && item.badge > 0) {
    attributes['aria-describedby'] = `nav-badge-${index}`;
  }
  
  return attributes;
};

/**
 * Generate ARIA attributes for navigation badges
 */
export const getNavigationBadgeAttributes = (
  item: NavItem,
  index: number
) => {
  if (!item.badge || item.badge <= 0) {
    return {};
  }
  
  return {
    id: `nav-badge-${index}`,
    'aria-label': `${item.badge} ${item.badge === 1 ? 'item' : 'items'}`,
    role: 'status'
  };
};

/**
 * Focus management utilities for navigation
 */
export const useFocusManagement = () => {
  const focusedElementRef = useRef<HTMLElement | null>(null);
  
  const saveFocus = () => {
    focusedElementRef.current = document.activeElement as HTMLElement;
  };
  
  const restoreFocus = () => {
    if (focusedElementRef.current && document.body.contains(focusedElementRef.current)) {
      focusedElementRef.current.focus();
    }
  };
  
  const focusFirstNavigationItem = () => {
    const firstNavItem = document.querySelector('[data-nav-index="0"]') as HTMLElement;
    if (firstNavItem) {
      firstNavItem.focus();
    }
  };
  
  return {
    saveFocus,
    restoreFocus,
    focusFirstNavigationItem
  };
};