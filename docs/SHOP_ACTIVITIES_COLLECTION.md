# Shop Activities Collection Documentation

## Overview

The `shop_activities` collection tracks all user interactions in the `/shops` section of the Stitches Africa marketplace. This data powers the vendor analytics dashboard with real-time insights based on actual customer behavior.

**Requirements:** 21.1, 21.7, 22.1

## Collection Schema

### Document Structure

```typescript
{
  id: string;                    // Unique activity identifier
  type: ActivityType;            // 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'search'
  userId: string;                // User ID (or anonymous ID)
  sessionId: string;             // Session identifier
  vendorId: string;              // Vendor/Tailor ID
  productId?: string;            // Product ID (optional for search)
  timestamp: Timestamp;          // When activity occurred
  metadata: {
    // Product details (for cart/purchase)
    price?: number;
    currency?: string;           // Always 'USD'
    quantity?: number;
    
    // Search details
    searchQuery?: string;
    resultsCount?: number;
    clickedResultPosition?: number;
    
    // Session & device
    deviceType: 'mobile' | 'tablet' | 'desktop';
    userAgent: string;
    
    // Location
    location?: {
      country: string;
      state?: string;
      city?: string;
    };
    
    // Referrer
    referrer?: string;
    source?: 'direct' | 'search' | 'social' | 'referral';
  }
}
```

## Firestore Indexes

The following composite indexes are configured in `firestore.indexes.json`:

1. **(vendorId ASC, timestamp DESC)** - Vendor activity timeline
2. **(productId ASC, timestamp DESC)** - Product activity timeline
3. **(type ASC, timestamp DESC)** - Activity type filtering
4. **(vendorId ASC, type ASC, timestamp DESC)** - Vendor + type filtering
5. **(productId ASC, type ASC, timestamp DESC)** - Product + type filtering
6. **(userId ASC, timestamp DESC)** - User activity history
7. **(sessionId ASC, timestamp ASC)** - Session activity tracking
8. **(timestamp ASC)** - Time-based cleanup queries

## Security Rules

### Read Permissions
- Vendors can read activities for their products
- Admins can read all activities for analytics
- System can read for processing

### Create Permissions
- Anyone can create activity logs (including anonymous users)
- This enables tracking of all user interactions in the shops section

### Update Permissions
- Not allowed - activities are immutable once created

### Delete Permissions
- Only admins can delete (for data retention/cleanup)
- Automated cleanup after 12 months retention period

## Data Retention Policy

**Retention Period:** 12 months

Activities older than 12 months are automatically archived or deleted to:
- Comply with data retention policies
- Optimize database performance
- Reduce storage costs

### Running Cleanup

```bash
# Dry run (preview what would be deleted)
npx ts-node scripts/cleanup-old-shop-activities.ts --dry-run

# Live cleanup (actually delete old activities)
npx ts-node scripts/cleanup-old-shop-activities.ts

# Custom batch size
npx ts-node scripts/cleanup-old-shop-activities.ts --batch-size=1000
```

**Recommended Schedule:** Run cleanup monthly via cron job or Cloud Scheduler

## Usage Examples

### Tracking Activities

```typescript
import { ActivityTracker } from '@/lib/analytics/activity-tracker';

const tracker = new ActivityTracker();

// Track product view
await tracker.trackProductView(productId, vendorId, userId);

// Track add to cart
await tracker.trackAddToCart(productId, vendorId, quantity, price, userId);

// Track purchase
await tracker.trackPurchase(orderId, productId, vendorId, amount, quantity, userId);
```

### Querying Activities

```typescript
import { collection, query, where, orderBy } from 'firebase/firestore';

// Get vendor activities in date range
const q = query(
  collection(db, 'shop_activities'),
  where('vendorId', '==', vendorId),
  where('timestamp', '>=', startDate),
  where('timestamp', '<=', endDate),
  orderBy('timestamp', 'desc')
);

// Get product views
const viewsQuery = query(
  collection(db, 'shop_activities'),
  where('productId', '==', productId),
  where('type', '==', 'view'),
  orderBy('timestamp', 'desc')
);

// Get cart activities
const cartQuery = query(
  collection(db, 'shop_activities'),
  where('productId', '==', productId),
  where('type', 'in', ['add_to_cart', 'remove_from_cart']),
  orderBy('timestamp', 'desc')
);
```

## Analytics Processing

Activities are processed in real-time (within 30 seconds) to update vendor analytics:

1. **View Metrics**: Total views, unique views, view trends
2. **Cart Metrics**: Add-to-cart rate, cart abandonment
3. **Conversion Metrics**: Purchase conversion rate, revenue
4. **Customer Insights**: Behavior patterns, location data

### Processing Flow

```
User Action → Activity Logged → Debounced Update (30s) → Analytics Updated → Dashboard Refreshed
```

## Performance Considerations

### Write Performance
- Activities are written asynchronously
- Failed writes are queued for retry
- Batch processing for analytics updates

### Read Performance
- Composite indexes optimize common queries
- Vendor-specific queries are fast
- Date range queries use timestamp index

### Storage Optimization
- 12-month retention reduces storage
- Automated cleanup maintains performance
- Archived data can be exported before deletion

## Monitoring

### Key Metrics to Monitor

1. **Write Rate**: Activities created per second
2. **Error Rate**: Failed activity logs
3. **Query Performance**: Average query duration
4. **Storage Size**: Total collection size
5. **Cleanup Success**: Activities deleted per cleanup run

### Alerts

Set up alerts for:
- High error rate (>5% failed writes)
- Slow queries (>1 second)
- Storage growth (>expected rate)
- Cleanup failures

## Integration Points

### Shop Pages
- Product detail pages track views
- Cart pages track add/remove actions
- Checkout flow tracks purchases
- Search pages track queries

### Analytics Dashboard
- Real-time metrics display
- Historical trend analysis
- Product performance rankings
- Customer behavior insights

### Vendor Dashboard
- Product analytics
- Sales funnel visualization
- Conversion rate tracking
- Revenue reporting

## Troubleshooting

### Activities Not Being Logged

1. Check browser console for errors
2. Verify Firebase configuration
3. Check security rules allow creation
4. Verify network connectivity

### Analytics Not Updating

1. Check debounce timer (30 seconds)
2. Verify analytics processor is running
3. Check for processing errors in logs
4. Verify indexes are deployed

### Slow Queries

1. Verify all required indexes exist
2. Check query uses indexed fields
3. Limit date ranges for large datasets
4. Consider pagination for large results

## Migration Notes

If migrating from `product_views` collection:

1. Both collections can coexist during transition
2. Update queries to use `shop_activities`
3. Migrate historical data if needed
4. Deprecate old collection after verification

## Related Documentation

- [Activity Tracker Service](../lib/analytics/activity-tracker.ts)
- [Analytics Processor](../lib/analytics/analytics-processor.ts)
- [Vendor Analytics Service](../lib/vendor/analytics-service.ts)
- [Shop Activities Types](../types/shop-activities.ts)

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Test with dry-run cleanup script
4. Contact development team
