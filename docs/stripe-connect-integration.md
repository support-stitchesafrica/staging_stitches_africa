# Stripe Connect Integration for Vendor Payouts

## Overview

This document describes the Stripe Connect integration that replaces Flutterwave for vendor payouts on Stitches Africa.

## Features

### 1. **Stripe Connect Express Accounts**
- Vendors can create and manage Stripe Connect accounts
- Secure onboarding flow handled by Stripe
- Real-time account status and balance display
- Automatic KYC verification through Stripe

### 2. **Automatic Payouts**
- 80/20 split: Vendors receive 80%, platform keeps 20%
- Payouts triggered automatically when orders are delivered
- Duplicate payout prevention
- Email notifications for successful payouts

### 3. **Payout History**
- Dashboard widget showing recent payouts
- Total earnings summary
- Transaction details with Stripe transfer IDs
- Direct links to Stripe Dashboard

## Architecture

### API Routes

#### `/api/stripe/connect/create-account`
Creates or retrieves a Stripe Connect Express account for a vendor.

**Request:**
```json
{
  "tailorUID": "vendor-123",
  "email": "vendor@example.com",
  "businessName": "Vendor Business",
  "country": "US"
}
```

**Response:**
```json
{
  "accountId": "acct_xxxxx",
  "detailsSubmitted": true,
  "chargesEnabled": true,
  "payoutsEnabled": true
}
```

#### `/api/stripe/connect/account-link`
Generates an onboarding link for vendors to complete their Stripe setup.

**Request:**
```json
{
  "accountId": "acct_xxxxx"
}
```

**Response:**
```json
{
  "url": "https://connect.stripe.com/setup/..."
}
```

#### `/api/stripe/connect/account-status`
Retrieves detailed account status including balance and requirements.

**Request:**
```json
{
  "accountId": "acct_xxxxx"
}
```

**Response:**
```json
{
  "accountId": "acct_xxxxx",
  "email": "vendor@example.com",
  "detailsSubmitted": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "balance": {
    "available": [{ "amount": 10000, "currency": "usd" }],
    "pending": [{ "amount": 5000, "currency": "usd" }]
  },
  "requirements": {
    "currentlyDue": [],
    "eventuallyDue": [],
    "pastDue": [],
    "pendingVerification": []
  }
}
```

#### `/api/stripe/connect/payout-webhook`
Handles automatic payouts when orders are delivered.

**Request:**
```json
{
  "orderId": "order-123",
  "status": "delivered",
  "event": "delivery_confirmed"
}
```

**Response:**
```json
{
  "message": "Payout successful",
  "transferId": "tr_xxxxx",
  "amount": 400.00,
  "currency": "usd"
}
```

### Webhook Flow

1. **Delivery Webhook** → `/api/webhooks/index.ts`
2. **Routes to** → `/api/stripe/connect/payout-webhook`
3. **Validates:**
   - Order is paid
   - Order is delivered
   - Vendor has Stripe account
   - Vendor KYC is complete
   - No duplicate payout
4. **Creates Transfer:**
   - Calculates 80/20 split
   - Creates Stripe transfer to connected account
   - Saves payout record to Firestore
   - Sends email notification

### Data Models

#### Firestore: `tailors` collection
```typescript
{
  stripeConnectAccountId: string;
  stripeAccountCreatedAt: string;
  lastPayout: string;
  totalPayouts: number;
  // ... other fields
}
```

#### Firestore: `payouts` collection
```typescript
{
  tailorId: string;
  orderId: string;
  totalAmount: number;
  vendorAmount: number;
  platformAmount: number;
  stripeTransferId: string;
  stripeAccountId: string;
  status: 'success' | 'failed' | 'pending';
  currency: string;
  createdAt: string;
  deliveredAt: string;
}
```

## Components

### `StripeConnectAccount`
Main component for vendor Stripe account management.

**Props:**
```typescript
{
  tailorUID: string;
  email: string;
  businessName?: string;
  country?: string;
  onSuccess?: () => void;
}
```

**Features:**
- Account creation and onboarding
- Status display with real-time updates
- Balance information
- Requirements alerts
- Direct link to Stripe Dashboard

