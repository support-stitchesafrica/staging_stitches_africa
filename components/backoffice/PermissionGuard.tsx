/**
 * Permission Guard Component
 * 
 * Conditionally renders children based on user permissions.
 * Provides flexible permission checking for department access and permission levels.
 * 
 * Requirements: 14.5
 */

'use client';

import React, { memo, ReactNode } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { Department, PermissionLevel } from '@/types/backoffice';

export interface PermissionGuardProps {
  /** Department to check access for */
  department?: Department;
  
  /** Permission level required (read, write, or delete) */
  permission?: keyof PermissionLevel;
  
  /** Content to render if user has permission */
  children: ReactNode;
  
  /** Content to render if user lacks permission */
  fallback?: ReactNode;
  
  /** Whether to show nothing (vs fallback) when permission is denied */
  hideOnDenied?: boolean;
  
  /** Custom permission check function */
  customCheck?: (user: any) => boolean;
}

function PermissionGuard({
  department,
  permission,
  children,
  fallback = null,
  hideOnDenied = false,
  customCheck,
}: PermissionGuardProps) {
  const { backOfficeUser, hasPermission, canAccessDepartment } = useBackOfficeAuth();

  // If no user is loaded, don't render anything
  if (!backOfficeUser) {
    return hideOnDenied ? null : fallback;
  }

  // Custom permission check
  if (customCheck) {
    const hasCustomPermission = customCheck(backOfficeUser);
    if (!hasCustomPermission) {
      return hideOnDenied ? null : fallback;
    }
    return <>{children}</>;
  }

  // Check department access
  if (department) {
    const hasDepartmentAccess = canAccessDepartment(department);
    
    if (!hasDepartmentAccess) {
      return hideOnDenied ? null : fallback;
    }

    // If permission level is specified, check that too
    if (permission) {
      const hasRequiredPermission = hasPermission(department, permission);
      
      if (!hasRequiredPermission) {
        return hideOnDenied ? null : fallback;
      }
    }
  }

  // User has required permissions
  return <>{children}</>;
}

/**
 * Higher-order component version of PermissionGuard
 * Wraps a component and only renders it if user has required permissions
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    );
  };

  WrappedComponent.displayName = `withPermissionGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for checking permissions in components
 * Useful when you need to conditionally execute logic based on permissions
 */
export function usePermissionCheck() {
  const { backOfficeUser, hasPermission, canAccessDepartment } = useBackOfficeAuth();

  const checkPermission = (
    department: Department,
    permission?: keyof PermissionLevel
  ): boolean => {
    if (!backOfficeUser) {
      return false;
    }

    const hasDepartmentAccess = canAccessDepartment(department);
    
    if (!hasDepartmentAccess) {
      return false;
    }

    if (permission) {
      return hasPermission(department, permission);
    }

    return true;
  };

  const isSuperAdmin = backOfficeUser?.role === 'superadmin';

  return {
    checkPermission,
    isSuperAdmin,
    currentRole: backOfficeUser?.role,
    departments: backOfficeUser?.departments || [],
  };
}


export default memo(PermissionGuard);