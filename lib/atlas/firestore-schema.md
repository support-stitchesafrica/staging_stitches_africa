# Atlas Firestore Schema Documentation

## Overview

This document describes the Firestore collection structure used by the Atlas authentication system. The Atlas system uses Firebase Firestore to store user profile data for authorized STITCHES Africa team members.

## Collections

### `atlasUsers`

The `atlasUsers` collection stores profile information for all Atlas users who have registered with authorized email domains (@stitchesafrica.com or @stitchesafrica.pro).

#### Collection Path
```
/atlasUsers/{uid}
```

#### Document Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | string | Yes | Firebase Authentication user ID (matches document ID) |
| `email` | string | Yes | User's email address (must be @stitchesafrica.com or @stitchesafrica.pro) |
| `fullName` | string | Yes | User's full name as provided during registration |
| `role` | string | Yes | User's role, always set to "superadmin" for Atlas users |
| `isAtlasUser` | boolean | Yes | Flag indicating Atlas user status, always set to `true` |
| `createdAt` | Timestamp | Yes | Timestamp when the user account was created |
| `updatedAt` | Timestamp | Yes | Timestamp when the user document was last updated |

#### Example Document

```typescript
{
  uid: "abc123xyz789",
  email: "john.doe@stitchesafrica.com",
  fullName: "John Doe",
  role: "superadmin",
  isAtlasUser: true,
  createdAt: Timestamp(2024-01-15T10:30:00Z),
  updatedAt: Timestamp(2024-01-15T10:30:00Z)
}
```

#### TypeScript Interface

```typescript
import { Timestamp } from "firebase/firestore";

export interface AtlasUser {
  uid: string;
  email: string;
  fullName: string;
  role: "superadmin";
  isAtlasUser: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

See `lib/atlas/types.ts` for the complete type definition.

## Indexes

### Required Indexes

The `atlasUsers` collection requires the following indexes for optimal query performance:

#### 1. Email Index (Single Field)
- **Field**: `email`
- **Type**: Ascending
- **Purpose**: Enable fast lookups by email address
- **Query Scope**: Collection

#### 2. isAtlasUser Index (Single Field)
- **Field**: `isAtlasUser`
- **Type**: Ascending
- **Purpose**: Enable filtering of Atlas users
- **Query Scope**: Collection

#### 3. Composite Index (if needed for future queries)
- **Fields**: 
  - `isAtlasUser` (Ascending)
  - `createdAt` (Descending)
- **Purpose**: Enable sorted queries of Atlas users by creation date
- **Query Scope**: Collection

### Index Configuration

Indexes are automatically created by Firebase when queries are executed. If you need to manually create indexes:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `stitches-africa` project
3. Navigate to Firestore Database → Indexes
4. Add the required indexes as specified above

## Security Rules

The `atlasUsers` collection is protected with Firestore security rules defined in the `firestore.rules` file at the project root.

### Security Rule Files

- **Rules Definition**: `firestore.rules` (project root)
- **Deployment Guide**: `lib/atlas/firestore-security-rules.md`
- **Testing Guide**: `lib/atlas/SECURITY_RULES_TEST_GUIDE.md`

### Security Rule Summary

- **Read**: Users can only read their own profile data
- **Create**: Users can create their own document during registration with required fields validated
- **Update**: Users can update limited fields (fullName, updatedAt) but cannot modify uid, email, role, or isAtlasUser
- **Delete**: Deletion is not allowed from client-side code (must be done via Firebase Admin SDK)

### Deploying Security Rules

To deploy the security rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

For detailed deployment instructions and testing procedures, see:
- `lib/atlas/firestore-security-rules.md` - Complete deployment and testing guide
- `lib/atlas/SECURITY_RULES_TEST_GUIDE.md` - Quick reference for Firebase Console testing

## Data Access Patterns

### Creating a New Atlas User

```typescript
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";

const userDocRef = doc(db, "atlasUsers", uid);
await setDoc(userDocRef, {
  uid,
  email,
  fullName,
  role: "superadmin",
  isAtlasUser: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});
```

### Reading an Atlas User

```typescript
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

const userDocRef = doc(db, "atlasUsers", uid);
const userDoc = await getDoc(userDocRef);

if (userDoc.exists()) {
  const atlasUser = userDoc.data() as AtlasUser;
  // Use atlasUser data
}
```

### Validating Atlas Access

```typescript
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

const userDocRef = doc(db, "atlasUsers", uid);
const userDoc = await getDoc(userDocRef);

const isAuthorized = userDoc.exists() && userDoc.data()?.isAtlasUser === true;
```

## Collection Initialization

The `atlasUsers` collection is automatically created when the first user registers. No manual initialization is required.

### Verification Steps

To verify the collection is properly configured:

1. **Check Collection Exists**:
   - Go to Firebase Console → Firestore Database
   - Look for the `atlasUsers` collection in the data viewer

2. **Verify Document Structure**:
   - Click on any document in the collection
   - Ensure all required fields are present with correct types

3. **Test Security Rules**:
   - Use the Firebase Console Rules Playground
   - Test read/write operations with different user contexts

4. **Monitor Indexes**:
   - Go to Firestore Database → Indexes
   - Ensure no missing index warnings appear in the console

## Maintenance

### Backup Strategy

- Firestore automatically backs up data
- For manual exports, use Firebase CLI:
  ```bash
  firebase firestore:export gs://stitches-africa.firebasestorage.app/backups/atlasUsers
  ```

### Data Cleanup

- User documents should be retained for audit purposes
- To remove a user, use Firebase Admin SDK (not client-side)
- Consider implementing a soft-delete pattern if needed

## Related Files

- **Type Definitions**: `lib/atlas/types.ts`
- **Auth Service**: `lib/atlas/auth-service.ts`
- **Auth Context**: `contexts/AtlasAuthContext.tsx`
- **Firebase Config**: `firebase.ts`

## Migration Notes

This is a new collection created for the Atlas authentication feature. No migration from existing data is required.

## Support

For questions or issues related to the Firestore schema:
1. Check the Firebase Console for error messages
2. Review the security rules in the Firebase Console
3. Verify indexes are properly configured
4. Check the Firebase logs for any access denied errors
