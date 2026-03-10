/**
 * Marketing Dashboard Guards
 * Export all guard components for easy importing
 */

export {
  RequireRole,
  RequirePermission,
  SuperAdminOnly,
  TeamLeadOnly,
  BDMOnly,
  TeamMemberOnly,
  CanManageUsers,
  CanInviteUsers,
  CanManageTeams,
  CanAssignVendors,
  CanViewAllVendors,
  CanViewAllAnalytics,
  CanExportData,
  CanViewAuditLogs,
  DisabledButton,
  RoleSwitch,
  PermissionDeniedMessage
} from './RoleBasedRender';
