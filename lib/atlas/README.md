# Atlas Authentication System

## Overview

This directory contains the core authentication system for the Atlas analytics dashboard. The system provides secure, domain-restricted access to authorized STITCHES Africa team members only.

## Files in this Directory

### Core Implementation Files

- **`types.ts`** - TypeScript type definitions for Atlas users and auth state
- **`auth-service.ts`** - Core authentication service with methods for registration, login, and validation
- **`auth-service.test.ts`** - Unit tests for the authentication service

### Documentation Files

- **`README.md`** (this file) - Overview of the Atlas authentication system
- **`firestore-schema.md`** - Complete Firestore database schema documentation
- **`firestore-security-rules.md`** - Comprehensive guide for deploying and testing security rules
- **`SECURITY_RULES_TEST_GUIDE.md`** - Quick reference for testing security rules in Firebase Console

## Related Files in Other Directories

### Context Providers
- `contexts/AtlasAuthContext.tsx` - React context for managing authentication state

### Components
- `components/atlas/auth/AtlasAuthForms.tsx` - Login and registration form components
- `components/atlas/auth/AtlasAuthGuard.tsx` - Route protection component

### Pages
- `app/atlas/(auth)/auth/page.tsx` - Authentication page
- `app/atlas/(dashboard)/page.tsx` - Protected dashboard page

### Configuration Files (Project Root)
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore index configuration
- `firebase.json` - Firebase project configuration
- `firebase.ts` - Firebase initialization and configuration

## Quick Start

### 1. Understanding the System

The Atlas authentication system:
- Restricts access to users with @stitchesafrica.com or @stitchesafrica.pro email domains
- Uses Firebase Authentication for identity management
- Stores user profiles in Firestore with an `isAtlasUser` flag
- Assigns all users the "superadmin" role by default
- Protects routes using the AtlasAuthGuard component

### 2. Key Concepts

**Email Domain Validation**: Only @stitchesafrica.com and @stitchesafrica.pro emails are allowed

**isAtlasUser Flag**: A boolean flag in Firestore that must be `true` for access to Atlas

**Role System**: All Atlas users have the "superadmin" role

**Route Protection**: The AtlasAuthGuard component validates authentication and authorization

### 3. Development Workflow

1. **Read the Schema**: Start with `firestore-schema.md` to understand the data structure
2. **Review Types**: Check `types.ts` for TypeScript interfaces
3. **Understand Auth Service**: Review `auth-service.ts` for authentication logic
4. **Test Security Rules**: Use `SECURITY_RULES_TEST_GUIDE.md` to test in Firebase Console
5. **Deploy Rules**: Follow `firestore-security-rules.md` for deployment instructions

## Security Rules

### Deployment

Deploy security rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

### Testing

Test security rules in Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Click "Rules Playground"
3. Use test cases from `SECURITY_RULES_TEST_GUIDE.md`

### Key Security Features

- Users can only read their own data
- Critical fields (uid, email, role, isAtlasUser) cannot be modified after creation
- Client-side deletion is blocked
- All operations require authentication

## Common Tasks

### Adding a New Atlas User

Users self-register through the authentication form at `/atlas/auth`. The system:
1. Validates email domain
2. Creates Firebase Auth account
3. Creates Firestore user document with `isAtlasUser: true`
4. Redirects to dashboard

### Protecting a New Route

Wrap the route component with AtlasAuthGuard:

```tsx
import { AtlasAuthGuard } from "@/components/atlas/auth/AtlasAuthGuard";

export default function ProtectedPage() {
  return (
    <AtlasAuthGuard>
      {/* Your protected content */}
    </AtlasAuthGuard>
  );
}
```

### Accessing User Data

Use the AtlasAuthContext:

```tsx
import { useAtlasAuth } from "@/contexts/AtlasAuthContext";

function MyComponent() {
  const { user, atlasUser, loading } = useAtlasAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!atlasUser) return <div>Not authorized</div>;
  
  return <div>Welcome, {atlasUser.fullName}!</div>;
}
```

## Testing

### Unit Tests

Run unit tests for the auth service:

```bash
npm test lib/atlas/auth-service.test.ts
```

### Integration Tests

Test the complete authentication flow:
1. Register with valid @stitchesafrica.com email
2. Login with credentials
3. Access protected route
4. Verify Firestore document creation
5. Test logout functionality

### Security Rules Testing

Use the Firebase Console Rules Playground or automated tests:

```bash
npm test test/firestore-rules.test.ts
```

## Troubleshooting

### Common Issues

**Permission Denied Errors**
- Verify user is authenticated
- Check that `isAtlasUser` is `true` in Firestore
- Ensure security rules are deployed

**Email Domain Validation Failing**
- Check that email ends with @stitchesafrica.com or @stitchesafrica.pro
- Verify no extra spaces or special characters

**User Not Redirecting After Login**
- Check that Firestore document was created
- Verify `isAtlasUser` flag is set to `true`
- Check browser console for errors

### Debug Steps

1. Check Firebase Console → Authentication for user account
2. Check Firebase Console → Firestore for user document
3. Verify `isAtlasUser: true` and `role: "superadmin"`
4. Check browser console for error messages
5. Review Firebase logs for security rule violations

## Architecture Decisions

### Why Email Domain Validation?

Email domain validation ensures only STITCHES Africa team members can access Atlas. This is enforced at registration time and provides a simple, effective access control mechanism.

### Why the isAtlasUser Flag?

The `isAtlasUser` flag provides an additional layer of security beyond email domain validation. It allows for:
- Revoking access without deleting the user account
- Distinguishing Atlas users from other users in the same Firebase project
- Flexible access control that can be managed via admin tools

### Why Firestore Security Rules?

Firestore security rules provide server-side validation that cannot be bypassed by client-side code. They ensure:
- Users can only access their own data
- Critical fields cannot be modified
- All operations are properly authenticated and authorized

### Why No Client-Side Deletion?

Preventing client-side deletion ensures:
- User accounts are retained for audit purposes
- Accidental deletions are prevented
- Deletion requires admin-level access via Firebase Admin SDK

## Future Enhancements

Potential improvements to consider:

1. **Role-Based Access Control**: Implement different permission levels (admin, viewer, etc.)
2. **Email Domain Validation in Security Rules**: Add server-side email domain validation
3. **Rate Limiting**: Implement rate limiting via Firebase App Check
4. **Audit Logging**: Track all authentication events for security monitoring
5. **Multi-Factor Authentication**: Add MFA for enhanced security
6. **Session Management**: Implement custom session timeout logic

## Support

For questions or issues:
1. Review the documentation files in this directory
2. Check the Firebase Console for error messages
3. Review Firebase logs for detailed error information
4. Consult the [Firebase Documentation](https://firebase.google.com/docs)

## Related Documentation

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)

