# Manual Product ID Replacement Guide

## ✅ Successfully Found Products

1. **OUCH SNEAKERS** → `pSweDumvbBJJw8OmQ5NW` (OUCH-Daily with Denim Cargo Pants)

## ❌ Products Still Needing Manual Replacement

### How to Find Product IDs Manually

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: stitches-africa
3. **Navigate to Firestore Database**
4. **Browse the `tailor_works` collection**
5. **Search for products using the search terms below**
6. **Copy the document ID** (the random string like `pSweDumvbBJJw8OmQ5NW`)

### Products to Find:

#### 2. TRAX PANTS WIDE LEG PANT
- **Search terms**: "TRAX", "wide leg", "pant"
- **Replace**: `REPLACE_WITH_TRAX_WIDE_LEG_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts` (line ~32)

#### 3. TRAX PANTS SPLATTERED SHORTS  
- **Search terms**: "TRAX", "splattered", "shorts"
- **Replace**: `REPLACE_WITH_TRAX_SHORTS_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts` (line ~45)

#### 4. HAUTE AFRIKANA AKWETE MAXI DRESS
- **Search terms**: "HAUTE AFRIKANA", "akwete", "maxi dress"
- **Replace**: `REPLACE_WITH_AKWETE_DRESS_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts` (line ~58)

#### 5. NANCY HANSON SILENT POWER TOP
- **Search terms**: "NANCY HANSON", "silent power", "top"
- **Replace**: `REPLACE_WITH_SILENT_POWER_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts` (line ~71)

#### 6. NANCY HANSON PEARL NEUTRAL
- **Search terms**: "NANCY HANSON", "pearl neutral"
- **Replace**: `REPLACE_WITH_PEARL_NEUTRAL_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts` (line ~84)

#### 7. IYANGA WOMAN AINA DRESS
- **Search terms**: "IYANGA", "aina dress"
- **Replace**: `REPLACE_WITH_AINA_DRESS_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts` (line ~97)

#### 8. TTDALK LONG WALLET ($96)
- **Search terms**: "TTDALK", "wallet", "long wallet"
- **Replace**: `REPLACE_WITH_TTDALK_WALLET_ID`
- **File**: Multiple locations - this is the free product for multiple mappings

#### 9. SEQUIN PURSE
- **Search terms**: "sequin", "purse"
- **Replace**: `REPLACE_WITH_SEQUIN_PURSE_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts`

#### 10. LOLA CANDY
- **Search terms**: "LOLA", "candy"
- **Replace**: `REPLACE_WITH_LOLA_CANDY_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts`

#### 11. LOLA BEAD BAG
- **Search terms**: "LOLA", "bead bag"
- **Replace**: `REPLACE_WITH_LOLA_BEAD_BAG_ID`
- **File**: `lib/bogo/configure-specific-mappings.ts`

## Quick Replacement Process

1. Find the product ID in Firestore
2. Open `lib/bogo/configure-specific-mappings.ts`
3. Use Ctrl+F (or Cmd+F) to find the placeholder ID
4. Replace with the actual product ID
5. Save the file

## Verification

After replacing all IDs, run the integration tests to verify:
```bash
npm test lib/bogo/specific-mappings-integration.test.ts
```

## Alternative: Use Firestore Console Export

If you have many products to find:
1. Go to Firestore Console
2. Export the `tailor_works` collection as JSON
3. Search the JSON file for product titles
4. Extract the document IDs

## Status Tracking

- [x] OUCH SNEAKERS → `pSweDumvbBJJw8OmQ5NW`
- [ ] TRAX PANTS WIDE LEG PANT
- [ ] TRAX PANTS SPLATTERED SHORTS  
- [ ] HAUTE AFRIKANA AKWETE MAXI DRESS
- [ ] NANCY HANSON SILENT POWER TOP
- [ ] NANCY HANSON PEARL NEUTRAL
- [ ] IYANGA WOMAN AINA DRESS
- [ ] TTDALK LONG WALLET
- [ ] SEQUIN PURSE
- [ ] LOLA CANDY
- [ ] LOLA BEAD BAG