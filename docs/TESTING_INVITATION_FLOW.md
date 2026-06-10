# Testing Invitation Flow Locally

This guide explains how to test the Atlas and Collections team access invitation flow in your local development environment.

## Prerequisites

1. **Firebase Configuration**: Make sure your Firebase is properly configured with:
   - `.env.local` file with `JWT_SECRET` set
   - Firebase Admin SDK credentials configured
   - Firebase client SDK initialized

2. **Environment Variables**: Set up your `.env.local` file:
   ```env
   JWT_SECRET=your-secret-key-here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=your-base64-encoded-service-account-key
   ```
   
   **Important**: Set `NEXT_PUBLIC_BASE_URL=http://localhost:3000` for local development. This ensures that invitation links in emails point to your local server instead of production.

3. **Development Server**: Start your Next.js development server:
   ```bash
   npm run dev
   ```

4. **Dependencies**: Ensure all dependencies are installed:
   ```bash
   npm install
   ```

## Quick Test - Create a Single Invitation

The easiest way to create a test invitation is using the quick script:

### For Atlas:
```bash
npx tsx scripts/create-test-invitation.ts atlas test@stitchesafrica.com admin "Test User"
```

**Note**: Atlas requires emails from authorized domains:
- `@stitchesafrica.com`
- `@stitchesafrica.pro`

### For Collections:
```bash
npx tsx scripts/create-test-invitation.ts collections test@example.com editor "Test User"
```

The script will output an invitation URL that you can open in your browser.

## Testing with Real Email Links

**Yes, you can test invitation links sent to email addresses in local dev!**

When you create an invitation through the API (e.g., `/api/atlas/team/invite` or `/api/collections/team/invite`), the invitation email will contain a link that uses the `NEXT_PUBLIC_BASE_URL` environment variable.

### To Test Email Links Locally:

1. **Set `NEXT_PUBLIC_BASE_URL` in `.env.local`**:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

2. **Create an invitation** through your app's UI or API (this will send an email)

3. **Check your email** - the invitation link will point to:
   ```
   http://localhost:3000/atlas/invite/TOKEN
   ```
   or
   ```
   http://localhost:3000/collections/invite/TOKEN
   ```

4. **Click the link** - it will open in your browser and connect to your local dev server

### Important Notes:

- **Email links will only work locally if**:
  - `NEXT_PUBLIC_BASE_URL` is set to `http://localhost:3000` in `.env.local`
  - Your local dev server is running (`npm run dev`)
  - You're testing on the same machine (localhost links won't work if you receive the email on a different device)

