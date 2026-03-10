# Performance Alerts System

## Overview

The Performance Alerts System is a comprehensive monitoring and alerting solution for vendors on the Stitches Africa marketplace. It automatically detects performance issues, quality concerns, critical inventory situations, ranking drops, and growth opportunities.

## Features

### 1. Metric Decline Detection (Requirement 19.1)
Monitors key performance metrics and alerts when they drop by more than 20%:
- **Revenue Decline**: Alerts when revenue drops significantly
- **Order Volume Decline**: Detects drops in order count
- **Traffic Decline**: Monitors store visit decreases
- **Conversion Rate Decline**: Tracks conversion rate drops

**Property 34**: For any vendor with a metric that drops by more than 20% compared to previous period, an alert is generated.

### 2. Quality Issue Alerts (Requirement 19.2)
Detects quality-related problems:
- **High Return Rate**: Alerts when returns exceed 15%
- **High Complaint Rate**: Monitors complaint rates above 10%
- **High Cancellation Rate**: Tracks cancellations above 20%
- **Slow Fulfillment**: Alerts when fulfillment time exceeds 72 hours

### 3. Critical Inventory Warnings (Requirement 19.3)
Monitors stock levels and generates urgent alerts:
- **Critical Stock**: Products with ≤5 units remaining
- **Out of Stock**: Products completely out of stock
- **Low Stock**: Products running low based on sales velocity

**Property 35**: For any product with stock at or below critical threshold (5 units), an urgent warning is sent.

### 4. Ranking Drop Alerts (Requirement 19.4)
Tracks product and store ranking changes:
- **Significant Ranking Drops**: Products dropping >10 positions
- **Low Visibility Scores**: Products with visibility <30
- **Low Store Engagement**: Store engagement score <50

### 5. Opportunity Alerts (Requirement 19.5)
Identifies growth opportunities:
- **Trending Products**: Products with >50% increase in views/sales
- **High Performers**: Products with excellent conversion and ratings
- **Revenue Milestones**: Achievements at key revenue thresholds
- **Order Milestones**: Celebrations for order count achievements

## Architecture

### Service Layer
```
PerformanceAlertsService
├── generatePerformanceAlerts()
│   ├── detectMetricDeclines()
│   ├── detectQualityIssues()
│   ├── detectCriticalInventory()
│   ├── detectRankingDrops()
│   └── detectOpportunities()
└── getAlertSummary()
```

### API Endpoints
- `GET /api/vendor/performance-alerts?vendorId={id}` - Get all alerts
- `GET /api/vendor/performance-alerts/summary?vendorId={id}` - Get alert counts

### Components
- `PerformanceAlertsList` - Displays alerts grouped by severity
- `AlertSummaryWidget` - Dashboard widget showing alert counts
- `PerformanceAlertsPage` - Full page view of all alerts

## Alert Types

### AlertType
- `metric_decline` - Performance metric has declined significantly
- `quality_issue` - Quality-related problem detected
- `critical_inventory` - Urgent stock-related issue
- `ranking_drop` - Product or store ranking has decreased
- `opportunity` - Growth opportunity or milestone

### AlertSeverity
- `critical` - Requires immediate action (red)
- `high` - Action recommended soon (orange)
- `medium` - Monitor closely (yellow)
- `low` - Informational/opportunity (green)

## Alert Structure

```typescript
interface PerformanceAlert {
  type: AlertType;
  severity: AlertSeverity;
  category: 'stock' | 'payout' | 'performance' | 'ranking' | 'milestone';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

## Thresholds

```typescript
const THRESHOLDS = {
  METRIC_DECLINE: 0.20,        // 20% decline triggers alert
  CRITICAL_STOCK: 5,           // 5 units or less is critical
  LOW_STOCK_DAYS: 7,           // Alert if stock runs out in 7 days
  HIGH_RETURN_RATE: 0.15,      // 15% return rate
  HIGH_COMPLAINT_RATE: 0.10,   // 10% complaint rate
  RANKING_DROP: 10,            // 10 position drop
  TRENDING_THRESHOLD: 0.50,    // 50% increase in views/sales
  LOW_VISIBILITY: 30,          // Visibility score below 30
};
```

## Usage Examples

### Generate Alerts for a Vendor
```typescript
import { PerformanceAlertsService } from '@/lib/vendor/performance-alerts-service';

const alertsService = new PerformanceAlertsService();
const result = await alertsService.generatePerformanceAlerts(vendorId);

if (result.success && result.data) {
  const alerts = result.data;
  console.log(`Generated ${alerts.length} alerts`);
}
```

### Get Alert Summary
```typescript
const summary = await alertsService.getAlertSummary(vendorId);

