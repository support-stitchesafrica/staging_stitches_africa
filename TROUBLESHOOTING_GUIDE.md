# Troubleshooting Guide - Agent Dashboard & Add to Cart

## Quick Diagnostics

### Issue 1: Products Not Showing in Vendor Details

**Symptoms**:
- Vendor details page loads but Products tab is empty
- Console shows "Products found: 0"

**Diagnostic Steps**:

1. **Check Firestore Data Structure**
   ```javascript
   // Open browser console on vendor details page
   // Check the console logs for:
   console.log('Tailor ID:', tailorId);
   console.log('Products found:', worksSnapshot.size);
   ```

2. **Verify Field Name**
   - The relationship uses `tailor_id` (with underscore)
   - NOT `tailorId` (camelCase)
   - Check your Firestore data to ensure products have `tailor_id` field

3. **Check API Response**
   - Open DevTools → Network tab
   - Navigate to vendor details page
   - Find the API call to `/api/agent/tailors/[id]`
   - Check the response:
     ```json
     {
       "success": true,
       "data": {
         "products": [...],  // Should have products here
         "totalProducts": 5  // Should show count
       }
     }
     ```

4. **Verify Products Exist**
   - Go to Firebase Console
   - Open Firestore Database
   - Navigate to `tailor_works` collection
   - Find products where `tailor_id` matches your vendor ID
   - Example document:
     ```json
     {
       "product_id": "abc123",
       "tailor_id": "2TaLExinAfPo4PiAs57Hrbwyy0O2",  // ← Must match vendor ID
       "title": "Product Name",
       "is_disabled": false
     }
     ```

**Common Fixes**:

- **Wrong Field Name**: If products use `tailorId` instead of `tailor_id`, update the API query
- **No Products**: Create test products for the vendor
- **Products Disabled**: Check if `is_disabled` is set to `true`

---

### Issue 2: Add to Cart Button Not Responding

**Symptoms**:
- Button doesn't show loading state
- No toast notification appears
- Items not added to cart

**Diagnostic Steps**:

1. **Check Console for Errors**
   ```javascript
   // Open browser console
   // Look for errors like:
   // - "addItem is not a function"
   // - "Cannot read property 'title' of undefined"
   // - Any red error messages
   ```

2. **Verify Button State**
   ```javascript
   // Add this temporarily to the button onClick:
   console.log('Button clicked!');
   console.log('addingToCart:', addingToCart);
   console.log('isDisabled:', isAddToCartDisabled());
   ```

3. **Check Cart Context**
   - Verify `useCart()` hook is working
   - Check if `addItem` function exists
   - Verify cart context is properly initialized

4. **Test Loading State**
   ```javascript
   // In browser console, manually trigger:
   setAddingToCart(true);
   // Button should show "ADDING..." with spinner
   ```

**Common Fixes**:

- **Cache Issue**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- **Build Issue**: Restart Next.js dev server
- **Missing Import**: Verify `Loader2` is imported from `lucide-react`
- **State Not Updating**: Check if React is re-rendering properly

---

### Issue 3: Enable/Disable Button Not Working

**Symptoms**:
- Button click doesn't open dialog
- Console shows "canManageTailors: false"
- Permission error toast appears

**Diagnostic Steps**:

1. **Check Agent Permissions**
   ```javascript
   // In browser console on vendor details page:
   console.log('canManageTailors:', canManageTailors);
   console.log('hasPermission:', hasPermission('manage_tailors'));
   ```

2. **Verify Agent User Document**
   - Go to Firebase Console → Firestore
   - Navigate to `agents` collection
   - Find document with email `agent@stitchesafrica.com`
   - Check `permissions` array:
     ```json
     {
       "email": "agent@stitchesafrica.com",
       "permissions": [
         "view_tailors",
         "manage_tailors",  // ← Must be present
         "view_products",
         "manage_products"
       ]
     }
     ```

3. **Re-run Setup Script**
   ```bash
   npx ts-node scripts/create-agent-user.ts
   ```

4. **Check Authentication**
   - Verify you're logged in as agent user
   - Check localStorage for agent token
   - Try logging out and back in

**Common Fixes**:

