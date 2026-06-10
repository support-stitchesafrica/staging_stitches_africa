# Vendor Payout & Admin Approval — Implementation Documentation

## Overview

The payout system has two distinct flows:

1. **Manual Payout Request** — vendor initiates a payout request from their dashboard; an admin reviews and approves/rejects it via the admin panel.
2. **Auto-Payout Webhook** — a Firebase Firestore trigger automatically pays vendors when an order is marked as delivered.

Both flows share the same wallet data model on the `tailors` Firestore document.

---

## Wallet Data Model

Wallet balances live on the `tailors/{vendorId}` Firestore document:

```
tailors/{vendorId}
  wallet              — total balance (number)
  wallet_balance      — alias for total (preferred read field)
  wallet_by_provider  — map: { paystack: number, stripe: number, flutterwave: number }
  wallet_details      — { balance: number, last_updated: Timestamp }
```

Balances are incremented at checkout (when an order is placed) and decremented when a payout is approved. All mutations use `FieldValue.increment()` for atomicity.

---

## Flow 1: Manual Payout Request

### Vendor Side

**Component:** `components/vendor/VendorPayoutWallet.tsx`  
**API routes:** `app/api/vendor/wallet-balance/route.ts`, `app/api/vendor/payout-request/route.ts`

#### How it works

1. The component fetches the vendor's wallet balance from `GET /api/vendor/wallet-balance?vendorId=<id>`.
2. It displays the total balance and a per-provider breakdown (Paystack, Stripe, Flutterwave).
3. For each provider with a positive balance and no pending request, a "Request Payout" button is shown.
4. Clicking the button opens a confirmation dialog showing the provider and amount.
5. On confirm, a `POST /api/vendor/payout-request` is called.

#### `POST /api/vendor/payout-request`

**Validation:**
- `vendorId`, `provider`, and `amount` are required.
- Provider must be one of `paystack`, `stripe`, `flutterwave`.
- The server ignores the client-submitted `amount` and reads the actual balance from `tailors/{vendorId}.wallet_by_provider[provider]` — this prevents client-side manipulation.
- If the provider balance is 0 or negative, the request is rejected.
- If a pending request already exists for the same vendor + provider, a `409` is returned.

**On success:**
- Creates a document in the `payout_requests` Firestore collection with status `pending`.
- Sends a notification email to `finance@stitchesafrica.com` with request details and a link to the admin panel.
- Returns `{ success: true, requestId }`.

**`payout_requests` document schema:**
```
{
  vendorId: string
  vendorName: string
  vendorEmail: string
  provider: "paystack" | "stripe" | "flutterwave"
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected" | "payout_failed"
  adminNote: string
  createdAt: Timestamp
  updatedAt: Timestamp
  processedAt: Timestamp
  providerTransferId: string | null
  payoutError: string | null
}
```

#### `GET /api/vendor/payout-request?vendorId=<id>`

Returns the last 20 payout requests for the vendor, ordered by `createdAt` descending. Used to populate the request history table in the wallet component.

---

### Admin Side

**Page:** `app/admin/payout-requests/page.tsx`  
**API route:** `app/api/admin/payout-requests/route.ts`

#### `GET /api/admin/payout-requests?status=<status>`

Returns up to 100 payout requests filtered by status (`pending`, `approved`, `rejected`, `payout_failed`, or `all`), ordered by `createdAt` descending.

#### `POST /api/admin/payout-requests`

Body: `{ requestId, action: "approve" | "reject", adminNote? }`

**On reject:**
- Updates the request document: `status = "rejected"`, stores `adminNote`.
- Sends a rejection email to the vendor with the reason.
- Sends a confirmation email to the finance team.

**On approve:**
1. Fetches the vendor's `tailors` document to get payment account details.
2. Atomically deducts the payout amount from the vendor's wallet:
   ```
   wallet              -= amount
   wallet_balance      -= amount
   wallet_by_provider[provider] -= amount
   ```
3. Calls the provider-specific transfer API:
   - **Paystack:** Creates a transfer recipient from the vendor's `paystackSubaccount.subaccount_code`, then calls `POST /transfer` with the amount in kobo.
   - **Flutterwave:** Calls `POST /v3/transfers` using the vendor's `flutterwaveSubaccount` bank details.
   - **Stripe:** Calls `POST /v1/transfers` to the vendor's `stripeConnectAccountId` in cents.
