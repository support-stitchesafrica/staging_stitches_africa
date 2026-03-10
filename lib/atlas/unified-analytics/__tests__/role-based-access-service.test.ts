import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RoleBasedAccessService } from '../services/role-based-access-service';
import { atlasRoleArb, vendorAnalyticsDataArb, bogoAnalyticsDataArb, storefrontAnalyticsDataArb, crossAnalyticsInsightsArb } from './generators';
import './setup';

/**
 * **Feature: atlas-unified-analytics, Property 1: Role-based analytics access control**
 * 
 * Property-based tests for role-based access control service
 * Tests that access permissions are correctly enforced across all user roles
 */

describe('RoleBasedAccessService', () => {
  let service: RoleBasedAccessService;

  beforeEach(() => {
    service = new RoleBasedAccessService();
  });

  describe('Property 1: Role-based analytics access control', () => {
    it('should correctly determine section access for all roles', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        fc.constantFrom('vendor', 'bogo', 'storefront', 'cross-analytics'),
        (userRole, section) => {
          const hasAccess = service.hasAccessToSection(userRole, section);
          const permissions = service.getRolePermissions(userRole);
          
          // Verify access matches role permissions
          switch (section) {
            case 'vendor':
              expect(hasAccess).toBe(permissions.canViewVendorAnalytics);
              break;
            case 'bogo':
              expect(hasAccess).toBe(permissions.canViewBogoAnalytics);
              break;
            case 'storefront':
              expect(hasAccess).toBe(permissions.canViewStorefrontAnalytics);
              break;
            case 'cross-analytics':
              expect(hasAccess).toBe(permissions.canViewCrossAnalytics);
              break;
          }
          
          return true;
        }
      ), { numRuns: 10 });
    });

    it('should enforce access control when filtering data', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        vendorAnalyticsDataArb,
        (userRole, vendorData) => {
          const permissions = service.getRolePermissions(userRole);
          
          if (permissions.canViewVendorAnalytics) {
            // Should not throw if user has access
            expect(() => service.filterAnalyticsData(vendorData, userRole, 'vendor')).not.toThrow();
            const filteredData = service.filterAnalyticsData(vendorData, userRole, 'vendor');
            expect(filteredData).toBeDefined();
          } else {
            // Should throw if user doesn't have access
            expect(() => service.filterAnalyticsData(vendorData, userRole, 'vendor')).toThrow();
          }
          
          return true;
        }
      ), { numRuns: 10 });
    });

    it('should return consistent permissions for the same role', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        (userRole) => {
          const permissions1 = service.getRolePermissions(userRole);
          const permissions2 = service.getRolePermissions(userRole);
          
          // Permissions should be identical for the same role
          expect(permissions1).toEqual(permissions2);
          
          // Permissions should be a new object (not the same reference)
          expect(permissions1).not.toBe(permissions2);
          
          return true;
        }
      ), { numRuns: 10 });
    });

    it('should correctly identify accessible sections for each role', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        (userRole) => {
          const accessibleSections = service.getAccessibleSections(userRole);
          const permissions = service.getRolePermissions(userRole);
          
          // Verify each accessible section matches permissions
          accessibleSections.forEach(section => {
            expect(service.hasAccessToSection(userRole, section)).toBe(true);
          });
          
          // Verify section count matches permission count
          const expectedSections = [];
          if (permissions.canViewVendorAnalytics) expectedSections.push('vendor');
          if (permissions.canViewBogoAnalytics) expectedSections.push('bogo');
          if (permissions.canViewStorefrontAnalytics) expectedSections.push('storefront');
          if (permissions.canViewCrossAnalytics) expectedSections.push('cross-analytics');
          
          expect(accessibleSections.sort()).toEqual(expectedSections.sort());
          
          return true;
        }
      ), { numRuns: 10 });
    });

    it('should validate minimum analytics access correctly', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        (userRole) => {
          const hasMinimumAccess = service.hasMinimumAnalyticsAccess(userRole);
          const accessibleSections = service.getAccessibleSections(userRole);
          
          // Should have minimum access if and only if there are accessible sections
          expect(hasMinimumAccess).toBe(accessibleSections.length > 0);
          
          return true;
        }
      ), { numRuns: 10 });
    });

    it('should handle export permissions correctly', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        fc.constantFrom('vendor', 'bogo', 'storefront', 'cross-analytics'),
        (userRole, dataType) => {
          const canExport = service.canExportDataType(userRole, dataType);
          const permissions = service.getRolePermissions(userRole);
          const hasAccess = service.hasAccessToSection(userRole, dataType);
          
          // Can export only if has both export permission and access to data type
          expect(canExport).toBe(permissions.canExportData && hasAccess);
          
          return true;
        }
      ), { numRuns: 10 });
    });

    it('should handle alert management permissions correctly', () => {
      fc.assert(fc.property(
        atlasRoleArb,
        fc.constantFrom('vendor', 'bogo', 'storefront', 'cross-analytics'),
        (userRole, dataType) => {
          const canManageAlerts = service.canManageAlertsForDataType(userRole, dataType);
          const permissions = service.getRolePermissions(userRole);
          const hasAccess = service.hasAccessToSection(userRole, dataType);
          
          // Can manage alerts only if has both alert permission and access to data type
          expect(canManageAlerts).toBe(permissions.canManageAlerts && hasAccess);
          
          return true;
        }
      ), { numRuns: 10 });
    });
  });

  describe('Role-specific access patterns', () => {
    it('should enforce superadmin has access to all sections', () => {
      const sections = ['vendor', 'bogo', 'storefront', 'cross-analytics'] as const;
      
      sections.forEach(section => {
        expect(service.hasAccessToSection('superadmin', section)).toBe(true);
      });
      
      const permissions = service.getRolePermissions('superadmin');
      expect(permissions.canViewVendorAnalytics).toBe(true);
      expect(permissions.canViewBogoAnalytics).toBe(true);
      expect(permissions.canViewStorefrontAnalytics).toBe(true);
      expect(permissions.canViewCrossAnalytics).toBe(true);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.canManageAlerts).toBe(true);
    });

    it('should enforce sales_lead has limited access', () => {
      expect(service.hasAccessToSection('sales_lead', 'vendor')).toBe(true);
      expect(service.hasAccessToSection('sales_lead', 'bogo')).toBe(false);
      expect(service.hasAccessToSection('sales_lead', 'storefront')).toBe(true);
      expect(service.hasAccessToSection('sales_lead', 'cross-analytics')).toBe(true);
      
      const permissions = service.getRolePermissions('sales_lead');
      expect(permissions.canManageAlerts).toBe(false);
    });

    it('should enforce logistics_lead has most limited access', () => {
      expect(service.hasAccessToSection('logistics_lead', 'vendor')).toBe(true);
      expect(service.hasAccessToSection('logistics_lead', 'bogo')).toBe(false);
      expect(service.hasAccessToSection('logistics_lead', 'storefront')).toBe(false);
      expect(service.hasAccessToSection('logistics_lead', 'cross-analytics')).toBe(false);
      
      const permissions = service.getRolePermissions('logistics_lead');
      expect(permissions.canExportData).toBe(false);
      expect(permissions.canManageAlerts).toBe(false);
    });
  });
});