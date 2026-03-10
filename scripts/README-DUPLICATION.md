# Firebase Collection Duplication Scripts

This directory contains scripts to duplicate your Firebase collections with a "staging_" prefix.

## Collections to be duplicated

The following collections will be duplicated:
- `tailors` → `staging_tailors`
- `tailors_local` → `staging_tailors_local`
- `template_library` → `staging_template_library`
- `templates` → `staging_templates`
- `user_credentials` → `staging_user_credentials`
- `user_profiles` → `staging_user_profiles`
- `user_session_analytics` → `staging_user_session_analytics`
- `user_sessions` → `staging_user_sessions`
- `users` → `staging_users`
- `WishlistItems` → `staging_WishlistItems`
- `users_addresses` → `staging_users_addresses`
- `users_cart_items` → `staging_users_cart_items`
- `users_local` → `staging_users_local`
- `users_measurements` → `staging_users_measurements`
- `users_orders` → `staging_users_orders`
- `users_viewed_items` → `staging_users_viewed_items`
- `users_wishlist_items` → `staging_users_wishlist_items`
- `vendor_analytics` → `staging_vendor_analytics`
- `vendor_pre_registrations` → `staging_vendor_pre_registrations`
- `vendor_stats` → `staging_vendor_stats`
- `vendor_visits` → `staging_vendor_visits`
- `vvip_audit_log` → `staging_vvip_audit_log`
- `vvip_audit_logs` → `staging_vvip_audit_logs`
- `vvip_shoppers` → `staging_vvip_shoppers`
- `waiting_list` → `staging_waiting_list`
- `web_hits` → `staging_web_hits`
- `web_signUp` → `staging_web_signUp`
- `wishlists` → `staging_wishlists`

## Prerequisites

1. **Firebase Admin SDK credentials** - Make sure you have one of:
   - Service account key file: `stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json` in project root
   - Environment variable: `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`
   - Environment variable: `FIREBASE_SERVICE_ACCOUNT_KEY`

2. **Node.js and npm** installed

3. **ts-node** for TypeScript execution (optional, JavaScript version available)

## Usage Options

### Option 1: Interactive Runner (Recommended)
```bash
node scripts/run-duplication.js
```
This will ask for confirmation before starting the duplication process.

### Option 2: Direct npm script (TypeScript)
```bash
npm run duplicate:collections
```

### Option 3: Direct npm script (JavaScript)
```bash
npm run duplicate:collections:js
```

### Option 4: Direct execution
```bash
# TypeScript version
npx ts-node scripts/duplicate-collections.ts

# JavaScript version
node scripts/duplicate-collections.js
```

## What the script does

1. **Connects to Firebase** using your admin credentials
2. **Reads all documents** from each source collection
3. **Creates staging collections** with "staging_" prefix
4. **Copies all documents** preserving document IDs and data
5. **Handles subcollections** (nested collections within documents)
6. **Processes in batches** to avoid Firestore limits
7. **Provides progress updates** and error handling
8. **Shows summary** of successful/failed operations

## Features

- ✅ **Batch processing** for better performance
- ✅ **Subcollection support** - copies nested collections too
- ✅ **Error handling** - continues on individual collection failures
- ✅ **Progress tracking** - shows real-time progress
- ✅ **Rate limiting** - includes delays to avoid Firebase limits
- ✅ **Duplicate detection** - removes duplicate collection names
- ✅ **Comprehensive logging** - detailed output for debugging

## Safety Notes

⚠️ **Important Considerations:**

1. **This creates NEW collections** - it doesn't overwrite existing staging collections
2. **Large collections** may take time to duplicate
3. **Firestore costs** apply for read/write operations
4. **Test with small collections first** if you're unsure
5. **Backup your data** before running large operations

## Troubleshooting

### Authentication Issues
- Ensure your service account key is valid and has Firestore permissions
- Check that the project ID matches your Firebase project

### Rate Limiting
- The script includes delays, but very large collections might hit limits
- Consider running during off-peak hours for large datasets

### Memory Issues
- For very large collections, the script processes in batches
- Monitor memory usage during execution

## Customization

To modify which collections are duplicated, edit the `collections` array in either:
- `scripts/duplicate-collections.ts` (TypeScript version)
- `scripts/duplicate-collections.js` (JavaScript version)

## Output Example

```
🚀 Starting Firebase collection duplication...
📊 Collections to process: 25
📋 Collections: tailors, tailors_local, template_library, ...

📋 Processing collection: tailors
   📄 Found 150 documents
   ✅ Committed batch 1/1
   🎉 Successfully duplicated 150 documents to staging_tailors

🔍 Checking for subcollections in tailors...
   📁 Found subcollections in tailors/tailor123:
      - measurements
      ✅ Duplicated 5 documents in subcollection measurements

==================================================
📊 DUPLICATION SUMMARY
==================================================
✅ Successful: 25 collections
❌ Failed: 0 collections
📄 Total documents duplicated: 15,432

🎉 Duplication process completed!
```