4. If the provider call succeeds: updates the request with `status = "approved"`, `providerTransferId`, `payoutTriggeredAt`.
5. If the provider call fails: **rolls back** the wallet deduction atomically, sets `status = "payout_failed"`, stores `payoutError`, and returns a `502`.
6. Sends emails:
   - Approval email to the vendor.
   - Confirmation email to the finance team.

#### Admin UI

- Status filter dropdown: Pending / Approved / Rejected / Payout Failed / All.
- Each row shows: vendor name, email, provider badge, status badge, amount, timestamp, admin note, transfer ID (if approved), error (if failed).
- Pending requests show Approve and Reject buttons.
- Clicking either opens a confirmation dialog with an optional admin note field.
- Approve button label: "Approve & Trigger Payout" — makes it clear the transfer fires immediately.
- Access is restricted to `adminRole === "superadmin" | "admin"` (checked via `localStorage`).

---

## Flow 2: Auto-Payout Webhook (Firebase Function)

**Function:** `processVendorPayout` — exported from `functions/src/payout/processVendorPayout.ts`  
**Trigger:** `onDocumentWritten("user_orders/{orderId}")` in region `europe-west1`  
**Secrets:** `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `STRIPE_SECRET_KEY`  
**Timeout:** 120 seconds

### Execution Flow

```
Firestore write on user_orders/{orderId}
  │
  ├─ 1. Idempotency check
  │     If payout_status == "completed" or "processing" → exit
  │
  ├─ 2. Delivery detection (deliveryDetector.ts)
  │     If not a delivery event → exit
  │
  ├─ 3. Set payout_status = "processing"
  │
  ├─ 4. Fetch vendor (tailors/{tailor_id})
  │     If missing → skip (vendor_not_found)
  │
  ├─ 5. KYC check (kycChecker.ts)
  │     If incomplete → skip (kyc_incomplete)
  │
  ├─ 6. Calculate payout amount (amountCalculator.ts)
  │     If vendorAmount <= 0 → skip (invalid_amount)
  │
  ├─ 7. Detect payment provider (providerRouter.ts)
  │     If unknown → skip (unknown_provider)
  │
  ├─ 8. Check vendor has account for provider
  │     If missing → skip (no_payment_account)
  │
  ├─ 9. Execute payout with retry (up to 3 attempts, exponential backoff)
  │     ├─ Paystack → executePaystackPayout()
  │     ├─ Flutterwave → executeFlutterwavePayout()
  │     └─ Stripe → executeStripePayout()
  │
  ├─ 10. Update order document (completed or failed)
  │
  ├─ 11. Send vendor notification (in-app + email, success only)
  │
  ├─ 12. Send admin notification (all outcomes)
  │
  └─ 13. Write payout audit log → payout_logs collection
