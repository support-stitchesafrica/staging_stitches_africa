# Deploying Shop Activities Firestore Indexes

## Overview

This guide explains how to deploy the Firestore indexes and security rules for the `shop_activities` collection.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated with Firebase (`firebase login`)
- Firebase project configured

## Step 1: Review Changes

### Indexes Added

The following composite indexes have been added to `firestore.indexes.json`:

1. `(vendorId ASC, timestamp DESC)` - Vendor activity timeline
2. `(productId ASC, timestamp DESC)` - Product activity timeline  
3. `(type ASC, timestamp DESC)` - Activity type filtering
4. `(vendorId ASC, type ASC, timestamp DESC)` - Vendor + type filtering
5. `(productId ASC, type ASC, timestamp DESC)` - Product + type filtering
6. `(userId ASC, timestamp DESC)` - User activity history
7. `(sessionId ASC, timestamp ASC)` - Session activity tracking
8. `(timestamp ASC)` - Time-based cleanup queries

### Security Rules Added

New security rules for `shop_activities` collection:
- **Read**: Vendors (own products), Admins (all)
- **Create**: Anyone (including anonymous users)
- **Update**: Not allowed (immutable)
- **Delete**: Admins only

## Step 2: Deploy Indexes

```bash
# Deploy only indexes
firebase deploy --only firestore:indexes

# Or deploy both indexes and rules
firebase deploy --only firestore
```

### Expected Output

```
=== Deploying to 'stitches-africa'...

i  firestore: reading indexes from firestore.indexes.json...
✔  firestore: deployed indexes in firestore.indexes.json successfully

✔  Deploy complete!
```

### Index Build Time

- Indexes will build in the background
- Build time depends on existing data in `shop_activities`
- For new collection: ~1-2 minutes
- For existing collection with data: May take longer

## Step 3: Monitor Index Build

### Via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Check status of `shop_activities` indexes

### Via CLI

```bash
firebase firestore:indexes
```

### Index States

- **Building**: Index is being created (wait for completion)
- **Enabled**: Index is ready to use
- **Error**: Index creation failed (check logs)

## Step 4: Deploy Security Rules

```bash
# Deploy only security rules
firebase deploy --only firestore:rules

# Verify rules after deployment
firebase firestore:rules:get
```

### Testing Rules

Test the security rules before deploying to production:

```bash
# Run rules tests (if you have test files)
firebase emulators:start --only firestore
npm test -- firestore-rules.test.js
```

## Step 5: Verify Deployment

### Test Activity Logging

```typescript
// In browser console or test script
import { ActivityTracker } from '@/lib/analytics/activity-tracker';

const tracker = new ActivityTracker();
await tracker.trackProductView('test-product-id', 'test-vendor-id');
```

### Check Firestore Console

1. Go to Firestore Database in Firebase Console
2. Look for `shop_activities` collection
3. Verify test activity was created
4. Check that indexes show as "Enabled"

### Test Queries

```typescript
// Test vendor query (uses vendorId + timestamp index)
const q = query(
  collection(db, 'shop_activities'),
  where('vendorId', '==', 'test-vendor-id'),
  orderBy('timestamp', 'desc'),
  limit(10)
);

const snapshot = await getDocs(q);
console.log(`Found ${snapshot.size} activities`);
```

## Step 6: Set Up Automated Cleanup

### Option A: Cloud Scheduler (Recommended)

```bash
# Create a Cloud Function for cleanup
firebase deploy --only functions:cleanupOldShopActivities

# Schedule it to run monthly
gcloud scheduler jobs create http cleanup-shop-activities \
  --schedule="0 0 1 * *" \
  --uri="https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/cleanupOldShopActivities" \
  --http-method=POST
```

### Option B: Manual Cron Job

Add to your server's crontab:

```cron
# Run cleanup on 1st of every month at 2 AM
0 2 1 * * cd /path/to/project && npx ts-node scripts/cleanup-old-shop-activities.ts >> /var/log/shop-activities-cleanup.log 2>&1
```

### Option C: Manual Execution

```bash
# Run cleanup manually when needed
npx ts-node scripts/cleanup-old-shop-activities.ts --dry-run
npx ts-node scripts/cleanup-old-shop-activities.ts
```

## Troubleshooting

### Index Build Fails

**Problem**: Index shows "Error" state

**Solutions**:
1. Check for conflicting indexes
2. Verify field names match exactly
3. Delete failed index and redeploy
4. Check Firebase quota limits

### Queries Still Slow

**Problem**: Queries timeout or take too long

**Solutions**:
1. Verify indexes are "Enabled" (not "Building")
2. Check query uses indexed fields
3. Add `.explain()` to query to see execution plan
4. Consider adding more specific indexes

### Security Rules Block Writes

**Problem**: Activities not being created

**Solutions**:
1. Check browser console for permission errors
2. Verify rules allow `create: if true`
3. Test rules in Firebase Console Rules Playground
4. Check for typos in collection name

### Missing Indexes Warning

**Problem**: Console shows "Missing index" warnings

**Solutions**:
1. Click the provided link to create index
2. Or add to `firestore.indexes.json` and redeploy
3. Wait for index to build before querying

## Rollback Procedure

If you need to rollback:

### Rollback Indexes

```bash
# Revert firestore.indexes.json to previous version
git checkout HEAD~1 firestore.indexes.json

# Deploy old indexes
firebase deploy --only firestore:indexes
```

### Rollback Rules

```bash
# Revert firestore.rules to previous version
git checkout HEAD~1 firestore.rules

# Deploy old rules
firebase deploy --only firestore:rules
```

### Delete Collection (if needed)

```bash
# Use Firebase Console or CLI
firebase firestore:delete shop_activities --recursive
```

## Post-Deployment Checklist

- [ ] All indexes show as "Enabled" in Firebase Console
- [ ] Security rules deployed successfully
- [ ] Test activity logging works
- [ ] Test vendor queries work
- [ ] Test product queries work
- [ ] Cleanup script tested with --dry-run
- [ ] Automated cleanup scheduled (if using)
- [ ] Documentation updated
- [ ] Team notified of changes

## Monitoring

Set up monitoring for:

1. **Index Performance**
   - Query latency
   - Index usage statistics

2. **Write Performance**
   - Activities created per second
   - Failed write rate

3. **Storage Growth**
   - Collection size over time
   - Cleanup effectiveness

4. **Error Rates**
   - Permission denied errors
   - Query timeout errors

## Support

For issues during deployment:

1. Check Firebase Console for error messages
2. Review Firebase CLI logs
3. Test in Firebase Emulator first
4. Contact Firebase Support if needed

## Related Documentation

- [Shop Activities Collection](./SHOP_ACTIVITIES_COLLECTION.md)
- [Firebase Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
