# Unified Invitation System Configuration

This document provides a quick reference for configuring the unified invitation system across Marketing, Collections, and Atlas dashboards.

## Required Environment Variables

### 1. JWT_SECRET (Critical)

```env
JWT_SECRET=your-strong-jwt-secret-key-here
```

**Purpose:** Signs and verifies JWT tokens for invitation links across all three systems.

**Requirements:**
- Minimum 32 characters
- Cryptographically secure random string
- Must be the same across all environments for a given deployment

**Generate a secure secret:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Used by:**
- Marketing: `lib/marketing/invitation-service.ts`
- Collections: `lib/collections/invitation-service.ts`
- Atlas: `lib/atlas/invitation-service.ts`

**Fallback values (INSECURE - Development only):**
- Marketing: `'marketing-dashboard-secret'`
- Collections: `'collections-dashboard-secret'`
- Atlas: `'atlas-dashboard-secret'`

⚠️ **Never use fallback values in production!**

---

### 2. NEXT_PUBLIC_BASE_URL

```env
NEXT_PUBLIC_BASE_URL=https://staging-stitches-africa.vercel.app
```

**Purpose:** Base URL for generating invitation links.

**Environment-specific values:**
- Development: `http://localhost:3000`
- Staging: `https://staging.stitchesafrica.com`
- Production: `https://staging-stitches-africa.vercel.app`

**Generates invitation URLs:**
- Marketing: `{BASE_URL}/marketing/invite/{token}`
- Collections: `{BASE_URL}/collections/invite/{token}`
- Atlas: `{BASE_URL}/atlas/invite/{token}`

**Fallback:** `http://localhost:3000` (for development)

**Note:** The system also checks for `NEXT_PUBLIC_APP_URL` as a fallback for backward compatibility.

---

## Invitation System Overview

### Token Expiration

| System | Expiration Period |
|--------|------------------|
| Marketing | 72 hours (3 days) |
| Collections | 7 days |
| Atlas | 7 days |

### Domain Validation

| System | Allowed Domains |
|--------|----------------|
| Marketing | `@stitchesafrica.com`, `@stitchesafrica.pro` |
| Collections | No restriction (any valid email) |
| Atlas | `@stitchesafrica.com`, `@stitchesafrica.pro` |

### Firestore Collections

| System | Collection Name |
|--------|----------------|
| Marketing | `marketing_invitations` |
| Collections | `collectionsInvitations` |
| Atlas | `atlasInvitations` |

---

## Configuration Checklist

### Initial Setup

- [ ] Set `JWT_SECRET` in `.env` file (generate using secure method)
- [ ] Set `NEXT_PUBLIC_BASE_URL` for your environment
- [ ] Verify Firebase Admin SDK is configured
- [ ] Verify Firebase Client SDK is configured
- [ ] Test invitation creation in each system
- [ ] Test invitation acceptance flow (existing user)
- [ ] Test invitation acceptance flow (new user)
- [ ] Verify invitation emails are being sent
- [ ] Confirm invitation links are correct

### Security Verification

- [ ] Confirm `JWT_SECRET` is at least 32 characters
- [ ] Verify `JWT_SECRET` is not committed to version control
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Test that expired tokens are rejected
- [ ] Test that already-used tokens are rejected
- [ ] Test that invalid tokens are rejected
- [ ] Verify domain validation works (Marketing/Atlas)

### Production Deployment

- [ ] Generate new production `JWT_SECRET`
- [ ] Set production `NEXT_PUBLIC_BASE_URL`
- [ ] Update Firestore security rules
- [ ] Test end-to-end invitation flow in production
- [ ] Monitor invitation creation and acceptance
- [ ] Set up alerts for invitation failures

---

## Troubleshooting

### Issue: "Invalid or expired token" errors

**Possible causes:**
1. `JWT_SECRET` is not set or differs between environments
2. Token has expired
3. Token was generated with a different secret

**Solution:**
1. Verify `JWT_SECRET` is set in `.env`
2. Ensure the same `JWT_SECRET` is used across all services
3. Check token expiration time
4. Regenerate invitation if needed

