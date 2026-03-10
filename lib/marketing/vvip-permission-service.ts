/**
 * VVIP Permission Service
 * 
 * Handles role-based access control for VVIP operations.
 * Validates permissions on the server-side to ensure security.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */

import { adminDb } from '@/lib/firebase-admin';
import { VvipRole, VvipError, VvipErrorCode } from '@/types/vvip';
import { MarketingRole } from './types';

/**
 * Role Permissions Matrix
 * Defines what actions each role can perform
 */
const ROLE_PERMISSIONS = {
  super_admin: {
    create: true,
    edit: true,
    revoke: true,
    view: true,
    approve: true,
  },
  bdm: {
    create: true,
    edit: true,
    revoke: false,
    view: true,
    approve: true,
  },
  team_lead: {
    create: true,
    edit: true,
    revoke: false,
    view: true,
    approve: false,
  },
  team_member: {
    create: false,
    edit: false,
    revoke: false,
    view: true,
    approve: false,
  },
} as const;

/**
 * VVIP Permission Service Class
 * Provides server-side permission validation for VVIP operations
 */
export class VvipPermissionService {
  private static readonly COLLECTION_NAME = 'marketing_users';

  /**
   * Get user role from Firestore
   * Requirement: 7.1, 7.2, 7.3, 7.4
   * 
   * @param userId - The user ID to fetch role for
   * @returns The user's VVIP role
   * @throws VvipError if user not found or not a marketing user
   */
  static async getUserRole(userId: string): Promise<VvipRole> {
    try {
      const userDoc = await adminDb
        .collection(this.COLLECTION_NAME)
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return 'none';
      }

      const userData = userDoc.data();
      const role = userData?.role as MarketingRole | undefined;

      // Map marketing role to VVIP role
      if (!role) {
        return 'none';
      }

      // Validate that the role is one of the expected values
      if (['super_admin', 'bdm', 'team_lead', 'team_member'].includes(role)) {
        return role as VvipRole;
      }

      return 'none';
    } catch (error) {
      console.error('Error fetching user role:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch user role',
        500
      );
    }
  }

  /**
   * Check if user can create VVIP shoppers
   * Requirement: 7.5, 7.6, 7.7
   * 
   * @param userId - The user ID to check permissions for
   * @returns True if user can create VVIP shoppers
   */
  static async canCreateVvip(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    
    if (role === 'none') {
      return false;
    }

    return ROLE_PERMISSIONS[role]?.create ?? false;
  }

  /**
   * Check if user can revoke VVIP status
   * Requirement: 7.5
   * 
   * @param userId - The user ID to check permissions for
   * @returns True if user can revoke VVIP status
   */
  static async canRevokeVvip(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    
    if (role === 'none') {
      return false;
    }

    return ROLE_PERMISSIONS[role]?.revoke ?? false;
  }

  /**
   * Check if user can approve payments
   * Requirement: 7.5, 7.6
   * 
   * @param userId - The user ID to check permissions for
   * @returns True if user can approve payments
   */
  static async canApprovePayment(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    
    if (role === 'none') {
      return false;
    }

    return ROLE_PERMISSIONS[role]?.approve ?? false;
  }

  /**
   * Check if user can view VVIP orders
   * Requirement: 7.5, 7.6, 7.7, 7.8
   * 
   * @param userId - The user ID to check permissions for
   * @returns True if user can view VVIP orders
   */
  static async canViewVvipOrders(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    
    if (role === 'none') {
      return false;
    }

    return ROLE_PERMISSIONS[role]?.view ?? false;
  }

  /**
   * Check if user can edit VVIP information
   * Requirement: 7.5, 7.6, 7.7
   * 
   * @param userId - The user ID to check permissions for
   * @returns True if user can edit VVIP information
   */
  static async canEditVvip(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    
    if (role === 'none') {
      return false;
    }

    return ROLE_PERMISSIONS[role]?.edit ?? false;
  }

  /**
   * Validate permission for a specific action
   * Throws an error if user doesn't have permission
   * Requirement: 7.9
   * 
   * @param userId - The user ID to validate
   * @param action - The action to validate permission for
   * @throws VvipError if user doesn't have permission
   */
  static async validatePermission(
    userId: string,
    action: 'create' | 'edit' | 'revoke' | 'view' | 'approve'
  ): Promise<void> {
    const role = await this.getUserRole(userId);

    if (role === 'none') {
      throw new VvipError(
        VvipErrorCode.UNAUTHORIZED,
        'You do not have permission to access VVIP features',
        403
      );
    }

    const hasPermission = ROLE_PERMISSIONS[role]?.[action] ?? false;

    if (!hasPermission) {
      throw new VvipError(
        VvipErrorCode.UNAUTHORIZED,
        `You do not have permission to ${action} VVIP resources`,
        403
      );
    }
  }

  /**
   * Get all permissions for a user
   * Useful for UI rendering decisions
   * 
   * @param userId - The user ID to get permissions for
   * @returns Object containing all permission flags
   */
  static async getUserPermissions(userId: string): Promise<{
    role: VvipRole;
    canCreate: boolean;
    canEdit: boolean;
    canRevoke: boolean;
    canView: boolean;
    canApprove: boolean;
  }> {
    const role = await this.getUserRole(userId);

    if (role === 'none') {
      return {
        role,
        canCreate: false,
        canEdit: false,
        canRevoke: false,
        canView: false,
        canApprove: false,
      };
    }

    const permissions = ROLE_PERMISSIONS[role];

    return {
      role,
      canCreate: permissions.create,
      canEdit: permissions.edit,
      canRevoke: permissions.revoke,
      canView: permissions.view,
      canApprove: permissions.approve,
    };
  }

  /**
   * Check if user is a marketing user (has any role)
   * 
   * @param userId - The user ID to check
   * @returns True if user is a marketing user
   */
  static async isMarketingUser(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role !== 'none';
  }

  /**
   * Batch check permissions for multiple users
   * Useful for displaying lists with role-based UI elements
   * 
   * @param userIds - Array of user IDs to check
   * @returns Map of userId to their permissions
   */
  static async batchGetUserPermissions(
    userIds: string[]
  ): Promise<Map<string, Awaited<ReturnType<typeof VvipPermissionService.getUserPermissions>>>> {
    const permissionsMap = new Map();

    // Fetch all user documents in parallel
    const userDocs = await Promise.all(
      userIds.map(userId =>
        adminDb.collection(this.COLLECTION_NAME).doc(userId).get()
      )
    );

    // Process each user document
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userDoc = userDocs[i];

      if (!userDoc.exists) {
        permissionsMap.set(userId, {
          role: 'none' as VvipRole,
          canCreate: false,
          canEdit: false,
          canRevoke: false,
          canView: false,
          canApprove: false,
        });
        continue;
      }

      const userData = userDoc.data();
      const role = userData?.role as MarketingRole | undefined;

      if (!role || !['super_admin', 'bdm', 'team_lead', 'team_member'].includes(role)) {
        permissionsMap.set(userId, {
          role: 'none' as VvipRole,
          canCreate: false,
          canEdit: false,
          canRevoke: false,
          canView: false,
          canApprove: false,
        });
        continue;
      }

      // At this point, role is guaranteed to be one of the valid marketing roles
      const vvipRole = role as Exclude<VvipRole, 'none'>;
      const permissions = ROLE_PERMISSIONS[vvipRole];

      permissionsMap.set(userId, {
        role: vvipRole,
        canCreate: permissions.create,
        canEdit: permissions.edit,
        canRevoke: permissions.revoke,
        canView: permissions.view,
        canApprove: permissions.approve,
      });
    }

    return permissionsMap;
  }
}

// Export singleton instance methods for convenience
export const vvipPermissionService = {
  getUserRole: VvipPermissionService.getUserRole.bind(VvipPermissionService),
  canCreateVvip: VvipPermissionService.canCreateVvip.bind(VvipPermissionService),
  canRevokeVvip: VvipPermissionService.canRevokeVvip.bind(VvipPermissionService),
  canApprovePayment: VvipPermissionService.canApprovePayment.bind(VvipPermissionService),
  canViewVvipOrders: VvipPermissionService.canViewVvipOrders.bind(VvipPermissionService),
  canEditVvip: VvipPermissionService.canEditVvip.bind(VvipPermissionService),
  validatePermission: VvipPermissionService.validatePermission.bind(VvipPermissionService),
  getUserPermissions: VvipPermissionService.getUserPermissions.bind(VvipPermissionService),
  isMarketingUser: VvipPermissionService.isMarketingUser.bind(VvipPermissionService),
  batchGetUserPermissions: VvipPermissionService.batchGetUserPermissions.bind(VvipPermissionService),
};
