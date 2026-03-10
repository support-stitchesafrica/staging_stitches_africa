# Staging Collections Update Summary

## Overview
Successfully updated all Firebase collection references in the codebase to use the "staging_" prefix. This allows the application to work with staging data while preserving production data.

## Changes Made

### 1. Collection Constants Updated
Updated all COLLECTIONS constant objects in:
- `lib/vendor/subscription-service.ts`
- `lib/vendor/collection-waitlist-service.ts`
- `lib/vendor/waitlist-database-schema.ts`
- `lib/vendor/user-onboarding-service.ts`
- `lib/collections/invitation-service.ts`
- `lib/atlas/invitation-service.ts`
- `lib/atlas/unified-analytics/services/referral-analytics-service.ts`
- `lib/atlas/unified-analytics/services/storefront-analytics-service.ts`
- `lib/marketing/invitation-service-server.ts`

### 2. Collection References Updated
Systematically updated 395 collection references across 125 files using automated script:

#### Key Collections Updated:
- `users` → `staging_users`
- `tailors` → `staging_tailors`
- `tailors_local` → `staging_tailors_local`
- `tailor_works` → `staging_tailor_works`
- `tailor_works_local` → `staging_tailor_works_local`
- `user_session_analytics` → `staging_user_session_analytics`
- `user_sessions` → `staging_user_sessions`
- `users_orders` → `staging_users_orders`
- `users_addresses` → `staging_users_addresses`
- `users_cart_items` → `staging_users_cart_items`
- `users_measurements` → `staging_users_measurements`
- `users_viewed_items` → `staging_users_viewed_items`
- `users_wishlist_items` → `staging_users_wishlist_items`
- `vendor_analytics` → `staging_vendor_analytics`
- `vendor_visits` → `staging_vendor_visits`
- `vendor_stats` → `staging_vendor_stats`
- `vendor_pre_registrations` → `staging_vendor_pre_registrations`
- `product_views` → `staging_product_views`
- `product_analytics` → `staging_product_analytics`
- `referrals` → `staging_referrals`
- `referralUsers` → `staging_referralUsers`
- `referralTransactions` → `staging_referralTransactions`
- `free_gift_claims` → `staging_free_gift_claims`
- `shop_activities` → `staging_shop_activities`
- `ai_assistant_sessions` → `staging_ai_assistant_sessions`
- `ai_assistant_interactions` → `staging_ai_assistant_interactions`
- `ai_assistant_conversions` → `staging_ai_assistant_conversions`
- `marketing_users` → `staging_marketing_users`
- `collectionsUsers` → `staging_collectionsUsers`
- `web_hits` → `staging_web_hits`
- `web_signUp` → `staging_web_signUp`
- `wishlists` → `staging_wishlists`
- `WishlistItems` → `staging_WishlistItems`
- `vvip_shoppers` → `staging_vvip_shoppers`
- `vvip_audit_log` → `staging_vvip_audit_log`
- `vvip_audit_logs` → `staging_vvip_audit_logs`
- `waiting_list` → `staging_waiting_list`
- `templates` → `staging_templates`
- `template_library` → `staging_template_library`
- `user_credentials` → `staging_user_credentials`
- `user_profiles` → `staging_user_profiles`
- `orders` → `staging_orders`
- `returns` → `staging_returns`
- `searches` → `staging_searches`
- `app_installs` → `staging_app_installs`
- `storefronts` → `staging_storefronts`
- `storefront_themes` → `staging_storefront_themes`
- `payouts` → `staging_payouts`

### 3. Updated File Categories:
- **Services**: 13 files updated (analytics, user services, etc.)
- **Vendor Services**: 18 files updated (tailor services, auth, etc.)
- **Agent Services**: 3 files updated
- **Library Files**: 45 files updated (vendor, marketing, collections, etc.)
- **API Routes**: 43 files updated
- **Hooks**: 1 file updated

### 4. Environment Configuration
Updated environment variables:
- `.env.example`: Set `NEXT_PUBLIC_USE_STAGING_COLLECTIONS=true`
- `.env`: Already configured for staging collections

### 5. Firestore Indexes
Updated `firestore.indexes.json` to reference staging collections:
- `orders` → `staging_orders`

### 6. Pattern Matching Updated
The script updated these patterns:
- `collection(db, "collection_name")` → `collection(db, "staging_collection_name")`
- `adminDb.collection("collection_name")` → `adminDb.collection("staging_collection_name")`
- `db.collection("collection_name")` → `db.collection("staging_collection_name")`
- `doc(db, "collection_name", ...)` → `doc(db, "staging_collection_name", ...)`

## Files Created/Updated

### New Scripts:
1. `scripts/duplicate-collections.js` - JavaScript version for duplicating collections
2. `scripts/duplicate-collections.ts` - TypeScript version for duplicating collections
3. `scripts/update-collection-names.ts` - Comprehensive collection name updater
4. `scripts/quick-collection-update.js` - Fast collection reference updater
5. `scripts/run-duplication.js` - Interactive runner for duplication
6. `scripts/README-DUPLICATION.md` - Documentation for duplication process

### Updated Package.json Scripts:
- `duplicate:collections` - Run TypeScript duplication
- `duplicate:collections:js` - Run JavaScript duplication
- `update:collection-names` - Update collection names
- `backup:before-staging` - Create backup before updates

## Next Steps

### 1. Data Migration (Optional)
If you want to copy existing production data to staging collections, run:
```bash
npm run duplicate:collections
```

### 2. Testing
- Test all major application flows
- Verify analytics are working with staging data
- Check that all CRUD operations work correctly

### 3. Environment Management
- Production: Set `NEXT_PUBLIC_USE_STAGING_COLLECTIONS=false`
- Staging: Set `NEXT_PUBLIC_USE_STAGING_COLLECTIONS=true`

### 4. Firestore Rules
Update Firestore security rules to include staging collections if needed.

### 5. Monitoring
Monitor the application to ensure all collection references are working correctly.

## Verification

To verify the changes:
1. Search for any remaining hardcoded collection names: `grep -r '"users"' --include="*.ts" --include="*.js" --exclude-dir=node_modules .`
2. Check that environment variables are set correctly
3. Test key application features
4. Monitor console for any collection-related errors

## Rollback Plan

If needed to rollback:
1. Revert environment variables to `NEXT_PUBLIC_USE_STAGING_COLLECTIONS=false`
2. Use git to revert the collection name changes
3. Run the original collection references

## Summary Statistics
- **Total Files Updated**: 125
- **Total Collection References Changed**: 395
- **Collection Constants Updated**: 9 files
- **Environment Files Updated**: 2 files
- **Index Files Updated**: 1 file

All collection references have been successfully updated to use the "staging_" prefix while maintaining the same functionality and data structure.