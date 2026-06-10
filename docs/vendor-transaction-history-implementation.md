# Vendor Transaction History & Payment Approval — Implementation Guide

## Overview

This feature adds end-to-end payment status tracking across two portals:

- **Marketing Portal** — staff can view all vendor orders, approve them as paid, or revert to unpaid
- **Vendor Portal** — vendors can see payment status on their orders list, order detail page, and a dedicated transaction history page

The authoritative data source for payment status is `users_orders/{userId}/user_orders/{orderId}` in Firestore. The marketing portal writes to this collection; the vendor portal reads from it.

---

## Data Flow

```
User places order
      │
      ▼
users_orders/{userId}/user_orders/{orderId}
  { payment_status: "unpaid", tailor_id: "...", ... }
      │
      ▼
Marketing Portal reads via collectionGroup("user_orders")
      │
      ▼
Marketing staff clicks "Approve as Paid"
      │
      ▼
POST /api/marketing/vendor-transactions/approve
  { userId, orderId, action: "paid" | "unpaid" }
      │
      ▼
Firestore update: { payment_status, approved_at, approved_by }
      │
      ▼
Vendor Portal reads updated payment_status
```

---

## Files Changed / Created

### New Services

| File | Purpose |
|---|---|
| `vendor-services/getAllVendorOrders.ts` | Fetches all orders from `collectionGroup("user_orders")` for the marketing portal |
| `vendor-services/getVendorOrderPaymentStatuses.ts` | Fetches payment statuses for a specific vendor's orders from `users_orders` |

### API

| File | Purpose |
|---|---|
| `app/api/marketing/vendor-transactions/approve/route.ts` | POST endpoint — approves or reverts payment status. Accepts `{ userId, orderId, action: "paid" \| "unpaid" }` |

### Marketing Portal

| File | Purpose |
|---|---|
| `app/marketing/(dashboard)/vendor-transactions/page.tsx` | Full order list with filter, search, pagination, approve/revert actions, and toast feedback |

### Vendor Portal

| File | Purpose |
|---|---|
| `app/vendor/transactions/page.tsx` | New transaction history page — shows all vendor orders with payment status badges, filter, search, pagination |
| `app/vendor/orders/page.tsx` | Updated — payment badge now always visible, reads from `users_orders` |
| `app/vendor/orders/[id]/page.tsx` | Updated — Order Summary sidebar shows a payment status banner |
| `components/vendor/modern-navbar.tsx` | Updated — "Transactions" nav link re-enabled |

### Tests

| File | Purpose |
|---|---|
| `test/vendor-transaction-approve-api.test.ts` | 17 unit tests covering all HTTP response codes (400, 401, 403, 404, 409, 200) |

---

## API Reference

### `POST /api/marketing/vendor-transactions/approve`

**Auth:** Firebase ID token in `Authorization: Bearer <token>` header

**Roles allowed:** `team_lead`, `bdm`, `super_admin`

**Request body:**
```json
{
  "userId": "string",
  "orderId": "string",
  "action": "paid" | "unpaid"
}
```

**Responses:**

| Status | Condition |
|---|---|
| 200 | Success |
| 400 | Missing `userId` or `orderId`, or invalid `action` |
| 401 | Missing or invalid Firebase ID token |
| 403 | User role not in `[team_lead, bdm, super_admin]` |
| 404 | Order document not found |
| 500 | Firestore write failure |

**On `action: "paid"`** — sets `payment_status: "paid"`, `approved_at: serverTimestamp()`, `approved_by: uid`

**On `action: "unpaid"`** — sets `payment_status: "unpaid"`, deletes `approved_at` and `approved_by`

---

## Firestore Collections

### `users_orders/{userId}/user_orders/{orderId}`

The primary collection for order data and payment status.

```
{
  order_id: string
  tailor_id: string
  tailor_name: string
  title: string
  price: number
  quantity: number
  source_original_price?: number   // NGN price
  source_currency?: string         // "NGN" | "USD" etc.
  currency?: string
  order_status: string
  timestamp: Timestamp
  user_id: string
  user_address: { first_name, last_name, ... }

  // Written by marketing portal
  payment_status?: "paid" | "unpaid"   // absent = "unpaid"
  approved_at?: Timestamp
  approved_by?: string                 // marketing user UID
}
```

---

## Currency Display Logic

Amount is displayed using `source_original_price` when the order currency is NGN, falling back through `source_price → original_price → price`.

```ts
const isNGN = source_currency === "NGN" || currency === "NGN";
const raw = isNGN
  ? (source_original_price ?? source_price ?? original_price ?? price ?? 0)
  : (original_price ?? price ?? 0);
const symbol = isNGN ? "₦" : "$";
```

---

## Vendor Portal Pages

### `/vendor/transactions`

Transaction history page accessible from the top navbar under the profile dropdown.

- Reads from `collectionGroup("user_orders")` filtered by `tailor_id`
- Shows: Order ID, Product, Amount, Date, Order Status, Payment Status
- Filter tabs: All / Paid / Unpaid
- Summary cards: Total Orders, Paid count, Awaiting Payment count
- Pagination: 15 rows per page

### `/vendor/orders`

Orders list — payment badge now always shown (defaults to "Unpaid" when absent). Reads payment status from `users_orders` via `getVendorOrderPaymentStatuses`, merged with the `tailors/{id}/orders` subcollection (prefers `users_orders`).

### `/vendor/orders/[id]`

Order detail page — Order Summary sidebar shows a prominent payment status banner at the top (green for Paid, yellow for Awaiting Payment).

---

## Marketing Portal Page

### `/marketing/vendor-transactions`

Accessible via "Vendor Orders" in the marketing sidebar (visible to `team_lead`, `bdm`, `super_admin` only).

- Reads all vendor orders via `collectionGroup("user_orders")`
- Columns: Order ID, Vendor, Product, Customer, Amount, Date, Order Status, Payment, Action
- Filter tabs: All / Paid / Unpaid
- Search: by order ID, vendor name, product title, or customer name
- Pagination: 20 rows per page
- Action buttons (role-gated):
  - Unpaid rows → "Approve as Paid" button
  - Paid rows → "Mark as Unpaid" button (red outline)
- Toast notifications on success or failure

---

## Role-Based Access

| Role | Can view marketing transactions page | Can approve/revert payment |
|---|---|---|
| `super_admin` | ✓ | ✓ |
| `team_lead` | ✓ | ✓ |
| `bdm` | ✓ | ✓ |
| `team_member` | ✗ | ✗ |

---

## Running Tests

```bash
npm run test
# or single file:
npx vitest --run test/vendor-transaction-approve-api.test.ts
```

All 17 tests should pass. Tests mock `firebase-admin`, `FieldValue.serverTimestamp()`, and `authenticateRequest` — no live Firebase connection required.
