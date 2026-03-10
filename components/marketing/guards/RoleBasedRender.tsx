/**
 * Role-Based Rendering Components
 * Provides component-level guards for conditional rendering based on roles and permissions
 * Requirements: 8.1, 8.5
 */

'use client';

import React from 'react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { UserPermissions } from '@/lib/marketing/auth-middleware';

/**
 * Props for role-based rendering components
 */
interface RoleBasedRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RequireRoleProps extends RoleBasedRenderProps {
  role: string | string[];
}

interface RequirePermissionProps extends RoleBasedRenderProps {
  permission: keyof UserPermissions | (keyof UserPermissions)[];
}

/**
 * Render children only if user has the required role
 * @example
 * <RequireRole role="super_admin">
 *   <button>Delete User</button>
 * </RequireRole>
 */
export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { hasRole } = useMarketingAuth();

  const hasRequiredRole = Array.isArray(role)
    ? hasRole(role)
    : hasRole(role);

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user has the required permission
 * @example
 * <RequirePermission permission="canManageUsers">
 *   <button>Invite User</button>
 * </RequirePermission>
 */
export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = useMarketingAuth();

  const hasRequiredPermission = Array.isArray(permission)
    ? permission.every(p => hasPermission(p))
    : hasPermission(permission);

  if (!hasRequiredPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only for super admins
 * @example
 * <SuperAdminOnly>
 *   <button>System Settings</button>
 * </SuperAdminOnly>
 */
export function SuperAdminOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequireRole role="super_admin" fallback={fallback}>{children}</RequireRole>;
}

/**
 * Render children only for team leads (or super admins)
 * @example
 * <TeamLeadOnly>
 *   <button>Manage Team</button>
 * </TeamLeadOnly>
 */
export function TeamLeadOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequireRole role={['super_admin', 'team_lead']} fallback={fallback}>{children}</RequireRole>;
}

/**
 * Render children only for BDMs (or super admins)
 * @example
 * <BDMOnly>
 *   <button>Assign Vendor</button>
 * </BDMOnly>
 */
export function BDMOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequireRole role={['super_admin', 'bdm']} fallback={fallback}>{children}</RequireRole>;
}

/**
 * Render children only for team members (all authenticated users)
 * @example
 * <TeamMemberOnly>
 *   <button>View My Tasks</button>
 * </TeamMemberOnly>
 */
export function TeamMemberOnly({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequireRole role={['super_admin', 'team_lead', 'bdm', 'team_member']} fallback={fallback}>{children}</RequireRole>;
}

/**
 * Render children only if user can manage users
 * @example
 * <CanManageUsers>
 *   <button>Edit User</button>
 * </CanManageUsers>
 */
export function CanManageUsers({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canManageUsers" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can invite users
 * @example
 * <CanInviteUsers>
 *   <button>Send Invitation</button>
 * </CanInviteUsers>
 */
export function CanInviteUsers({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canInviteUsers" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can manage teams
 * @example
 * <CanManageTeams>
 *   <button>Create Team</button>
 * </CanManageTeams>
 */
export function CanManageTeams({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canManageTeams" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can assign vendors
 * @example
 * <CanAssignVendors>
 *   <button>Assign to Team Member</button>
 * </CanAssignVendors>
 */
export function CanAssignVendors({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canAssignVendors" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can view all vendors
 * @example
 * <CanViewAllVendors>
 *   <VendorList />
 * </CanViewAllVendors>
 */
export function CanViewAllVendors({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canViewAllVendors" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can view all analytics
 * @example
 * <CanViewAllAnalytics>
 *   <AnalyticsDashboard />
 * </CanViewAllAnalytics>
 */
export function CanViewAllAnalytics({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canViewAllAnalytics" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can export data
 * @example
 * <CanExportData>
 *   <button>Export CSV</button>
 * </CanExportData>
 */
export function CanExportData({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canExportData" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Render children only if user can view audit logs
 * @example
 * <CanViewAuditLogs>
 *   <AuditLogViewer />
 * </CanViewAuditLogs>
 */
export function CanViewAuditLogs({ children, fallback = null }: RoleBasedRenderProps) {
  return <RequirePermission permission="canViewAuditLogs" fallback={fallback}>{children}</RequirePermission>;
}

/**
 * Higher-order component to disable a button based on role/permission
 * @example
 * <DisabledButton
 *   requiredRole="super_admin"
 *   onClick={handleClick}
 *   disabledMessage="Only super admins can perform this action"
 * >
 *   Delete
 * </DisabledButton>
 */
interface DisabledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiredRole?: string | string[];
  requiredPermission?: keyof UserPermissions | (keyof UserPermissions)[];
  disabledMessage?: string;
  children: React.ReactNode;
}

export function DisabledButton({
  requiredRole,
  requiredPermission,
  disabledMessage = 'You do not have permission to perform this action',
  children,
  className = '',
  ...props
}: DisabledButtonProps) {
  const { hasRole, hasPermission } = useMarketingAuth();

  let isDisabled = false;
  let title = '';

  // Check role requirement
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? hasRole(requiredRole)
      : hasRole(requiredRole);

    if (!hasRequiredRole) {
      isDisabled = true;
      title = disabledMessage;
    }
  }

  // Check permission requirement
  if (requiredPermission && !isDisabled) {
    const hasRequiredPermission = Array.isArray(requiredPermission)
      ? requiredPermission.every(p => hasPermission(p))
      : hasPermission(requiredPermission);

    if (!hasRequiredPermission) {
      isDisabled = true;
      title = disabledMessage;
    }
  }

  return (
    <button
      {...props}
      disabled={isDisabled || props.disabled}
      title={isDisabled ? title : props.title}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

/**
 * Component to show different content based on user role
 * @example
 * <RoleSwitch
 *   superAdmin={<SuperAdminDashboard />}
 *   teamLead={<TeamLeadDashboard />}
 *   bdm={<BDMDashboard />}
 *   teamMember={<TeamMemberDashboard />}
 *   fallback={<UnauthorizedMessage />}
 * />
 */
interface RoleSwitchProps {
  superAdmin?: React.ReactNode;
  teamLead?: React.ReactNode;
  bdm?: React.ReactNode;
  teamMember?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleSwitch({
  superAdmin,
  teamLead,
  bdm,
  teamMember,
  fallback = null
}: RoleSwitchProps) {
  const { marketingUser } = useMarketingAuth();

  if (!marketingUser) {
    return <>{fallback}</>;
  }

  switch (marketingUser.role) {
    case 'super_admin':
      return <>{superAdmin || fallback}</>;
    case 'team_lead':
      return <>{teamLead || fallback}</>;
    case 'bdm':
      return <>{bdm || fallback}</>;
    case 'team_member':
      return <>{teamMember || fallback}</>;
    default:
      return <>{fallback}</>;
  }
}

/**
 * Component to show error message when user lacks permission
 * @example
 * <PermissionDeniedMessage
 *   message="You need super admin privileges to access this feature"
 *   showContactInfo
 * />
 */
interface PermissionDeniedMessageProps {
  message?: string;
  showContactInfo?: boolean;
  className?: string;
}

export function PermissionDeniedMessage({
  message = 'You do not have permission to access this feature',
  showContactInfo = false,
  className = ''
}: PermissionDeniedMessageProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Permission Required</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{message}</p>
            {showContactInfo && (
              <p className="mt-2">
                Contact your administrator if you believe you should have access to this feature.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
