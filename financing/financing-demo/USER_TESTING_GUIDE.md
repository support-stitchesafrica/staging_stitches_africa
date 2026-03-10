# User Testing Guide - Financing Simulator

This guide helps you test all features of the financing simulator systematically.

## Test Scenarios

### Scenario 1: New User - Low Credit Tier

**Objective**: Test the complete flow for a new user with basic income

**Steps**:
1. Open the application
2. Browse products in the catalog
3. Add 2-3 products to cart (Total: ~$500)
4. Click cart icon and proceed to checkout
5. Click "Finance This Purchase"
6. Fill KYC form with:
   - Monthly Income: $1,200
   - Employment: Employed
   - Valid ID information
7. Submit form
8. Verify credit limit: **$500** (New User tier)
9. Select **3-month plan (0% interest)**
10. Confirm plan
11. Verify repayment schedule
12. Go to dashboard
13. Verify loan appears with correct details

**Expected Results**:
- Credit Tier: "New User"
- Credit Limit: $500
- Order should be approved if total ≤ $500
- Dashboard shows 1 active loan

---

### Scenario 2: Verified User - Medium Credit Tier

**Objective**: Test mid-tier credit approval

**Steps**:
1. Clear browser data (or use incognito mode)
2. Browse and add products totaling ~$1,500
3. Proceed to checkout → Finance This Purchase
4. Fill KYC with:
   - Monthly Income: $2,000
   - Employment: Employed
5. Verify credit limit: **$2,000** (Verified User)
6. Select **6-month plan (5% interest)**
7. Confirm and verify interest calculation
8. Check dashboard for accurate monthly payment

**Expected Results**:
- Credit Tier: "Verified User"
- Credit Limit: $2,000
- Interest calculated correctly (5% on total)
- Monthly payment = Total × 1.05 ÷ 6

---

### Scenario 3: Trusted User - High Credit Tier

**Objective**: Test premium user experience

**Steps**:
1. Clear browser data
2. Add expensive items totaling ~$3,500
3. Finance the purchase
4. KYC form:
   - Monthly Income: $4,500
   - Employment: Employed or Self-Employed
5. Verify credit limit: **$5,000** (Trusted User)
6. Select **12-month plan (10% interest)**
7. Verify total with interest
8. Complete checkout

**Expected Results**:
- Credit Tier: "Trusted User"
- Credit Limit: $5,000
- Order approved for amounts up to $5,000
- Interest: 10%

---

### Scenario 4: Credit Limit Exceeded

**Objective**: Test rejection when order exceeds credit

**Steps**:
1. Create user with $500 credit (New User)
2. Add products totaling $700
3. Attempt to finance
4. Verify error message

**Expected Results**:
- Error: "Order exceeds your available credit limit"
- User redirected to catalog
- No loan created

---

### Scenario 5: Multiple Active Loans

**Objective**: Test credit utilization

**Steps**:
1. Create Trusted User ($5,000 limit)
2. Finance first order for $2,000
3. Go back to catalog
4. Add more products ($1,500)
5. Finance second order
6. Check dashboard

**Expected Results**:
- First loan: $2,000 (reduces available credit to $3,000)
- Second loan: $1,500 (reduces available credit to $1,500)
- Dashboard shows 2 active loans
- Available credit: $1,500

---

### Scenario 6: Making Payments

**Objective**: Test payment processing

**Steps**:
1. Create a loan with $300 total, 3-month plan ($100/month)
2. Go to dashboard
3. Click "Make Payment" on the loan
4. Enter amount: $100
5. Select payment method
6. Submit payment
7. Verify updates

**Expected Results**:
- Remaining balance decreases by $100
- Progress bar updates (33% → 66% → 100%)
- Payments remaining decreases by 1
- Next payment date updates
- Payment appears in loan history

---

### Scenario 7: Full Loan Repayment

**Objective**: Test credit restoration

**Steps**:
1. Create loan for $500
2. Make payments until balance = $0
3. Verify loan status changes to "Completed"
4. Check available credit

**Expected Results**:
- Loan status: "Completed"
- Original credit limit fully restored
- Can finance new purchases up to full limit

---

### Scenario 8: Interest Calculation Verification

**Objective**: Verify correct interest on all plans

