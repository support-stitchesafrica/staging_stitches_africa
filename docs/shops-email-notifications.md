# Shops Email Notifications Implementation

## Overview
Comprehensive email notification system for customer actions in the shops section, including welcome emails, login notifications, and order confirmations for both customers and vendors.

## Email Templates Created

### 1. Customer Welcome Email
**File:** `lib/emailTemplates/customerWelcomeTemplate.ts`

**Sent when:** User registers/signs up in the shops section

**Features:**
- Welcome message with customer name
- Account confirmation with email
- "What's Next" section with action items
- Call-to-action button to start shopping
- Support contact information

### 2. Customer Login Notification
**File:** `lib/emailTemplates/customerLoginTemplate.ts`

**Sent when:** User logs into their account

**Features:**
- Welcome back message
- Login details (time, device, IP address)
- Security warning if login wasn't authorized
- Link to account dashboard
- Support contact information

### 3. Customer Order Confirmation
**File:** `lib/emailTemplates/customerOrderConfirmationTemplate.ts`

**Sent when:** Customer places an order

**Features:**
- Order confirmation badge
- Order ID and date
- Itemized list with images
- Pricing breakdown (subtotal, shipping, total)
- Shipping address
- "What's Next" information
- Order tracking link

### 4. Vendor Order Notification
**File:** `lib/emailTemplates/vendorOrderNotificationTemplate.ts`

**Sent when:** Order contains vendor's products

**Features:**
- New order alert
- Order ID and customer name
- Itemized list of vendor's products
- Order total for vendor's items
- Shipping address
- Action required notice
- Direct link to order details in vendor dashboard

## API Routes Created

### 1. Send Welcome Email
**Endpoint:** `POST /api/shops/send-welcome-email`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### 2. Send Login Notification
**Endpoint:** `POST /api/shops/send-login-notification`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "customerName": "John Doe",
  "ipAddress": "192.168.1.1",
  "device": "Chrome on Windows"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### 3. Send Order Confirmation
**Endpoint:** `POST /api/shops/send-order-confirmation`

**Request Body:**
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "orderId": "ORD-12345",
  "orderDate": "January 1, 2025",
  "items": [
    {
      "title": "Product Name",
      "quantity": 2,
      "price": 50.00,
      "image": "https://..."
    }
  ],
  "subtotal": 100.00,
  "shippingCost": 30.00,
  "total": 130.00,
  "currency": "USD",
  "shippingAddress": "123 Main St, City, Country",
  "vendorEmails": [
    {
      "email": "vendor@example.com",
      "vendorName": "Vendor Name",
      "items": [...],
      "subtotal": 100.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "customer": { "success": true, "response": "..." },
    "vendors": [
      { "email": "vendor@example.com", "success": true, "response": "..." }
    ]
  }
}
```

## Integration Points

### 1. User Registration
**Location:** `components/shops/auth/AuthForms.tsx` or `components/shops/auth/MultiStepRegistration.tsx`

**Add after successful registration:**
```typescript
// After user is created successfully
await fetch('/api/shops/send-welcome-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: user.email,
    customerName: user.displayName || user.email.split('@')[0],
  }),
});
```

### 2. User Login
**Location:** `components/shops/auth/AuthForms.tsx`

**Add after successful login:**
```typescript
// After successful login
await fetch('/api/shops/send-login-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: user.email,
    customerName: user.displayName || user.email.split('@')[0],
    device: navigator.userAgent,
  }),
});
```

### 3. Order Placement
**Location:** `app/shops/checkout/page.tsx` (after successful payment)

**Add after order is created:**
```typescript
// After order is successfully created
const vendorEmails = groupItemsByVendor(items); // Group items by vendor

await fetch('/api/shops/send-order-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerEmail: user.email,
    customerName: user.displayName || selectedAddress.first_name + ' ' + selectedAddress.last_name,
    orderId: orderData.order_id,
    orderDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
    items: items.map(item => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      image: item.images?.[0],
    })),
    subtotal: totalAmount,
    shippingCost: shippingCost,
    total: totalWithShipping,
    currency: selectedCurrency,
    shippingAddress: AddressService.formatAddressForDisplay(selectedAddress),
    vendorEmails: vendorEmails,
  }),
});
```

## Email Service Configuration

All emails are sent through the Stitches Africa staging email API:
- **API Endpoint:** `https://stitchesafricamobile-backend.onrender.com/api/Email/Send`
- **Method:** POST
- **Content-Type:** application/json

### Email Addresses Used:
- **Welcome emails:** `welcome@stitchesafrica.com`
- **Login notifications:** `security@stitchesafrica.com`
- **Order confirmations:** `orders@stitchesafrica.com`
- **Reply-to:** `support@stitchesafrica.com`

## Design Features

All email templates include:
- ✅ Responsive design for mobile and desktop
- ✅ Stitches Africa branding and logo
- ✅ Professional color scheme (black, gray, blue accents)
- ✅ Clear call-to-action buttons
- ✅ Proper email client compatibility
- ✅ Footer with copyright and year
- ✅ Support contact information

## Testing

To test the email notifications:

1. **Welcome Email:**
   ```bash
   curl -X POST http://localhost:3000/api/shops/send-welcome-email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","customerName":"Test User"}'
   ```

2. **Login Notification:**
   ```bash
   curl -X POST http://localhost:3000/api/shops/send-login-notification \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","customerName":"Test User"}'
   ```

3. **Order Confirmation:**
   ```bash
   curl -X POST http://localhost:3000/api/shops/send-order-confirmation \
     -H "Content-Type: application/json" \
     -d @order-test-data.json
   ```

## Next Steps

To complete the integration:

1. ✅ Email templates created
2. ✅ API routes created
3. ⏳ Integrate welcome email into registration flow
4. ⏳ Integrate login notification into login flow
5. ⏳ Integrate order confirmation into checkout flow
6. ⏳ Add vendor email lookup logic
7. ⏳ Test all email flows end-to-end

## Notes

- All emails are sent asynchronously to avoid blocking user actions
- Failed email sends are logged but don't prevent user actions from completing
- Vendor emails are sent to all vendors whose products are in the order
- Email templates use inline CSS for maximum email client compatibility
