# Historical Data Access Guide

## Overview

The Historical Data Access feature provides vendors with comprehensive access to 12 months of historical analytics data, including seasonal patterns, year-over-year comparisons, cumulative metrics, and custom date range comparisons.

## Features

### 1. 12-Month Historical Data Access (Requirement 16.1)

Vendors can access data from the past 12 months for any metric:
- Revenue
- Orders
- Customers
- Products

**Usage:**
```typescript
import { useHistoricalData } from '@/lib/vendor/useHistoricalData';

const { data, loading, error } = useHistoricalData(vendorId, 'revenue');
```

**Data Structure:**
```typescript
{
  vendorId: string;
  metric: string;
  dataPoints: TrendDataPoint[];
  seasonalPatterns: SeasonalPattern[];
  yearOverYearComparison: YearOverYearComparison[];
}
```

### 2. Seasonal Pattern Detection (Requirement 16.2)

Automatically detects high, medium, and low seasons based on quarterly and monthly trends.

**Pattern Detection Logic:**
- **High Season**: Average value is 20% or more above overall average
- **Medium Season**: Average value is within ±20% of overall average
- **Low Season**: Average value is 20% or more below overall average

**Usage:**
```typescript
import { useSeasonalPatterns } from '@/lib/vendor/useHistoricalData';

const { patterns, loading, error } = useSeasonalPatterns(vendorId, 'revenue');
```

**Example Output:**
```typescript
[
  { period: 'Q1', averageValue: 45000, trend: 'low' },
  { period: 'Q2', averageValue: 65000, trend: 'high' },
  { period: 'December', averageValue: 80000, trend: 'high' }
]
```

### 3. Cumulative Metrics (Requirement 16.3)

Shows running totals over time to understand overall growth trajectory.

**Usage:**
```typescript
import { useCumulativeMetrics } from '@/lib/vendor/useHistoricalData';

const dateRange = {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31')
};

const { data, loading, error } = useCumulativeMetrics(vendorId, dateRange, 'revenue');
```

**Property Validation:**
For any time series data, cumulative values at each point equal the sum of all values up to that point.

### 4. Custom Date Range Comparison (Requirement 16.4)

Compare any two custom date ranges within the 12-month window.

**Usage:**
```typescript
import { useDateRangeComparison } from '@/lib/vendor/useHistoricalData';

const range1 = {
  start: new Date('2024-01-01'),
  end: new Date('2024-03-31')
};

const range2 = {
  start: new Date('2023-01-01'),
  end: new Date('2023-03-31')
};

const { data, loading, error } = useDateRangeComparison(vendorId, range1, range2);
```

**Comparison Output:**
```typescript
{
  range1: {
    period: DateRange,
    revenue: number,
    orders: number,
    customers: number,
    averageOrderValue: number
  },
  range2: { /* same structure */ },
  changes: {
    revenue: number,      // percentage change
    orders: number,
    customers: number,
    averageOrderValue: number
  }
}
```

### 5. Data Archival and Retention (Requirement 16.5)

Historical data is maintained for 12 months for compliance and analysis purposes.

**Usage:**
```typescript
import { useArchivedData } from '@/lib/vendor/useHistoricalData';

const { data, loading, error } = useArchivedData(
  vendorId,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

## Date Range Presets

Convenient preset date ranges are available:

```typescript
import { getDateRangePresets } from '@/lib/vendor/useHistoricalData';

const presets = getDateRangePresets();
// Returns:
// {
//   'Last 7 Days': DateRange,
//   'Last 30 Days': DateRange,
//   'Last 3 Months': DateRange,
//   'Last 6 Months': DateRange,
//   'Last 12 Months': DateRange,
//   'This Year': DateRange,
//   'Last Year': DateRange
// }
```

## Validation

### Date Range Validation

All date ranges are validated to ensure they:
1. Do not exceed 12 months
2. Have start date before end date

```typescript
import { isDateRangeValid } from '@/lib/vendor/useHistoricalData';

const isValid = isDateRangeValid(startDate, endDate);
```

## UI Components

### HistoricalDataView Component

A comprehensive component that displays all historical data features:

```typescript
import { HistoricalDataView } from '@/components/vendor/analytics/HistoricalDataView';

