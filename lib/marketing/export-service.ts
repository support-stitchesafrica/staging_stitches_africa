/**
 * Marketing Data Export Service
 * Handles CSV/Excel export for vendor data, analytics reports, and user data
 */

import { 
  VendorPerformanceMetrics, 
  TeamPerformanceMetrics, 
  OrganizationAnalytics,
  VendorInsights,
  AnalyticsService 
} from './analytics-service';
import { User } from './user-service';
import { VendorAssignment } from './team-assignment-service';
import { ActivityLog } from './activity-log-service';

// Export Types
export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
}

// CSV Export Utilities
export class ExportService {
  
  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any[], headers: string[]): string {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }
        
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      });
      
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Download data as file
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export vendor performance data
   */
  static async exportVendorPerformance(
    vendors: VendorPerformanceMetrics[],
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `vendor-performance-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      const headers = [
        'vendorId',
        'vendorName',
        'assignedToUserName',
        'teamId',
        'totalProducts',
        'activeProducts',
        'averageProductPrice',
        'totalOrders',
        'completedOrders',
        'pendingOrders',
        'cancelledOrders',
        'totalRevenue',
        'averageOrderValue',
        'monthlyRevenue',
        'totalCustomers',
        'repeatCustomers',
        'customerRetentionRate',
        'lastActivityDate',
        'totalActivities',
        'engagementScore',
        'monthlyGrowthRate',
        'orderGrowthRate',
        'revenueGrowthRate',
        'performanceScore',
        'status',
        'assignmentDate',
        'daysSinceAssignment'
      ];
      
      const data = vendors.map(vendor => ({
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        assignedToUserName: vendor.assignedToUserName || 'Unassigned',
        teamId: vendor.teamId || 'N/A',
        totalProducts: vendor.totalProducts,
        activeProducts: vendor.activeProducts,
        averageProductPrice: vendor.averageProductPrice.toFixed(2),
        totalOrders: vendor.totalOrders,
        completedOrders: vendor.completedOrders,
        pendingOrders: vendor.pendingOrders,
        cancelledOrders: vendor.cancelledOrders,
        totalRevenue: vendor.totalRevenue.toFixed(2),
        averageOrderValue: vendor.averageOrderValue.toFixed(2),
        monthlyRevenue: vendor.monthlyRevenue.toFixed(2),
        totalCustomers: vendor.totalCustomers,
        repeatCustomers: vendor.repeatCustomers,
        customerRetentionRate: vendor.customerRetentionRate.toFixed(2),
        lastActivityDate: vendor.lastActivityDate?.toISOString() || 'N/A',
        totalActivities: vendor.totalActivities,
        engagementScore: vendor.engagementScore,
        monthlyGrowthRate: vendor.monthlyGrowthRate.toFixed(2),
        orderGrowthRate: vendor.orderGrowthRate.toFixed(2),
        revenueGrowthRate: vendor.revenueGrowthRate.toFixed(2),
        performanceScore: vendor.performanceScore,
        status: vendor.status,
        assignmentDate: vendor.assignmentDate?.toISOString() || 'N/A',
        daysSinceAssignment: vendor.daysSinceAssignment || 'N/A'
      }));
      
      const csv = this.convertToCSV(data, headers);
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    } else {
      // JSON export
      const json = JSON.stringify(vendors, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export team performance data
   */
  static async exportTeamPerformance(
    teams: TeamPerformanceMetrics[],
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `team-performance-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      const headers = [
        'teamId',
        'teamName',
        'teamLeadName',
        'totalMembers',
        'activeMembers',
        'totalVendors',
        'activeVendors',
        'averageVendorsPerMember',
        'totalRevenue',
        'averageRevenuePerVendor',
        'averageRevenuePerMember',
        'totalOrders',
        'completedOrders',
        'averageOrdersPerVendor',
        'monthlyGrowthRate',
        'teamPerformanceScore'
      ];
      
      const data = teams.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        teamLeadName: team.teamLeadName,
        totalMembers: team.totalMembers,
        activeMembers: team.activeMembers,
        totalVendors: team.totalVendors,
        activeVendors: team.activeVendors,
        averageVendorsPerMember: team.averageVendorsPerMember.toFixed(2),
        totalRevenue: team.totalRevenue.toFixed(2),
        averageRevenuePerVendor: team.averageRevenuePerVendor.toFixed(2),
        averageRevenuePerMember: team.averageRevenuePerMember.toFixed(2),
        totalOrders: team.totalOrders,
        completedOrders: team.completedOrders,
        averageOrdersPerVendor: team.averageOrdersPerVendor.toFixed(2),
        monthlyGrowthRate: team.monthlyGrowthRate.toFixed(2),
        teamPerformanceScore: team.teamPerformanceScore.toFixed(2)
      }));
      
      const csv = this.convertToCSV(data, headers);
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    } else {
      const json = JSON.stringify(teams, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export organization analytics
   */
  static async exportOrganizationAnalytics(
    analytics: OrganizationAnalytics,
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `organization-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      // Export summary metrics
      const summaryHeaders = ['metric', 'value'];
      const summaryData = [
        { metric: 'Total Vendors', value: analytics.totalVendors },
        { metric: 'Active Vendors', value: analytics.activeVendors },
        { metric: 'Total Teams', value: analytics.totalTeams },
        { metric: 'Total Users', value: analytics.totalUsers },
        { metric: 'Total Revenue', value: analytics.totalRevenue.toFixed(2) },
        { metric: 'Monthly Revenue', value: analytics.monthlyRevenue.toFixed(2) },
        { metric: 'Average Revenue Per Vendor', value: analytics.averageRevenuePerVendor.toFixed(2) },
        { metric: 'Total Orders', value: analytics.totalOrders },
        { metric: 'Completed Orders', value: analytics.completedOrders },
        { metric: 'Average Order Value', value: analytics.averageOrderValue.toFixed(2) },
        { metric: 'Monthly Growth Rate', value: `${analytics.monthlyGrowthRate.toFixed(2)}%` },
        { metric: 'Vendor Growth Rate', value: `${analytics.vendorGrowthRate.toFixed(2)}%` },
        { metric: 'Revenue Growth Rate', value: `${analytics.revenueGrowthRate.toFixed(2)}%` },
        { metric: 'BDM Conversion Rate', value: analytics.bdmConversionRate.toFixed(2) },
        { metric: 'Average Vendor Onboarding Time (days)', value: analytics.averageVendorOnboardingTime.toFixed(0) }
      ];
      
      const summaryCsv = this.convertToCSV(summaryData, summaryHeaders);
      this.downloadFile(summaryCsv, filename, 'text/csv;charset=utf-8;');
      
      // Also export monthly trends
      const trendsFilename = filename.replace('.csv', '-trends.csv');
      const trendsHeaders = ['month', 'revenue', 'orders', 'newVendors', 'activeVendors'];
      const trendsCsv = this.convertToCSV(analytics.monthlyTrends, trendsHeaders);
      this.downloadFile(trendsCsv, trendsFilename, 'text/csv;charset=utf-8;');
      
    } else {
      const json = JSON.stringify(analytics, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export user data (for compliance)
   */
  static async exportUserData(
    users: User[],
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `user-data-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      const headers = [
        'id',
        'email',
        'name',
        'phoneNumber',
        'role',
        'teamId',
        'isActive',
        'createdAt',
        'lastLoginAt'
      ];
      
      const data = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber || 'N/A',
        role: user.role,
        teamId: user.teamId || 'N/A',
        isActive: user.isActive ? 'Yes' : 'No',
        createdAt: user.createdAt.toDate().toISOString(),
        lastLoginAt: user.lastLoginAt?.toDate().toISOString() || 'Never'
      }));
      
      const csv = this.convertToCSV(data, headers);
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    } else {
      const json = JSON.stringify(users, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export vendor assignments
   */
  static async exportVendorAssignments(
    assignments: VendorAssignment[],
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `vendor-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      const headers = [
        'vendorId',
        'assignedToUserId',
        'assignedByUserId',
        'teamId',
        'assignmentDate',
        'status',
        'notes'
      ];
      
      const data = assignments.map(assignment => ({
        vendorId: assignment.vendorId,
        assignedToUserId: assignment.assignedToUserId,
        assignedByUserId: assignment.assignedByUserId,
        teamId: assignment.teamId || 'N/A',
        assignmentDate: assignment.assignmentDate.toDate().toISOString(),
        status: assignment.status,
        notes: assignment.notes || 'N/A'
      }));
      
      const csv = this.convertToCSV(data, headers);
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    } else {
      const json = JSON.stringify(assignments, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export activity logs
   */
  static async exportActivityLogs(
    logs: ActivityLog[],
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      const headers = [
        'id',
        'userId',
        'userName',
        'action',
        'entityType',
        'entityId',
        'timestamp',
        'details'
      ];
      
      const data = logs.map(log => ({
        id: log.id,
        userId: log.userId,
        userName: log.userName || 'N/A',
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId || 'N/A',
        timestamp: log.timestamp.toDate().toISOString(),
        details: JSON.stringify(log.details || {})
      }));
      
      const csv = this.convertToCSV(data, headers);
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    } else {
      const json = JSON.stringify(logs, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export vendor insights report
   */
  static async exportVendorInsights(
    insights: VendorInsights,
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    const filename = options.filename || `vendor-insights-${insights.vendorId}-${new Date().toISOString().split('T')[0]}.csv`;
    
    if (options.format === 'csv') {
      // Export multiple sheets as separate files
      
      // 1. Performance Summary
      const summaryHeaders = ['metric', 'value'];
      const summaryData = [
        { metric: 'Vendor ID', value: insights.vendorId },
        { metric: 'Vendor Name', value: insights.vendorName },
        { metric: 'Business Type', value: insights.businessType },
        { metric: 'Registration Date', value: insights.registrationDate.toISOString() },
        { metric: 'Total Products', value: insights.productAnalysis.totalProducts },
        { metric: 'Total Revenue', value: insights.revenueAnalysis.totalRevenue.toFixed(2) },
        { metric: 'Total Customers', value: insights.customerAnalysis.totalCustomers },
        { metric: 'Repeat Customers', value: insights.customerAnalysis.repeatCustomers },
        { metric: 'Performance Score', value: insights.performanceMetrics.performanceScore },
        { metric: 'Status', value: insights.performanceMetrics.status }
      ];
      
      const summaryCsv = this.convertToCSV(summaryData, summaryHeaders);
      this.downloadFile(summaryCsv, filename, 'text/csv;charset=utf-8;');
      
      // 2. Product Analysis
      if (insights.productAnalysis.categories.length > 0) {
        const productFilename = filename.replace('.csv', '-products.csv');
        const productHeaders = ['category', 'count', 'averagePrice', 'totalRevenue'];
        const productCsv = this.convertToCSV(insights.productAnalysis.categories, productHeaders);
        this.downloadFile(productCsv, productFilename, 'text/csv;charset=utf-8;');
      }
      
      // 3. Monthly Revenue
      if (insights.revenueAnalysis.monthlyRevenue.length > 0) {
        const revenueFilename = filename.replace('.csv', '-monthly-revenue.csv');
        const revenueHeaders = ['month', 'revenue', 'orderCount'];
        const revenueCsv = this.convertToCSV(insights.revenueAnalysis.monthlyRevenue, revenueHeaders);
        this.downloadFile(revenueCsv, revenueFilename, 'text/csv;charset=utf-8;');
      }
      
    } else {
      const json = JSON.stringify(insights, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }

  /**
   * Export custom analytics report
   */
  static async exportCustomReport(
    data: any[],
    headers: string[],
    filename: string,
    options: ExportOptions = { format: 'csv', includeHeaders: true }
  ): Promise<void> {
    if (options.format === 'csv') {
      const csv = this.convertToCSV(data, headers);
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    } else {
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(json, filename.replace('.csv', '.json'), 'application/json');
    }
  }
}
