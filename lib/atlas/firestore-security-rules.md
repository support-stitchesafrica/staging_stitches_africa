# Firestore Security Rules for Atlas Users

## Overview

This document provides instructions for deploying and testing the Firestore security rules for the Atlas authentication system. The security rules ensure that only authorized users can access Atlas user data and that critical fields are protected from unauthorized modification.

## Security Rules Location

The Firestore security rules are defined in the `firestore.rules` file at the root of the project.

## Rule Summary

### atlasUsers Collection

The `atlasUsers` collection has the following security rules:

1. **Read Access**: Users can only read their own user document
   - Requires authentication
   - User ID must match the document ID

2. **Create Access**: Users can create their own document during registration
   - Requires authentication
   - User ID must match the document ID
   - `isAtlasUser` must be set to `true`
   - `role` must be set to `"superadmin"`
   - All required fields must be present and of correct type

3. **Update Access**: Users can update their own document with restrictions
   - Requires authentication
   - User ID must match the document ID
   - Cannot modify: `uid`, `email`, `role`, `isAtlasUser`
   - Can modify: `fullName`, `updatedAt`

4. **Delete Access**: Deletion is not allowed from client-side
   - Must be performed via Firebase Admin SDK

## Deployment Instructions

### Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase project (if not already done):
   ```bash
   firebase init
   ```
   - Select "Firestore" when prompted
   - Choose the existing `stitches-africa` project
   - Accept the default `firestore.rules` file
   - Accept the default `firestore.indexes.json` file

### Deploy Security Rules

To deploy the security rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

To deploy both rules and indexes:

```bash
firebase deploy --only firestore
```

### Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `stitches-africa` project
3. Navigate to Firestore Database → Rules
4. Verify that the rules match the content of `firestore.rules`

## Testing Security Rules

### Using Firebase Console Rules Playground

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `stitches-africa` project
3. Navigate to Firestore Database → Rules
4. Click on the "Rules Playground" tab

#### Test Case 1: Read Own Document (Should Succeed)

```
Location: /atlasUsers/user123
Operation: get
Auth: { uid: "user123" }
Expected Result: ✅ Allow
```

#### Test Case 2: Read Another User's Document (Should Fail)

```
Location: /atlasUsers/user456
Operation: get
Auth: { uid: "user123" }
Expected Result: ❌ Deny
```

#### Test Case 3: Create Valid Document (Should Succeed)

```
Location: /atlasUsers/user123
Operation: create
Auth: { uid: "user123" }
Data: {
  uid: "user123",
  email: "test@stitchesafrica.com",
  fullName: "Test User",
  role: "superadmin",
  isAtlasUser: true,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
Expected Result: ✅ Allow
```

#### Test Case 4: Create Document with isAtlasUser=false (Should Fail)

```
Location: /atlasUsers/user123
Operation: create
Auth: { uid: "user123" }
Data: {
  uid: "user123",
  email: "test@stitchesafrica.com",
  fullName: "Test User",
  role: "superadmin",
  isAtlasUser: false,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
Expected Result: ❌ Deny
```

#### Test Case 5: Create Document with Wrong Role (Should Fail)

```
Location: /atlasUsers/user123
Operation: create
Auth: { uid: "user123" }
Data: {
  uid: "user123",
  email: "test@stitchesafrica.com",
  fullName: "Test User",
  role: "admin",
  isAtlasUser: true,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
Expected Result: ❌ Deny
```

#### Test Case 6: Update Allowed Fields (Should Succeed)

```
Location: /atlasUsers/user123
Operation: update
Auth: { uid: "user123" }
Existing Data: {
  uid: "user123",
  email: "test@stitchesafrica.com",
  fullName: "Test User",
  role: "superadmin",
  isAtlasUser: true,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
New Data: {
  uid: "user123",
  email: "test@stitchesafrica.com",
  fullName: "Updated Name",
  role: "superadmin",
  isAtlasUser: true,
  createdAt: <timestamp>,
  updatedAt: <new_timestamp>
}
Expected Result: ✅ Allow
```

