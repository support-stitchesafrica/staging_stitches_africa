# Back Office Permission Middleware

Comprehensive middleware system for route protection, authentication verification, and authorization checks in the Unified Back Office System.

## Overview

The permission middleware provides a robust security layer that:
- ✅ Verifies authentication tokens (Requirements 19.3)
- ✅ Validates user permissions (Requirements 19.4)
- ✅ Protects routes from unauthorized access (Requirements 19.1, 19.2)
- ✅ Logs unauthorized access attempts (Requirements 19.5)
- ✅ Provides flexible authorization options

## Features

### 1. Authentication Verification
- Extracts tokens from Authorization header or session cookie
- Validates Firebase ID tokens
- Fetches and validates user profiles
- Checks account active status

### 2. Authorization Checks
- Role-based access control
- Department-based access control
- Permission-level checks (read, write, delete)
- Custom authorization functions

### 3. Security Logging
- Logs all unauthorized access attempts
- Stores audit trail in Firestore
- Captures IP address and user agent
- Tracks reason for denial

### 4. Developer Experience
- Simple higher-order function API
- Type-safe context
- Composable middleware options
- Clear error messages

## Usage

### Basic Authentication

Protect a route with authentication only:

```typescript
import { withAuth } from '@/lib/backoffice/middleware';

export const GET = withAuth(async (request, context) => {
  // context.user is guaranteed to be authenticated
  return NextResponse.json({ user: context.user });
});
```

### Superadmin Only

Restrict access to superadmin users:

```typescript
import { withAuth, requireSuperAdmin } from '@/lib/backoffice/middleware';

export const GET = withAuth(async (request, context) => {
  // Only superadmin can access this route
  return NextResponse.json({ message: 'Admin only' });
}, requireSuperAdmin());
```

### Department Access

Require access to a specific department:

```typescript
import { withAuth, requireDepartment } from '@/lib/backoffice/middleware';

export const GET = withAuth(async (request, context) => {
  // User must have read access to analytics department
  return NextResponse.json({ data: analyticsData });
}, requireDepartment('analytics', 'read'));
```

### Write Permissions

Require write permissions for a department:

```typescript
import { withAuth, requireDepartment } from '@/lib/backoffice/middleware';

export const POST = withAuth(async (request, context) => {
  // User must have write access to promotions department
  const body = await request.json();
  // Create promotion...
  return NextResponse.json({ success: true });
}, requireDepartment('promotions', 'write'));
```

### Delete Permissions

Require delete permissions:

```typescript
import { withAuth, requireDepartment } from '@/lib/backoffice/middleware';

export const DELETE = withAuth(async (request, context) => {
  // User must have delete access to collections department
  // Delete collection...
  return NextResponse.json({ success: true });
}, requireDepartment('collections', 'delete'));
```

### Custom Authorization

Use custom authorization logic:

```typescript
import { withAuth } from '@/lib/backoffice/middleware';

export const GET = withAuth(async (request, context) => {
  // Custom logic already verified in middleware
  return NextResponse.json({ data: teamData });
}, {
  customAuthCheck: (user) => {
    // Only allow users from specific team
    return user.teamId === 'team-123';
  }
});
```

### Multiple Requirements

Combine multiple authorization requirements:

```typescript
import { withAuth, requireDepartment } from '@/lib/backoffice/middleware';

export const PUT = withAuth(async (request, context) => {
  // User must be from marketing department with write access
  // AND have a specific team ID
  return NextResponse.json({ success: true });
}, {
  ...requireDepartment('marketing', 'write'),
  customAuthCheck: (user) => user.teamId !== undefined
});
```

## Auth Context

The `context` parameter passed to your handler contains:

```typescript
interface AuthContext {
  user: BackOfficeUser;           // Authenticated user
  hasPermission: (department, level) => boolean;  // Check permission
  canAccessDepartment: (department) => boolean;   // Check department access
  isSuperAdmin: boolean;          // Quick superadmin check
}
```

### Using Context Methods

```typescript
export const GET = withAuth(async (request, context) => {
  // Check if user can write to analytics
  if (context.hasPermission('analytics', 'write')) {
    // Allow modification
  }

  // Check if user can access marketing department
  if (context.canAccessDepartment('marketing')) {
    // Show marketing data
  }

  // Check if user is superadmin
  if (context.isSuperAdmin) {
    // Show admin controls
  }

  return NextResponse.json({ data });
});
```

## Middleware Options

```typescript
interface MiddlewareOptions {
  // Skip authentication (for testing)
  skipAuth?: boolean;
  
  // Required role for access
  requiredRole?: BackOfficeRole;
  
  // Required department access
  requiredDepartment?: Department;
  
  // Required permission level
  requiredPermission?: PermissionLevel;
  
  // Allow inactive users
  allowInactiveUsers?: boolean;
  
  // Custom authorization check
  customAuthCheck?: (user: BackOfficeUser) => boolean;
}
```

## Helper Functions

### requireSuperAdmin()

Returns middleware options for superadmin-only routes:

