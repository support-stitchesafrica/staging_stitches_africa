# Firestore Collections Setup for Vendor Analytics

## Overview

This document describes the Firestore collections required for the vendor analytics and export functionality.

## Required Collections

### 1. export_audit_logs

**Purpose**: Tracks all export activities for security auditing

**Structure**:
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

**Indexes** (added to firestore.indexes.json):
- `vendorId ASC, timestamp DESC`
- `vendorId ASC, dataType ASC, timestamp DESC`

**Security Rules**:
```javascript
match /export_audit_logs/{logId} {
  // Only admins can read audit logs
  allow read: if request.auth != null && 
                 get(/databases/$(database)/documents/backoffice_users/$(request.auth.uid)).data.role == 'super_admin';
  // System can write (via Cloud Functions or server-side)
  allow write: if false;
}
```

### 2. vendor_analytics

**Purpose**: Stores aggregated analytics data for vendors

**Structure**:
```typescript
{
  id: string, // vendorId_YYYYMMDD
  vendorId: string,
  date: Timestamp,
  sales: {
    totalRevenue: number,
    orderCount: number,
    averageOrderValue: number,
    topCategories: array
  },
  orders: {
    completed: number,
    cancelled: number,
    averageFulfillmentTime: number
  },
  traffic: {
    profileVisits: number,
    productViews: number,
    searchAppearances: number
  },
  updatedAt: Timestamp
}
```

**Indexes**:
- `vendorId ASC, date DESC`

**Security Rules**:
```javascript
match /vendor_analytics/{docId} {
  allow read: if request.auth != null && 
                 resource.data.vendorId == request.auth.uid;
  allow write: if false; // Only Cloud Functions can write
}
```

### 3. product_analytics

**Purpose**: Stores per-product analytics data

**Structure**:
```typescript
{
  id: string, // productId_YYYYMMDD
  productId: string,
  vendorId: string,
  date: Timestamp,
  views: number,
  addToCart: number,
  purchases: number,
  revenue: number,
  conversionRate: number,
  addToCartRate: number,
  updatedAt: Timestamp
}
```

**Indexes**:
- `vendorId ASC, date DESC`
- `productId ASC, date DESC`

**Security Rules**:
```javascript
match /product_analytics/{docId} {
  allow read: if request.auth != null && 
                 resource.data.vendorId == request.auth.uid;
  allow write: if false;
}
```

### 4. vendor_payouts

**Purpose**: Stores payout history and details