- **Alternative for testing across devices**:
  - Use a tool like [ngrok](https://ngrok.com/) to create a public tunnel to your localhost
  - Set `NEXT_PUBLIC_BASE_URL` to your ngrok URL (e.g., `https://abc123.ngrok.io`)
  - Now the email links will work from any device

- **If you receive an email with a production URL**:
  - You can manually replace the domain in the URL with `localhost:3000`
  - Or copy just the token and construct: `http://localhost:3000/atlas/invite/TOKEN`

## Comprehensive Test - Full Flow Testing

Run the comprehensive test script to test both systems:

```bash
npx tsx scripts/test-invitation-flow.ts
```

This script will:
1. Create test invitations for both Atlas and Collections
2. Generate invitation URLs
3. Validate tokens using both the service methods and centralized validators
4. Test URL encoding/decoding
5. Provide a summary and next steps

## Manual Testing Steps

After creating an invitation, follow these steps to test the full flow:

### Scenario 1: New User (Email Not in Firebase)

1. **Open the invitation URL** in your browser (from the script output)

2. **Verify the validation page**:
   - Should show invitation details
   - Should detect that email doesn't exist in Firebase
   - Should show "Create Account" form

3. **Create account**:
   - Enter a password
   - Enter your name (if required)
   - Submit the form

4. **Verify success**:
   - Should successfully create Firebase Auth account
   - Should create user profile in Firestore
   - Should accept the invitation
   - Should redirect to the appropriate dashboard

5. **Check Firestore**:
   - Invitation document should have `status: 'accepted'`
   - User profile should exist with correct role
   - `acceptedAt` and `acceptedByUid` should be set

### Scenario 2: Existing User (Email Already in Firebase)

1. **Create a Firebase Auth account first** (if testing with existing user):
   ```bash
   # Use Firebase Console or create via your app's registration
   ```

2. **Open the invitation URL** in your browser

3. **Verify the validation page**:
   - Should show invitation details
   - Should detect that email exists in Firebase
   - Should show "Login" form

4. **Login**:
   - Enter the password for the existing account
   - Submit the form

5. **Verify success**:
   - Should successfully authenticate
   - Should accept the invitation
   - Should update user profile with new role (if different)
   - Should redirect to the appropriate dashboard

6. **Check Firestore**:
   - Invitation document should have `status: 'accepted'`
   - User profile should be updated with correct role
   - `acceptedAt` and `acceptedByUid` should be set

## Testing Edge Cases

### 1. Expired Token

To test an expired token:

1. Create an invitation
2. Manually update the invitation in Firestore to have an expired `expiresAt` timestamp
3. Try to access the invitation URL
4. Should show an expiration error

### 2. Already Accepted Invitation

1. Accept an invitation (complete the flow)
2. Try to access the same invitation URL again
3. Should show an error that the invitation has already been used

### 3. Invalid/Malformed Token

1. Modify the token in the URL (add/remove characters)
2. Try to access the invitation URL
3. Should show "invalid or malformed token" error

### 4. URL Encoding

The scripts automatically encode tokens in URLs. To verify encoding works:

1. Check that tokens with special characters are properly encoded
2. Verify the API routes correctly decode the tokens
3. Check browser console and server logs for any encoding/decoding errors

## Debugging

### Check Browser Console

Open browser DevTools (F12) and check:
- Network tab for API requests/responses
- Console tab for any client-side errors
- Application tab for localStorage/sessionStorage

### Check Server Logs

Watch your terminal where `npm run dev` is running for:
- API route logs (validation, acceptance)
- Token validation logs
- Firestore operation logs
- Any error messages

### Common Issues

1. **"Invalid or malformed token"**:
   - Check that `JWT_SECRET` is set in `.env.local`
   - Verify token wasn't corrupted in URL
   - Check server logs for detailed error

2. **"Invitation not found"**:
   - Verify invitation exists in Firestore
   - Check that `inviteId` in token matches Firestore document ID

3. **"Email mismatch"**:
   - Ensure the authenticated user's email matches invitation email
   - Check Firebase Auth user email

4. **"Domain validation failed"** (Atlas only):
   - Atlas requires emails from authorized domains
   - Use `@stitchesafrica.com` or `@stitchesafrica.pro`

## API Endpoints for Testing

You can also test the API endpoints directly:

### Validate Invitation
```bash
# Replace TOKEN with actual token
curl http://localhost:3000/api/atlas/invites/validate/TOKEN
curl http://localhost:3000/api/collections/invites/validate/TOKEN
```

### Accept Invitation (requires authentication)
```bash
# Replace TOKEN with actual token, ID_TOKEN with Firebase Auth ID token
curl -X POST http://localhost:3000/api/atlas/invites/accept/TOKEN \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ID_TOKEN" \
  -d '{"name": "Test User"}'
```

## Firestore Collections

The invitations are stored in:
- **Atlas**: `atlasInvitations` collection
- **Collections**: `collectionsInvitations` collection

User profiles are stored in:
- **Atlas**: `atlas_users` collection
- **Collections**: `collections_users` collection

## Environment Variables

Make sure these are set in `.env.local`:

```env
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=your-base64-encoded-service-account-key
```

**Note on `NEXT_PUBLIC_BASE_URL`**:
- For **local development**: Set to `http://localhost:3000` so invitation email links point to your local server
- For **production**: Set to your production URL (e.g., `https://www.stitchesafrica.com`)
- For **testing across devices**: Use a tool like ngrok and set to your ngrok URL

## Additional Test Scripts

- `scripts/test-jwt-token.ts` - Test JWT token generation and validation
- `scripts/test-firebase-admin.ts` - Test Firebase Admin SDK configuration
- `scripts/test-invitation-flow.ts` - Comprehensive invitation flow test
- `scripts/create-test-invitation.ts` - Quick single invitation creation

## Tips

1. **Use different emails** for different test scenarios
2. **Clean up test invitations** after testing (delete from Firestore)
3. **Check both browser and server logs** for complete debugging info
4. **Test with both new and existing users** to cover all flows
5. **Verify role assignment** in user profiles after acceptance

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Ensure Firebase is properly configured
4. Check that the development server is running
5. Verify Firestore collections exist and have correct structure

