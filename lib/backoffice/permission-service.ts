/**
 * Permission Service
 * 
 * Provides centralized permission checking and navigation filtering
 * for the unified back office system.
 */

import {
  BackOfficeUser,
  BackOfficeRole,
  Department,
  DepartmentPermissions,
  PermissionLevel,
  NavItem,
  ROLE_PERMISSIONS,
} from '@/types/backoffice';

export class PermissionService {
  /**
   * Get the complete permission set for a given role
   * 
   * @param role - The back office role
   * @returns The department permissions for the role
   */
  static getRolePermissions(role: BackOfficeRole): DepartmentPermissions {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Get list of departments a role has access to
   * 
   * @param role - The back office role
   * @returns Array of departments the role can access
   */
  static getDepartmentsForRole(role: BackOfficeRole): Department[] {
    const permissions = this.getRolePermissions(role);
    const departments: Department[] = [];

    // Check each department for any permission (read, write, or delete)
    for (const [dept, perms] of Object.entries(permissions)) {
      if (perms.read || perms.write || perms.delete) {
        departments.push(dept as Department);
      }
    }

    return departments;
  }

  /**
   * Check if a user has a specific permission level for a department
   * 
   * @param user - The back office user
   * @param department - The department to check
   * @param level - The permission level to check ('read', 'write', or 'delete')
   * @returns True if the user has the permission, false otherwise
   */
  static hasPermission(
    user: BackOfficeUser,
    department: Department,
    level: keyof PermissionLevel
  ): boolean {
    // Check if user is active
    if (!user.isActive) {
      return false;
    }

    // Get the user's permissions for the department
    const departmentPermissions = user.permissions[department];
    
    // If no permissions exist for this department, deny access
    if (!departmentPermissions) {
      return false;
    }

    // Return the specific permission level
    return departmentPermissions[level] === true;
  }

  /**
   * Check if a user can access a department (has at least read permission)
   * 
   * @param user - The back office user
   * @param department - The department to check
   * @returns True if the user can access the department, false otherwise
   */
  static canAccessDepartment(
    user: BackOfficeUser,
    department: Department
  ): boolean {
    // Check if user is active
    if (!user.isActive) {
      return false;
    }

    // Check if the department is in the user's accessible departments list
    if (!user.departments.includes(department)) {
      return false;
    }

    // Check if the user has at least read permission
    return this.hasPermission(user, department, 'read');
  }

  /**
   * Filter navigation items based on user permissions
   * Only returns departments and sub-items the user can access
   * 
   * @param navigation - The complete navigation structure
   * @param user - The back office user
   * @returns Filtered navigation items
   */
  static filterNavigationByPermissions(
    navigation: NavItem[],
    user: BackOfficeUser
  ): NavItem[] {
    // Check if user is active
    if (!user.isActive) {
      return [];
    }

    // Filter navigation items
    return navigation
      .filter((item) => {
        // Check if user can access this department
        return this.canAccessDepartment(user, item.department);
      })
      .map((item) => {
        // If the item has children, filter them based on permissions
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: item.children.filter((child) => {
              // If no specific permission is required, include it
              if (!child.requiredPermission) {
                return true;
              }

              // Check if user has the required permission
              return this.hasPermission(
                user,
                item.department,
                child.requiredPermission
              );
            }),
          };
        }

        return item;
      })
      // Remove items with no accessible children
      .filter((item) => {
        if (item.children) {
          return item.children.length > 0;
        }
        return true;
      });
  }

  /**
   * Check if a user has write access to a department
   * Convenience method for common permission check
   * 
   * @param user - The back office user
   * @param department - The department to check
   * @returns True if the user can write to the department
   */
  static canWrite(user: BackOfficeUser, department: Department): boolean {
    return this.hasPermission(user, department, 'write');
  }

  /**
   * Check if a user has delete access to a department
   * Convenience method for common permission check
   * 
   * @param user - The back office user
   * @param department - The department to check
   * @returns True if the user can delete in the department
   */
  static canDelete(user: BackOfficeUser, department: Department): boolean {
    return this.hasPermission(user, department, 'delete');
  }

  /**
   * Get all departments a user can access
   * 
   * @param user - The back office user
   * @returns Array of accessible departments
   */
  static getAccessibleDepartments(user: BackOfficeUser): Department[] {
    if (!user.isActive) {
      return [];
    }

    return user.departments.filter((department) =>
      this.canAccessDepartment(user, department)
    );
  }

  /**
   * Check if a user is a superadmin
   * Convenience method for role checking
   * 
   * @param user - The back office user
   * @returns True if the user is a superadmin
   */
  static isSuperAdmin(user: BackOfficeUser): boolean {
    return user.role === 'superadmin' && user.isActive;
  }

  /**
   * Check if a user has read-only access to a department
   * (has read but not write or delete)
   * 
   * @param user - The back office user
   * @param department - The department to check
   * @returns True if the user has read-only access
   */
  static isReadOnly(user: BackOfficeUser, department: Department): boolean {
    return (
      this.hasPermission(user, department, 'read') &&
      !this.hasPermission(user, department, 'write') &&
      !this.hasPermission(user, department, 'delete')
    );
  }

  /**
   * Get a complete permission summary for a user
   * Useful for debugging and displaying user capabilities
   * 
   * @param user - The back office user
   * @returns Permission summary object
   */
  static getPermissionSummary(user: BackOfficeUser) {
    return {
      role: user.role,
      isSuperAdmin: this.isSuperAdmin(user),
      isActive: user.isActive,
      accessibleDepartments: this.getAccessibleDepartments(user),
      permissions: user.permissions,
      departmentAccess: {
        analytics: {
          canAccess: this.canAccessDepartment(user, 'analytics'),
          canRead: this.hasPermission(user, 'analytics', 'read'),
          canWrite: this.hasPermission(user, 'analytics', 'write'),
          canDelete: this.hasPermission(user, 'analytics', 'delete'),
          isReadOnly: this.isReadOnly(user, 'analytics'),
        },
        promotions: {
          canAccess: this.canAccessDepartment(user, 'promotions'),
          canRead: this.hasPermission(user, 'promotions', 'read'),
          canWrite: this.hasPermission(user, 'promotions', 'write'),
          canDelete: this.hasPermission(user, 'promotions', 'delete'),
          isReadOnly: this.isReadOnly(user, 'promotions'),
        },
        collections: {
          canAccess: this.canAccessDepartment(user, 'collections'),
          canRead: this.hasPermission(user, 'collections', 'read'),
          canWrite: this.hasPermission(user, 'collections', 'write'),
          canDelete: this.hasPermission(user, 'collections', 'delete'),
          isReadOnly: this.isReadOnly(user, 'collections'),
        },
        marketing: {
          canAccess: this.canAccessDepartment(user, 'marketing'),
          canRead: this.hasPermission(user, 'marketing', 'read'),
          canWrite: this.hasPermission(user, 'marketing', 'write'),
          canDelete: this.hasPermission(user, 'marketing', 'delete'),
          isReadOnly: this.isReadOnly(user, 'marketing'),
        },
        admin: {
          canAccess: this.canAccessDepartment(user, 'admin'),
          canRead: this.hasPermission(user, 'admin', 'read'),
          canWrite: this.hasPermission(user, 'admin', 'write'),
          canDelete: this.hasPermission(user, 'admin', 'delete'),
          isReadOnly: this.isReadOnly(user, 'admin'),
        },
      },
    };
  }
}
