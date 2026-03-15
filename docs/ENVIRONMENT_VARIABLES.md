# Environment Variables Documentation

This document describes all environment variables required for the STITCHES Africa platform, including the unified invitation system for Marketing, Collections, and Atlas dashboards.

## Table of Contents

- [Required Variables](#required-variables)
- [Invitation System Variables](#invitation-system-variables)
- [Firebase Configuration](#firebase-configuration)
- [Payment Configuration](#payment-configuration)
- [Email Configuration](#email-configuration)
- [Third-Party Services](#third-party-services)
- [Security Best Practices](#security-best-practices)

## Required Variables

### Application Base URL

```env
NEXT_PUBLIC_BASE_URL=https://https://staging-stitches-africa.vercel.app
```

**Description:** The base URL of your application. Used for generating invitation links and other absolute URLs.

**Required:** Yes

**Environment-specific values:**
- Development: `http://localhost:3000`
- Staging: `https://staging.stitchesafrica.com`
- Production: `https://https://staging-stitches-africa.vercel.app`

---

## Invitation System Variables

### JWT Secret

```env
JWT_SECRET=your-strong-jwt-secret-key-here
```

**Description:** Secret key used to sign and verify JWT tokens for the unified invitation system across Marketing, Collections, and Atlas dashboards.

**Required:** Yes (Critical for security)

**Security Requirements:**
- Minimum 32 characters
- Use a cryptographically secure random string
- Never commit to version control
- Rotate periodically (every 90 days recommended)

**How to generate:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Used by:**
- `lib/marketing/invitation-service.ts`
- `lib/collections/invitation-service.ts`
- `lib/atlas/invitation-service.ts`

**Fallback behavior:**
- Marketing: Falls back to `'marketing-dashboard-secret'` (insecure, for development only)
- Collections: Falls back to `'collections-dashboard-secret'` (insecure, for development only)
- Atlas: Falls back to `'atlas-dashboard-secret'` (insecure, for development only)

⚠️ **Warning:** Never use fallback values in production. Always set a strong JWT_SECRET.

---

## Firebase Configuration

### Admin SDK Configuration

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Description:** Firebase Admin SDK credentials for server-side operations.

**Required:** Yes

**How to obtain:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Extract values from the downloaded JSON file

**Note:** The private key must include `\n` for line breaks.

### Service Account Key (BASE64)

```env
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=your-base64-encoded-service-account-json
```

**Description:** BASE64-encoded Firebase service account JSON (alternative format).

**Required:** Yes (used by `firebase-admins.ts`)

**How to generate:**
```bash
# Linux/Mac
base64 -i service-account-key.json

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account-key.json"))
```

### Client Configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Description:** Firebase client SDK configuration for browser-side operations.

**Required:** Yes

**How to obtain:**
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Copy configuration values

**Note:** These are prefixed with `NEXT_PUBLIC_` and are exposed to the browser.

---

## Payment Configuration

### Flutterwave

```env
FLW_PUBLIC_KEY=your-flutterwave-public-key
FLW_SECRET_KEY=your-flutterwave-secret-key
FLW_ENCRYPTION_KEY=your-flutterwave-encryption-key
FLW_SECRET_HASH=your-secret-hash
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
```

**Description:** Flutterwave payment gateway credentials.

**Required:** Yes (for payment processing)

**How to obtain:**
1. Log in to Flutterwave Dashboard
2. Go to Settings → API Keys
3. Copy keys for your environment (Test/Live)

### Paystack

```env
NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY=your-paystack-public-key
```

**Description:** Paystack payment gateway public key.

**Required:** Yes (for payment processing)

### Stripe

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

**Description:** Stripe payment gateway credentials and webhook secret.

**Required:** Yes (for Stripe Connect vendor payouts)

**How to obtain:**
1. Log in to Stripe Dashboard
2. Go to Developers → API Keys
3. Copy publishable and secret keys
4. For webhook secret: Developers → Webhooks → Add endpoint

---

## Email Configuration

### Microsoft Email

```env
MICROSOFT_EMAIL=alerts@stitchesafrica.com
MICROSOFT_PASSWORD=your-password
```

**Description:** Microsoft email account for sending system alerts.

**Required:** Yes (for email notifications)

### Gmail SMTP

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Description:** Gmail SMTP credentials for sending emails.

**Required:** Yes (for invitation emails)

**How to obtain Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → 2-Step Verification
3. Scroll to "App passwords"
4. Generate a new app password for "Mail"

---

## Third-Party Services

### Remove.bg

```env
NEXT_PUBLIC_REMOVEBG_API_KEY=your-removebg-api-key
```

**Description:** Remove.bg API key for background removal.

**Required:** Optional (for image editing features)

### ImageKit

```env
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=your-imagekit-url-endpoint
```

**Description:** ImageKit CDN credentials for image optimization.

**Required:** Optional (for image optimization)

### DHL API

```env
NEXT_PUBLIC_DHL_API_BASE=https://stitchesafricamobile-backend.onrender.com/api/
```

**Description:** DHL API base URL for shipping calculations.

**Required:** Yes (for shipping features)

---

## Security Best Practices

### 1. Never Commit Secrets

- Add `.env` to `.gitignore`
- Use `.env.example` for documentation
- Never commit actual credentials

### 2. Use Strong Secrets

- JWT_SECRET: Minimum 32 characters, cryptographically random
- Rotate secrets periodically
- Use different secrets for different environments

### 3. Environment-Specific Configuration

Create separate `.env` files for each environment:
- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### 4. Access Control

- Limit who has access to production secrets
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault, etc.)
- Audit secret access regularly

### 5. Validation

Always validate environment variables at application startup:

```typescript
// Example validation
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL must be set');
}
```

---

## Invitation System Configuration

### Invitation URLs

The unified invitation system generates URLs in the following format:

- **Marketing:** `{NEXT_PUBLIC_BASE_URL}/marketing/invite/{token}`
- **Collections:** `{NEXT_PUBLIC_BASE_URL}/collections/invite/{token}`
- **Atlas:** `{NEXT_PUBLIC_BASE_URL}/atlas/invite/{token}`

### Token Expiration

- **Marketing:** 72 hours (3 days)
- **Collections:** 7 days
- **Atlas:** 7 days

### Domain Validation

- **Marketing:** `@stitchesafrica.com`, `@stitchesafrica.pro`
- **Collections:** No domain restriction
- **Atlas:** `@stitchesafrica.com`, `@stitchesafrica.pro`

---

## Troubleshooting

### Issue: Invitation tokens are invalid

**Solution:** Ensure `JWT_SECRET` is set and consistent across all environments.

### Issue: Invitation links point to wrong domain

**Solution:** Verify `NEXT_PUBLIC_BASE_URL` is set correctly for your environment.

### Issue: Firebase authentication fails

**Solution:** Check that all Firebase configuration variables are set correctly and match your Firebase project.

### Issue: Email invitations not sending

**Solution:** Verify email configuration variables and check that the email service is accessible.

---

## Quick Setup Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Set `JWT_SECRET` (generate using `openssl rand -base64 32`)
- [ ] Set `NEXT_PUBLIC_BASE_URL` for your environment
- [ ] Configure Firebase Admin SDK credentials
- [ ] Configure Firebase Client SDK credentials
- [ ] Set up payment gateway credentials (Flutterwave, Paystack, Stripe)
- [ ] Configure email credentials (Microsoft, Gmail)
- [ ] Test invitation system end-to-end
- [ ] Verify all invitation URLs are correct
- [ ] Confirm JWT tokens are being generated and validated

---

## Support

For questions or issues with environment configuration, contact the development team or refer to the main project documentation.

**Last Updated:** November 16, 2025