<HistoricalDataView vendorId={vendorId} />
```

**Features:**
- Metric selector (Revenue, Orders, Customers, Products)
- View mode switcher (Historical, Cumulative, Comparison)
- Interactive charts using Recharts
- Seasonal pattern cards
- Year-over-year comparison
- Custom date range comparison

### Historical Analytics Page

Full-page view at `/vendor/analytics/historical`:

```typescript
// app/vendor/analytics/historical/page.tsx
import HistoricalAnalyticsPage from '@/app/vendor/analytics/historical/page';
```

## API Methods

### VendorAnalyticsService

```typescript
// Get historical data
const result = await service.getHistoricalData(vendorId, 'revenue');

// Get cumulative metrics
const cumulative = await service.getCumulativeMetrics(vendorId, dateRange, 'orders');

// Compare date ranges
const comparison = await service.compareCustomDateRanges(vendorId, range1, range2);

// Get archived data
const archived = await service.getArchivedData(vendorId, startDate, endDate);
```

## Performance Considerations

1. **Caching**: Historical data is cached to minimize database queries
2. **Batch Fetching**: Multiple metrics are fetched in parallel using Promise.all()
3. **Lazy Loading**: Charts and data are loaded on-demand
4. **Pagination**: Large datasets are paginated for better performance

## Error Handling

All methods return a `ServiceResponse` with error handling:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}
```

Common errors:
- `INVALID_DATE_RANGE`: Date range exceeds 12 months or is invalid
- `VENDOR_NOT_FOUND`: Vendor ID does not exist
- `DATA_NOT_AVAILABLE`: Historical data not available for the specified period

## Testing

Comprehensive tests are available in `lib/vendor/historical-data.test.ts`:

```bash
npx vitest run lib/vendor/historical-data.test.ts
```

Tests cover:
- Date range validation
- Seasonal pattern detection
- Cumulative metrics calculation
- Year-over-year comparison
- Date range comparison
- Historical data point generation

## Best Practices

1. **Always validate date ranges** before making API calls
2. **Use preset date ranges** when possible for consistency
3. **Handle loading and error states** in UI components
4. **Cache results** when displaying the same data multiple times
5. **Show skeleton loaders** while data is loading
6. **Provide clear error messages** to users

## Examples

### Example 1: Display Revenue Trend

```typescript
function RevenueTrend({ vendorId }: { vendorId: string }) {
  const { data, loading, error } = useHistoricalData(vendorId, 'revenue');

  if (loading) return <Skeleton />;
  if (error) return <Error message={error} />;

  return (
    <LineChart data={data.dataPoints}>
      <Line dataKey="value" stroke="#8884d8" />
    </LineChart>
  );
}
```

### Example 2: Show Seasonal Insights

```typescript
function SeasonalInsights({ vendorId }: { vendorId: string }) {
  const { patterns, loading } = useSeasonalPatterns(vendorId, 'orders');

  return (
    <div>
      {patterns.map(pattern => (
        <Card key={pattern.period}>
          <h3>{pattern.period}</h3>
          <p>{pattern.averageValue} orders</p>
          <Badge>{pattern.trend} season</Badge>
        </Card>
      ))}
    </div>
  );
}
```

### Example 3: Compare Two Quarters

```typescript
function QuarterComparison({ vendorId }: { vendorId: string }) {
  const q1 = {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31')
  };
  
  const q2 = {
    start: new Date('2024-04-01'),
    end: new Date('2024-06-30')
  };

  const { data, loading } = useDateRangeComparison(vendorId, q1, q2);

  if (!data) return null;

  return (
    <div>
      <h3>Q1 vs Q2</h3>
      <p>Revenue Change: {data.changes.revenue}%</p>
      <p>Orders Change: {data.changes.orders}%</p>
    </div>
  );
}
```

## Troubleshooting

### Issue: "Date range cannot exceed 12 months"
**Solution**: Ensure your date range is within 12 months. Use `isDateRangeValid()` to check.

### Issue: No data returned
**Solution**: Check if the vendor has any orders in the specified date range. Historical data is based on actual orders.

### Issue: Seasonal patterns not showing
**Solution**: Seasonal patterns require at least 3 months of data. Ensure the vendor has sufficient historical data.

### Issue: Year-over-year comparison shows 0%
**Solution**: This occurs when there's no data for the previous year. This is expected for new vendors.

## Future Enhancements

Potential improvements for future versions:
1. Export historical data to CSV/PDF
2. Custom seasonal period definitions
3. Predictive analytics based on historical trends
4. Automated insights and recommendations
5. Multi-year comparisons (beyond 2 years)
6. Industry benchmarking