#### Test Case 7: Update Protected Fields (Should Fail)

```
Location: /atlasUsers/user123
Operation: update
Auth: { uid: "user123" }
Existing Data: {
  uid: "user123",
  email: "test@stitchesafrica.com",
  fullName: "Test User",
  role: "superadmin",
  isAtlasUser: true,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
New Data: {
  uid: "user123",
  email: "newemail@stitchesafrica.com",
  fullName: "Test User",
  role: "superadmin",
  isAtlasUser: true,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
Expected Result: ❌ Deny
```

#### Test Case 8: Delete Document (Should Fail)

```
Location: /atlasUsers/user123
Operation: delete
Auth: { uid: "user123" }
Expected Result: ❌ Deny
```

### Using Firebase Emulator (Local Testing)

For local testing before deployment:

1. Start the Firebase emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Update your Firebase configuration to use the emulator:
   ```typescript
   import { connectFirestoreEmulator } from "firebase/firestore";
   
   if (process.env.NODE_ENV === 'development') {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

3. Run your application and test the authentication flow

### Automated Testing

You can also write automated tests for security rules using the Firebase Emulator Suite:

```bash
npm install --save-dev @firebase/rules-unit-testing
```

Example test file (`test/firestore-rules.test.ts`):

```typescript
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'stitches-africa',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('User can read their own document', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().doc('atlasUsers/alice').get());
  });

  test('User cannot read another user\'s document', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(alice.firestore().doc('atlasUsers/bob').get());
  });

  // Add more tests...
});
```

## Security Considerations

### What the Rules Protect

1. **User Privacy**: Users can only access their own data
2. **Data Integrity**: Critical fields (uid, email, role, isAtlasUser) cannot be modified after creation
3. **Authorization**: Only users with `isAtlasUser: true` can be created in the collection
4. **Role Protection**: All Atlas users must have the "superadmin" role

### What the Rules Don't Protect

1. **Email Domain Validation**: The rules don't validate email domains (@stitchesafrica.com or @stitchesafrica.pro)
   - This validation is performed in the client-side code before registration
   - Consider adding server-side validation via Cloud Functions

2. **Rate Limiting**: The rules don't prevent abuse through repeated requests
   - Consider implementing rate limiting via Firebase App Check

3. **Data Deletion**: While client-side deletion is blocked, admin deletion is still possible
   - Ensure proper access controls for Firebase Admin SDK usage

## Monitoring and Maintenance

### Monitor Rule Violations

1. Go to Firebase Console → Firestore Database → Usage
2. Check for "Permission Denied" errors
3. Review the logs to identify potential security issues or bugs

### Update Rules

When updating security rules:

1. Test changes in the Rules Playground first
2. Deploy to a staging environment if available
3. Monitor for errors after deployment
4. Have a rollback plan ready

### Best Practices

1. **Always test rules before deployment**
2. **Use the principle of least privilege**
3. **Document any rule changes**
4. **Review rules regularly for security improvements**
5. **Monitor Firebase logs for unauthorized access attempts**

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Verify the user is authenticated
   - Check that the user ID matches the document ID
   - Ensure all required fields are present and valid

2. **Rules Not Taking Effect**
   - Verify deployment was successful
   - Check Firebase Console to confirm rules are updated
   - Clear browser cache and reload the application

3. **Emulator Issues**
   - Ensure emulator is running on the correct port
   - Verify emulator configuration in code
   - Check that rules file path is correct

## Related Files

- **Security Rules**: `firestore.rules`
- **Indexes Configuration**: `firestore.indexes.json`
- **Firebase Configuration**: `firebase.json`
- **Schema Documentation**: `lib/atlas/firestore-schema.md`
- **Auth Service**: `lib/atlas/auth-service.ts`

## Support

For issues with security rules:
1. Check the Firebase Console for error messages
2. Review the Rules Playground test results
3. Check Firebase logs for detailed error information
4. Consult the [Firebase Security Rules documentation](https://firebase.google.com/docs/firestore/security/get-started)

