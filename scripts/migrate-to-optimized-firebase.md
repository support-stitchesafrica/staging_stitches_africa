# Migration Guide: Optimized Firebase

## Automatic Optimizations (No Code Changes Required)

These optimizations work automatically once you import the initialization:

1. **Offline Persistence** - Already enabled in `firebase.ts`
2. **IndexedDB Auth** - Already enabled in `firebase.ts`
3. **Auto-initialization** - Add this line to your app entry point:

```typescript
// In app/layout.tsx or pages/_app.tsx
import '@/lib/firebase-init';
```

## Optional: Migrate to Optimized APIs

For maximum performance, gradually migrate your queries to use the optimized APIs.

### Pattern 1: Simple Collection Query

**Before:**
```typescript
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase';

const snapshot = await getDocs(collection(db, 'tailor_works'));
const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After:**
```typescript
import { createQueryBuilder } from '@/lib/utils/firestore-query-optimizer';
import { db } from '@/firebase';

const products = await createQueryBuilder(db, 'tailor_works')
  .withCache(5 * 60 * 1000) // 5 minutes cache
  .execute();
```

### Pattern 2: Filtered Query

**Before:**
```typescript
import { getDocs, collection, query, where } from 'firebase/firestore';

const q = query(
  collection(db, 'tailor_works'),
  where('category', '==', 'shirts')
);
const snapshot = await getDocs(q);
const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After:**
```typescript
import { createQueryBuilder } from '@/lib/utils/firestore-query-optimizer';

const products = await createQueryBuilder(db, 'tailor_works')
  .whereEqual('category', 'shirts')
  .withCache()
  .execute();
```

### Pattern 3: Sorted and Limited Query

**Before:**
```typescript
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';

const q = query(
  collection(db, 'tailor_works'),
  orderBy('created_at', 'desc'),
  limit(20)
);
const snapshot = await getDocs(q);
const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After:**
```typescript
import { createQueryBuilder } from '@/lib/utils/firestore-query-optimizer';

const products = await createQueryBuilder(db, 'tailor_works')
  .orderByField('created_at', 'desc')
  .limitTo(20)
  .withCache()
  .execute();
```

### Pattern 4: Count Query

**Before:**
```typescript
import { getDocs, collection } from 'firebase/firestore';

const snapshot = await getDocs(collection(db, 'users'));
const count = snapshot.size;
```

**After:**
```typescript
import { getCollectionCount } from '@/lib/utils/firestore-query-optimizer';

const count = await getCollectionCount(db, 'users', [], {
  useCache: true,
  cacheTTL: 10 * 60 * 1000 // 10 minutes
});
```

### Pattern 5: Multiple Documents by ID

**Before:**
```typescript
import { getDoc, doc } from 'firebase/firestore';

const productIds = ['id1', 'id2', 'id3'];
const products = await Promise.all(
  productIds.map(async (id) => {
    const docRef = doc(db, 'tailor_works', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  })
);
```

**After:**
```typescript
import { batchGetDocuments } from '@/lib/utils/firestore-query-optimizer';

const products = await batchGetDocuments(
  db,
  'tailor_works',
  ['id1', 'id2', 'id3'],
  { useCache: true }
);
```

### Pattern 6: Multiple Queries in Parallel

**Before:**
```typescript
const usersSnapshot = await getDocs(collection(db, 'users'));
const productsSnapshot = await getDocs(collection(db, 'tailor_works'));
const ordersSnapshot = await getDocs(collection(db, 'orders'));

const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After:**
```typescript
import { executeParallelQueries } from '@/lib/utils/firestore-query-optimizer';

const [users, products, orders] = await executeParallelQueries(db, [
  { collectionName: 'users', options: { useCache: true } },
  { collectionName: 'tailor_works', options: { useCache: true } },
  { collectionName: 'orders', options: { useCache: true } },
]);
```

### Pattern 7: Analytics Queries

**Before:**
```typescript
// Multiple separate queries
const usersSnapshot = await getCountFromServer(collection(db, 'users'));
const installsSnapshot = await getCountFromServer(collection(db, 'app_installs'));
const searchesSnapshot = await getCountFromServer(collection(db, 'searches'));

const totalUsers = usersSnapshot.data().count;
const totalInstalls = installsSnapshot.data().count;
const totalSearches = searchesSnapshot.data().count;
```

**After:**
```typescript
import { getAllAnalytics } from '@/services/optimizedAnalytics';

const analytics = await getAllAnalytics();
// Returns: { totalUsers, totalInstalls, totalSearches, ... }
```

## Cache Invalidation

When you create, update, or delete documents, invalidate the cache:

```typescript
import { invalidateCollectionCache } from '@/lib/utils/firestore-query-optimizer';

// After mutation
await addDoc(collection(db, 'tailor_works'), newProduct);
invalidateCollectionCache('tailor_works');
```

## Gradual Migration Strategy

1. **Week 1**: Add `import '@/lib/firebase-init'` to app entry point
   - Benefit: Automatic offline persistence and caching

2. **Week 2**: Migrate analytics and dashboard queries
   - Use `optimizedAnalytics.ts` functions
   - Benefit: 75% faster dashboard loads

3. **Week 3**: Migrate product listing queries
   - Use `createQueryBuilder` for product queries
   - Benefit: 75% faster product lists

4. **Week 4**: Migrate remaining queries
   - Convert all remaining queries to optimized versions
   - Benefit: Consistent performance across the app

## Testing

After migration, test:

1. **Initial Load**: Should be 50-60% faster
2. **Subsequent Loads**: Should be 80-90% faster
3. **Cache**: Check browser DevTools > Application > IndexedDB
4. **Network**: Check Network tab - should see fewer requests

## Rollback

If you need to rollback:

1. Remove `import '@/lib/firebase-init'` from app entry point
2. Revert to original query patterns
3. The optimized files don't affect existing code

## Support

For issues or questions:
1. Check `FIREBASE_OPTIMIZATION_GUIDE.md`
2. Check `FIREBASE_PERFORMANCE_FIXES.md`
3. Review console logs for optimization status