**Structure**:
```typescript
{
  id: string,
  vendorId: string,
  amount: number,
  fees: {
    platformCommission: number,
    commissionRate: number,
    paymentProcessingFee: number,
    totalFees: number
  },
  netAmount: number,
  status: 'processing' | 'paid' | 'failed',
  transferDate: Timestamp,
  paystackReference: string,
  failureReason?: string,
  transactions: array,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes**:
- `vendorId ASC, transferDate DESC`
- `vendorId ASC, status ASC`

**Security Rules**:
```javascript
match /vendor_payouts/{payoutId} {
  allow read: if request.auth != null && 
                 resource.data.vendorId == request.auth.uid;
  allow write: if false;
}
```

### 5. vendor_notifications

**Purpose**: Stores notifications for vendors

**Structure**:
```typescript
{
  id: string,
  vendorId: string,
  type: 'alert' | 'info' | 'warning' | 'celebration',
  category: 'stock' | 'payout' | 'performance' | 'ranking' | 'milestone',
  title: string,
  message: string,
  actionUrl?: string,
  isRead: boolean,
  createdAt: Timestamp
}
```

**Indexes**:
- `vendorId ASC, isRead ASC, createdAt DESC`
- `vendorId ASC, createdAt DESC`

**Security Rules**:
```javascript
match /vendor_notifications/{notificationId} {
  allow read: if request.auth != null && 
                 resource.data.vendorId == request.auth.uid;
  allow write: if request.auth != null && 
                  resource.data.vendorId == request.auth.uid;
}
```

### 6. customer_segments

**Purpose**: Stores anonymized customer segmentation data

**Structure**:
```typescript
{
  id: string, // vendorId_customerId
  vendorId: string,
  customerId: string, // hashed
  segment: 'new' | 'returning' | 'frequent' | 'high-value',
  orderCount: number,
  totalSpent: number,
  averageOrderValue: number,
  lastPurchase: Timestamp,
  location: {
    city: string,
    state: string
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes**:
- `vendorId ASC, segment ASC, totalSpent DESC`

**Security Rules**:
```javascript
match /customer_segments/{segmentId} {
  allow read: if request.auth != null && 
                 resource.data.vendorId == request.auth.uid;
  allow write: if false;
}
```

## Existing Collections Used

### tailor_works (Products)

**Used for**: Product inventory and analytics

**Query Pattern**:
```typescript
query(
  collection(db, 'tailor_works'),
  where('tailor_id', '==', vendorId)
)
```

### users_orders (Orders)

**Used for**: Order analytics and metrics

**Query Pattern**:
```typescript
// Get all users first
const usersSnap = await getDocs(collection(db, "users"));

// Then query each user's orders
await Promise.all(
  usersSnap.docs.map(async (userDoc) => {
    const userId = userDoc.id;
    const userOrdersSnap = await getDocs(
      collection(db, "users_orders", userId, "user_orders")
    );
    // Filter by tailor_id
  })
);
```

## Setup Instructions

### Step 1: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

This will create all the necessary composite indexes defined in `firestore.indexes.json`.

### Step 2: Update Firestore Rules

Add the security rules from this document to your `firestore.rules` file.

### Step 3: Initialize Collections

The collections will be created automatically when data is first written. However, you can pre-create them:

```typescript
// In a Cloud Function or admin script
import { db } from './firebase-admin';

async function initializeCollections() {
  const collections = [
    'export_audit_logs',
    'vendor_analytics',
    'product_analytics',
    'vendor_payouts',
    'vendor_notifications',
    'customer_segments'
  ];

  for (const collectionName of collections) {
    // Create a placeholder document
    await db.collection(collectionName).doc('_init').set({
      initialized: true,
      createdAt: new Date()
    });
    
    // Delete the placeholder
    await db.collection(collectionName).doc('_init').delete();
    
    console.log(`✅ Initialized ${collectionName}`);
  }
}
```

### Step 4: Verify Collections Exist

You can verify collections exist in the Firebase Console:
1. Go to Firestore Database
2. Check that all collections are listed
3. Verify indexes are being built (may take a few minutes)

## Data Migration

If you have existing data that needs to be migrated:

### Migrate Existing Orders

```typescript
// Cloud Function to aggregate historical order data
async function migrateOrderData() {
  // Fetch all orders
  // Group by vendor and date
  // Create vendor_analytics documents
}
```

### Migrate Existing Products

```typescript
// Cloud Function to create product analytics
async function migrateProductData() {
  // Fetch all products from tailor_works
  // Create product_analytics documents
}
```

## Monitoring

### Check Collection Sizes

```bash
# Using Firebase CLI
firebase firestore:indexes

# Check document counts in Firebase Console
```

### Monitor Export Activity

```typescript
// Query recent exports
const recentExports = await getDocs(
  query(
    collection(db, 'export_audit_logs'),
    orderBy('timestamp', 'desc'),
    limit(100)
  )
);
```

## Troubleshooting

### Issue: "Missing index" error

**Solution**: Deploy indexes using `firebase deploy --only firestore:indexes`

### Issue: "Permission denied" error

**Solution**: Check that security rules are properly configured

### Issue: Collection not appearing

**Solution**: Write at least one document to the collection to create it

### Issue: Slow queries

**Solution**: Verify that composite indexes are built and active

## Best Practices

1. **Use Batch Writes**: When creating multiple documents, use batch writes
2. **Cache Frequently Accessed Data**: Use React Query or similar caching
3. **Paginate Large Queries**: Use cursor-based pagination for large result sets
4. **Monitor Costs**: Track read/write operations in Firebase Console
5. **Regular Backups**: Set up automated Firestore backups

## Cost Optimization

- Use caching to reduce read operations
- Aggregate data daily instead of real-time
- Use Cloud Functions for batch processing
- Implement pagination for large datasets
- Monitor and optimize expensive queries

## Security Considerations

- All vendor data is isolated by vendorId
- Customer data is anonymized (no PII)
- Export logs are admin-only
- All writes are server-side only
- Authentication required for all reads

## Next Steps

1. ✅ Deploy Firestore indexes
2. ✅ Update security rules
3. ✅ Initialize collections
4. ⏳ Create Cloud Functions for data aggregation
5. ⏳ Set up monitoring and alerts
6. ⏳ Implement data migration scripts
