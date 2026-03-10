import React from 'react';
import { NavigationConfig, NavItem } from '@/types/navigation';
import {
  House,
  Search,
  ShoppingCart,
  Heart,
  Menu,
  User
} from 'lucide-react';

/**
 * Navigation configuration for unauthenticated users
 * Shows only public navigation items with sign-in option
 */
const unauthenticatedItems: NavItem[] = [
  {
    href: '/',
    icon: React.createElement(House, { size: 20 }),
    label: 'Home',
    showForUnauthenticated: true,
    priority: 1
  },
  {
    href: '/search',
    icon: React.createElement(Search, { size: 20 }),
    label: 'Search',
    showForUnauthenticated: true,
    priority: 2
  },
  {
    href: '/auth',
    icon: React.createElement(User, { size: 20 }),
    label: 'Sign In',
    showForUnauthenticated: true,
    priority: 3
  }
];

/**
 * Navigation configuration for authenticated users
 * Shows full navigation including cart, wishlist, and menu
 */
const authenticatedItems: NavItem[] = [
  {
    href: '/',
    icon: React.createElement(House, { size: 20 }),
    label: 'Home',
    priority: 1
  },
  {
    href: '/search',
    icon: React.createElement(Search, { size: 20 }),
    label: 'Search',
    priority: 2
  },
  {
    icon: React.createElement(ShoppingCart, { size: 20 }),
    label: 'Cart',
    priority: 3,
    // onClick will be set dynamically in the component
  },
  {
    href: '/wishlist',
    icon: React.createElement(Heart, { size: 20 }),
    label: 'Wishlist',
    requireAuth: true,
    priority: 4
  },
  {
    icon: React.createElement(Menu, { size: 20 }),
    label: 'Menu',
    priority: 5,
    // onClick will be set dynamically in the component
  }
];

/**
 * Complete navigation configuration object
 */
export const navigationConfig: NavigationConfig = {
  unauthenticatedItems,
  authenticatedItems
};

/**
 * Get navigation items based on authentication state
 * @param isAuthenticated - Whether the user is authenticated
 * @param cartItemCount - Number of items in cart (for badge)
 * @param wishlistItemCount - Number of items in wishlist (for badge)
 * @param onCartClick - Handler for cart button click
 * @param onMenuClick - Handler for menu button click
 * @returns Array of navigation items configured for the current state
 */
export const getNavigationItems = (
  isAuthenticated: boolean,
  cartItemCount: number = 0,
  wishlistItemCount: number = 0,
  onCartClick?: () => void,
  onMenuClick?: () => void
): NavItem[] => {
  const baseItems = isAuthenticated 
    ? navigationConfig.authenticatedItems 
    : navigationConfig.unauthenticatedItems;

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
};

/**
 * Filter navigation items based on authentication requirements
 * @param items - Array of navigation items to filter
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Filtered array of navigation items
 */
export const filterNavigationItems = (
  items: NavItem[], 
  isAuthenticated: boolean
): NavItem[] => {
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
 * Sort navigation items by priority
 * @param items - Array of navigation items to sort
 * @returns Sorted array of navigation items
 */
export const sortNavigationItemsByPriority = (items: NavItem[]): NavItem[] => {
  return [...items].sort((a, b) => {
    const priorityA = a.priority ?? 999;
    const priorityB = b.priority ?? 999;
    return priorityA - priorityB;
  });
};