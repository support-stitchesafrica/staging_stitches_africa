# Coupon System Testing Guide

## Test Scenarios

### Test 1: Percentage Discount Coupon
**Setup:**
1. Go to Atlas Dashboard → Coupons
2. Create new coupon:
   - Discount Type: Percentage
   - Discount Value: 10
   - Assigned Email: test@example.com
   - Min Order: (leave empty)
   - Expiry: (future date)

**Test:**
1. Login as test@example.com
2. Add items to cart (total > $10)
3. Go to checkout
4. Enter coupon code
5. Click "Apply"

**Expected Results:**
- ✅ Success toast appears: "Coupon applied! You saved $X.XX (10% off)"
- ✅ Order summary shows "Coupon Discount" line with -$X.XX
- ✅ Total amount reduces by 10%
- ✅ Green success banner shows with coupon code
- ✅ DiscountSummary component displays with celebration message

---

### Test 2: Fixed Amount Discount (NGN to USD Conversion)
**Setup:**
1. Create new coupon:
   - Discount Type: Fixed Amount
   - Discount Value: 3000 (₦3000)
   - Assigned Email: test@example.com

**Test:**
1. Add items to cart (total > $10)
2. Apply coupon at checkout

**Expected Results:**
- ✅ Success toast shows: "Coupon applied! You saved $2.00 ($2.00 off)"
- ✅ Discount calculated as: 3000 / 1500 = $2.00
- ✅ Order total reduces by $2.00
- ✅ If order total is $15, final total should be $13.00

**Calculation:**
```
₦3000 ÷ 1500 (conversion rate) = $2.00 USD
```

---

### Test 3: Invalid Coupon Code
**Test:**
1. Enter "INVALID-CODE"
2. Click "Apply"

**Expected Results:**
- ✅ Error toast appears: "Coupon code not found. Please check and try again."
- ✅ Red error message shows below input
- ✅ Order total remains unchanged

---

### Test 4: Wrong Email
**Setup:**
1. Create coupon for user1@example.com
2. Login as user2@example.com

**Test:**
1. Try to apply the coupon

**Expected Results:**
- ✅ Error toast: "This coupon is not valid for your account."
- ✅ Order total unchanged

---

### Test 5: Minimum Order Not Met
**Setup:**
1. Create coupon:
   - Discount: 10%
   - Min Order: 15000 (₦15,000 = $10 USD)

**Test:**
1. Add items totaling $8
2. Apply coupon

**Expected Results:**
- ✅ Error toast: "Order total must be at least $10.00 to use this coupon."
- ✅ Order total unchanged

---

### Test 6: Expired Coupon
**Setup:**
1. Create coupon with expiry date in the past

**Test:**
1. Try to apply coupon

**Expected Results:**
- ✅ Error toast: "This coupon has expired."
- ✅ Order total unchanged

---

### Test 7: Already Used Coupon
**Setup:**
1. Create coupon with usage limit: 1
2. Complete one order with the coupon

**Test:**
1. Try to use same coupon again

**Expected Results:**
- ✅ Error toast: "This coupon has already been used."
- ✅ Order total unchanged

---

### Test 8: Empty Coupon Code
**Test:**
1. Click "Apply" without entering code

**Expected Results:**
- ✅ Error toast: "Please enter a coupon code"
- ✅ Red error message below input

---

### Test 9: Remove Applied Coupon
**Test:**
1. Apply valid coupon
2. Click "X" button to remove

**Expected Results:**
- ✅ Success toast: "Coupon removed"
- ✅ Order total returns to original amount
- ✅ Coupon discount line disappears
- ✅ Input field reappears

---

### Test 10: Coupon with Voucher
**Test:**
1. Apply a coupon (10% off)
2. Apply a SureGifts voucher

**Expected Results:**
- ✅ Coupon discount applies first
- ✅ Voucher applies to discounted amount
- ✅ Both discounts show in breakdown
- ✅ Final total is correct

**Example:**
```
Original Total: $100
Coupon (10%): -$10
After Coupon: $90
Voucher: -$50
Final Total: $40
```

---

## Visual Checks

### Order Summary Display
```
Order Summary
─────────────────────────
Subtotal (3 items)    $100.00
Shipping              $10.00
Tax                   $7.50
Coupon Discount       -$10.00  ← Green text
─────────────────────────
Total                 $107.50  ← Bold
```

