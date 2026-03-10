import { AtlasRole } from '@/lib/atlas/types';
import { IRoleBasedAccessService } from '../interfaces';

/**
 * Role-based access control service implementation
 * Manages analytics access permissions based on user roles
 */
export class RoleBasedAccessService implements IRoleBasedAccessService {
  
  /**
   * Role permissions configuration for analytics access
   */
  private readonly rolePermissions = {
    superadmin: {
      canViewVendorAnalytics: true,
      canViewBogoAnalytics: true,
      canViewStorefrontAnalytics: true,
      canViewCollectionsAnalytics: true,
      canViewReferralAnalytics: true,
      canViewCrossAnalytics: true,
      canExportData: true,
      canManageAlerts: true,
    },
    founder: {
      canViewVendorAnalytics: true,
      canViewBogoAnalytics: true,
      canViewStorefrontAnalytics: true,
      canViewCollectionsAnalytics: true,
      canViewReferralAnalytics: true,
      canViewCrossAnalytics: true,
      canExportData: true,
      canManageAlerts: false,
    },
    sales_lead: {
      canViewVendorAnalytics: true,
      canViewBogoAnalytics: false,
      canViewStorefrontAnalytics: true,
      canViewCollectionsAnalytics: true,
      canViewReferralAnalytics: true,
      canViewCrossAnalytics: true,
      canExportData: true,
      canManageAlerts: false,
    },
    brand_lead: {
      canViewVendorAnalytics: true,
      canViewBogoAnalytics: true,
      canViewStorefrontAnalytics: true,
      canViewCollectionsAnalytics: true,
      canViewReferralAnalytics: true,
      canViewCrossAnalytics: true,
      canExportData: true,
      canManageAlerts: false,
    },
    logistics_lead: {
      canViewVendorAnalytics: true,
      canViewBogoAnalytics: false,
      canViewStorefrontAnalytics: false,
      canViewCollectionsAnalytics: true,
      canViewReferralAnalytics: false,
      canViewCrossAnalytics: false,
      canExportData: false,
      canManageAlerts: false,
    },
  };

  /**
   * Check if user role has access to specific analytics section
   */
  hasAccessToSection(userRole: AtlasRole, section: 'vendor' | 'bogo' | 'storefront' | 'collections' | 'referral' | 'cross-analytics'): boolean {
    const permissions = this.rolePermissions[userRole];
    
    switch (section) {
      case 'vendor':
        return permissions.canViewVendorAnalytics;
      case 'bogo':
        return permissions.canViewBogoAnalytics;
      case 'storefront':
        return permissions.canViewStorefrontAnalytics;
      case 'collections':
        return permissions.canViewCollectionsAnalytics || true; // Allow all roles for now
      case 'referral':
        return permissions.canViewReferralAnalytics;
      case 'cross-analytics':
        return permissions.canViewCrossAnalytics;
      default:
        return false;
    }
  }

  /**
   * Filter analytics data based on user role permissions
   */
  filterAnalyticsData<T>(data: T, userRole: AtlasRole, dataType: string): T {
    const permissions = this.rolePermissions[userRole];
    
    // For now, return data as-is if user has access
    // In the future, this could implement more granular filtering
    // based on specific data sensitivity levels
    
    switch (dataType) {
      case 'vendor':
        if (!permissions.canViewVendorAnalytics) {
          throw new Error('Insufficient permissions to access vendor analytics data');
        }
        return this.filterVendorData(data, userRole);
        
      case 'bogo':
        if (!permissions.canViewBogoAnalytics) {
          throw new Error('Insufficient permissions to access BOGO analytics data');
        }
        return this.filterBogoData(data, userRole);
        
      case 'storefront':
        if (!permissions.canViewStorefrontAnalytics) {
          throw new Error('Insufficient permissions to access storefront analytics data');
        }
        return this.filterStorefrontData(data, userRole);
        
      case 'referral':
        if (!permissions.canViewReferralAnalytics) {
          throw new Error('Insufficient permissions to access referral analytics data');
        }
        return this.filterReferralData(data, userRole);
        
      case 'cross-analytics':
        if (!permissions.canViewCrossAnalytics) {
          throw new Error('Insufficient permissions to access cross-analytics data');
        }
        return this.filterCrossAnalyticsData(data, userRole);
        
      default:
        return data;
    }
  }

