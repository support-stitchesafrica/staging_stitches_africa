/**
 * Export Service
 * Handles data export functionality for vendor analytics
 * All monetary values are exported in USD format
 * 
 * Validates: Requirements 23.5
 */

import { BaseVendorService } from './base-service';
import {
  VendorAnalytics,
  ExportOptions,
  ExportResult,
  ServiceResponse
} from '@/types/vendor-analytics';
import { db } from '@/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { formatUSD } from '@/lib/utils/currency';

export class ExportService extends BaseVendorService {
  constructor() {
    super('ExportService');
  }

  /**
   * Exports analytics data in specified format
   */
  async exportData(
    vendorId: string,
    data: VendorAnalytics,
    options: ExportOptions
  ): Promise<ServiceResponse<ExportResult>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);
      this.validateRequired({ format: options.format, dataType: options.dataType });

      // Filter data by date range
      const filteredData = this.filterByDateRange(data, options.dateRange);

      // Anonymize customer data if exporting customer data
      if (options.dataType === 'customers') {
        filteredData.customers = this.anonymizeCustomerData(filteredData.customers);
      }

      // Generate export based on format
      let result: ExportResult;
      if (options.format === 'csv') {
        result = this.generateCSV(filteredData, options.dataType);
      } else {
        result = this.generatePDF(filteredData, options.dataType, options.includeCharts);
      }

      // Log export for audit
      await this.logExport(vendorId, options, result);

      return result;
    }, 'exportData');
  }

  /**
   * Generates CSV export for specified data type
   */
  private generateCSV(data: VendorAnalytics, dataType: ExportOptions['dataType']): ExportResult {
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'sales':
        csvContent = this.generateSalesCSV(data);
        filename = `sales-export-${this.formatDateForFilename(data.period.start)}-${this.formatDateForFilename(data.period.end)}.csv`;
        break;
      case 'orders':
        csvContent = this.generateOrdersCSV(data);
        filename = `orders-export-${this.formatDateForFilename(data.period.start)}-${this.formatDateForFilename(data.period.end)}.csv`;
        break;
      case 'products':
        csvContent = this.generateProductsCSV(data);
        filename = `products-export-${this.formatDateForFilename(data.period.start)}-${this.formatDateForFilename(data.period.end)}.csv`;
        break;
      case 'customers':
        csvContent = this.generateCustomersCSV(data);
        filename = `customers-export-${this.formatDateForFilename(data.period.start)}-${this.formatDateForFilename(data.period.end)}.csv`;
        break;
      case 'payouts':
        csvContent = this.generatePayoutsCSV(data);
        filename = `payouts-export-${this.formatDateForFilename(data.period.start)}-${this.formatDateForFilename(data.period.end)}.csv`;
        break;
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    return {
      blob,
      filename,
      mimeType: 'text/csv',
      size: blob.size
    };
  }

  /**
   * Generates sales data CSV with USD formatting
   * Validates: Requirements 23.5
   */
  private generateSalesCSV(data: VendorAnalytics): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Sales Analytics Export');
    lines.push(`Period: ${this.formatDateForDisplay(data.period.start)} to ${this.formatDateForDisplay(data.period.end)}`);
    lines.push(`Generated: ${this.formatDateForDisplay(new Date())}`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value,Change (%)');
    lines.push(`Total Revenue,${formatUSD(data.sales.totalRevenue)},${data.sales.revenueChange}`);
    lines.push(`Average Order Value,${formatUSD(data.sales.averageOrderValue)},${data.sales.aovChange}`);
    lines.push(`Completed Orders,${data.sales.completedOrders},-`);
    lines.push(`Cancelled Orders,${data.sales.cancelledOrders},-`);
    lines.push(`Cancellation Rate,${data.sales.cancellationRate}%,-`);
    lines.push('');

    // Top categories
    lines.push('Top Categories by Revenue');
    lines.push('Category,Revenue,Order Count,Percentage');
    data.sales.topCategories.forEach(cat => {
      lines.push(`${this.escapeCSV(cat.category)},${formatUSD(cat.revenue)},${cat.orderCount},${cat.percentage}%`);
    });
    lines.push('');

    // Revenue by product
    lines.push('Revenue by Product');
    lines.push('Product ID,Product Name,Revenue,Quantity,Percentage');
    data.sales.revenueByProduct.forEach(prod => {
      lines.push(`${prod.productId},${this.escapeCSV(prod.productName)},${formatUSD(prod.revenue)},${prod.quantity},${prod.percentage}%`);
    });
    lines.push('');

    // Sales trend
    lines.push('Sales Trend');
    lines.push('Date,Revenue');
    data.sales.salesTrend.forEach(point => {
      lines.push(`${this.formatDateForDisplay(point.date)},${formatUSD(point.value)}`);
    });
    lines.push('');

    // Payment methods
    lines.push('Payment Methods');
    lines.push('Method,Count,Total Amount,Success Rate,Percentage');
    data.sales.paymentMethods.forEach(method => {
      lines.push(`${this.escapeCSV(method.method)},${method.count},${formatUSD(method.totalAmount)},${method.successRate}%,${method.percentage}%`);
    });

    return lines.join('\n');
  }

  /**
   * Generates orders data CSV
   */
  private generateOrdersCSV(data: VendorAnalytics): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Orders Analytics Export');
    lines.push(`Period: ${this.formatDateForDisplay(data.period.start)} to ${this.formatDateForDisplay(data.period.end)}`);
    lines.push(`Generated: ${this.formatDateForDisplay(new Date())}`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value,Change (%)');
    lines.push(`Total Orders,${data.orders.totalOrders},${data.orders.orderChange}`);
    lines.push(`Average Fulfillment Time (hours),${data.orders.averageFulfillmentTime},${data.orders.fulfillmentChange}`);
    lines.push(`Abandoned Checkouts,${data.orders.abandonedCheckouts},-`);
    lines.push(`Abandonment Rate,${data.orders.abandonmentRate}%,-`);
    lines.push(`Return Rate,${data.orders.returnRate}%,-`);
    lines.push(`Complaint Rate,${data.orders.complaintRate}%,-`);
    lines.push('');

    // Order funnel
    lines.push('Order Funnel');
    lines.push('Stage,Count');
    lines.push(`Viewed,${data.orders.funnel.viewed}`);
    lines.push(`Added to Cart,${data.orders.funnel.addedToCart}`);
    lines.push(`Ordered,${data.orders.funnel.ordered}`);
    lines.push(`Paid,${data.orders.funnel.paid}`);
    lines.push(`Delivered,${data.orders.funnel.delivered}`);
    lines.push('');

    // Cancellation reasons
    lines.push('Cancellation Reasons');
    lines.push('Reason,Count,Percentage');
    data.orders.cancellationReasons.forEach(reason => {
      lines.push(`${this.escapeCSV(reason.reason)},${reason.count},${reason.percentage}%`);
    });

    return lines.join('\n');
  }

  /**
   * Generates products data CSV with USD formatting
   * Validates: Requirements 23.5
   */
  private generateProductsCSV(data: VendorAnalytics): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Products Analytics Export');
    lines.push(`Period: ${this.formatDateForDisplay(data.period.start)} to ${this.formatDateForDisplay(data.period.end)}`);
    lines.push(`Generated: ${this.formatDateForDisplay(new Date())}`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Products,${data.products.totalProducts}`);
    lines.push(`Active Products,${data.products.activeProducts}`);
    lines.push(`Out of Stock,${data.products.outOfStock}`);
    lines.push(`Low Stock,${data.products.lowStock}`);
    lines.push('');

    // Top performers
    lines.push('Top Performing Products');
    lines.push('Product ID,Product Name,Views,Sales,Revenue,Conversion Rate,Rating');
    data.products.topPerformers.forEach(prod => {
      lines.push(`${prod.productId},${this.escapeCSV(prod.productName)},${prod.views},${prod.sales},${formatUSD(prod.revenue)},${prod.conversionRate}%,${prod.rating}`);
    });
    lines.push('');

    // Under performers
    lines.push('Under Performing Products');
    lines.push('Product ID,Product Name,Views,Sales,Revenue,Conversion Rate,Rating');
    data.products.underPerformers.forEach(prod => {
      lines.push(`${prod.productId},${this.escapeCSV(prod.productName)},${prod.views},${prod.sales},${formatUSD(prod.revenue)},${prod.conversionRate}%,${prod.rating}`);
    });

    return lines.join('\n');
  }

  /**
   * Generates customers data CSV (anonymized) with USD formatting
   * Validates: Requirements 23.5
   */
  private generateCustomersCSV(data: VendorAnalytics): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Customer Analytics Export (Anonymized)');
    lines.push(`Period: ${this.formatDateForDisplay(data.period.start)} to ${this.formatDateForDisplay(data.period.end)}`);
    lines.push(`Generated: ${this.formatDateForDisplay(new Date())}`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Customers,${data.customers.totalCustomers}`);
    lines.push(`New Customers,${data.customers.newCustomers}`);
    lines.push(`Returning Customers,${data.customers.returningCustomers}`);
    lines.push(`Frequent Buyers,${data.customers.frequentBuyers}`);
    lines.push(`High Value Customers,${data.customers.highValueCustomers}`);
    lines.push(`Average Lifetime Value,${formatUSD(data.customers.averageLifetimeValue)}`);
    lines.push('');

    // Customer segments
    lines.push('Customer Segments');
    lines.push('Segment,Count,Percentage,Avg Order Value,Total Revenue,Avg Purchase Frequency');
    data.customers.segments.forEach(segment => {
      lines.push(`${segment.type},${segment.count},${segment.percentage}%,${formatUSD(segment.averageOrderValue)},${formatUSD(segment.totalRevenue)},${segment.averagePurchaseFrequency}`);
    });
    lines.push('');

    // Location insights
    lines.push('Location Insights');
    lines.push('City,State,Country,Customer Count,Revenue,Percentage');
    data.customers.locationInsights.forEach(location => {
      lines.push(`${this.escapeCSV(location.city)},${this.escapeCSV(location.state)},${this.escapeCSV(location.country)},${location.customerCount},${formatUSD(location.revenue)},${location.percentage}%`);
    });

    return lines.join('\n');
  }

  /**
   * Generates payouts data CSV with USD formatting
   * Validates: Requirements 23.5
   */
  private generatePayoutsCSV(data: VendorAnalytics): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Payouts Export');
    lines.push(`Period: ${this.formatDateForDisplay(data.period.start)} to ${this.formatDateForDisplay(data.period.end)}`);
    lines.push(`Generated: ${this.formatDateForDisplay(new Date())}`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value');
    lines.push(`Pending Balance,${formatUSD(data.payouts.pendingBalance)}`);
    lines.push(`Available Balance,${formatUSD(data.payouts.availableBalance)}`);
    lines.push(`Next Payout Date,${this.formatDateForDisplay(data.payouts.nextPayoutDate)}`);
    lines.push(`Next Payout Amount,${formatUSD(data.payouts.nextPayoutAmount)}`);
    lines.push(`Total Earnings,${formatUSD(data.payouts.totalEarnings)}`);
    lines.push(`Total Fees,${formatUSD(data.payouts.totalFees)}`);
    lines.push('');

    // Payout history
    lines.push('Payout History');
    lines.push('Payout ID,Amount,Platform Commission,Payment Processing Fee,Total Fees,Net Amount,Status,Transfer Date,Paystack Reference');
    data.payouts.payoutHistory.forEach(payout => {
      lines.push(`${payout.id},${formatUSD(payout.amount)},${formatUSD(payout.fees.platformCommission)},${formatUSD(payout.fees.paymentProcessingFee)},${formatUSD(payout.fees.totalFees)},${formatUSD(payout.netAmount)},${payout.status},${this.formatDateForDisplay(payout.transferDate)},${payout.paystackReference}`);
    });

    return lines.join('\n');
  }

  /**
   * Generates PDF export (simplified version - returns text-based PDF)
   */
  private generatePDF(
    data: VendorAnalytics,
    dataType: ExportOptions['dataType'],
    includeCharts?: boolean
  ): ExportResult {
    // For now, generate a simple text-based PDF
    // In production, you would use a library like jsPDF or pdfmake
    const csvResult = this.generateCSV(data, dataType);
    
    // Extract CSV content from blob
    let csvContent = '';
    if (csvResult.blob instanceof Blob) {
      // In browser environment, we'd use blob.text()
      // For now, regenerate the CSV content directly
      csvContent = this.generateCSVContent(data, dataType);
    }
    
    const pdfContent = this.convertCSVToPDFText(csvContent, dataType);
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const filename = `${dataType}-export-${this.formatDateForFilename(data.period.start)}-${this.formatDateForFilename(data.period.end)}.pdf`;

    return {
      blob,
      filename,
      mimeType: 'application/pdf',
      size: blob.size
    };
  }

  /**
   * Generates CSV content as string (helper for PDF generation)
   */
  private generateCSVContent(data: VendorAnalytics, dataType: ExportOptions['dataType']): string {
    switch (dataType) {
      case 'sales':
        return this.generateSalesCSV(data);
      case 'orders':
        return this.generateOrdersCSV(data);
      case 'products':
        return this.generateProductsCSV(data);
      case 'customers':
        return this.generateCustomersCSV(data);
      case 'payouts':
        return this.generatePayoutsCSV(data);
      default:
        return '';
    }
  }

  /**
   * Converts CSV content to PDF-like text format
   * Note: In production, use a proper PDF library
   */
  private convertCSVToPDFText(csvContent: string, dataType: string): string {
    const lines = csvContent.split('\n');
    const pdfLines: string[] = [];

    pdfLines.push('='.repeat(80));
    pdfLines.push(`${dataType.toUpperCase()} ANALYTICS REPORT`);
    pdfLines.push('='.repeat(80));
    pdfLines.push('');

    lines.forEach(line => {
      pdfLines.push(line);
    });

    pdfLines.push('');
    pdfLines.push('='.repeat(80));
    pdfLines.push('End of Report');
    pdfLines.push('='.repeat(80));

    return pdfLines.join('\n');
  }

  /**
   * Filters data by date range
   */
  private filterByDateRange(data: VendorAnalytics, dateRange: { start: Date; end: Date }): VendorAnalytics {
    // Filter sales trend
    const filteredSalesTrend = data.sales.salesTrend.filter(point => {
      const pointDate = point.date;
      return pointDate >= dateRange.start && pointDate <= dateRange.end;
    });

    // Return filtered data
    return {
      ...data,
      period: dateRange,
      sales: {
        ...data.sales,
        salesTrend: filteredSalesTrend
      }
    };
  }

  /**
   * Anonymizes customer data for export
   */
  private anonymizeCustomerData(customers: any): any {
    // Customer data is already anonymized in the analytics service
    // This is an additional layer to ensure no PII is exported
    return {
      ...customers,
      // Remove any potentially identifying information
      segments: customers.segments.map((segment: any) => ({
        ...segment,
        // Keep only aggregate data
      })),
      locationInsights: customers.locationInsights.map((location: any) => ({
        city: location.city,
        state: location.state,
        country: location.country,
        customerCount: location.customerCount,
        revenue: location.revenue,
        percentage: location.percentage
        // No individual customer identifiers
      }))
    };
  }

  /**
   * Logs export activity for audit purposes
   */
  private async logExport(
    vendorId: string,
    options: ExportOptions,
    result: ExportResult
  ): Promise<void> {
    try {
      const exportLog = {
        vendorId,
        dataType: options.dataType,
        format: options.format,
        dateRange: {
          start: Timestamp.fromDate(options.dateRange.start),
          end: Timestamp.fromDate(options.dateRange.end)
        },
        filename: result.filename,
        fileSize: result.size,
        timestamp: Timestamp.now(),
        includeCharts: options.includeCharts || false
      };

      await addDoc(collection(db, 'export_audit_logs'), exportLog);
      this.log('info', 'Export logged successfully', { vendorId, dataType: options.dataType });
    } catch (error) {
      // Log error but don't fail the export
      this.log('error', 'Failed to log export', { vendorId, error });
    }
  }

  /**
   * Escapes CSV values to handle commas, quotes, and newlines
   */
  private escapeCSV(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Formats date for display (YYYY-MM-DD format)
   */
  private formatDateForDisplay(date: Date): string {
    return this.formatDate(date).split('T')[0];
  }

  /**
   * Formats date for filename (YYYYMMDD format)
   */
  private formatDateForFilename(date: Date): string {
    return this.formatDate(date).split('T')[0].replace(/-/g, '');
  }
}