if (summary.success && summary.data) {
  console.log(`Critical: ${summary.data.critical}`);
  console.log(`High: ${summary.data.high}`);
  console.log(`Medium: ${summary.data.medium}`);
  console.log(`Low: ${summary.data.low}`);
}
```

### Display Alerts in UI
```tsx
import { PerformanceAlertsList } from '@/components/vendor/alerts/PerformanceAlertsList';

function MyComponent() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  return (
    <PerformanceAlertsList 
      alerts={alerts}
      onDismiss={(alert) => {
        // Handle alert dismissal
        setAlerts(prev => prev.filter(a => a !== alert));
      }}
    />
  );
}
```

### Dashboard Widget
```tsx
import { AlertSummaryWidget } from '@/components/vendor/alerts/AlertSummaryWidget';

function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <AlertSummaryWidget vendorId={vendorId} />
      {/* Other widgets */}
    </div>
  );
}
```

## Data Sources

The performance alerts system queries multiple Firestore collections:

1. **vendor_analytics** - Sales, orders, traffic metrics
2. **inventory_alerts** - Stock level alerts
3. **vendor_rankings** - Product and store rankings
4. **product_analytics** - Individual product performance

## Alert Metadata

Each alert includes metadata specific to its type:

### Metric Decline
```typescript
{
  metric: 'revenue' | 'orders' | 'traffic' | 'conversion_rate',
  currentValue: number,
  previousValue: number,
  changePercentage: number,
  threshold: number
}
```

### Quality Issue
```typescript
{
  issueType: 'returns' | 'complaints' | 'cancellations' | 'fulfillment',
  rate: number,
  threshold: number,
  affectedProducts?: string[],
  topReasons?: string[]
}
```

### Critical Inventory
```typescript
{
  criticalCount?: number,
  outOfStockCount?: number,
  lowStockCount?: number,
  threshold: number,
  products: Array<{
    productId: string,
    productName: string,
    currentStock?: number,
    recommendedStock?: number
  }>
}
```

### Ranking Drop
```typescript
{
  droppedCount?: number,
  lowVisibilityCount?: number,
  threshold: number,
  products: Array<{
    productId: string,
    productName: string,
    rankingChange?: number,
    currentPosition?: number,
    visibilityScore?: number
  }>
}
```

### Opportunity
```typescript
{
  trendingCount?: number,
  highPerformerCount?: number,
  milestone?: number,
  threshold?: number,
  products?: Array<{
    productId: string,
    productName: string,
    viewIncrease?: number,
    salesIncrease?: number,
    conversionRate?: number,
    revenue?: number
  }>
}
```

## Integration with Notification Service

The performance alerts can be integrated with the existing NotificationService to send notifications:

```typescript
import { NotificationService } from '@/lib/vendor/notification-service';
import { PerformanceAlertsService } from '@/lib/vendor/performance-alerts-service';

const alertsService = new PerformanceAlertsService();
const notificationService = new NotificationService();

// Generate alerts
const alertsResult = await alertsService.generatePerformanceAlerts(vendorId);

if (alertsResult.success && alertsResult.data) {
  // Send notifications for each alert
  for (const alert of alertsResult.data) {
    await notificationService.sendNotification(vendorId, {
      type: alert.severity === 'critical' ? 'alert' : 
            alert.severity === 'high' ? 'warning' : 
            alert.severity === 'low' ? 'celebration' : 'info',
      category: alert.category,
      title: alert.title,
      message: alert.message,
      actionUrl: alert.actionUrl,
      metadata: alert.metadata
    });
  }
}
```

## Scheduled Monitoring

For production use, set up a scheduled job to run monitoring:

```typescript
// Cloud Function or cron job
export async function monitorVendorPerformance() {
  const alertsService = new PerformanceAlertsService();
  
  // Get all active vendors
  const vendors = await getActiveVendors();
  
  for (const vendor of vendors) {
    try {
      await alertsService.generatePerformanceAlerts(vendor.id);
    } catch (error) {
      console.error(`Failed to monitor vendor ${vendor.id}:`, error);
    }
  }
}

// Run every hour
schedule.every('1 hour').do(monitorVendorPerformance);
```

## Testing

The system includes comprehensive property-based tests:

- **Property 34**: Metric decline alert generation
- **Property 35**: Critical stock warning urgency

Run tests with:
```bash
npm test -- lib/vendor/performance-alerts-service.test.ts
```

## Future Enhancements

1. **Machine Learning**: Predict issues before they occur
2. **Custom Thresholds**: Allow vendors to set their own alert thresholds
3. **Alert Preferences**: Let vendors choose which alerts to receive
4. **Email/SMS Notifications**: Send alerts via multiple channels
5. **Alert History**: Track alert trends over time
6. **Automated Actions**: Auto-restock, auto-adjust pricing, etc.

## Support

For issues or questions about the performance alerts system:
- Check the main vendor analytics documentation
- Review the design document at `.kiro/specs/vendor-analytics-upgrade/design.md`
- Contact the development team
