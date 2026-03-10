import { describe, it, expect } from 'vitest';
import { PermissionService } from './permission-service';
import {
  BackOfficeUser,
  BackOfficeRole,
  Department,
  NavItem,
  ROLE_PERMISSIONS,
} from '@/types/backoffice';
import { Timestamp } from 'firebase/firestore';

// Helper function to create a mock user
function createMockUser(role: BackOfficeRole): BackOfficeUser {
  const permissions = ROLE_PERMISSIONS[role];
  const departments: Department[] = [];
  
  // Determine accessible departments based on permissions
  (Object.keys(permissions) as Department[]).forEach((dept) => {
    if (permissions[dept].read) {
      departments.push(dept);
    }
  });

  return {
    uid: 'test-uid',
    email: 'test@example.com',
    fullName: 'Test User',
    role,
    departments,
    permissions,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

describe('PermissionService', () => {
  describe('getRolePermissions', () => {
    it('should return permissions for superadmin', () => {
      const permissions = PermissionService.getRolePermissions('superadmin');
      
      expect(permissions.analytics.read).toBe(true);
      expect(permissions.analytics.write).toBe(true);
      expect(permissions.analytics.delete).toBe(true);
      expect(permissions.promotions.read).toBe(true);
      expect(permissions.promotions.write).toBe(true);
      expect(permissions.promotions.delete).toBe(true);
    });

    it('should return read-only permissions for founder', () => {
      const permissions = PermissionService.getRolePermissions('founder');
      
      expect(permissions.analytics.read).toBe(true);
      expect(permissions.analytics.write).toBe(false);
      expect(permissions.analytics.delete).toBe(false);
    });

    it('should return correct permissions for bdm', () => {
      const permissions = PermissionService.getRolePermissions('bdm');
      
      expect(permissions.analytics.read).toBe(true);
      expect(permissions.analytics.write).toBe(true);
      expect(permissions.marketing.read).toBe(true);
      expect(permissions.marketing.write).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      const user = createMockUser('superadmin');
      
      expect(PermissionService.hasPermission(user, 'analytics', 'read')).toBe(true);
      expect(PermissionService.hasPermission(user, 'analytics', 'write')).toBe(true);
      expect(PermissionService.hasPermission(user, 'analytics', 'delete')).toBe(true);
    });

    it('should return false when user lacks the permission', () => {
      const user = createMockUser('founder');
      
      expect(PermissionService.hasPermission(user, 'analytics', 'read')).toBe(true);
      expect(PermissionService.hasPermission(user, 'analytics', 'write')).toBe(false);
      expect(PermissionService.hasPermission(user, 'analytics', 'delete')).toBe(false);
    });

    it('should return false for departments user cannot access', () => {
      const user = createMockUser('viewer');
      
      expect(PermissionService.hasPermission(user, 'marketing', 'read')).toBe(false);
      expect(PermissionService.hasPermission(user, 'admin', 'read')).toBe(false);
    });
  });

  describe('canAccessDepartment', () => {
    it('should return true when user has read access', () => {
      const user = createMockUser('founder');
      
      expect(PermissionService.canAccessDepartment(user, 'analytics')).toBe(true);
    });

    it('should return false when user has no access', () => {
      const user = createMockUser('viewer');
      
      expect(PermissionService.canAccessDepartment(user, 'marketing')).toBe(false);
      expect(PermissionService.canAccessDepartment(user, 'admin')).toBe(false);
    });
  });

  describe('filterNavigationByPermissions', () => {
    const mockNavigation: NavItem[] = [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'chart',
        department: 'analytics',
        children: [
          { id: 'overview', label: 'Overview', href: '/backoffice/analytics' },
          { id: 'sales', label: 'Sales', href: '/backoffice/analytics/sales' },
        ],
      },
      {
        id: 'marketing',
        label: 'Marketing',
        icon: 'megaphone',
        department: 'marketing',
        children: [
          { id: 'dashboard', label: 'Dashboard', href: '/backoffice/marketing' },
          { id: 'vendors', label: 'Vendors', href: '/backoffice/marketing/vendors' },
        ],
      },
      {
        id: 'admin',
        label: 'Admin',
        icon: 'settings',
        department: 'admin',
        children: [
          { id: 'users', label: 'Users', href: '/backoffice/admin/users' },
        ],
      },
    ];

    it('should show all navigation for superadmin', () => {
      const user = createMockUser('superadmin');
      const filtered = PermissionService.filterNavigationByPermissions(mockNavigation, user);
      
      expect(filtered).toHaveLength(3);
      expect(filtered.map(item => item.id)).toEqual(['analytics', 'marketing', 'admin']);
    });

    it('should filter navigation for viewer', () => {
      const user = createMockUser('viewer');
      const filtered = PermissionService.filterNavigationByPermissions(mockNavigation, user);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('analytics');
    });

    it('should filter navigation for marketing_member', () => {
      const user = createMockUser('marketing_member');
      const filtered = PermissionService.filterNavigationByPermissions(mockNavigation, user);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(item => item.id)).toEqual(['analytics', 'marketing']);
    });
  });

  describe('getAccessibleDepartments', () => {
    it('should return all departments for superadmin', () => {
      const user = createMockUser('superadmin');
      const departments = PermissionService.getAccessibleDepartments(user);
      
      expect(departments).toHaveLength(5);
      expect(departments).toContain('analytics');
      expect(departments).toContain('promotions');
      expect(departments).toContain('collections');
      expect(departments).toContain('marketing');
      expect(departments).toContain('admin');
    });

    it('should return limited departments for viewer', () => {
      const user = createMockUser('viewer');
      const departments = PermissionService.getAccessibleDepartments(user);
      
      expect(departments).toHaveLength(3);
      expect(departments).toContain('analytics');
      expect(departments).toContain('promotions');
      expect(departments).toContain('collections');
      expect(departments).not.toContain('marketing');
      expect(departments).not.toContain('admin');
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for superadmin', () => {
      const user = createMockUser('superadmin');
      expect(PermissionService.isSuperAdmin(user)).toBe(true);
    });

    it('should return false for non-superadmin', () => {
      const user = createMockUser('founder');
      expect(PermissionService.isSuperAdmin(user)).toBe(false);
    });
  });

  describe('isReadOnly', () => {
    it('should return true for read-only access', () => {
      const user = createMockUser('founder');
      expect(PermissionService.isReadOnly(user, 'analytics')).toBe(true);
    });

    it('should return false when user has write access', () => {
      const user = createMockUser('bdm');
      expect(PermissionService.isReadOnly(user, 'analytics')).toBe(false);
    });

    it('should return false when user has no access', () => {
      const user = createMockUser('viewer');
      expect(PermissionService.isReadOnly(user, 'marketing')).toBe(false);
    });
  });

  describe('getPermissionSummary', () => {
    it('should return complete permission summary', () => {
      const user = createMockUser('bdm');
      const summary = PermissionService.getPermissionSummary(user);
      
      expect(summary.role).toBe('bdm');
      expect(summary.isSuperAdmin).toBe(false);
      expect(summary.accessibleDepartments).toContain('analytics');
      expect(summary.accessibleDepartments).toContain('marketing');
      expect(summary.permissions).toBeDefined();
    });
  });
});