---

### Issue: Invitation links point to wrong domain

**Possible causes:**
1. `NEXT_PUBLIC_BASE_URL` is not set correctly
2. Using wrong environment configuration

**Solution:**
1. Verify `NEXT_PUBLIC_BASE_URL` in `.env`
2. Check that the value matches your deployment environment
3. Restart the development server after changing environment variables

---

### Issue: Domain validation fails (Atlas/Marketing)

**Possible causes:**
1. Email domain is not `@stitchesafrica.com` or `@stitchesafrica.pro`
2. Email has extra whitespace or incorrect formatting

**Solution:**
1. Verify email domain is correct
2. Check for typos in email address
3. Ensure email is properly trimmed and lowercased

---

### Issue: Invitation emails not sending

**Possible causes:**
1. Email service configuration is incorrect
2. Network issues
3. Email API is down

**Solution:**
1. Check email configuration in `.env`
2. Verify email service is accessible
3. Check server logs for email errors
4. Note: Invitation is still valid even if email fails - can be manually shared

---

## API Endpoints

### Marketing

- Create: `POST /api/marketing/invites/create`
- Validate: `GET /api/marketing/invites/validate/[token]`
- Accept: `POST /api/marketing/invites/accept/[token]`

### Collections

- Create: `POST /api/collections/team/invite`
- Validate: `GET /api/collections/invites/validate/[token]`
- Accept: `POST /api/collections/invites/accept/[token]`

### Atlas

- Create: `POST /api/atlas/team/invite`
- Validate: `GET /api/atlas/invites/validate/[token]`
- Accept: `POST /api/atlas/invites/accept/[token]`

---

## Testing Commands

### Test JWT Secret Generation

```bash
# Generate a test secret
openssl rand -base64 32

# Verify it's at least 32 characters
echo "your-secret-here" | wc -c
```

### Test Invitation Link Generation

```javascript
// In browser console or Node.js
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const token = 'test-token';
console.log(`Marketing: ${baseUrl}/marketing/invite/${token}`);
console.log(`Collections: ${baseUrl}/collections/invite/${token}`);
console.log(`Atlas: ${baseUrl}/atlas/invite/${token}`);
```

### Test JWT Token Verification

```javascript
// In Node.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const token = 'your-invitation-token';

try {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  console.log('Token is valid:', decoded);
} catch (error) {
  console.error('Token is invalid:', error.message);
}
```

---

## Environment Variable Priority

The system checks environment variables in the following order:

1. `NEXT_PUBLIC_BASE_URL` (preferred)
2. `NEXT_PUBLIC_APP_URL` (fallback for backward compatibility)
3. `'http://localhost:3000'` (development fallback)

For JWT_SECRET:
1. `JWT_SECRET` (required)
2. System-specific fallback (insecure, development only)

---

## Migration Notes

If you're migrating from an old invitation system:

1. **Set JWT_SECRET:** Generate and set a new `JWT_SECRET` in your environment
2. **Update Base URL:** Ensure `NEXT_PUBLIC_BASE_URL` is set correctly
3. **Test Old Tokens:** Old invitation tokens will not work with the new system
4. **Resend Invitations:** Users with pending invitations will need new invitations
5. **Update Documentation:** Update any internal documentation with new invitation URLs

---

## Security Best Practices

1. **Rotate JWT_SECRET periodically** (every 90 days recommended)
2. **Use different secrets for different environments** (dev, staging, prod)
3. **Never commit secrets to version control**
4. **Use secret management tools** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Monitor invitation usage** for suspicious activity
6. **Set up alerts** for failed invitation attempts
7. **Audit invitation logs** regularly

---

## Support

For issues or questions about the unified invitation system configuration:

1. Check this documentation first
2. Review the main environment variables documentation: `docs/ENVIRONMENT_VARIABLES.md`
3. Check the invitation service implementations:
   - `lib/marketing/invitation-service.ts`
   - `lib/collections/invitation-service.ts`
   - `lib/atlas/invitation-service.ts`
4. Contact the development team

**Last Updated:** November 16, 2025
