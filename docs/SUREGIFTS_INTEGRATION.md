# SureGifts API Integration Guide

## Overview

This document describes the SureGifts voucher redemption system integrated into Stitches Africa's checkout process. The integration allows customers to use SureGifts vouchers to pay for orders, either fully or partially.

## Features

### Customer Features
- ✅ Validate voucher codes during checkout
- ✅ View voucher balance and expiry date
- ✅ Apply vouchers to reduce order total
- ✅ Hybrid payment support (voucher + card/bank transfer)
- ✅ Real-time voucher balance updates
- ✅ Clear error messages for invalid/expired vouchers

### Admin Features
- ✅ Track all voucher redemptions
- ✅ View redemption analytics
- ✅ Export redemption data to CSV
- ✅ Monitor success/failure rates
- ✅ Audit trail for all transactions

## Architecture

### Components

1. **VoucherInput Component** (`components/checkout/VoucherInput.tsx`)
   - User interface for entering and validating voucher codes
   - Displays voucher balance and payment breakdown
   - Handles voucher removal

2. **SureGifts Service** (`lib/suregifts/suregifts-service.ts`)
   - API communication with SureGifts
   - Voucher validation
   - Voucher redemption
   - Request signing and authentication

3. **Voucher Payment Service** (`lib/suregifts/voucher-payment-service.ts`)
   - Payment flow orchestration
   - Hybrid payment handling
   - Payment breakdown calculations

4. **Voucher Repository** (`lib/suregifts/voucher-repository.ts`)
   - Firestore data persistence
   - Transaction logging
   - Analytics data retrieval

### API Endpoints

- `POST /api/vouchers/validate` - Validate a voucher code
- `POST /api/vouchers/redeem` - Redeem a voucher for payment
- `GET /api/vouchers/transactions` - Get voucher transaction history

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# SureGifts API Configuration
SUREGIFTS_API_URL=https://api.suregifts.com.ng/v1
SUREGIFTS_API_KEY=your_api_key_here
SUREGIFTS_SECRET_KEY=your_secret_key_here
```

### 2. SureGifts Dashboard Configuration

1. Log in to your SureGifts merchant dashboard
2. Navigate to API Settings
3. Generate API credentials (API Key and Secret Key)
4. Add your server IP addresses to the whitelist
5. Set credential status to "Active"

### 3. Firestore Collections

The integration creates two Firestore collections:

**voucher_transactions**
```typescript
{
  voucherCode: string;
  orderId: string;
  userId: string;
  amountRedeemed: number;
  remainingBalance: number;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}
```

**voucher_admin_logs**
```typescript
{
  voucherCode: string;
  orderId: string;
  customerEmail: string;
  amountRedeemed: number;
  transactionId: string;
  timestamp: Timestamp;
  status: 'success' | 'failed';
  error?: string;
}
```

### 4. Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Voucher transactions - users can only read their own
match /voucher_transactions/{transactionId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow write: if false; // Only backend can write
}

// Voucher admin logs - admin only
match /voucher_admin_logs/{logId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
  allow write: if false; // Only backend can write
}
```

## Usage

### Customer Flow

1. **Add Items to Cart**
   - Customer adds products to cart
   - Proceeds to checkout

2. **Enter Voucher Code**
   - On payment step, customer enters voucher code
   - System validates voucher with SureGifts API
   - Displays voucher balance and payment breakdown

3. **Complete Payment**
   - **Voucher covers full amount**: Order completed with voucher only
   - **Partial coverage**: Customer pays remaining amount with card/bank transfer
   - **No voucher**: Standard payment flow

### Payment Scenarios

#### Scenario 1: Voucher Covers Full Amount
```
Order Total: $100
Voucher Balance: $150
Voucher Applied: $100
Remaining to Pay: $0
→ Order completed with voucher only
```

#### Scenario 2: Partial Coverage (Hybrid Payment)
```
Order Total: $150
Voucher Balance: $80
Voucher Applied: $80
Remaining to Pay: $70
→ Customer pays $70 with Stripe/Flutterwave
→ Voucher redeemed after successful payment
```

#### Scenario 3: Insufficient Balance
```
Order Total: $200
Voucher Balance: $50
→ Customer can choose to:
   - Apply voucher and pay $150 with card
   - Remove voucher and pay full $200 with card
```

## API Integration Details

### Voucher Validation

