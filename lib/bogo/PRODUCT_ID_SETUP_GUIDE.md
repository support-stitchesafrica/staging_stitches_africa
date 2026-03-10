# BOGO Product ID Setup Guide

## Overview

The BOGO promotion system requires actual product IDs from your Firestore `tailor_works` collection. The current configuration uses placeholder IDs that need to be replaced with real product document IDs before deployment.

## Current Status

❌ **Configuration uses placeholder IDs** - Not ready for production  
✅ **BOGO system implementation** - Complete and tested  
✅ **Integration tests** - All passing with mock data  

## Required Products

You need to find the actual Firestore document IDs for these products:

### Main Products (Customers Buy These)
1. **OUCH SNEAKERS** ($240.00) → Currently: `REPLACE_WITH_OUCH_SNEAKERS_ID`
2. **TRAX PANTS WIDE LEG PANT** → Currently: `REPLACE_WITH_TRAX_WIDE_LEG_ID`
3. **TRAX PANTS SPLATTERED SHORTS** → Currently: `REPLACE_WITH_TRAX_SHORTS_ID`
4. **HAUTE AFRIKANA AKWETE MAXI DRESS** ($120.00) → Currently: `REPLACE_WITH_AKWETE_DRESS_ID`
5. **NANCY HANSON SILENT POWER TOP** ($120.00) → Currently: `REPLACE_WITH_SILENT_POWER_ID`
6. **NANCY HANSON PEARL NEUTRAL** ($78.00) → Currently: `REPLACE_WITH_PEARL_NEUTRAL_ID`
7. **IYANGA WOMAN AINA DRESS** ($366.00) → Currently: `REPLACE_WITH_AINA_DRESS_ID`

### Free Products (Customers Get These Free)
1. **TTDALK LONG WALLET** ($96.00) → Currently: `REPLACE_WITH_TTDALK_WALLET_ID`
2. **BY ORE SEQUIN PURSE** ($79.00) → Currently: `REPLACE_WITH_SEQUIN_PURSE_ID`
3. **LOLA SIGNATURE CANDY** ($108.00) → Currently: `REPLACE_WITH_LOLA_CANDY_ID`
4. **LOLA SIGNATURE EWA BEAD BAG** ($98.00) → Currently: `REPLACE_WITH_LOLA_BEAD_BAG_ID`

## Method 1: Automated Script (Recommended)

Run the automated product finder script:

```bash
npx tsx scripts/find-and-update-bogo-product-ids.ts
```

This script will:
- Search your Firestore `tailor_works` collection
- Find products by title and tags
- Automatically update the configuration file
- Show a summary of found vs missing products

## Method 2: Manual Firestore Search

### Step 1: Access Firestore Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Open the `tailor_works` collection

### Step 2: Find Product IDs
For each product, search by:
- **Title field**: Look for products with matching titles
- **Tags field**: Search for relevant keywords
- **Vendor/Tailor**: Filter by brand names (LOLA SIGNATURE, NANCY HANSON, etc.)

### Step 3: Copy Document IDs
- Firestore document IDs are typically 20-character alphanumeric strings
- Example: `abc123def456ghi789jk`
- Copy the exact document ID (not the title)

### Step 4: Update Configuration
Replace placeholders in `lib/bogo/configure-specific-mappings.ts`:

```typescript
// Before
mainProductId: 'REPLACE_WITH_OUCH_SNEAKERS_ID',

// After (example)
mainProductId: 'abc123def456ghi789jk',
```

## Method 3: Database Query

If you have database access, run these queries:

```sql
-- Search by title (case insensitive)
SELECT id, title FROM tailor_works 
WHERE LOWER(title) LIKE '%ouch sneakers%';

-- Search by tags
SELECT id, title FROM tailor_works 
WHERE tags @> '["ouch", "sneakers"]';
```

## Validation Steps

After updating the product IDs:

### 1. Run Configuration Test
```bash
npx tsx scripts/configure-bogo-mappings.ts
```

### 2. Run Integration Tests
```bash
npx vitest run lib/bogo/specific-mappings-integration.test.ts
```

### 3. Validate Product Existence
```bash
# Check if products exist in Firestore
npx tsx -e "
import { getFirebaseDb } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function checkProduct(id) {
  const db = await getFirebaseDb();
  const docRef = doc(db, 'tailor_works', id);
  const docSnap = await getDoc(docRef);
  console.log(\`\${id}: \${docSnap.exists() ? '✅ EXISTS' : '❌ NOT FOUND'}\`);
}

// Replace with your actual IDs
checkProduct('your-actual-product-id');
"
```

## Common Issues & Solutions

### Issue: Product Not Found
**Symptoms**: Script can't find a product by name
**Solutions**:
- Check exact product title in Firestore
- Try alternative search terms
- Search by vendor/brand name
- Manually browse the collection

### Issue: Multiple Products Match
**Symptoms**: Multiple products with similar names
**Solutions**:
- Use more specific search terms
- Check product prices to identify correct one
- Verify vendor/brand information
- Use exact title match

### Issue: Product ID Format Error
**Symptoms**: Invalid product ID format
**Solutions**:
- Ensure using Firestore document ID (not title)
- Check for extra spaces or characters
- Verify ID is alphanumeric string
- Test ID exists in Firestore

## File Locations

- **Configuration**: `lib/bogo/configure-specific-mappings.ts`
- **Finder Script**: `scripts/find-and-update-bogo-product-ids.ts`
- **Integration Tests**: `lib/bogo/specific-mappings-integration.test.ts`
- **Demo Script**: `scripts/demo-bogo-mappings.ts`

## Production Deployment Checklist

- [ ] All placeholder IDs replaced with real Firestore document IDs
- [ ] Products exist and are accessible in Firestore
- [ ] Configuration script runs without errors
- [ ] Integration tests pass with real product IDs
- [ ] BOGO mappings tested with actual product data
- [ ] Free shipping calculation works correctly
- [ ] Cart behavior validated end-to-end
- [ ] Admin dashboard can manage mappings
- [ ] Analytics tracking configured

## Support

If you encounter issues:

1. **Check Firebase Connection**: Ensure your `.env.local` has correct Firebase config
2. **Verify Permissions**: Ensure your service account can read `tailor_works` collection
3. **Test Product Access**: Manually verify products exist and are accessible
4. **Review Logs**: Check console output for specific error messages

## Next Steps

After setting up real product IDs:

1. **Test in Staging**: Deploy to staging environment first
2. **User Acceptance Testing**: Test complete BOGO flow with real users
3. **Performance Testing**: Ensure system handles expected load
4. **Production Deployment**: Deploy for December 1-31, 2024 promotion
5. **Monitor Analytics**: Track promotion performance and customer behavior

---

**Important**: Do not deploy to production with placeholder IDs. The system will not work correctly without real product IDs from your Firestore database.