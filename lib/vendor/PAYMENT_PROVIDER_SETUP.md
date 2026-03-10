# Payment Provider Setup Guide

## Overview
Vendors on Stitches Africa can choose between two payment providers for receiving payouts:
- **Stripe Connect** (Recommended for international vendors)
- **Flutterwave** (Recommended for African vendors)

## Stripe Connect Setup

### Vendor Requirements
1. Valid business information
2. Bank account details
3. Tax identification
4. Identity verification documents

### Configuration Fields
```typescript
{
  stripeConnectAccountId: string;  // e.g., "acct_1234567890"
  stripeAccountCreatedAt: string;  // ISO timestamp
  stripeAccountCountry: string;    // e.g., "US", "NG"
  splitPercentage: 80;             // Vendor gets 80%
}
```

### Setup Process
1. Vendor initiates Stripe Connect onboarding
2. API creates Stripe Connect account (`/api/stripe/connect/create-account`)
3. Vendor completes onboarding via Stripe-hosted form
4. Account ID saved to vendor document
5. Payouts enabled after verification

### Payout Flow
1. Customer pays via Stripe
2. Funds held in platform Stripe account
3. On delivery confirmation, transfer created to vendor's connected account
4. Vendor receives 80% of order amount
5. Platform keeps 20%

## Flutterwave Setup

### Vendor Requirements
1. Valid business information
2. Bank account details (Nigerian banks supported)
3. BVN (Bank Verification Number)
4. Business registration documents

### Configuration Fields
```typescript
{
  flutterwaveSubaccount: {
    id: number;                    // Flutterwave internal ID
    subaccount_id: string;         // e.g., "RS_1234567890"
    account_bank: string;          // Bank code
    account_number: string;        // Account number
    business_name: string;         // Business name
    split_type: "percentage";      // Split type
    split_value: 80;               // Vendor gets 80%
  };
  hasSubaccount: true;
  splitPercentage: 80;
}
```

### Setup Process
1. Vendor provides bank details
2. API creates Flutterwave subaccount (`/api/flutterwave/subaccounts`)
3. Subaccount details saved to vendor document
4. Split configuration set to 80/20
5. Payouts enabled immediately

### Payout Flow
1. Customer pays via Flutterwave
2. Split processed automatically at payment time
3. 80% routed to vendor's subaccount
4. 20% routed to platform account
5. On delivery confirmation, payout record created for tracking
6. Vendor already has funds in their account

## Key Differences

| Feature | Stripe Connect | Flutterwave |
|---------|---------------|-------------|
| **Payout Timing** | On delivery (transfer created) | At payment (split processed) |
| **Geographic Focus** | Global | Africa-focused |
| **Setup Complexity** | More complex (KYC) | Simpler (bank details) |
| **Processing Fees** | ~2.9% + $0.30 | ~1.4% |
| **Currency Support** | Multi-currency | Primarily NGN, USD |
| **Payout Speed** | 2-7 business days | Instant to subaccount |

## Vendor Split Structure

Both providers use the same split:
- **Vendor**: 80% of order amount
- **Platform**: 20% of order amount

Example for $100 order:
- Vendor receives: $80
- Platform keeps: $20

## KYC Requirements

### Both Providers Require
1. ✅ Company verification
2. ✅ Identity verification  
3. ✅ Address verification

### Verification Status
Must be one of: `verified`, `approved`, `completed`, `true`

### Checking KYC Status
```typescript
const vendorDoc = await getDoc(doc(db, 'tailors', vendorId));
const vendorData = vendorDoc.data();

const companyVerified = vendorData['company-verification']?.status;
const identityVerified = vendorData['identity-verification']?.status;
const addressVerified = vendorData['company-address-verification']?.status;

const kycComplete = 
  ['verified', 'approved', 'completed', 'true'].includes(companyVerified) &&
  ['verified', 'approved', 'completed', 'true'].includes(identityVerified) &&
  ['verified', 'approved', 'completed', 'true'].includes(addressVerified);
```

## Webhook Integration

### DHL Delivery Webhook
- Endpoint: `/api/webhooks`
- Trigger: DHL confirms delivery
- Status: `delivered`
- Action: Routes to payout handler

### Payout Handler
- Endpoint: `/api/stripe/connect/payout-webhook`
- Handles both Stripe and Flutterwave
- Verifies KYC completion
- Prevents duplicate payouts
- Creates payout records
- Sends email notifications

## Testing

### Test Stripe Connect
1. Use Stripe test mode
2. Create test connected account
3. Simulate delivery webhook
4. Verify transfer created

### Test Flutterwave
1. Use Flutterwave test mode
2. Create test subaccount
3. Make test payment
4. Verify split processed

## Troubleshooting

### Payout Not Processing
1. Check vendor has payment provider configured
2. Verify KYC is complete
3. Confirm order is marked as delivered
4. Check for duplicate payout records
5. Review webhook logs

### Failed Payouts
1. Check `payouts` collection for error details
2. Review `failureDetails` field
3. Common issues:
   - Insufficient funds (Stripe)
   - Invalid account details
   - KYC incomplete
   - Account suspended

### Vendor Not Receiving Funds
1. **Stripe**: Check transfer status in Stripe dashboard
2. **Flutterwave**: Verify subaccount configuration
3. Check payout record status
4. Verify bank account details

## Support

For payment provider issues:
- **Stripe**: support@stripe.com
- **Flutterwave**: support@flutterwave.com
- **Platform**: support@stitchesafrica.com

## Related Files

- `/lib/vendor/payout-service.ts` - Payout service implementation
- `/app/api/webhooks/index.ts` - Webhook router
- `/app/api/stripe/connect/payout-webhook/route.ts` - Payout handler
- `/app/api/stripe/connect/create-account/route.ts` - Stripe account creation
- `/app/api/flutterwave/subaccounts/route.ts` - Flutterwave subaccount creation