```

### Delivery Detection (`deliveryDetector.ts`)

A delivery event is detected when the order transitions **to** a delivered state (not already delivered before):

- `last_dhl_event.status` contains "delivered", "ok - delivered", or "shipment delivered" (case-insensitive), **or**
- `order_status` equals "delivered"

The before/after snapshots are compared to ensure the trigger only fires on the transition, not on subsequent updates.

### KYC Check (`kycChecker.ts`)

KYC is considered complete if the vendor document has at least one of:
- `identity-verification.idNumber` (NIN, passport, driver's license)
- `company-verification.registrationNumber`

### Payout Amount Calculation (`amountCalculator.ts`)

```
grossAmount  = source_price ?? price ?? 0
shippingFee  = shipping_fee ?? 0
netAmount    = max(0, grossAmount - shippingFee)
vendorAmount = netAmount * 0.80   (vendor's 80% share)
platformAmount = netAmount * 0.20
currency     = source_currency ?? currency ?? "NGN"
```

### Provider Routing (`providerRouter.ts`)

Reads `order.payment_provider` (case-insensitive) and maps to `"paystack"`, `"flutterwave"`, or `"stripe"`. Returns `null` for anything else.

### Retry Strategy

Up to 3 attempts with exponential backoff (2s, 4s between retries). If all attempts fail, the order is marked `payout_status = "failed"` with the error message stored in `payout_error`.

### Skip Reasons

| Reason | Cause |
|---|---|
| `vendor_not_found` | `tailor_id` missing or vendor doc doesn't exist |
| `kyc_incomplete` | Vendor has no verified identity or company document |
| `invalid_amount` | Calculated vendor payout is 0 or negative |
| `unknown_provider` | `payment_provider` field is missing or unrecognized |
| `no_payment_account` | Vendor has no account configured for the detected provider |

### Order Document Fields (added by payout system)

```
payout_status:       "pending" | "processing" | "completed" | "failed" | "skipped"
payout_provider:     "paystack" | "flutterwave" | "stripe" | null
payout_amount:       number | null
payout_currency:     string | null
payout_reference:    string | null
payout_error:        string | null
payout_skip_reason:  string | null
payout_completed_at: Timestamp | null
payout_log_id:       string | null
```

---

## Notifications & Emails

### Email API

All emails are sent via `POST https://stitchesafricamobile-backend.onrender.com/api/Email/Send` using the `noreply@stitchesafrica.com` sender.

### Manual Payout Flow Emails

| Trigger | Recipient | Subject |
|---|---|---|
| Vendor submits request | `finance@stitchesafrica.com` | `Payout Request — {vendor} via {provider}` |
| Admin approves | Vendor email | `Your Payout Has Been Approved` |
| Admin rejects | Vendor email | `Payout Request Update` |
| Admin approves or rejects | `finance@stitchesafrica.com` | `Payout APPROVED/REJECTED — {vendor}` |

### Auto-Payout Flow Emails & Notifications

| Trigger | Recipient | Type |
|---|---|---|
| Payout completed | Vendor email | Email: "Payout Received" |
| Payout completed | `notifications/{vendorId}/items` | In-app Firestore notification |
| Any payout outcome | `admin_notifications` collection | In-app Firestore notification |
| Any payout outcome | Admin email addresses | Email: "Payout Event — Admin" |

Admin email addresses for auto-payout notifications: `stitchesafrica1m@gmail.com`, `stitchesafrica8m@gmail.com`, `support@stitchesafrica.com`.

---

## Audit Trail

Every payout attempt (auto or manual) writes to the `payout_logs` Firestore collection:

```
payout_logs/{logId}
  order_id:     string
  tailor_id:    string
  amount:       number
  currency:     string
  provider:     "paystack" | "flutterwave" | "stripe" | null
  status:       "completed" | "failed" | "skipped"
  reference:    string | null
  error:        string | null
  reason:       string | null   (skip reason)
  gross_amount: number
  shipping_fee: number
  net_amount:   number
  created_at:   Timestamp
```

The `user_orders` document is updated with `payout_log_id` pointing to the log entry.

---

## File Map

```
app/api/vendor/
  wallet-balance/route.ts         — GET vendor wallet balance
  payout-request/route.ts         — POST create request, GET vendor history

app/api/admin/
  payout-requests/route.ts        — GET list requests, POST approve/reject

app/admin/payout-requests/
  page.tsx                        — Admin payout management UI

components/vendor/
  VendorPayoutWallet.tsx          — Vendor wallet + payout request UI

functions/src/payout/
  processVendorPayout.ts          — Main Firestore trigger orchestrator
  deliveryDetector.ts             — isDeliveryEvent()
  kycChecker.ts                   — isKycComplete()
  amountCalculator.ts             — calculateVendorPayout()
  providerRouter.ts               — detectProvider()
  notificationService.ts          — Vendor + admin notifications and emails
  auditLogger.ts                  — writePayoutLog()
  providers/
    paystackPayout.ts             — executePaystackPayout()
    flutterwavePayout.ts          — executeFlutterwavePayout()
    stripePayout.ts               — executeStripePayout()
```

---

## Environment Variables

```bash
# Next.js (.env.local)
PAYSTACK_SECRET_KEY=sk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx

# Firebase Functions (functions/.env)
PAYSTACK_SECRET_KEY=sk_live_xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

Firebase Function secrets are also registered via `defineSecret()` and must be set in the Firebase project's Secret Manager.