  /**
   * Get role permissions for analytics access
   */
  getRolePermissions(userRole: AtlasRole) {
    return { ...this.rolePermissions[userRole] };
  }

  /**
   * Filter vendor analytics data based on role
   */
  private filterVendorData<T>(data: T, userRole: AtlasRole): T {
    // For logistics_lead, they might have limited vendor data access
    if (userRole === 'logistics_lead') {
      // Could filter out sensitive revenue data, but for now return as-is
      return data;
    }
    
    return data;
  }

  /**
   * Filter BOGO analytics data based on role
   */
  private filterBogoData<T>(data: T, userRole: AtlasRole): T {
    // Sales leads don't have BOGO access, but this is already checked above
    return data;
  }

  /**
   * Filter storefront analytics data based on role
   */
  private filterStorefrontData<T>(data: T, userRole: AtlasRole): T {
    // Logistics leads don't have storefront access, but this is already checked above
    return data;
  }

  /**
   * Filter referral analytics data based on role
   */
  private filterReferralData<T>(data: T, userRole: AtlasRole): T {
    // For logistics_lead, they don't have referral access (already checked above)
    // For other roles, return data as-is for now
    return data;
  }

  /**
   * Filter cross-analytics data based on role
   */
  private filterCrossAnalyticsData<T>(data: T, userRole: AtlasRole): T {
    // Only roles with access to multiple analytics sections can see cross-analytics
    return data;
  }

  /**
   * Check if user can export specific data types
   */
  canExportDataType(userRole: AtlasRole, dataType: 'vendor' | 'bogo' | 'storefront' | 'referral' | 'cross-analytics'): boolean {
    const permissions = this.rolePermissions[userRole];
    
    // Must have both export permission and access to the data type
    return permissions.canExportData && this.hasAccessToSection(userRole, dataType);
  }

  /**
   * Check if user can manage alerts for specific data types
   */
  canManageAlertsForDataType(userRole: AtlasRole, dataType: 'vendor' | 'bogo' | 'storefront' | 'referral' | 'cross-analytics'): boolean {
    const permissions = this.rolePermissions[userRole];
    
    // Must have both alert management permission and access to the data type
    return permissions.canManageAlerts && this.hasAccessToSection(userRole, dataType);
  }

  /**
   * Get accessible analytics sections for a user role
   */
  getAccessibleSections(userRole: AtlasRole): ('vendor' | 'bogo' | 'storefront' | 'collections' | 'referral' | 'cross-analytics')[] {
    const sections: ('vendor' | 'bogo' | 'storefront' | 'collections' | 'referral' | 'cross-analytics')[] = [];
    
    if (this.hasAccessToSection(userRole, 'vendor')) {
      sections.push('vendor');
    }
    if (this.hasAccessToSection(userRole, 'bogo')) {
      sections.push('bogo');
    }
    if (this.hasAccessToSection(userRole, 'storefront')) {
      sections.push('storefront');
    }
    if (this.hasAccessToSection(userRole, 'collections')) {
      sections.push('collections');
    }
    if (this.hasAccessToSection(userRole, 'referral')) {
      sections.push('referral');
    }
    if (this.hasAccessToSection(userRole, 'cross-analytics')) {
      sections.push('cross-analytics');
    }
    
    return sections;
  }

  /**
   * Validate if user has minimum required permissions for unified analytics
   */
  hasMinimumAnalyticsAccess(userRole: AtlasRole): boolean {
    // User must have access to at least one analytics section
    return this.getAccessibleSections(userRole).length > 0;
  }
}