- **Missing Permission**: Run `scripts/create-agent-user.ts` to add permission
- **Wrong User**: Ensure you're logged in as `agent@stitchesafrica.com`
- **Stale Session**: Log out and log back in
- **Firestore Rules**: Deploy rules with `firebase deploy --only firestore:rules`

---

## Step-by-Step Testing

### Test 1: Verify Products Load

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `/agent/dashboard/vendors`
4. Click on any vendor
5. Look for console logs:
   ```
   === LOADING VENDOR DETAILS ===
   Vendor ID: 2TaLExinAfPo4PiAs57Hrbwyy0O2
   API Response status: 200
   Vendor data: {...}
   Products: [...]
   Total products: 5
   ```

6. Click on "Products" tab
7. Should see product grid with images and details

**If products don't show**:
- Check console for "Products found: 0"
- Verify `tailor_id` field exists in Firestore
- Check API response in Network tab

### Test 2: Verify Add to Cart

1. Navigate to any product page: `/shops/products/[id]`
2. Select size (if required)
3. Select color (if required)
4. Open browser console
5. Click "ADD TO BAG" button
6. Watch for:
   - Button text changes to "ADDING..."
   - Spinner icon appears
   - Button becomes gray/disabled
   - Toast notification appears
   - Button returns to normal after ~600ms

**If button doesn't respond**:
- Check console for errors
- Verify `addingToCart` state changes
- Check if `addItem` function is called
- Hard refresh browser (Ctrl+Shift+R)

### Test 3: Verify Enable/Disable

1. Navigate to vendor details page
2. Open browser console
3. Type: `console.log('canManageTailors:', canManageTailors)`
4. Should show `true`
5. Click "Disable Vendor" or "Enable Vendor" button
6. Dialog should open
7. Confirm action
8. Watch for:
   - Success toast notification
   - Button changes appearance
   - Product count in message

**If button doesn't work**:
- Check console for permission error
- Run `scripts/create-agent-user.ts`
- Log out and back in
- Verify Firestore rules are deployed

---

## Common Issues & Solutions

### Issue: "params is a Promise" Error

**Solution**: Already fixed in all API routes. If you still see this:
```bash
# Restart Next.js dev server
npm run dev
# or
yarn dev
```

### Issue: Products Show as Empty Array

**Solution**: Check Firestore field name
```javascript
// In Firestore, products must have:
{
  "tailor_id": "vendor-id-here",  // ← underscore, not camelCase
  "is_disabled": false
}
```

### Issue: Add to Cart Button Frozen

**Solution**: Clear browser cache and hard refresh
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or press Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
```

### Issue: Permission Denied

**Solution**: Update agent permissions
```bash
# Run this script to fix permissions
npx ts-node scripts/create-agent-user.ts

# Then log out and back in
```

### Issue: Firestore Rules Error

**Solution**: Deploy updated rules
```bash
firebase deploy --only firestore:rules
```

---

## Debug Mode

Add these console logs temporarily to debug:

### In Vendor Details Page (`app/agent/dashboard/vendors/[id]/page.tsx`)

```typescript
// Add after loadTailor function
useEffect(() => {
  console.log('=== VENDOR DETAILS DEBUG ===');
  console.log('Tailor:', tailor);
  console.log('Products:', tailor?.products);
  console.log('Total Products:', tailor?.totalProducts);
  console.log('Can Manage:', canManageTailors);
}, [tailor, canManageTailors]);
```

### In Product Page (`app/shops/products/[id]/page.tsx`)

```typescript
// Add in button onClick
onClick={async () => {
  console.log('=== ADD TO CART DEBUG ===');
  console.log('Product:', product);
  console.log('Quantity:', quantity);
  console.log('Options:', selectedOptions);
  console.log('Adding to cart...');
  
  try {
    setAddingToCart(true);
    console.log('State set to true');
    // ... rest of code
  }
}}
```

---

## Contact Support

If issues persist after trying all solutions:

1. **Provide Console Logs**: Copy all console output
2. **Provide Network Tab**: Screenshot of API calls
3. **Provide Firestore Data**: Screenshot of relevant documents
4. **Provide Steps**: Exact steps to reproduce the issue

This will help diagnose the specific problem in your environment.
