# Vendor Analytics Services

This directory contains the service layer for the Vendor Analytics Upgrade feature. All services extend the `BaseVendorService` class which provides common functionality and error handling.

## Architecture

### Base Service (`base-service.ts`)

The `BaseVendorService` class provides:
- Standardized error handling with `ServiceResponse<T>` wrapper
- Common validation methods (vendor ID, date ranges, required fields)
- Utility functions for calculations (percentage change, safe division, etc.)
- Retry logic with exponential backoff
- Data aggregation and grouping utilities
- Logging functionality

All service methods return `ServiceResponse<T>` which includes:
```typescript
{
  success: boolean;
  data?: T;
  error?: ServiceError;
  timestamp: Date;
}
```

## Services

### 1. VendorAnalyticsService (`analytics-service.ts`)

Handles comprehensive analytics calculations for vendors.

**Key Methods:**
- `getVendorAnalytics(vendorId, dateRange)` - Fetches all analytics for a vendor
- `exportAnalytics(vendorId, options)` - Exports analytics data as CSV or PDF

**Responsibilities:**
- Sales metrics calculation with period-over-period comparison
- Order metrics including funnel tracking
- Product performance aggregation
- Customer metrics compilation
- Store visibility metrics

### 2. ProductRankingService (`product-ranking-service.ts`)

Calculates product rankings and visibility scores.

**Key Methods:**
- `calculateRankingScore(productId)` - Calculates ranking factors and overall score
- `generateRecommendations(productId, factors)` - Generates actionable recommendations

**Ranking Factors (weighted):**
- CTR (15%)
- Conversion Rate (20%)
- Rating (15%)
- Fulfillment Speed (15%)
- Complaint Score (10%)
- Stock Health (10%)
- Price Competitiveness (10%)
- Engagement Signals (5%)

**Score Range:** 1-100 (enforced by `clamp` function)

### 3. CustomerInsightsService (`customer-insights-service.ts`)

Handles customer segmentation and anonymized insights.

**Key Methods:**
- `segmentCustomers(vendorId)` - Segments customers into categories
- `anonymizeCustomerData(customer)` - Removes PII from customer data
- `calculateLifetimeValue(customerId, vendorId)` - Calculates customer LTV

**Customer Segments:**
- New: First purchase within period
- Returning: 2+ purchases
- Frequent: 5+ purchases
- High-Value: Top 20% by revenue

**Privacy:** All customer data is anonymized using SHA-256 hashing for IDs and excludes email, phone, and full addresses.

### 4. PayoutService (`payout-service.ts`)

Handles payout calculations, history, and statement generation.

**Key Methods:**
- `getPayoutDetails(vendorId)` - Retrieves payout information with fee breakdown
- `generatePayoutStatement(vendorId, payoutId)` - Generates PDF statement
- `calculateFees(grossAmount, commissionRate)` - Calculates fee breakdown

**Fee Structure:**
- Platform Commission: 15% (default, configurable per vendor)
- Payment Processing Fee: 1.5% (Paystack)
- Other Fees: As applicable

### 5. InventoryService (`inventory-service.ts`)

Handles inventory alerts, forecasting, and stock management.

**Key Methods:**
- `generateInventoryAlerts(vendorId)` - Generates alerts based on stock levels
- `forecastInventory(productId, daysAhead)` - Forecasts inventory needs

**Alert Types:**
- Out of Stock: Stock = 0 (Critical)
- Low Stock: < 7 days until stockout (Warning)
- High Return Rate: > 15% returns (Warning)

**Forecasting:** Uses 90-day sales history with seasonality adjustments.

### 6. NotificationService (`notification-service.ts`)

Handles vendor notifications and alerts.

**Key Methods:**
- `sendNotification(vendorId, notification)` - Creates and sends notification
- `monitorAndAlert(vendorId)` - Monitors metrics and triggers alerts
- `getNotificationPreferences(vendorId)` - Gets notification preferences
- `updateNotificationPreferences(vendorId, preferences)` - Updates preferences
- `markAsRead(notificationId)` - Marks notification as read

**Notification Types:**
- Alert: Critical issues requiring immediate attention
- Warning: Issues that may impact performance
- Info: General information (e.g., payout processed)
- Celebration: Positive milestones

**Alert Triggers:**
- Out of stock products
- High cancellation rate (> 20%)
- Ranking drops (> 10 positions)
- Low stock warnings

## Usage Example

```typescript
import {
  VendorAnalyticsService,
  ProductRankingService,
  CustomerInsightsService,
  PayoutService,
  InventoryService,
  NotificationService
} from '@/lib/vendor';

// Initialize services
const analyticsService = new VendorAnalyticsService();
const rankingService = new ProductRankingService();
const customerService = new CustomerInsightsService();
const payoutService = new PayoutService();
const inventoryService = new InventoryService();
const notificationService = new NotificationService();

// Fetch vendor analytics
const analyticsResponse = await analyticsService.getVendorAnalytics(
  vendorId,
  { start: new Date('2024-01-01'), end: new Date('2024-01-31') }
);

if (analyticsResponse.success) {
  const analytics = analyticsResponse.data;
  // Use analytics data
} else {
  console.error(analyticsResponse.error);
}

// Calculate product ranking
const rankingResponse = await rankingService.calculateRankingScore(productId);

// Generate inventory alerts
const alertsResponse = await inventoryService.generateInventoryAlerts(vendorId);

// Send notification
await notificationService.sendNotification(vendorId, {
  type: 'info',
  category: 'payout',
  title: 'Payout Processed',
  message: 'Your payout of $500 has been processed',
  actionUrl: '/vendor/payouts'
});
```

## Error Handling

All services use standardized error handling:

```typescript
const response = await service.someMethod(params);

if (response.success) {
  // Handle success
  const data = response.data;
} else {
  // Handle error
  const error = response.error;
  console.error(`Error ${error.code}: ${error.message}`);
  if (error.details) {
    console.error('Details:', error.details);
  }
}
```

## Implementation Status

All services are currently **stub implementations** with:
- ✅ Complete type definitions
- ✅ Method signatures
- ✅ Error handling infrastructure
- ✅ Validation logic
- ⏳ Database integration (TODO)
- ⏳ Business logic implementation (TODO)

Each service method that requires database access throws `Error('Not implemented')` and should be implemented in subsequent tasks.

## Next Steps

1. Implement database queries in each service
2. Add unit tests for calculation methods
3. Add property-based tests for correctness properties
4. Implement CSV/PDF export functionality
5. Add caching layer for frequently accessed data
6. Implement real-time updates with React Query