**Request:**
```typescript
POST /api/vouchers/validate
{
  "voucherCode": "GIFT-12345"
}
```

**Response (Success):**
```typescript
{
  "success": true,
  "voucher": {
    "code": "GIFT-12345",
    "balance": 150.00,
    "currency": "NGN",
    "expiryDate": "2024-12-31",
    "status": "active",
    "isValid": true
  }
}
```

**Response (Error):**
```typescript
{
  "success": false,
  "error": "Invalid voucher code",
  "errorCode": "INVALID_CODE"
}
```

### Voucher Redemption

**Request:**
```typescript
POST /api/vouchers/redeem
{
  "voucherCode": "GIFT-12345",
  "amount": 100.00,
  "orderId": "ORD-1234567890",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "userId": "user123"
}
```

**Response (Success):**
```typescript
{
  "success": true,
  "transactionId": "TXN-9876543210",
  "amountRedeemed": 100.00,
  "remainingBalance": 50.00
}
```

## Error Handling

### Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `INVALID_CODE` | Voucher code doesn't exist | "The voucher code you entered is invalid" |
| `EXPIRED` | Voucher has expired | "This voucher has expired" |
| `INSUFFICIENT_BALANCE` | Voucher balance too low | "The voucher balance is insufficient" |
| `ALREADY_USED` | Voucher fully redeemed | "This voucher has already been fully redeemed" |
| `API_ERROR` | SureGifts API error | "Service temporarily unavailable" |
| `NETWORK_ERROR` | Connection failed | "Network error. Please check your connection" |

### Retry Logic

- Failed validations: User can retry immediately
- Failed redemptions: Logged for manual review
- Network errors: Automatic retry with exponential backoff

## Testing

### Test Voucher Codes

SureGifts provides test voucher codes for development:

```
TEST-VALID-100: Valid voucher with $100 balance
TEST-EXPIRED: Expired voucher
TEST-INVALID: Invalid voucher code
TEST-ZERO: Voucher with $0 balance
```

### Testing Checklist

- [ ] Validate valid voucher code
- [ ] Validate expired voucher
- [ ] Validate invalid voucher
- [ ] Apply voucher covering full amount
- [ ] Apply voucher with partial coverage
- [ ] Remove applied voucher
- [ ] Complete order with voucher only
- [ ] Complete hybrid payment (voucher + card)
- [ ] Handle failed redemption
- [ ] Verify transaction logging
- [ ] Export admin analytics

## Monitoring

### Key Metrics

1. **Redemption Rate**: Percentage of validated vouchers that are redeemed
2. **Success Rate**: Percentage of redemptions that succeed
3. **Average Redemption Amount**: Mean voucher amount used per order
4. **Hybrid Payment Rate**: Percentage of orders using voucher + card

### Admin Dashboard

Access voucher analytics at `/admin/vouchers` (admin only):

- Total redemptions count
- Total amount redeemed
- Success/failure rates
- Recent redemption history
- Export to CSV

## Security Considerations

1. **API Credentials**: Never expose API keys in frontend code
2. **Request Signing**: All API requests are signed with HMAC-SHA256
3. **IP Whitelisting**: Only whitelisted IPs can access SureGifts API
4. **Backend-Only**: All SureGifts API calls go through backend
5. **Transaction Logging**: All redemptions logged for audit trail
6. **User Isolation**: Users can only see their own transactions

## Troubleshooting

### Common Issues

**Issue: "SureGifts API credentials not configured"**
- Solution: Add `SUREGIFTS_API_KEY` and `SUREGIFTS_SECRET_KEY` to `.env`

**Issue: "Network error while connecting to SureGifts API"**
- Solution: Check if server IP is whitelisted in SureGifts dashboard

**Issue: "Voucher validation fails but code is valid"**
- Solution: Verify API credentials are active in SureGifts dashboard

**Issue: "Redemption succeeds but order not created"**
- Solution: Check Firestore permissions and order creation logs

## Support

For SureGifts API issues:
- Email: support@suregifts.com.ng
- Phone: +234 XXX XXX XXXX
- Dashboard: https://merchant.suregifts.com.ng

For integration issues:
- Check application logs
- Review Firestore transaction records
- Contact development team

## Changelog

### Version 1.0.0 (2024-02-06)
- Initial SureGifts integration
- Voucher validation and redemption
- Hybrid payment support
- Admin analytics dashboard
- Transaction logging and audit trail