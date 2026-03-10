# Quick Start: Real-Time Data Updates

## 5-Minute Setup Guide

### 1. Basic Usage

```typescript
import { useVendorAnalytics } from '@/lib/vendor/useVendorAnalyticsQuery';

function Dashboard() {
  const { data, isLoading, isFetching } = useVendorAnalytics(vendorId, dateRange);
  
  // data updates automatically every 30 seconds
  // isLoading: true only on first load
  // isFetching: true during background updates
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {isFetching && <Badge>Updating...</Badge>}
      <MetricCard value={data.sales.totalRevenue} />
    </div>
  );
}
```

### 2. Real-Time Orders

```typescript
import { useRecentOrders } from '@/lib/vendor/useVendorAnalyticsQuery';

function OrdersWidget() {
  const { data: orders } = useRecentOrders(vendorId);
  
  // Updates every 10 seconds
  // New orders appear automatically
  
  return (
    <div>
      {orders?.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### 3. Instant Filtering

```typescript
import { useMemo } from 'react';
import { useProductAnalytics } from '@/lib/vendor/useVendorAnalyticsQuery';

function ProductList() {
  const { data: products } = useProductAnalytics(vendorId);
  const [search, setSearch] = useState('');
  
  // Client-side filtering - instant results
  const filtered = useMemo(() => {
    return products?.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);
  
  return (
    <div>
      <Input value={search} onChange={e => setSearch(e.target.value)} />
      {filtered?.map(product => <ProductCard key={product.id} {...product} />)}
    </div>
  );
}
```

### 4. Manual Refresh

```typescript
import { useInvalidateVendorQueries } from '@/lib/vendor/useVendorAnalyticsQuery';

function RefreshButton() {
  const invalidate = useInvalidateVendorQueries();
  
  return (
    <Button 
      onClick={() => invalidate.mutateAsync(vendorId)}
      disabled={invalidate.isPending}
    >
      <RefreshCw className={invalidate.isPending ? 'animate-spin' : ''} />
      Refresh
    </Button>
  );
}
```

### 5. Optimistic Updates

```typescript
import { useMarkNotificationRead } from '@/lib/vendor/useVendorAnalyticsQuery';

function Notification({ notification }) {
  const markRead = useMarkNotificationRead();
  
  return (
    <div 
      onClick={() => markRead.mutate({
        notificationId: notification.id,
        vendorId: notification.vendorId,
      })}
      className={notification.isRead ? 'opacity-50' : ''}
    >
      {/* UI updates instantly, reverts if error */}
      {notification.message}
    </div>
  );
}
```

## Available Hooks

### Analytics
- `useVendorAnalytics(vendorId, dateRange)` - Main analytics (30s updates)
- `useProductAnalytics(vendorId)` - Product metrics (30s updates)
- `useExportAnalytics(vendorId)` - Export data mutation

### Products
- `useProductRanking(productId)` - Product ranking (12h updates)

### Customers
- `useCustomerSegments(vendorId)` - Customer segments (1m updates)
- `useCustomerSegment(vendorId, segment)` - Segment details (1m updates)

### Payouts
- `usePayoutDetails(vendorId)` - Payout info (5m updates)
- `usePayoutHistory(vendorId)` - Payout history (5m updates)

### Inventory
- `useInventoryAlerts(vendorId)` - Stock alerts (1m updates)
- `useInventoryForecast(productId, days)` - Forecast (1m updates)

### Notifications
- `useVendorNotifications(vendorId)` - All notifications (15s updates)
- `useMarkNotificationRead()` - Mark as read mutation

### Orders
- `useRecentOrders(vendorId)` - Recent orders (10s updates)

### Utilities
- `useInvalidateVendorQueries()` - Manual refresh all
- `useIsAnyQueryLoading()` - Global loading state

## Update Frequencies

| Data Type | Update Interval | Use Case |
|-----------|----------------|----------|
| Orders | 10 seconds | Critical real-time data |
| Notifications | 15 seconds | Time-sensitive alerts |
| Analytics | 30 seconds | Frequently changing metrics |
| Inventory | 1 minute | Stock monitoring |
| Customers | 1 minute | Moderate updates |
| Payouts | 5 minutes | Infrequent changes |
| Rankings | 12 hours | Slow-changing data |

## Real-Time Indicators

### Live Badge
```typescript
{isFetching ? (
  <Badge variant="outline" className="border-blue-200 bg-blue-50">
    <RefreshCw className="h-3 w-3 animate-spin" />
    Updating
  </Badge>
) : (
  <Badge variant="outline" className="border-emerald-200 bg-emerald-50">
    <Wifi className="h-3 w-3" />
    Live
  </Badge>
)}
```

### Last Update Time
```typescript
const getLastUpdateText = () => {
  if (!dataUpdatedAt) return '';
  const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Updated ${minutes}m ago`;
};
```

### New Data Alert
```typescript
{recentOrders?.length > 0 && (
  <Alert>
    <ShoppingBag />
    {recentOrders.length} new orders - analytics updated in real-time
  </Alert>
)}
```

## Common Patterns

### Loading States
```typescript
if (isLoading) return <Skeleton />;
if (error) return <ErrorState error={error} />;
if (!data) return null;

return (
  <div>
    {isFetching && <LoadingIndicator />}
    <Content data={data} />
  </div>
);
```

### Error Handling
```typescript
const { data, error, refetch } = useVendorAnalytics(vendorId, dateRange);

if (error) {
  return (
    <ErrorState 
      message={error.message}
      onRetry={refetch}
    />
  );
}
```

### Conditional Queries
```typescript
const { data } = useProductRanking(productId, {
  enabled: !!productId, // Only fetch if productId exists
});
```

## Performance Tips

1. **Use appropriate cache times**
   - Critical data: Short stale time
   - Static data: Long stale time

2. **Implement proper loading states**
   - `isLoading` for initial load
   - `isFetching` for background updates

3. **Handle errors gracefully**
   - Show error messages
   - Provide retry option

4. **Use client-side filtering**
   - Filter cached data with useMemo
   - No network requests needed

5. **Invalidate selectively**
   - Only invalidate changed data
   - Avoid invalidating everything

## Troubleshooting

### Data not updating?
- Check refetch interval configuration
- Verify query key uniqueness
- Ensure component is mounted

### Slow performance?
- Reduce refetch frequency
- Increase stale time
- Use pagination

### Memory issues?
- Reduce GC time
- Limit cache size
- Remove unused queries

## Next Steps

1. Read [Full Documentation](./REAL_TIME_UPDATES_GUIDE.md)
2. Check [Implementation Summary](../../.kiro/specs/vendor-analytics-upgrade/TASK_30_SUMMARY.md)
3. Review [Query Configuration](./query-client.ts)
4. Explore [Custom Hooks](./useVendorAnalyticsQuery.ts)

## Support

For issues or questions:
1. Check DevTools (bottom-right in dev mode)
2. Review query state and cache
3. Check network requests
4. Verify query keys
