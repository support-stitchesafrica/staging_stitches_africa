# VVIP Checkout Testing Guide

## Overview
This guide explains how to test the VVIP checkout functionality that shows manual payment options instead of Stripe/Flutterwave for VVIP users.

## Setup Test User

1. **Create a test user** (if not already exists):
   - Register a new user account on the platform
   - Note down the email address

2. **Make the user VVIP**:
   ```bash
   npx tsx scripts/create-test-vvip-user.ts user-email@domain.com
   ```

## Testing Steps

### 1. Regular User Checkout (Control Test)
1. Log in with a non-VVIP user
2. Add items to cart
3. Go to checkout
4. Verify you see "Pay with Stripe" and "Pay with Flutterwave" buttons
5. Verify the footer shows "Secure checkout powered by Stripe"

### 2. VVIP User Checkout (Main Test)
1. Log in with the VVIP user account
2. Add items to cart
3. Go to checkout (`/shops/checkout`)
4. Complete the shipping address step
5. On the payment step, verify you see:
   - **VVIP Status Banner**: Purple banner showing "VVIP Shopper" status
   - **Manual Payment Option**: "Proceed with Manual Payment" button instead of Stripe/Flutterwave
   - **Footer Text**: "VVIP Manual Payment Available" instead of Stripe text

### 3. VVIP Manual Payment Flow
1. Click "Proceed with Manual Payment"
2. Verify you see:
   - **Bank Transfer Details**: Account information for manual payment
   - **Payment Amount**: Total amount to pay
   - **Reference Number**: Unique reference for the payment
   - **File Upload**: Option to upload payment proof
   - **Notes Field**: Optional additional notes
3. Upload a test image/PDF as payment proof
4. Add optional notes
5. Click "Submit Order"
6. Verify:
   - Success message appears
   - Redirected to success page with `vvip=true` parameter
   - Cart is cleared

## Expected Behavior

### For Regular Users:
- See standard Stripe/Flutterwave payment options
- No VVIP-related UI elements

### For VVIP Users:
- See VVIP status indicator
- Manual payment instructions with bank details
- File upload for payment proof
- No Stripe/Flutterwave buttons
- Different success flow

## Verification Points

1. **VVIP Status Check**: Console should log VVIP status check
2. **UI Conditional Rendering**: Payment section changes based on VVIP status
3. **Manual Payment Submission**: Order data logged to console
4. **Analytics Tracking**: VVIP-specific events tracked
5. **Success Redirect**: Includes VVIP parameters

## Troubleshooting

### User Not Showing as VVIP
- Check if the user exists in Firebase Auth
- Verify the VVIP record was created in Firestore
- Check browser console for API errors

### VVIP Status Not Loading
- Check network tab for `/api/vvip/status` call
- Verify Firebase ID token is being sent
- Check server logs for authentication errors

### Manual Payment Not Working
- Verify file upload validation
- Check console for submission errors
- Ensure all required fields are filled

## Database Verification

Check Firestore collections:
- `vvip_shoppers`: Should contain the test user
- `vvip_audit_log`: Should log the VVIP creation action

## Cleanup

To remove VVIP status from test user:
```bash
# Manual cleanup in Firestore console
# Delete document from vvip_shoppers collection
```

## Notes

- VVIP status is checked on checkout page load
- Manual payment orders have `VVIP-` prefix in order ID
- Payment proof files are validated (type and size)
- All VVIP actions are tracked for analytics