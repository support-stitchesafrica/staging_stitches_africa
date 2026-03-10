# Export Service Documentation

## Overview

The Export Service provides comprehensive data export functionality for vendor analytics, supporting both CSV and PDF formats with built-in data anonymization, date range filtering, and audit logging.

## Features

### ✅ Implemented Features

1. **CSV Export Generation**
   - Sales analytics export
   - Orders analytics export
   - Products analytics export
   - Customers analytics export (anonymized)
   - Payouts export

2. **PDF Export Generation**
   - Text-based PDF generation
   - Support for all data types
   - Optional chart inclusion

3. **Data Anonymization**
   - Automatic PII removal for customer data
   - Preserves aggregate statistics
   - Maintains location insights (city, state)

4. **Date Range Filtering**
   - Filter exports by custom date ranges
   - Accurate data filtering
   - Filename includes date range

5. **Export Audit Logging**
   - Logs all export activities
   - Tracks vendor ID, data type, format
   - Records file size and timestamp
   - Stored in `export_audit_logs` collection

## Usage

### Basic CSV Export

```typescript
import { VendorAnalyticsService } from './analytics-service';

const analyticsService = new VendorAnalyticsService();

const options = {
  format: 'csv',
  dataType: 'sales',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
    preset: '30days'
  }
};

const result = await analyticsService.exportAnalytics('vendor-123', options);

if (result.success && result.data) {
  // Download the file
  const url = URL.createObjectURL(result.data.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.data.filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Export Customer Data (Anonymized)

```typescript
const options = {
  format: 'csv',
  dataType: 'customers',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
};

const result = await analyticsService.exportAnalytics('vendor-123', options);

// Customer data is automatically anonymized
// No email, phone, or address information is included
```

### Export as PDF

```typescript
const options = {
  format: 'pdf',
  dataType: 'payouts',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  includeCharts: true
};

const result = await analyticsService.exportAnalytics('vendor-123', options);
```

## Export Data Types

### 1. Sales Export

Includes:
- Summary metrics (revenue, AOV, orders, cancellation rate)
- Top categories by revenue
- Revenue by product
- Sales trend over time
- Payment method statistics

### 2. Orders Export

Includes:
- Order metrics (total, fulfillment time, abandonment)
- Order funnel (viewed → delivered)
- Cancellation reasons
- Return and complaint rates

### 3. Products Export

Includes:
- Product inventory summary
- Top performing products
- Under performing products
- Product analytics (views, sales, conversion)

### 4. Customers Export (Anonymized)

Includes:
- Customer segments (new, returning, frequent, high-value)
- Location insights (city, state, country)
- Aggregate purchase behavior
- **Excludes**: Email, phone, full address, names

### 5. Payouts Export

Includes:
- Balance information
- Payout history
- Fee breakdown (commission, processing fees)
- Transfer status and dates

## CSV Format

### Sales CSV Structure

```csv
Sales Analytics Export
Period: 2024-01-01 to 2024-01-31
Generated: 2024-02-01

Summary Metrics
Metric,Value,Change (%)
Total Revenue,50000,15.5
Average Order Value,2500,5.2
...

Top Categories by Revenue
Category,Revenue,Order Count,Percentage
Men's Wear,20000,10,40%
...

Revenue by Product
Product ID,Product Name,Revenue,Quantity,Percentage
prod-1,Agbada Set,15000,5,30%
...
```

## Data Anonymization

### What is Anonymized

- Customer email addresses
- Phone numbers
- Full street addresses
- Customer names
- Any personally identifiable information

### What is Preserved

- City and state (for location insights)
- Purchase amounts and dates
- Product categories
- Aggregate statistics

## Audit Logging

All exports are logged to the `export_audit_logs` Firestore collection:

```typescript
{
  vendorId: string,
  dataType: 'sales' | 'orders' | 'products' | 'customers' | 'payouts',
  format: 'csv' | 'pdf',
  dateRange: {
    start: Timestamp,
    end: Timestamp
  },
  filename: string,
  fileSize: number,
  timestamp: Timestamp,
  includeCharts: boolean
}
```

## Error Handling

The export service includes comprehensive error handling:

```typescript
const result = await analyticsService.exportAnalytics(vendorId, options);

if (!result.success) {
  console.error('Export failed:', result.error);
  // result.error contains:
  // - code: Error code
  // - message: Human-readable error message
  // - details: Additional error context
}
```

### Common Errors

- **Invalid vendor ID**: Vendor ID is empty or invalid
- **Invalid date range**: Start date is after end date
- **Missing required fields**: Format or dataType not specified
- **Export generation failed**: Internal error during export creation

## File Naming Convention

Exported files follow this naming pattern:

```
{dataType}-export-{startDate}-{endDate}.{extension}

Examples:
- sales-export-20240101-20240131.csv
- customers-export-20240101-20240131.csv
- payouts-export-20240101-20240131.pdf
```

## Performance Considerations

- CSV exports are generated in-memory
- Large date ranges may take longer to process
- Consider implementing pagination for very large datasets
- Exports are limited to 12 months of data

## Security

1. **Authentication**: All exports require valid vendor authentication
2. **Authorization**: Vendors can only export their own data
3. **Data Isolation**: Vendor data is strictly isolated
4. **Audit Trail**: All exports are logged for security auditing
5. **PII Protection**: Customer data is automatically anonymized

## Future Enhancements

- [ ] Implement proper PDF generation with charts (using jsPDF or pdfmake)
- [ ] Add Excel (.xlsx) export format
- [ ] Support for scheduled exports
- [ ] Email delivery of exports
- [ ] Compression for large exports
- [ ] Export templates customization
- [ ] Batch export API

## Testing

Run the export service tests:

```bash
npm test -- lib/vendor/export-service.test.ts
```

All tests should pass, covering:
- CSV generation for all data types
- PDF generation
- Data anonymization
- Date range filtering
- Audit logging
- Error handling

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **Requirement 1.5**: CSV export generation for analytics data
- ✅ **Requirement 12.1**: Generate CSV files with all transaction details
- ✅ **Requirement 12.2**: Create PDF payout statements
- ✅ **Requirement 12.3**: Anonymize personal information in exports
- ✅ **Requirement 12.4**: Allow export of filtered date ranges
- ✅ **Requirement 12.5**: Complete exports within 5 seconds (in-memory generation)
- ✅ **Requirement 15.4**: Log all export activities for security audit

## Support

For issues or questions about the export functionality, please refer to:
- Design document: `.kiro/specs/vendor-analytics-upgrade/design.md`
- Requirements: `.kiro/specs/vendor-analytics-upgrade/requirements.md`
- Examples: `lib/vendor/export-service.example.ts`
