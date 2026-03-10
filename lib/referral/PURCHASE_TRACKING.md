# Purchase Commission Tracking

## Overview

This document describes the purchase commission tracking implementation for the referral program. When a referred user makes a purchase, the system automatically awards commission points to their referrer (for the first purchase only).

## Implementation

### API Endpoint

**POST** `/api/referral/track-purchase`

Tracks purchases made by referred users and awards commission to referrers.

**Request Body:**
```json
{
  "refereeId": "firebase-auth-uid",
  "orderId": "order_1234567890",
  "amount": 150.00
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Purchase tracked and commission awarded",
  "awarded": true,
  "referral": {
    "id": "referral-id",
    "referrerId": "referrer-uid",
    "refereeId": "referee-uid"
  }
}
```

**Response (User Not Referred):**
```json
{
  "success": true,
  "message": "Purchase tracked (user was not referred)",
  "awarded": false
}
```

### Integration Point

The endpoint is called from the checkout success handler in `app/shops/checkout/page.tsx`:

```typescript
// Track purchase for referral program
if (user) {
  try {
    await fetch("/api/referral/track-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refereeId: user.uid,
        orderId: `order_${Date.now()}`,
        amount: regularItemsTotalWithShipping,
      }),
    });
  } catch (referralError) {
    // Don't fail the order if referral tracking fails
    console.error("Failed to track referral purchase:", referralError);
  }
}
```

## Commission Calculation

- **Commission Rate:** 5% of purchase amount
- **Points Awarded:** Equal to commission amount (rounded down)
- **Example:** $150 purchase = $7.50 commission = 7 points

## First Purchase Only

The system ensures commission is only awarded for the first purchase:

1. When a purchase is tracked, the system checks the `firstPurchaseDate` field in the referral document
2. If `firstPurchaseDate` is not set, this is the first purchase:
   - Commission points are awarded to the referrer
   - `firstPurchaseDate` is set to current timestamp
   - Referral status is updated to 'converted'
3. If `firstPurchaseDate` is already set:
   - Purchase stats are updated (totalPurchases, totalSpent)
   - No commission points are awarded
   - No transaction record is created

## Data Updates

When a first purchase is tracked, the following updates occur atomically:

### 1. ReferralPurchase Document (Created)
```typescript
{
  id: "auto-generated",
  referrerId: "referrer-uid",
  referralId: "referral-id",
  refereeId: "referee-uid",
  orderId: "order-id",
  amount: 150.00,
  commission: 7.50,
  points: 7,
  status: "completed",
  createdAt: Timestamp
}
```

### 2. ReferralTransaction Document (Created)
```typescript
{
  id: "auto-generated",
  referrerId: "referrer-uid",
  referralId: "referral-id",
  type: "purchase",
  points: 7,
  amount: 150.00,
  description: "Purchase commission from John Doe",
  metadata: {
    refereeEmail: "john@example.com",
    refereeName: "John Doe",
    orderId: "order-id"
  },
  createdAt: Timestamp
}
```

### 3. ReferralUser Document (Updated)
```typescript
{
  totalPoints: increment(7),
  totalRevenue: increment(150.00),
  updatedAt: Timestamp
}
```

### 4. Referral Document (Updated)
```typescript
{
  totalPurchases: increment(1),
  totalSpent: increment(150.00),
  pointsEarned: increment(7),
  status: "converted",
  firstPurchaseDate: Timestamp
}
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Invalid Input:** Returns 400 with descriptive error message
2. **User Not Referred:** Returns 200 with `awarded: false`
3. **Duplicate Purchase:** Idempotency check prevents double-awarding
4. **Firestore Errors:** Logged and returned as 500 errors
5. **Checkout Integration:** Failures don't block order completion

## Requirements Fulfilled

- **Requirement 9.3:** First purchases award commission to referrer
- **Property 21:** First purchases award commission (5% of purchase amount)

## Testing

To test the purchase tracking:

1. Create a referral relationship (user A refers user B)
2. Have user B complete a purchase
3. Verify:
   - Commission points awarded to user A
   - `firstPurchaseDate` set in referral document
   - Transaction and purchase records created
4. Have user B make a second purchase
5. Verify:
   - No commission points awarded
   - Purchase stats updated
   - No new transaction record

## Monitoring

Key metrics to monitor:

- Purchase tracking success rate
- Commission award rate
- Average commission per referral
- Time between signup and first purchase
- Conversion rate (referrals who make purchases)

## Future Enhancements

Potential improvements:

1. **Tiered Commissions:** Different rates based on purchase amount or referrer tier
2. **Recurring Commissions:** Award commission on multiple purchases (not just first)
3. **Bonus Milestones:** Extra points when referee reaches spending thresholds
4. **Purchase Categories:** Different commission rates for different product types
5. **Webhook Integration:** Real-time purchase tracking via payment provider webhooks
