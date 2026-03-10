# Database Structure Corrections

## Critical Issues Identified

Based on `admin-services/useTailors.ts`, the actual database structure is:

### ❌ INCORRECT (Current Implementation)
```typescript
collection(db, 'wears')  // This collection doesn't exist!
collectionGroup(db, 'all_orders')  // Wrong subcollection name!
```

### ✅ CORRECT (Actual Structure)
```typescript
collection(db, 'tailor_works')  // Products collection
collection(db, 'users_orders', userId, 'user_orders')  // Orders subcollection
```

## Actual Firestore Structure

```
Firestore Database
├── tailors/
│   └── {tailorId}
│       ├── brand_name
│       ├── brand_category[]
│       ├── wallet
│       ├── payoutProvider (NEW: 'stripe' | 'flutterwave')
│       ├── stripeAccountId (NEW)
│       ├── flutterwaveAccountId (NEW)
│       └── ...
│
├── tailor_works/  (NOT 'wears'!)
│   └── {workId}
│       ├── tailor_id
│       ├── title
│       ├── price
│       ├── stock (if exists)
│       └── ...
│
├── users/
│   └── {userId}
│       └── (user profile data)
│
├── users_orders/  (NOT subcollection 'all_orders'!)
│   └── {userId}/
│       └── user_orders/
│           └── {orderId}
│               ├── tailor_id
│               ├── product_id
│               ├── order_status
│               ├── price
│               ├── timestamp
│               └── ...
│
└── dhl_events/
    └── {eventId}
        ├── tailor_id
        ├── order_id
        └── ...
```

## Required Changes

### 1. Product Collection Name
**Change:** `wears` → `tailor_works`

**Affected Services:**
- ✅ VendorAnalyticsService
- ✅ ProductRankingService  
- ✅ CustomerInsightsService
- ✅ InventoryService

### 2. Orders Collection Structure
**Change:** `collectionGroup(db, 'all_orders')` → Proper users_orders query

**Current (Wrong):**
```typescript
collectionGroup(db, 'all_orders')
```

**Correct Pattern from useTailors.ts:**
```typescript
// Get all users first
const usersSnap = await getDocs(collection(db, "users"));

// Then query each user's orders subcollection
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

### 3. Add Payout Provider Support

**New Fields in `tailors` collection:**
```typescript
interface TailorPayoutSettings {
  payoutProvider: 'stripe' | 'flutterwave';
  stripeAccountId?: string;
  flutterwaveAccountId?: string;
  preferredCurrency: 'NGN' | 'USD' | 'GHS' | 'KES';
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
}
```

## Performance Optimizations

### From useTailors.ts Best Practices:

1. **Batch Fetching**
```typescript
const [tailorsSnap, usersSnap, worksSnap] = await Promise.all([
  getDocs(collection(db, "tailors")),
  getDocs(collection(db, "users")),
  getDocs(collection(db, "tailor_works")),
]);
```

2. **Filter in Memory** (when possible)
```typescript
const tailorProducts = works.filter((w) => w.tailor_id === tailor.id);
```

3. **Parallel Processing**
```typescript
const enrichedTailors = await Promise.all(
  tailors.map(async (tailor) => {
    // Process each tailor in parallel
  })
);
```

## Migration Steps

### Step 1: Update Type Definitions
Add payout provider fields to vendor types

### Step 2: Update All Services
- Replace `wears` with `tailor_works`
- Fix order queries to use correct structure
- Add payout provider logic

### Step 3: Update Firestore Rules
Add rules for new payout fields

### Step 4: Create Migration Script
For existing vendors to set default payout provider

## Bumpa-like Features to Add

Based on Bumpa merchant system:

1. ✅ **Multiple Payout Options**
   - Stripe Connect
   - Flutterwave Subaccounts
   - Bank transfer details

2. ✅ **Instant Balance View**
   - Available balance
   - Pending balance
   - Next payout date

3. ✅ **Transaction History**
   - All transactions with status
   - Fee breakdown
   - Downloadable statements

4. ✅ **Smart Analytics**
   - Real-time sales tracking
   - Customer insights
   - Product performance

5. ✅ **Automated Payouts**
   - Scheduled transfers
   - Instant payout option (premium)
   - Multi-currency support

## Next Steps

1. Create optimized vendor hooks following useTailors.ts pattern
2. Update all service files with correct collections
3. Add payout provider selection UI
4. Implement Stripe + Flutterwave integration
5. Add performance monitoring