```typescript
export const GET = withAuth(handler, requireSuperAdmin());
```

### requireDepartment(department, permission)

Returns middleware options for department access:

```typescript
export const GET = withAuth(handler, requireDepartment('analytics', 'read'));
```

### hasRole(user, ...roles)

Check if user has any of the specified roles:

```typescript
if (hasRole(context.user, 'superadmin', 'admin')) {
  // User is superadmin or admin
}
```

### isSuperAdmin(user)

Check if user is superadmin:

```typescript
if (isSuperAdmin(context.user)) {
  // User is superadmin
}
```

## Error Responses

The middleware returns standardized error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden - Inactive Account
```json
{
  "success": false,
  "error": {
    "code": "USER_INACTIVE",
    "message": "Account has been deactivated"
  }
}
```

### 403 Forbidden - Insufficient Role
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "Insufficient role permissions",
    "required": "superadmin",
    "current": "editor"
  }
}
```

### 403 Forbidden - No Department Access
```json
{
  "success": false,
  "error": {
    "code": "NO_DEPARTMENT_ACCESS",
    "message": "No access to analytics department"
  }
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Insufficient permissions for this action",
    "required": "write",
    "department": "promotions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Back office account not found"
  }
}
```

## Security Logging

All unauthorized access attempts are logged to:
1. Console (for development)
2. Firestore `backoffice_audit_logs` collection

Log entry structure:
```typescript
{
  type: 'unauthorized_access',
  timestamp: Date,
  userId: string | null,
  email: string | null,
  route: string,
  method: string,
  reason: string,
  ipAddress: string | null,
  userAgent: string | null
}
```

## Best Practices

### 1. Always Use Middleware for Protected Routes

❌ **Don't** manually check authentication:
```typescript
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization');
  // Manual auth logic...
}
```

✅ **Do** use the middleware:
```typescript
export const GET = withAuth(async (request, context) => {
  // Authentication handled automatically
});
```

### 2. Use Specific Permission Levels

❌ **Don't** use generic authentication for write operations:
```typescript
export const POST = withAuth(async (request, context) => {
  // Anyone authenticated can write
});
```

✅ **Do** specify required permissions:
```typescript
export const POST = withAuth(
  async (request, context) => {
    // Only users with write permission can access
  },
  requireDepartment('promotions', 'write')
);
```

### 3. Leverage Context Methods

❌ **Don't** manually check permissions:
```typescript
export const GET = withAuth(async (request, context) => {
  if (context.user.role === 'superadmin') {
    // Show admin data
  }
});
```

✅ **Do** use context helpers:
```typescript
export const GET = withAuth(async (request, context) => {
  if (context.isSuperAdmin) {
    // Show admin data
  }
});
```

### 4. Handle Errors Gracefully

✅ **Do** return consistent error responses:
```typescript
export const POST = withAuth(async (request, context) => {
  try {
    // Handler logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Operation failed'
        }
      },
      { status: 500 }
    );
  }
});
```

## Testing

### Skip Authentication for Tests

```typescript
export const GET = withAuth(
  async (request, context) => {
    // Handler logic
  },
  { skipAuth: true } // Only for testing!
);
```

### Mock Context

When `skipAuth: true`, the middleware provides a mock superadmin context:
```typescript
{
  user: {
    uid: 'test-user',
    email: 'test@backoffice.com',
    role: 'superadmin',
    // ... other fields
  },
  hasPermission: () => true,
  canAccessDepartment: () => true,
  isSuperAdmin: true
}
```

## Requirements Coverage

- ✅ **Requirement 19.1**: Unauthenticated users redirect to login
- ✅ **Requirement 19.2**: Authenticated users without permission redirect to unauthorized page
- ✅ **Requirement 19.3**: API endpoints verify authentication tokens
- ✅ **Requirement 19.4**: API endpoints verify user permissions
- ✅ **Requirement 19.5**: Log unauthorized access attempts

## Related Files

- `lib/backoffice/middleware.ts` - Main middleware implementation
- `lib/backoffice/permission-service.ts` - Permission checking logic
- `lib/backoffice/api-auth.ts` - Legacy auth utilities (deprecated)
- `types/backoffice.ts` - Type definitions

## Migration from Legacy Auth

If you're using the old `verifyAuth` and `isSuperAdmin` functions:

### Before
```typescript
import { verifyAuth, isSuperAdmin } from '@/lib/backoffice/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!isSuperAdmin(authResult.user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Handler logic
}
```

### After
```typescript
import { withAuth, requireSuperAdmin } from '@/lib/backoffice/middleware';

export const GET = withAuth(async (request, context) => {
  // Handler logic - auth handled automatically
}, requireSuperAdmin());
```

## Support

For questions or issues with the middleware:
1. Check this documentation
2. Review the design document at `.kiro/specs/unified-backoffice/design.md`
3. Check the requirements at `.kiro/specs/unified-backoffice/requirements.md`
4. Review example usage in `app/api/backoffice/users/route.ts`