### Success State
```
┌─────────────────────────────────────┐
│ ✓ Coupon Applied                    │
│   STIT-ABC123                       │
│                          10% OFF    │
│                               [X]   │
└─────────────────────────────────────┘
```

### Discount Summary
```
┌─────────────────────────────────────┐
│ ✓ Coupon Applied Successfully!      │
│   STIT-ABC123              10% OFF  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏷️ Discount Applied                 │
│                                     │
│ Original Total        $117.50       │
│ Discount (10%)        -$10.00       │
│ ─────────────────────────────       │
│ You Pay               $107.50       │
│                                     │
│ 🎉 You're saving $10.00! 🎉         │
└─────────────────────────────────────┘
```

---

## Browser Console Checks

### No Errors
- ✅ No HTML validation warnings
- ✅ No React warnings about nested elements
- ✅ No Firebase errors about "Description, packaging ID, and items are required"

### Network Requests
1. **POST /api/shops/coupons/validate**
   - Status: 200 OK
   - Response includes: `{ valid: true, discountAmount, finalAmount, coupon }`

2. **POST /api/shops/coupons/apply** (after payment)
   - Status: 200 OK
   - Called only after successful payment

---

## Admin Dashboard Checks

### Creating Coupon
1. ✅ Currency symbol shows ₦ for fixed amounts
2. ✅ Info message displays: "Fixed amounts are entered in Naira (₦) and automatically converted to USD at checkout"
3. ✅ Percentage shows % symbol
4. ✅ Form validation works

### Coupon List
1. ✅ Shows all coupons
2. ✅ Status badges display correctly
3. ✅ Usage count updates after use
4. ✅ Can edit/delete coupons

---

## Edge Cases

### Test 11: Discount Exceeds Order Total
**Setup:**
1. Create fixed coupon: ₦150,000 (= $100 USD)
2. Order total: $50

**Expected:**
- ✅ Discount capped at order total
- ✅ Final amount: $0.00 (not negative)

### Test 12: Very Small Discount
**Setup:**
1. Create fixed coupon: ₦100 (= $0.07 USD)

**Expected:**
- ✅ Discount applies correctly
- ✅ Toast shows: "You saved $0.07"

### Test 13: Multiple Rapid Clicks
**Test:**
1. Click "Apply" button multiple times quickly

**Expected:**
- ✅ Button disables during validation
- ✅ Only one API call made
- ✅ No duplicate toasts

---

## Performance Checks

1. ✅ Coupon validation completes in < 1 second
2. ✅ UI updates immediately after validation
3. ✅ No layout shifts when discount appears
4. ✅ Toast animations smooth

---

## Mobile Testing

1. ✅ Coupon input responsive
2. ✅ Toast notifications visible
3. ✅ Order summary readable
4. ✅ Buttons accessible
5. ✅ Keyboard opens for input

---

## Accessibility Checks

1. ✅ Error messages announced by screen readers
2. ✅ Success messages announced
3. ✅ Form labels properly associated
4. ✅ Keyboard navigation works
5. ✅ Color contrast sufficient (green/red text)

---

## Conversion Rate Verification

**Formula:** `USD = NGN / 1500`

| NGN Amount | USD Equivalent |
|------------|----------------|
| ₦1,500     | $1.00          |
| ₦3,000     | $2.00          |
| ₦7,500     | $5.00          |
| ₦15,000    | $10.00         |
| ₦30,000    | $20.00         |
| ₦75,000    | $50.00         |
| ₦150,000   | $100.00        |

---

## Known Limitations

1. **Fixed Conversion Rate:** Currently using 1 USD = 1500 NGN. This should be updated to use real-time rates in production.

2. **Currency Display:** All prices display in USD at checkout, even if user's local currency is different.

3. **Historical Accuracy:** If conversion rate changes, old coupons will use new rate. Consider storing rate with coupon for historical accuracy.

---

## Troubleshooting

### Issue: Toast not showing
**Solution:** Check that `sonner` Toaster component is in layout

### Issue: Discount not calculating
**Solution:** Check browser console for API errors

### Issue: Wrong discount amount
**Solution:** Verify conversion rate (1500) is correct

### Issue: Coupon not applying
**Solution:** Check email matches exactly (case-insensitive)
