# Mintsoft (Mission Logix) integration

Docs: [Swagger UI](https://api.mintsoft.co.uk/swagger/ui/index), [Create order](https://help-mintsoft.theaccessgroup.com/en/articles/11686761-api-create-an-order), [Order webhooks](https://help-mintsoft.theaccessgroup.com/en/articles/11694811-api-set-up-order-webhooks).

## Outbound — create order

| Method | Path | Mintsoft API |
|--------|------|----------------|
| `POST` | `/api/integrations/mintsoft/push-order` | `PUT /api/Order` |
| `POST` | `/api/mission-logix` | same (legacy) |

After a successful create, the handler registers **ConnectActions** (`PUT /api/Order/{id}/ConnectActions`) so Mintsoft POSTs back on despatch/cancel/delivery, and tags Firestore `user_orders` with `mintsoft.orderId` when `userId` is provided.

## Inbound — webhooks (tracking & fulfilment)

Mintsoft calls your URLs (set via `ExtraCode1`–`ExtraCode3` on ConnectActions):

| Method | Path | When |
|--------|------|------|
| `POST` | `/api/integrations/mintsoft/webhooks/despatched` | Order despatched — includes `TrackingNumber`, `TrackingURL` |
| `POST` | `/api/integrations/mintsoft/webhooks/cancelled` | Order cancelled |
| `POST` | `/api/integrations/mintsoft/webhooks/delivered` | Delivered (requires Tracking Events module + courier support) |

Payload: same JSON as [GET /api/Order/{id}](https://api.mintsoft.co.uk/swagger/ui/index#!/Order/Order_Get).

Updates all `users_orders/{uid}/user_orders/*` with matching `order_id` / `ExternalOrderReference`:

- `order_status` → `shipped` | `cancelled` | `delivered`
- `shipping.trackingNumber`, `shipping.trackingUrl`, `shipping.carrier`
- `mintsoft.*` metadata
- `dhl_events_snapshot` / `last_dhl_event` (for track-order UI)

## Sync jobs (cron / manual)

| Method | Path | Mintsoft API |
|--------|------|----------------|
| `POST` | `/api/integrations/mintsoft/sync/inventory` | `GET /api/Product/StockLevels`, optional `GET /api/Product/StockLevels/UpdatedSince` |
| `POST` | `/api/integrations/mintsoft/sync/orders` | `GET /api/Order/{id}`, `GET /api/Order/Search` |

Auth: `Authorization: Bearer <MINTSOFT_SYNC_SECRET>` or `?secret=` (falls back to `MINTSOFT_INTEGRATION_SECRET`).

Inventory sync updates Mission Logix merchandise in `tailor_works` (any `tailor_id` in `UNITY_CUP_VENDOR_IDS`) that have **`mintsoft_sku`** set: `wear_quantity`, `availability`, `mintsoft_stock_*`. Stitches `product_id` stays internal; warehouse SKU is `mintsoft_sku` only.

Order webhooks match `user_orders` by **`order_id`** (= Mintsoft `OrderNumber` from checkout) and/or **`mintsoft.orderId`** (numeric Mintsoft id after push).

## Environment

| Variable | Purpose |
|----------|---------|
| `MINTSOFT_BASE_URL` | e.g. `https://api.mintsoft.co.uk` |
| `MINTSOFT_API_KEY` | `ms-apikey` request header (static key from Mintsoft admin, or from `POST /api/Auth`) |
| `MINTSOFT_USERNAME` / `MINTSOFT_PASSWORD` | Used to obtain a key via `POST /api/Auth` when the env key is missing or returns 401 |
| `MINTSOFT_WEBHOOK_BASE_URL` | Public origin for webhook URLs (e.g. `https://www.stitchesafrica.com`) |
| `MINTSOFT_WEBHOOK_SECRET` | `?APIKEY=` on webhook URLs + validation |
| `MINTSOFT_WEBHOOK_AUTH_HEADER` | Optional `ExtraCode4` (e.g. `Bearer <secret>`) |
| `MINTSOFT_SYNC_SECRET` | Protects `/sync/*` routes |
| `MINTSOFT_INTEGRATION_SECRET` | Push-order auth (Postman / server) |
| `MINTSOFT_COURIER_SERVICE` / `MINTSOFT_WAREHOUSE` | Exact names from `GET /api/Warehouse` and `GET /api/Courier/Services` (defaults: `Mission Logix`, `DPD Next Day (Standard Delivery)`) |
| `MINTSOFT_CLIENT_ID` | **Required for admin API users** — client id from `GET /api/Client` (`ID` field, e.g. `162`) |

## Suggested cron (Vercel Cron / external)

```http
POST /api/integrations/mintsoft/sync/inventory
Authorization: Bearer <MINTSOFT_SYNC_SECRET>
Content-Type: application/json

{"since":"2024-01-01T00:00:00Z"}
```

```http
POST /api/integrations/mintsoft/sync/orders
Authorization: Bearer <MINTSOFT_SYNC_SECRET>
```

Run inventory every 15–60 minutes; order poll every 30 minutes as backup if webhooks fail.
