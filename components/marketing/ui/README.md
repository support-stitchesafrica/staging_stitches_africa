# Marketing Dashboard UI Component Library

A comprehensive, responsive UI component library for the Marketing Dashboard. All components are built with mobile-first design principles and follow accessibility best practices.

## Components

### Form Components

#### FormField
Reusable form field with built-in validation and error handling.

```tsx
import { FormField } from '@/components/marketing/ui';

<FormField
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
  placeholder="Enter your email"
/>
```

#### ResponsiveForm
Mobile-optimized form layout with automatic responsive behavior.

```tsx
import { ResponsiveForm, FormSection, FormRow } from '@/components/marketing/ui';

<ResponsiveForm
  title="Create User"
  description="Add a new team member"
  onSubmit={handleSubmit}
  submitLabel="Create"
  onCancel={handleCancel}
>
  <FormSection title="Basic Information">
    <FormRow columns={2}>
      <FormField label="First Name" name="firstName" value={firstName} onChange={setFirstName} />
      <FormField label="Last Name" name="lastName" value={lastName} onChange={setLastName} />
    </FormRow>
  </FormSection>
</ResponsiveForm>
```

### Table Components

#### DataTable
Feature-rich data table with sorting, filtering, and pagination.

```tsx
import { DataTable, Column } from '@/components/marketing/ui';

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', render: (value) => <RoleBadge role={value} /> },
];

<DataTable
  data={users}
  columns={columns}
  searchable
  searchPlaceholder="Search users..."
  pageSize={10}
/>
```

#### ResponsiveTable
Mobile-optimized table that converts to cards on small screens.

```tsx
import { ResponsiveTable } from '@/components/marketing/ui';

<ResponsiveTable
  data={vendors}
  columns={columns}
  keyExtractor={(row) => row.id}
  emptyMessage="No vendors found"
/>
```

### Modal Components

#### Modal
Customizable modal dialog.

```tsx
import { Modal } from '@/components/marketing/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  size="md"
>
  <p>Modal content goes here</p>
</Modal>
```

#### ConfirmModal
Pre-configured confirmation modal.

```tsx
import { ConfirmModal } from '@/components/marketing/ui';

<ConfirmModal
  isOpen={isOpen}
  onClose={handleClose}
  onConfirm={handleConfirm}
  title="Delete User"
  description="This action cannot be undone."
  confirmText="Delete"
  variant="destructive"
/>
```

### Dashboard Components

#### DashboardWidget
Reusable dashboard metric widget.

```tsx
import { DashboardWidget } from '@/components/marketing/ui';
import { Users } from 'lucide-react';

<DashboardWidget
  title="Total Users"
  value={150}
  description="Active team members"
  icon={Users}
  trend={{ value: 12, label: 'vs last month' }}
  variant="compact"
/>
```

#### StatCard
Simplified stat card for dashboard metrics.

```tsx
import { StatCard } from '@/components/marketing/ui';
import { Building2 } from 'lucide-react';

<StatCard
  title="Active Vendors"
  value={45}
  subtitle="Total vendors"
  icon={Building2}
  color="green"
  trend="+8%"
/>
```

#### ResponsiveDashboard
Complete responsive dashboard layout.

```tsx
import {
  ResponsiveDashboard,
  DashboardHeader,
  DashboardStatsGrid,
  DashboardSection,
} from '@/components/marketing/ui';

<ResponsiveDashboard>
  <DashboardHeader
    title="Dashboard"
    description="Overview of your metrics"
    actions={<Button>Add New</Button>}
  />
  
  <DashboardStatsGrid columns={{ default: 1, sm: 2, lg: 4 }}>
    {/* Stat cards */}
  </DashboardStatsGrid>
  
  <DashboardSection title="Recent Activity">
    {/* Content */}
  </DashboardSection>
</ResponsiveDashboard>
```

### Layout Components

#### ResponsiveContainer
Responsive container with consistent padding.

```tsx
import { ResponsiveContainer } from '@/components/marketing/ui';

<ResponsiveContainer>
  <h1>Page Content</h1>
</ResponsiveContainer>
```

#### ResponsiveGrid
Responsive grid layout.

```tsx
import { ResponsiveGrid } from '@/components/marketing/ui';

<ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3, xl: 4 }} gap={6}>
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</ResponsiveGrid>
```

#### MobileMenu
Mobile-friendly navigation menu.

```tsx
import { MobileMenu } from '@/components/marketing/ui';

<MobileMenu
  title="Navigation"
  items={[
    { label: 'Dashboard', icon: Home, onClick: () => router.push('/dashboard') },
    { label: 'Users', icon: Users, onClick: () => router.push('/users'), badge: '5' },
  ]}
/>
```

### State Components

#### LoadingSpinner
Simple loading spinner.

```tsx
import { LoadingSpinner } from '@/components/marketing/ui';

<LoadingSpinner size="lg" />
```

#### LoadingOverlay
Full-screen loading overlay.

```tsx
import { LoadingOverlay } from '@/components/marketing/ui';

{isLoading && <LoadingOverlay message="Loading data..." />}
```

#### DashboardSkeleton
Pre-built dashboard loading skeleton.

```tsx
import { DashboardSkeleton } from '@/components/marketing/ui';

{loading ? <DashboardSkeleton /> : <Dashboard data={data} />}
```

#### EmptyState
Empty state component.

```tsx
import { EmptyState } from '@/components/marketing/ui';
import { Users } from 'lucide-react';

<EmptyState
  icon={Users}
  title="No users found"
  description="Get started by inviting your first team member"
  action={{ label: 'Invite User', onClick: handleInvite }}
/>
```

#### ErrorState
Error state component.

```tsx
import { ErrorState } from '@/components/marketing/ui';

<ErrorState
  title="Failed to load data"
  message="Unable to fetch users. Please try again."
  onRetry={handleRetry}
  variant="card"
/>
```

### Badge Components

#### StatusBadge
Pre-configured status badges.

```tsx
import { StatusBadge } from '@/components/marketing/ui';

<StatusBadge status="active" showIcon />
<StatusBadge status="pending" />
<StatusBadge status="completed" />
```

#### RoleBadge
Role-specific badges.

```tsx
import { RoleBadge } from '@/components/marketing/ui';

<RoleBadge role="super_admin" />
<RoleBadge role="team_lead" />
```

## Responsive Design

All components are built with mobile-first design:

- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Targets**: Minimum 44x44px for mobile
- **Font Sizes**: Automatically scale based on screen size
- **Layouts**: Stack vertically on mobile, horizontal on desktop

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Reduced motion support

## Styling

Components use Tailwind CSS and follow the design system defined in `tailwind.config.js`. Custom responsive utilities are available in `app/marketing/styles.css`.

## Best Practices

1. **Always use semantic HTML**: Use proper heading hierarchy, form labels, etc.
2. **Test on mobile devices**: Ensure touch targets are large enough
3. **Provide loading states**: Use skeleton loaders for better UX
4. **Handle errors gracefully**: Show clear error messages with retry options
5. **Keep forms simple**: Break complex forms into sections
6. **Use consistent spacing**: Follow the design system spacing scale
