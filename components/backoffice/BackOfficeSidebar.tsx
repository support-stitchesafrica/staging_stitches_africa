/**
 * Back Office Sidebar Component
 * 
 * Unified navigation sidebar with dropdown menus, permission-based filtering,
 * and Bumpa-style design (gradients, modern typography).
 * 
 * Features:
 * - Dropdown navigation with expand/collapse animation
 * - Permission-based filtering of navigation items
 * - Active page highlighting
 * - Responsive design (hamburger menu for mobile)
 * - Bumpa-style gradients and modern design
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5, 14.1, 14.2, 14.3, 14.4, 14.5, 18.3
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  BarChart3,
  Calendar,
  Layers,
  Megaphone,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  TrendingUp,
  ShoppingCart,
  Truck,
  Building2,
  Target,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { PermissionService } from '@/lib/backoffice/permission-service';
import { NavItem, NavSubItem, Department } from '@/types/backoffice';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Navigation structure with all departments and sub-pages
 */
const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    department: 'analytics',
    children: [
      { id: 'analytics-overview', label: 'Overview', href: '/backoffice/analytics', icon: 'Home' },
      { id: 'analytics-traffic', label: 'Traffic', href: '/backoffice/analytics/traffic', icon: 'TrendingUp' },
      { id: 'analytics-sales', label: 'Sales', href: '/backoffice/analytics/sales', icon: 'ShoppingCart', requiredPermission: 'write' },
      { id: 'analytics-products', label: 'Products', href: '/backoffice/analytics/products', icon: 'Layers', requiredPermission: 'write' },
      { id: 'analytics-logistics', label: 'Logistics', href: '/backoffice/analytics/logistics', icon: 'Truck', requiredPermission: 'write' },
    ],
  },
  {
    id: 'promotions',
    label: 'Promotions',
    icon: 'Calendar',
    department: 'promotions',
    children: [
      { id: 'promotions-events', label: 'Events', href: '/backoffice/promotions', icon: 'Calendar' },
      { id: 'promotions-create', label: 'Create Event', href: '/backoffice/promotions/create', icon: 'FileText', requiredPermission: 'write' },
      { id: 'promotions-analytics', label: 'Analytics', href: '/backoffice/promotions/analytics', icon: 'BarChart3' },
    ],
  },
  {
    id: 'collections',
    label: 'Collections',
    icon: 'Layers',
    department: 'collections',
    children: [
      { id: 'collections-list', label: 'All Collections', href: '/backoffice/collections', icon: 'Layers' },
      { id: 'collections-create', label: 'Create Collection', href: '/backoffice/collections/create', icon: 'FileText', requiredPermission: 'write' },
      { id: 'collections-featured', label: 'Featured', href: '/backoffice/collections/featured', icon: 'Target' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    department: 'marketing',
    children: [
      { id: 'marketing-dashboard', label: 'Dashboard', href: '/backoffice/marketing', icon: 'Home' },
      { id: 'marketing-vendors', label: 'Vendors', href: '/backoffice/marketing/vendors', icon: 'Building2' },
      { id: 'marketing-tasks', label: 'Tasks', href: '/backoffice/marketing/tasks', icon: 'Target' },
      { id: 'marketing-interactions', label: 'Interactions', href: '/backoffice/marketing/interactions', icon: 'FileText' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'Settings',
    department: 'admin',
    children: [
      { id: 'admin-dashboard', label: 'Dashboard', href: '/backoffice/admin', icon: 'Home' },
      { id: 'admin-users', label: 'Users', href: '/backoffice/admin/users', icon: 'Users' },
      { id: 'admin-tailors', label: 'Tailors', href: '/backoffice/admin/tailors', icon: 'Users' },
      { id: 'admin-settings', label: 'Settings', href: '/backoffice/admin/settings', icon: 'Settings' },
    ],
  },
];

/**
 * Icon mapping for dynamic icon rendering
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  BarChart3,
  Calendar,
  Layers,
  Megaphone,
  Settings,
  Users,
  TrendingUp,
  ShoppingCart,
  Truck,
  Building2,
  Target,
  FileText,
};

export interface BackOfficeSidebarProps {
  /** Optional controlled collapsed state */
  isCollapsed?: boolean;
  /** Optional callback when collapse state changes */
  onToggleCollapse?: () => void;
}

/**
 * Back Office Sidebar Component
 */
export const BackOfficeSidebar: React.FC<BackOfficeSidebarProps> = ({
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { backOfficeUser, signOut } = useBackOfficeAuth();
  const isMobile = useIsMobile();

  // Internal state for collapse
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState<Set<string>>(new Set(['analytics']));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use prop if provided, otherwise use internal state
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  /**
   * Filter navigation items based on user permissions
   * Requirements: 3.1, 3.2
   */
  const filteredNavigation = useMemo(() => {
    if (!backOfficeUser) {
      return [];
    }

    return PermissionService.filterNavigationByPermissions(NAVIGATION_ITEMS, backOfficeUser);
  }, [backOfficeUser]);

  /**
   * Format role name for display
   */
  const formatRoleName = useCallback((role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  /**
   * Check if a path is active
   * Requirements: 3.5, 14.4
   */
  const isActive = useCallback((href: string): boolean => {
    if (href === '/backoffice') {
      return pathname === href;
    }
    return pathname?.startsWith(href) || false;
  }, [pathname]);

  /**
   * Check if a dropdown should be expanded
   */
  const isDropdownExpanded = useCallback((departmentId: string): boolean => {
    return expandedDropdowns.has(departmentId);
  }, [expandedDropdowns]);

  /**
   * Toggle dropdown expansion
   * Requirements: 14.2, 14.3
   */
  const toggleDropdown = useCallback((departmentId: string) => {
    setExpandedDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
    });
  }, []);

  /**
   * Toggle sidebar collapse
   */
  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  }, [onToggleCollapse, internalCollapsed]);

  /**
   * Toggle mobile menu
   * Requirements: 18.3
   */
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(!mobileMenuOpen);
  }, [mobileMenuOpen]);

  /**
   * Handle logout
   * Requirements: 1.5
   */
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut]);

  /**
   * Close mobile menu when navigating
   */
  const handleNavigation = useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Don't render if no user
  if (!backOfficeUser) {
    return null;
  }

  /**
   * Render navigation item icon
   */
  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = ICON_MAP[iconName];
    if (!IconComponent) {
      return <Home className={className} />;
    }
    return <IconComponent className={className} />;
  };

  /**
   * Sidebar content (shared between desktop and mobile)
   */
  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Image
              src="/Stitches-Africa-Logo-06.png"
              alt="Stitches Africa"
              width={32}
              height={32}
              className="rounded"
            />
            <div>
              <span className="text-lg font-bold text-white">
                Stitches Africa
              </span>
              <p className="text-xs text-white/70">Back Office</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <Image
              src="/Stitches-Africa-Logo-06.png"
              alt="SA"
              width={32}
              height={32}
              className="rounded"
            />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isExpanded = isDropdownExpanded(item.id);
            const hasActiveChild = item.children?.some(child => isActive(child.href));

            return (
              <li key={item.id}>
                {/* Dropdown Header */}
                <button
                  onClick={() => toggleDropdown(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${hasActiveChild
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  {renderIcon(item.icon, 'w-5 h-5 flex-shrink-0')}
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">
                        {item.label}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* Dropdown Content */}
                {!isCollapsed && isExpanded && item.children && (
                  <ul
                    className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200"
                  >
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);

                      return (
                        <li key={child.id}>
                          <Link
                            href={child.href}
                            onClick={handleNavigation}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                              transition-all duration-200
                              ${childActive
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }
                            `}
                          >
                            {child.icon && renderIcon(child.icon, 'w-4 h-4')}
                            <span>{child.label}</span>
                            {childActive && (
                              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Team Management Link (Superadmin only) */}
      {backOfficeUser.role === 'superadmin' && (
        <div className="px-2 pb-2">
          <Link
            href="/backoffice/team"
            onClick={handleNavigation}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${isActive('/backoffice/team')
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Team Management' : undefined}
          >
            <Users className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-medium">Team</span>}
          </Link>
        </div>
      )}

      {/* User Info and Actions */}
      <div className="p-2 border-t border-white/10 space-y-1">
        {/* User Info */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs text-white/70 space-y-1.5">
            <div className="font-medium text-white truncate">
              {backOfficeUser.fullName}
            </div>
            <div className="truncate">{backOfficeUser.email}</div>
            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white text-[10px] font-medium border border-white/10">
              {formatRoleName(backOfficeUser.role)}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-white/70 hover:bg-red-500/10 hover:text-red-400
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isCollapsed ? 'justify-center' : ''}
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          )}
        </button>

        {/* Collapse Toggle (Desktop only) */}
        {!isMobile && (
          <button
            onClick={handleToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-white/70 hover:bg-white/5 hover:text-white
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  // Mobile view
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/Stitches-Africa-Logo-06.png"
              alt="Stitches Africa"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-lg font-bold text-white">Back Office</span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={toggleMobileMenu}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 bottom-0 z-50 w-64
            bg-gradient-to-b from-slate-800 to-slate-900
            transform transition-transform duration-300 ease-in-out
            flex flex-col
            lg:hidden
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop view
  return (
    <aside
      className={`
        bg-gradient-to-b from-slate-800 to-slate-900
        border-r border-white/10
        transition-all duration-300 ease-in-out
        flex flex-col
        h-screen sticky top-0
        ${isCollapsed ? 'w-16' : 'w-64'}
        overflow-y-auto
        hidden lg:flex
      `}
    >
      {sidebarContent}
    </aside>
  );
};
