# Back Office UI Components

This directory contains reusable UI components for the unified back office system, implementing Bumpa-style design with gradients, modern typography, and clean aesthetics.

## Components

### BackOfficeHeader

The header component displays user information, notifications, and quick actions.

**Features:**
- User avatar with initials
- User name and role display
- Notifications button (ready for integration)
- Settings button
- Sign out functionality
- Responsive design

**Usage:**
```tsx
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';

// In your layout
<BackOfficeHeader />
```

### DashboardCard

A reusable card component for dashboard content with Bumpa styling.

**Props:**
- `title?: string` - Card title
- `description?: string` - Card description/subtitle
- `icon?: LucideIcon` - Icon to display in header
- `children: ReactNode` - Card content
- `className?: string` - Additional CSS classes
- `onClick?: () => void` - Click handler for the entire card
- `hoverable?: boolean` - Whether the card is clickable/hoverable
- `footer?: ReactNode` - Footer content

**Usage:**
```tsx
import DashboardCard from '@/components/backoffice/DashboardCard';
import { BarChart3 } from 'lucide-react';

<DashboardCard
  title="Analytics Overview"
  description="View your analytics data"
  icon={BarChart3}
  hoverable
  footer={<button>View Details</button>}
>
  <p>Your content here</p>
</DashboardCard>
```

### StatsCard

Displays statistical information with gradient backgrounds and modern styling.

**Props:**
- `value: string | number` - Main statistic value
- `label: string` - Label/description of the statistic
- `icon?: LucideIcon` - Icon to display
- `change?: number` - Change percentage (e.g., +12.5 or -5.2)
- `changeLabel?: string` - Change label (e.g., "vs last month")
- `variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'purple' | 'pink'` - Gradient variant
- `className?: string` - Additional CSS classes
- `onClick?: () => void` - Click handler
- `children?: ReactNode` - Additional content to display below the main stat

**Usage:**
```tsx
import StatsCard from '@/components/backoffice/StatsCard';
import { Users } from 'lucide-react';

<StatsCard
  value={1234}
  label="Total Users"
  icon={Users}
  change={12.5}
  changeLabel="vs last month"
  variant="primary"
/>
```

**Available Variants:**
- `primary` - Blue gradient
- `secondary` - Gray gradient
- `success` - Green gradient
- `warning` - Orange to red gradient
- `purple` - Purple gradient
- `pink` - Pink to rose gradient

### PermissionGuard

Conditionally renders children based on user permissions.

**Props:**
- `department?: Department` - Department to check access for
- `permission?: keyof PermissionLevel` - Permission level required (read, write, or delete)
- `children: ReactNode` - Content to render if user has permission
- `fallback?: ReactNode` - Content to render if user lacks permission
- `hideOnDenied?: boolean` - Whether to show nothing (vs fallback) when permission is denied
- `customCheck?: (user: any) => boolean` - Custom permission check function

**Usage:**
```tsx
import PermissionGuard from '@/components/backoffice/PermissionGuard';

// Basic usage - check department access
<PermissionGuard department="analytics">
  <AnalyticsContent />
</PermissionGuard>

// Check specific permission level
<PermissionGuard department="promotions" permission="write">
  <EditButton />
</PermissionGuard>

// With fallback content
<PermissionGuard 
  department="admin" 
  permission="delete"
  fallback={<p>You don't have permission to delete</p>}
>
  <DeleteButton />
</PermissionGuard>

// Hide completely if no permission
<PermissionGuard department="marketing" hideOnDenied>
  <MarketingSection />
</PermissionGuard>

// Custom permission check
<PermissionGuard customCheck={(user) => user.role === 'superadmin'}>
  <SuperAdminPanel />
</PermissionGuard>
```

**Higher-Order Component:**
```tsx
import { withPermissionGuard } from '@/components/backoffice/PermissionGuard';

const ProtectedComponent = withPermissionGuard(
  MyComponent,
  { department: 'analytics', permission: 'write' }
);
```

**Hook for Permission Checks:**
```tsx
import { usePermissionCheck } from '@/components/backoffice/PermissionGuard';

function MyComponent() {
  const { checkPermission, isSuperAdmin, currentRole, departments } = usePermissionCheck();
  
  const canEdit = checkPermission('promotions', 'write');
  
  return (
    <div>
      {canEdit && <EditButton />}
      {isSuperAdmin && <AdminPanel />}
    </div>
  );
}
```

## Design System

All components follow the Bumpa-style design system with:

- **Gradients**: Modern gradient backgrounds for visual appeal
- **Shadows**: Subtle shadows with hover effects
- **Typography**: Clean, modern font hierarchy
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design that adapts to all screen sizes

## Requirements

These components satisfy requirement **14.5** from the unified backoffice specification:
- Modern Bumpa-style interface
- Gradient backgrounds
- Clean typography
- Smooth animations
- Responsive design
