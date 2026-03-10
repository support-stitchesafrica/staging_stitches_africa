# Analytics Permissions Fix Summary

## Problem
The UserDashboard component was throwing "Missing or insufficient permissions" errors when trying to access analytics data from Firestore. The errors occurred for these functions:

1. `getTopViewedProducts` (productAnalytics.ts:212)
2. `getTopSearchTerms` (searchAnalytics.ts:90) 
3. `getUsersByCountry` (userLocationAnalytics.ts:67)
4. `getDailyActiveUsersTrend` (activeUserAnalytics.ts:348)
5. `getAverageSessionTime` (sessionAnalytics.ts:116)
6. `getTotalAppUsage` (sessionAnalytics.ts:199)

## Root Cause
The analytics collections accessed by these functions were not defined in `firestore.rules`. When Firestore collections don't have explicit security rules, they default to denying all access.

### Missing Collections in Rules:
- `product_views` - Individual product view records
- `search_analytics` - Aggregated search term statistics  
- `searches` - Individual search records
- `user_session_analytics` - Aggregated user session statistics
- `user_sessions` - Individual session records
- `cart_analytics` - Cart analytics data
- `install_analytics` - App installation analytics

## Solution
Updated `firestore.rules` to add security rules for all analytics collections:

### Added Global Helper Functions:
```javascript
function isAtlasUser() - Checks if user is in atlasUsers collection
function isBackOfficeAnalyticsUser() - Checks if user has analytics permission
function isAnalyticsAdmin() - Checks if user is admin with analytics access
function hasAnalyticsAccess() - Combines all analytics access checks
```

### Added Collection Rules:
- **Read Access**: Atlas users, Admins, Back office users with analytics permission
- **Write Access**: Disabled (only Cloud Functions should write analytics data)
- **Create Access**: Enabled for tracking collections (product_views, searches, user_sessions) to allow anonymous tracking

### Updated Users Collection:
- Added analytics access to users collection for location analytics (getUsersByCountry function)

## Deployment
Successfully deployed the updated rules to Firebase:
```bash
npx firebase deploy --only firestore:rules
```

## Verification
Created test scripts to verify the fix:
- `scripts/test-analytics-access.js` - Tests collection accessibility
- `scripts/create-atlas-user.js` - Creates test Atlas user if needed

All analytics collections are now accessible to authorized users.

## User Access
The UserDashboard is accessed through the Atlas dashboard (`/atlas/(dashboard)/page.tsx`) which requires:
1. Authentication through AtlasAuthGuard
2. Valid Atlas user in `atlasUsers` collection
3. Active status (`isActive: true`)

Existing Atlas users in the system:
- support@stitchesafrica.com (founder)
- pogbu@stitchesafrica.com (brand_lead) 
- cnwanguma@stitchesafrica.com (sales_lead)
- uchinedu@stitchesafrica.com (superadmin)
- fpeters@stitchesafrica.com (founder)

## Testing
To test the fix:
1. Login to `/atlas/auth` with any existing Atlas user credentials
2. Navigate to the dashboard 
3. The UserDashboard should now load analytics data without permission errors

The analytics functions should now work correctly and display data in the dashboard.