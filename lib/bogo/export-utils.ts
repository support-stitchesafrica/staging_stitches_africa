/**
 * BOGO Analytics Export Utilities
 * 
 * Utility functions for exporting BOGO analytics data in various formats
 */

import type { BogoAnalyticsReport } from './analytics-service';

/**
 * Export analytics data as CSV
 */
export function exportAsCSV(reports: BogoAnalyticsReport[], filename?: string): void {
  const headers = [
    'Mapping ID',
    'Period Start',
    'Period End',
    'Total Views',
    'Total Redemptions',
    'Total Revenue',
    'Unique Customers',
    'View to Cart Rate (%)',
    'Cart to Checkout Rate (%)',
    'Overall Conversion Rate (%)',
    'Average Order Value',
    'Total Savings Provided',
    'Revenue Per View'
  ];
  
  const rows = reports.map(report => [
    report.mappingId,
    report.periodStart.toISOString(),
    report.periodEnd.toISOString(),
    report.totalViews.toString(),
    report.totalRedemptions.toString(),
    report.totalRevenue.toFixed(2),
    report.uniqueCustomers.toString(),
    report.viewToCartRate.toFixed(2),
    report.cartToCheckoutRate.toFixed(2),
    report.overallConversionRate.toFixed(2),
    report.averageOrderValue.toFixed(2),
    report.totalSavingsProvided.toFixed(2),
    report.revenuePerView.toFixed(2)
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csvContent, filename || `bogo-analytics-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

/**
 * Export analytics data as JSON
 */
export function exportAsJSON(reports: BogoAnalyticsReport[], filename?: string): void {
  const jsonData = {
    exportedAt: new Date().toISOString(),
    totalReports: reports.length,
    reports
  };
  
  const jsonContent = JSON.stringify(jsonData, null, 2);
  downloadFile(jsonContent, filename || `bogo-analytics-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

/**
 * Export popular combinations as CSV
 */
export function exportCombinationsAsCSV(combinations: any[], filename?: string): void {
  const headers = [
    'Main Product ID',
    'Main Product Name',
    'Free Product ID',
    'Free Product Name',
    'Redemption Count',
    'Total Revenue'
  ];
  
  const rows = combinations.map(combo => [
    combo.mainProductId,
    combo.mainProductName,
    combo.freeProductId,
    combo.freeProductName,
    combo.redemptionCount.toString(),
    combo.totalRevenue.toFixed(2)
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csvContent, filename || `bogo-combinations-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Calculate conversion rate between two metrics
 */
export function calculateConversionRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

/**
 * Generate date range options for analytics
 */
export function getDateRangeOptions(): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      label: 'Last 7 days',
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: now
    },
    {
      label: 'Last 30 days',
      start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
      end: now
    },
    {
      label: 'Last 90 days',
      start: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000),
      end: now
    },
    {
      label: 'This month',
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now
    },
    {
      label: 'Last month',
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0)
    },
    {
      label: 'This year',
      start: new Date(now.getFullYear(), 0, 1),
      end: now
    }
  ];
}