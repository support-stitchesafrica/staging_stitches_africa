/**
 * Marketing Dashboard Role Guard Hooks
 * Provides hooks for role-based access control
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { UserPermissions } from '@/lib/marketing/auth-middleware';

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/marketing/auth/login') {
  const router = useRouter();
  const { isAuthenticated, loading } = useMarketingAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, redirectTo, router]);

  return { isAuthenticated, loading };
}

/**
 * Hook to require specific role
 * Redirects to unauthorized page if user doesn't have required role
 */
export function useRequireRole(
  role: string | string[],
  redirectTo: string = '/marketing/unauthorized'
) {
  const router = useRouter();
  const { marketingUser, hasRole, loading, isAuthorized } = useMarketingAuth();

  useEffect(() => {
    if (!loading && isAuthorized) {
      const hasRequiredRole = Array.isArray(role)
        ? hasRole(role)
        : hasRole(role);

      if (!hasRequiredRole) {
        router.push(redirectTo);
      }
    }
  }, [marketingUser, hasRole, loading, isAuthorized, role, redirectTo, router]);

  return { marketingUser, loading };
}

/**
 * Hook to require team lead role
 * Redirects to unauthorized page if user is not a team lead or super admin
 */
export function useRequireTeamLead(redirectTo: string = '/marketing/unauthorized') {
  return useRequireRole(['super_admin', 'team_lead'], redirectTo);
}

/**
 * Hook to require super admin role
 * Redirects to unauthorized page if user is not a super admin
 */
export function useRequireSuperAdmin(redirectTo: string = '/marketing/unauthorized') {
  return useRequireRole('super_admin', redirectTo);
}

/**
 * Hook to require BDM role
 * Redirects to unauthorized page if user is not a BDM or super admin
 */
export function useRequireBDM(redirectTo: string = '/marketing/unauthorized') {
  return useRequireRole(['super_admin', 'bdm'], redirectTo);
}

/**
 * Hook to require specific permissions
 * Redirects to unauthorized page if user doesn't have required permissions
 */
export function useRequirePermissions(
  permissions: (keyof UserPermissions)[],
  redirectTo: string = '/marketing/unauthorized'
) {
  const router = useRouter();
  const { hasPermission, loading, isAuthorized } = useMarketingAuth();

  useEffect(() => {
    if (!loading && isAuthorized) {
      const hasAllPermissions = permissions.every(permission => hasPermission(permission));

      if (!hasAllPermissions) {
        router.push(redirectTo);
      }
    }
  }, [hasPermission, loading, isAuthorized, permissions, redirectTo, router]);

  return { loading };
}

/**
 * Hook to check if user can manage users
 */
export function useCanManageUsers() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canManageUsers');
}

/**
 * Hook to check if user can invite users
 */
export function useCanInviteUsers() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canInviteUsers');
}

/**
 * Hook to check if user can manage teams
 */
export function useCanManageTeams() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canManageTeams');
}

/**
 * Hook to check if user can assign vendors
 */
export function useCanAssignVendors() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canAssignVendors');
}

/**
 * Hook to check if user can view all vendors
 */
export function useCanViewAllVendors() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canViewAllVendors');
}

/**
 * Hook to check if user can view all analytics
 */
export function useCanViewAllAnalytics() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canViewAllAnalytics');
}

/**
 * Hook to check if user can manage roles
 */
export function useCanManageRoles() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canManageRoles');
}

/**
 * Hook to check if user can view audit logs
 */
export function useCanViewAuditLogs() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canViewAuditLogs');
}

/**
 * Hook to check if user can export data
 */
export function useCanExportData() {
  const { hasPermission } = useMarketingAuth();
  return hasPermission('canExportData');
}

/**
 * Hook to check if user is super admin
 */
export function useIsSuperAdmin() {
  const { hasRole } = useMarketingAuth();
  return hasRole('super_admin');
}

/**
 * Hook to check if user is team lead
 */
export function useIsTeamLead() {
  const { hasRole } = useMarketingAuth();
  return hasRole('team_lead');
}

/**
 * Hook to check if user is BDM
 */
export function useIsBDM() {
  const { hasRole } = useMarketingAuth();
  return hasRole('bdm');
}

/**
 * Hook to check if user is team member
 */
export function useIsTeamMember() {
  const { hasRole } = useMarketingAuth();
  return hasRole('team_member');
}
