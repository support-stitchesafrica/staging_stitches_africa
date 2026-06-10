# Firebase Functions

## Setup

Install dependencies:

```bash
cd functions && npm install
```

## Environment Variables

Copy the values below into `functions/.env` and replace placeholders with real keys before deploying.

| Variable | Description | Required |
|---|---|---|
| `YOUVERIFY_PRODUCTION_API_KEY` | YouVerify API key for KYC identity checks | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_live_xxx`) for vendor payouts | Yes |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key (`FLWSECK_xxx`) for vendor payouts | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_xxx`) for vendor payouts | Yes |
| `ADMIN_EMAIL` | Admin email address for payout alert emails | Optional |

> **Note:** `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, and `STRIPE_SECRET_KEY` are consumed via Firebase Secret Manager (`defineSecret`). They must also be set as Firebase secrets before deploying:
>
> ```bash
> firebase functions:secrets:set PAYSTACK_SECRET_KEY
> firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY
> firebase functions:secrets:set STRIPE_SECRET_KEY
> ```

## Deployed Functions

| Function | Trigger | Region | Description |
|---|---|---|---|
| `processVendorPayout` | Firestore `user_orders/{orderId}` write | `europe-west1` | Automatically pays vendors when an order is marked as delivered |
| `sendOrderPlacedVendorEmail` | HTTPS callable | `europe-west1` | Queues a vendor order notification email |
| `getDhlDomesticRate` | HTTPS callable | `europe-west1` | Fetches DHL domestic shipping rates |
| Various YouVerify functions | HTTPS callable | `europe-west1` | KYC identity/business/phone verification |

## Vendor Auto-Payout Webhook

`processVendorPayout` fires on every write to `user_orders/{orderId}`. It:

1. Detects delivery via `last_dhl_event.status` or `order_status == "delivered"`
2. Guards against double-payouts (idempotency via `payout_status`)
3. Verifies vendor KYC (`identity-verification.idNumber` or `company-verification.registrationNumber`)
4. Calculates vendor share: `(source_price - shipping_fee) * 0.20`
5. Routes to Paystack / Flutterwave / Stripe based on `payment_provider`
6. Retries up to 3 times with exponential backoff on failure
7. Writes an audit log to `payout_logs` and notifies vendor + admins

Payout status is tracked on the order document via `payout_status`: `pending | processing | completed | failed | skipped`.
