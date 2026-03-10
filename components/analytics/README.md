# Analytics Components - Loading States and Error Handling

This directory contains skeleton loaders and error boundaries for the Google Analytics-style dashboard components.

## Skeleton Loaders

Skeleton loaders provide visual feedback while data is being fetched, improving perceived performance.

### MetricCardGASkeleton

Use this skeleton when loading metric cards.

```tsx
import { MetricCardGASkeleton } from '@/components/analytics/skeletons';

// Basic usage
<MetricCardGASkeleton />

// Without sparkline
<MetricCardGASkeleton showSparkline={false} />

// Without trend indicator
<MetricCardGASkeleton showTrend={false} />
```

### ChartCardSkeleton

Use this skeleton when loading chart components.

```tsx
import { ChartCardSkeleton } from '@/components/analytics/skeletons';

// Basic usage
<ChartCardSkeleton />

// Custom height
<ChartCardSkeleton height={400} />

// With subtitle and actions
<ChartCardSkeleton showSubtitle={true} showActions={true} />
```

### DataTableGASkeleton

Use this skeleton when loading data tables.

```tsx
import { DataTableGASkeleton } from '@/components/analytics/skeletons';

// Basic usage
<DataTableGASkeleton />

// Custom columns and rows
<DataTableGASkeleton columns={5} rows={10} />

// Without pagination
<DataTableGASkeleton showPagination={false} />
```

## Error Boundaries

Error boundaries catch JavaScript errors in child components and display fallback UI.

### ChartErrorBoundary

Use this for individual chart components. Provides a compact error UI suitable for card-sized components.

```tsx
import { ChartErrorBoundary } from '@/components/analytics/error-handling';

<ChartErrorBoundary>
  <MyChartComponent />
</ChartErrorBoundary>

// With custom error handler
<ChartErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    console.error('Chart error:', error);
  }}
>
  <MyChartComponent />
</ChartErrorBoundary>

// With custom fallback
<ChartErrorBoundary
  fallback={<div>Custom error message</div>}
>
  <MyChartComponent />
</ChartErrorBoundary>
```

### AnalyticsErrorBoundary

Use this for entire dashboard pages. Provides a full-page error UI with navigation options.

```tsx
import { AnalyticsErrorBoundary } from '@/components/analytics/error-handling';

<AnalyticsErrorBoundary>
  <DashboardPage />
</AnalyticsErrorBoundary>

// Without home button
<AnalyticsErrorBoundary showHomeButton={false}>
  <DashboardPage />
</AnalyticsErrorBoundary>

// With custom error handler
<AnalyticsErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    logErrorToService(error, errorInfo);
  }}
>
  <DashboardPage />
</AnalyticsErrorBoundary>
```

### ErrorFallback

Use this component for inline error states (not as an error boundary).

```tsx
import { ErrorFallback } from '@/components/analytics/error-handling';

// Basic usage
<ErrorFallback error="Failed to load data" />

// With retry handler
<ErrorFallback
  error={error}
  onRetry={() => refetch()}
/>

// Compact mode (for smaller spaces)
<ErrorFallback
  error="Connection failed"
  onRetry={handleRetry}
  compact={true}
/>

// Custom title and message
<ErrorFallback
  title="Data Unavailable"
  message="The requested data could not be loaded at this time."
  onRetry={handleRetry}
/>
```

## Complete Example

Here's a complete example showing loading states, error handling, and data display:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { MetricCardGA } from '@/components/analytics/MetricCardGA';
import { MetricCardGASkeleton } from '@/components/analytics/skeletons';
import { ChartErrorBoundary, ErrorFallback } from '@/components/analytics/error-handling';

export function DashboardMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardGASkeleton />
        <MetricCardGASkeleton />
        <MetricCardGASkeleton />
        <MetricCardGASkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          fetchMetrics()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  // Success state with error boundary
  return (
    <ChartErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardGA
          label="Total Users"
          value={data.totalUsers}
          change={data.userChange}
          trend={data.userTrend}
          format="number"
        />
        {/* More metrics... */}
      </div>
    </ChartErrorBoundary>
  );
}
```

## Best Practices

1. **Always wrap charts in error boundaries** - Charts are prone to rendering errors with malformed data
2. **Use skeletons for perceived performance** - Show skeletons immediately while data loads
3. **Provide retry functionality** - Allow users to retry failed operations
4. **Log errors appropriately** - Use the `onError` callback to send errors to your monitoring service
5. **Match skeleton structure to actual component** - Ensure skeletons closely match the final UI
6. **Use compact error states in tight spaces** - Use `ErrorFallback` with `compact={true}` in cards
7. **Test error states** - Regularly test error boundaries to ensure they work correctly

## Error Logging

To integrate with an error tracking service (like Sentry, LogRocket, etc.):

```tsx
import * as Sentry from '@sentry/nextjs';

<AnalyticsErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }}
>
  <YourComponent />
</AnalyticsErrorBoundary>
```
