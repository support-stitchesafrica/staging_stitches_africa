# Referral Authentication Components

This directory contains authentication components for the referral program.

## Components

### ReferralAuthContext

The main authentication context that manages referral user state and authentication operations.

**Usage:**

```tsx
import { ReferralAuthProvider, useReferralAuth } from '@/contexts/ReferralAuthContext';

// Wrap your app with the provider
function App() {
  return (
    <ReferralAuthProvider>
      <YourComponents />
    </ReferralAuthProvider>
  );
}

// Use the hook in your components
function MyComponent() {
  const { user, referralUser, login, logout, isAuthenticated, isAdmin } = useReferralAuth();
  
  // Your component logic
}
```

### ReferralAuthGuard

Protects routes that require referral authentication. Redirects unauthenticated users to login.

**Usage:**

```tsx
import { ReferralAuthGuard } from '@/components/referral/auth';

// As a component wrapper
function DashboardPage() {
  return (
    <ReferralAuthGuard>
      <YourDashboardContent />
    </ReferralAuthGuard>
  );
}

// As a HOC
import { withReferralAuth } from '@/components/referral/auth';

function DashboardPage() {
  return <YourDashboardContent />;
}

export default withReferralAuth(DashboardPage);
```

**Props:**
- `redirectTo` (optional): Where to redirect unauthenticated users (default: `/referral/login`)
- `fallback` (optional): Component to show while checking authentication

### AdminAuthGuard

Protects routes that require admin privileges. Redirects non-admin users to dashboard.

**Usage:**

```tsx
import { AdminAuthGuard } from '@/components/referral/auth';

// As a component wrapper
function AdminPage() {
  return (
    <AdminAuthGuard>
      <YourAdminContent />
    </AdminAuthGuard>
  );
}

// As a HOC
import { withAdminAuth } from '@/components/referral/auth';

function AdminPage() {
  return <YourAdminContent />;
}

export default withAdminAuth(AdminPage);
```

**Props:**
- `redirectTo` (optional): Where to redirect unauthenticated users (default: `/referral/login`)
- `unauthorizedRedirect` (optional): Where to redirect non-admin users (default: `/referral/dashboard`)
- `fallback` (optional): Component to show while checking authorization

## Authentication Flow

1. **Registration**: User registers via `register(email, password, fullName)`
2. **Login**: User logs in via `login(email, password)`
3. **Auth State**: Firebase auth state changes trigger Firestore listener
4. **Real-time Updates**: User data syncs in real-time from Firestore
5. **Logout**: User logs out via `logout()`

## Security Features

- Real-time account deactivation detection
- Automatic sign-out on account deactivation
- Role-based access control (admin vs regular referrer)
- Protected routes with automatic redirects
- Error handling with user-friendly messages
