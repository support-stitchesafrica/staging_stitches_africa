# VVIP Shoppers Not Showing - Fix Guide

## Issue Summary
The VVIP shoppers page shows "No VVIP shoppers found" even though you have VVIP shoppers. This is due to a mismatch between how VVIP status is stored and how it's being queried.

## Root Cause
There are two different approaches being used in the codebase:

1. **VVIP Status API** (`/api/vvip/status`) - Looks for records in `vvip_shoppers` collection
2. **VVIP Shoppers API** (`/api/marketing/vvip/shoppers`) - Was looking for `isVvip: true` in `users` collection

## Fix Applied
✅ Updated the VVIP shoppers API to use the correct `vvip_shoppers` collection approach, matching the VVIP status API.

## Steps to Resolve

### 1. Check Current VVIP Records
Run this script to see what VVIP records exist in your database:

```bash
npx tsx scripts/check-vvip-shoppers.ts
```

### 2. Create VVIP Status for Your User
If no VVIP records exist, create one for your current user:

```bash
npx tsx scripts/create-vvip-for-current-user.ts
```

This will create a VVIP record for `uchinedu@stitchesafrica.com` in the `vvip_shoppers` collection.

### 3. Verify the Fix
1. Refresh the VVIP shoppers page at `/marketing/vvip/shoppers`
2. You should now see your VVIP shopper record
3. Test the checkout flow to ensure VVIP users see manual payment options

## Database Structure

### VVIP Shoppers Collection (`vvip_shoppers`)
```javascript
{
  userId: "user-firebase-uid",
  email: "user@example.com", 
  name: "User Name",
  status: "active", // or "inactive"
  createdAt: Timestamp,
  createdBy: "creator-uid",
  createdByEmail: "creator@example.com",
  updatedAt: Timestamp,
  metadata: {
    source: "admin_script",
    createdByRole: "system"
  }
}
```

### Users Collection (Referenced for Details)
The system now fetches user details (firstName, lastName, country) from the `users` collection using the `userId` from the VVIP record.

## API Endpoints Fixed

### `/api/marketing/vvip/shoppers` (GET)
- ✅ Now queries `vvip_shoppers` collection instead of `users` collection
- ✅ Fetches user details from `users` collection for display
- ✅ Supports all existing filters (search, country, creator, dateRange)
- ✅ Includes proper error handling and logging

### `/api/vvip/status` (GET)
- ✅ Already working correctly with `vvip_shoppers` collection
- ✅ Used by checkout flow to determine VVIP status

## Testing Checklist

- [ ] Run `npx tsx scripts/check-vvip-shoppers.ts` to verify VVIP records exist
- [ ] Visit `/marketing/vvip/shoppers` page - should show VVIP shoppers
- [ ] Test search functionality on VVIP shoppers page
- [ ] Test filters (country, creator, date range) on VVIP shoppers page
- [ ] Login as VVIP user and go to checkout - should see manual payment option
- [ ] Verify VVIP orders are created correctly when using manual payment

## Troubleshooting

### Still No Shoppers Showing?
1. Check browser console for API errors
2. Check server logs for database query errors
3. Verify Firebase permissions allow reading `vvip_shoppers` collection
4. Ensure marketing user has proper VVIP permissions

### VVIP Status Not Working in Checkout?
1. Verify `/api/vvip/status` endpoint is working
2. Check that VVIP record has `status: "active"`
3. Ensure user is properly authenticated

### Permission Errors?
1. Verify marketing user exists in `marketing_users` collection
2. Check VVIP permission service configuration
3. Ensure proper role assignments

## Files Modified

1. `app/api/marketing/vvip/shoppers/route.ts` - Updated to use `vvip_shoppers` collection
2. `scripts/create-vvip-for-current-user.ts` - New script to create VVIP status
3. `scripts/check-vvip-shoppers.ts` - New script to check existing VVIP records

## Next Steps

After running the scripts and verifying the fix:

1. The VVIP shoppers page should display your VVIP users
2. The checkout flow should work correctly for VVIP users
3. You can create additional VVIP users using the existing script or through the UI

The system is now consistent in using the `vvip_shoppers` collection for all VVIP-related operations.