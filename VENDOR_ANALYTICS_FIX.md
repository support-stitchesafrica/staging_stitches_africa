# Vendor Analytics Display Fix

## Problem
The vendor analytics are not showing data even though orders exist in the database. The dashboard shows $0.00 for total revenue and the products analytics tab shows "No analytics data available".

## Root Cause
1. The dashboard is displaying `kyc.wallet` instead of calculating actual revenue from completed orders
2. The products page has an Analytics tab but never populates the `productAnalytics` state
3. The UI components aren't calling the analytics services that were already implemented

## Solution

### 1. Fix Dashboard Revenue Display

**File:** `app/vendor/dashboard/page.tsx`

**Current Issue:** Line ~220 shows:
```typescript
value: `${((kyc?.wallet as number) || 0).toLocaleString...`
```

**Fix:** Import and use the analytics service:

```typescript
// Add this import at the top
import { getVendorAnalytics } from "@/lib/vendor/useVendorAnalytics";

// Add state for analytics
const [analyticsData, setAnalyticsData] = useState<any>(null);

// Add useEffect to fetch analytics
useEffect(() => {
  if (!tailorId) return;
  
  const fetchAnalytics = async () => {
    try {
      const analytics = await getVendorAnalytics(tailorId);
      setAnalyticsData(analytics);
      
      // Update sales summary with real data
      setSalesSummary({
        totalItemsSold: analytics.metrics.completedOrders,
        totalRevenue: analytics.metrics.totalRevenue,
        orderCount: analytics.metrics.totalOrders,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };
  
  fetchAnalytics();
}, [tailorId]);

// Update metrics array to use analyticsData
const metrics = [
  {
    title: "Total Revenue",
    value: `$${(analyticsData?.metrics?.totalRevenue || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    // ... rest of config
  },
  {
    title: "Products Sold",
    value: (analyticsData?.metrics?.completedOrders || 0).toString(),
    // ... rest of config
  },
  {
    title: "Active Products",
    value: (analyticsData?.metrics?.totalProducts || works.length).toString(),
    // ... rest of config
  },
  {
    title: "Total Orders",
    value: (analyticsData?.metrics?.totalOrders || 0).toString(),
    // ... rest of config
  },
];
```

### 2. Fix Products Page Analytics Tab

**File:** `app/vendor/products/page.tsx`

**Current Issue:** Line ~50 has unused state:
```typescript
const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
```

**Fix:** Fetch product analytics data:

```typescript
// Add import
import { VendorAnalyticsService } from "@/lib/vendor/analytics-service";

// Add useEffect to fetch product analytics
useEffect(() => {
  if (!tailorUID) return;
  
  const fetchProductAnalytics = async () => {
    try {
      const analyticsService = new VendorAnalyticsService();
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };
      
      const result = await analyticsService.getVendorAnalytics(tailorUID, dateRange);
      
      if (result.success && result.data) {
        // Transform data for product analytics cards
        const productData = products.map(product => {
          const productOrders = result.data!.orders.orders.filter(
            o => o.product_id === product.product_id && 
            (o.order_status === 'completed' || o.order_status === 'delivered')
          );
          
          const revenue = productOrders.reduce((sum, order) => sum + (order.price || 0), 0);
          const orderCount = productOrders.length;
          
          return {
            productId: product.product_id || '',
            productName: product.title || '',
            productImage: product.images?.[0] || '',
            revenue,
            orderCount,
            views: 0, // Would need view tracking
            conversionRate: 0 // Would need view tracking
          };
        });
        
        setProductAnalytics(productData);
      }
    } catch (error) {
      console.error("Failed to fetch product analytics:", error);
    }
  };
  
  if (activeTab === 'analytics' && products.length > 0) {
    fetchProductAnalytics();
  }
}, [activeTab, products, tailorUID]);
```

### 3. Create Product Analytics Card Component

**File:** `components/vendor/products/ProductAnalyticsCard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, Eye } from "lucide-react";

interface ProductAnalyticsCardProps {
  product: {
    productId: string;
    productName: string;
    productImage?: string;
    revenue: number;
    orderCount: number;
    views?: number;
    conversionRate?: number;
  };
  currency?: string;
}

export function ProductAnalyticsCard({ product, currency = "NGN" }: ProductAnalyticsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {product.productImage && (
            <img
              src={product.productImage}
              alt={product.productName}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">
              {product.productName}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Revenue</span>
          <span className="font-semibold text-emerald-600">
            ${product.revenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            Orders
          </span>
          <span className="font-semibold">{product.orderCount}</span>
        </div>
        {product.views !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Views
            </span>
            <span className="font-semibold">{product.views}</span>
          </div>
        )}
        {product.conversionRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Conversion
            </span>
            <span className="font-semibold">{product.conversionRate.toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Testing

After implementing these fixes:

1. Navigate to `/vendor/dashboard` - should see actual revenue from completed orders
2. Navigate to `/vendor/products` and click Analytics tab - should see product cards with revenue and order counts
3. Verify that products with no orders show $0 revenue instead of "no data available"

## Database Structure

The analytics service correctly queries:
- `users_orders/{userId}/user_orders` - for order data
- `tailor_works` - for product data (filtered by `tailor_id`)
- `tailors` - for vendor profile data

All collections are being queried correctly in the existing `VendorAnalyticsService` and `useVendorAnalytics` hook.
