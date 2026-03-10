# Quick Test Guide for Atlas Firestore Security Rules

## Firebase Console Testing Steps

### Step 1: Access Rules Playground

1. Go to https://console.firebase.google.com/
2. Select the **stitches-africa** project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Click **Rules Playground** button (top right)

### Step 2: Run Test Cases

Copy and paste these test cases into the Rules Playground:

---

## ✅ Test Case 1: User Reads Own Document (SHOULD PASS)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `get`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```

**Expected:** ✅ **Allowed**

---

## ❌ Test Case 2: User Reads Another User's Document (SHOULD FAIL)

**Location:** `/atlasUsers/otheruser456`  
**Operation:** `get`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```

**Expected:** ❌ **Denied**

---

## ✅ Test Case 3: Create Valid Atlas User (SHOULD PASS)

**Location:** `/atlasUsers/newuser789`  
**Operation:** `create`  
**Authentication:**
```json
{
  "uid": "newuser789"
}
```
**Document Data:**
```json
{
  "uid": "newuser789",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ✅ **Allowed**

---

## ❌ Test Case 4: Create User with isAtlasUser=false (SHOULD FAIL)

**Location:** `/atlasUsers/newuser789`  
**Operation:** `create`  
**Authentication:**
```json
{
  "uid": "newuser789"
}
```
**Document Data:**
```json
{
  "uid": "newuser789",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ❌ **Denied** (isAtlasUser must be true)

---

## ❌ Test Case 5: Create User with Wrong Role (SHOULD FAIL)

**Location:** `/atlasUsers/newuser789`  
**Operation:** `create`  
**Authentication:**
```json
{
  "uid": "newuser789"
}
```
**Document Data:**
```json
{
  "uid": "newuser789",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "admin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ❌ **Denied** (role must be "superadmin")

---

## ❌ Test Case 6: Create User with Missing Fields (SHOULD FAIL)

**Location:** `/atlasUsers/newuser789`  
**Operation:** `create`  
**Authentication:**
```json
{
  "uid": "newuser789"
}
```
**Document Data:**
```json
{
  "uid": "newuser789",
  "email": "test@stitchesafrica.com",
  "isAtlasUser": true
}
```

**Expected:** ❌ **Denied** (missing required fields)

---

## ✅ Test Case 7: Update Allowed Fields (SHOULD PASS)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `update`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```
**Existing Document:**
```json
{
  "uid": "testuser123",
  "email": "test@stitchesafrica.com",
  "fullName": "Old Name",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```
**New Document Data:**
```json
{
  "uid": "testuser123",
  "email": "test@stitchesafrica.com",
  "fullName": "New Name",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ✅ **Allowed** (only fullName and updatedAt changed)

---

## ❌ Test Case 8: Update Protected Field - Email (SHOULD FAIL)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `update`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```
**Existing Document:**
```json
{
  "uid": "testuser123",
  "email": "old@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```
**New Document Data:**
```json
{
  "uid": "testuser123",
  "email": "new@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ❌ **Denied** (email cannot be changed)

---

## ❌ Test Case 9: Update Protected Field - Role (SHOULD FAIL)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `update`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```
**Existing Document:**
```json
{
  "uid": "testuser123",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```
**New Document Data:**
```json
{
  "uid": "testuser123",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "admin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ❌ **Denied** (role cannot be changed)

---

## ❌ Test Case 10: Update Protected Field - isAtlasUser (SHOULD FAIL)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `update`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```
**Existing Document:**
```json
{
  "uid": "testuser123",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```
**New Document Data:**
```json
{
  "uid": "testuser123",
  "email": "test@stitchesafrica.com",
  "fullName": "Test User",
  "role": "superadmin",
  "isAtlasUser": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Expected:** ❌ **Denied** (isAtlasUser cannot be changed)

---

## ❌ Test Case 11: Delete Document (SHOULD FAIL)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `delete`  
**Authentication:**
```json
{
  "uid": "testuser123"
}
```

**Expected:** ❌ **Denied** (deletion not allowed from client)

---

## ❌ Test Case 12: Unauthenticated Access (SHOULD FAIL)

**Location:** `/atlasUsers/testuser123`  
**Operation:** `get`  
**Authentication:** `null` (no authentication)

**Expected:** ❌ **Denied** (authentication required)

---

## Summary of Expected Results

| Test Case | Operation | Expected Result | Reason |
|-----------|-----------|-----------------|--------|
| 1 | Read own document | ✅ Allow | User authenticated and owns document |
| 2 | Read other's document | ❌ Deny | User doesn't own document |
| 3 | Create valid user | ✅ Allow | All validations pass |
| 4 | Create with isAtlasUser=false | ❌ Deny | isAtlasUser must be true |
| 5 | Create with wrong role | ❌ Deny | Role must be "superadmin" |
| 6 | Create with missing fields | ❌ Deny | All fields required |
| 7 | Update allowed fields | ✅ Allow | Only fullName/updatedAt changed |
| 8 | Update email | ❌ Deny | Email is protected |
| 9 | Update role | ❌ Deny | Role is protected |
| 10 | Update isAtlasUser | ❌ Deny | isAtlasUser is protected |
| 11 | Delete document | ❌ Deny | Deletion not allowed |
| 12 | Unauthenticated access | ❌ Deny | Authentication required |

## Deployment Command

After testing, deploy the rules with:

```bash
firebase deploy --only firestore:rules
```

## Verification

After deployment, verify in Firebase Console:
1. Go to Firestore Database → Rules
2. Check that the rules match your `firestore.rules` file
3. Note the deployment timestamp