**Test Data**:
Order Total: $1,000

**Expected Calculations**:

| Plan | Interest | Total | Monthly Payment |
|------|----------|-------|-----------------|
| 3 months | 0% | $1,000.00 | $333.33 |
| 6 months | 5% | $1,050.00 | $175.00 |
| 9 months | 8% | $1,080.00 | $120.00 |
| 12 months | 10% | $1,100.00 | $91.67 |

**Steps**:
1. Add items totaling exactly $1,000
2. View all financing plans
3. Verify calculations match table above

---

### Scenario 9: Pay in Full Option

**Objective**: Test non-financing checkout

**Steps**:
1. Add products to cart
2. Proceed to checkout
3. Click "Pay in Full"
4. Verify success message
5. Cart should be cleared
6. No loan created

**Expected Results**:
- Success notification appears
- Cart emptied
- User returned to catalog
- No entry in dashboard

---

### Scenario 10: Navigation Flow

**Objective**: Test all navigation paths

**Steps**:
1. Start at catalog
2. Add items → View cart
3. Return to catalog (back button/logo)
4. Go to dashboard
5. Return to catalog
6. Verify all routes work

**Expected Results**:
- Smooth transitions between views
- Cart count persists
- Credit banner shows on catalog
- All buttons functional

---

## Edge Cases to Test

### Edge Case 1: Empty Cart Checkout
- Attempt checkout with 0 items
- Expected: Checkout button disabled

### Edge Case 2: Partial Payment
- Make payment less than monthly amount
- Expected: Accepts any amount, updates accordingly

### Edge Case 3: Overpayment
- Pay more than remaining balance
- Expected: Accepts payment, completes loan

### Edge Case 4: Browser Refresh
- Refresh page at any step
- Expected: Data persists (LocalStorage)

### Edge Case 5: Clear Browser Data
- Clear LocalStorage
- Expected: App resets to initial state

---

## Data Persistence Test

**Objective**: Verify LocalStorage functionality

**Steps**:
1. Complete a full financing flow
2. Close browser completely
3. Reopen and navigate to app
4. Check if:
   - User profile persists
   - Active loans persist
   - Credit limit shows correctly
   - Dashboard data intact

**Expected**: All data persists across sessions

---

## Mobile Responsiveness Test

**Devices to Test**:
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)
- Desktop (Chrome, Firefox, Safari)

**Check**:
- Layout adjusts properly
- Buttons are tappable
- Forms are usable
- No horizontal scroll
- Text is readable

---

## Browser Compatibility

**Test on**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Verify**:
- All features work
- Styling consistent
- No console errors
- LocalStorage works

---

## Performance Test

**Metrics to Check**:
1. Page load time: Should be < 2 seconds
2. Navigation: Instant (no page reloads)
3. Form submission: Immediate feedback
4. Cart updates: Real-time

**Tools**:
- Chrome DevTools → Network tab
- Lighthouse audit
- PageSpeed Insights

**Expected Scores**:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+

---

## Bug Report Template

When you find issues, report using this format:

```
**Bug Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: [What should happen]

**Actual Result**: [What actually happened]

**Browser/Device**: [e.g., Chrome 120 on Windows 11]

**Screenshots**: [If applicable]

**Console Errors**: [Copy any errors from browser console]
```

---

## Success Criteria

The app passes testing if:
- ✅ All 10 scenarios complete successfully
- ✅ All edge cases handled gracefully
- ✅ Data persists across sessions
- ✅ Responsive on all devices
- ✅ Works in all major browsers
- ✅ No console errors
- ✅ Performance scores > 90

---

## Quick Test Checklist

Use this for rapid smoke testing:

- [ ] Products display in catalog
- [ ] Add to cart works
- [ ] Cart count updates
- [ ] Checkout flow works
- [ ] KYC form submits
- [ ] Credit tier assigned correctly
- [ ] Financing plans display
- [ ] Plan selection works
- [ ] Order confirmation shows
- [ ] Dashboard displays loans
- [ ] Payment processing works
- [ ] Credit limit updates
- [ ] All buttons functional
- [ ] No broken images
- [ ] Mobile responsive
- [ ] Data persists

---

**Happy Testing!** 🧪

Report all findings to the development team for improvements.