### `PayoutHistoryWidget`
Dashboard widget showing payout history.

**Props:**
```typescript
{
  tailorUID: string;
  maxItems?: number; // default: 10
}
```

**Features:**
- Total earnings summary
- Recent payouts list
- Status badges
- Transaction details
- Refresh functionality

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=https://staging-stitches-africa.vercel.app
```

### 2. Stripe Dashboard Configuration

1. Enable Stripe Connect in your Stripe Dashboard
2. Configure Connect settings:
   - Account type: Express
   - Capabilities: card_payments, transfers
3. Set up webhook endpoint:
   - URL: `https://staging-stitches-africa.vercel.app/api/stripe/connect/payout-webhook`
   - Events: (handled via custom delivery webhooks)

### 3. Vendor Onboarding Flow

1. Vendor completes KYC verification
2. Vendor navigates to Settings → Account Details
3. Clicks "Connect with Stripe"
4. Redirected to Stripe onboarding
5. Completes Stripe verification
6. Redirected back to settings page
7. Account status displayed

### 4. Payout Flow

1. Customer places order
2. Order is fulfilled and shipped
3. Delivery webhook received
4. System validates:
   - Payment confirmed
   - Delivery confirmed
   - Vendor KYC complete
   - Stripe account active
5. Payout calculated (80/20 split)
6. Transfer created to vendor's Stripe account
7. Payout record saved
8. Email notification sent

## Testing

### Test Mode

Use Stripe test keys for development:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Scenarios

1. **New Vendor Onboarding:**
   - Create account
   - Complete onboarding
   - Verify account status

2. **Successful Payout:**
   - Create test order
   - Mark as delivered
   - Verify payout created
   - Check Stripe Dashboard

3. **Failed Payout:**
   - Incomplete KYC
   - Disabled payouts
   - Invalid account

4. **Duplicate Prevention:**
   - Send same delivery webhook twice
   - Verify only one payout created

## Migration from Flutterwave

### Data Migration

Existing vendors with Flutterwave accounts:
1. Keep historical payout data
2. Prompt to connect Stripe account
3. Future payouts use Stripe

### Backward Compatibility

The webhook handler still supports Flutterwave for:
- Legacy payment processing
- Historical data

## Security Considerations

1. **Webhook Verification:**
   - Stripe signature verification
   - Request origin validation

2. **KYC Validation:**
   - Company verification
   - Identity verification
   - Address verification

3. **Duplicate Prevention:**
   - Firestore transaction checks
   - Idempotency keys

4. **Data Protection:**
   - Sensitive data in environment variables
   - Secure API communication
   - Minimal data exposure

## Monitoring

### Key Metrics

- Successful payout rate
- Average payout amount
- Payout processing time
- Failed payout reasons

### Logging

All payout attempts logged with:
- Timestamp
- Vendor ID
- Order ID
- Amount
- Status
- Error details (if failed)

## Support

### Common Issues

1. **Payouts Disabled:**
   - Complete Stripe onboarding
   - Provide required information
   - Wait for Stripe verification

2. **KYC Incomplete:**
   - Complete platform KYC
   - All three verifications required

3. **Transfer Failed:**
   - Check Stripe account status
   - Verify bank details
   - Contact Stripe support

### Contact

- Platform Support: support@stitchesafrica.com
- Stripe Support: https://support.stripe.com

## Future Enhancements

1. **Multi-currency Support:**
   - Support multiple payout currencies
   - Automatic currency conversion

2. **Payout Scheduling:**
   - Custom payout schedules
   - Minimum payout thresholds

3. **Advanced Analytics:**
   - Earnings reports
   - Payout trends
   - Performance metrics

4. **Instant Payouts:**
   - Enable Stripe Instant Payouts
   - Premium feature for verified vendors

## Changelog

### Version 1.0.0 (Current)
- Initial Stripe Connect integration
- Automatic payouts on delivery
- Payout history widget
- Email notifications
- 80/20 revenue split

---

**Last Updated:** January 2025
**Maintained By:** Stitches Africa Development Team
