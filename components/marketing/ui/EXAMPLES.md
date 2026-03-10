# Marketing UI Components - Usage Examples

## Complete Dashboard Example

```tsx
'use client';

import { useState } from 'react';
import {
  ResponsiveDashboard,
  DashboardHeader,
  DashboardStatsGrid,
  DashboardSection,
  StatCard,
  DataTable,
  Column,
  StatusBadge,
  RoleBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from '@/components/marketing/ui';
import { Users, Building2, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  status: 'active' | 'inactive';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => <RoleBadge role={value} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <ResponsiveDashboard>
      <DashboardHeader
        title="Marketing Dashboard"
        description="Overview of your team and vendors"
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>Add New</Button>
          </>
        }
      />

      <DashboardStatsGrid columns={{ default: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Users"
          value={150}
          subtitle="Active team members"
          icon={Users}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Active Vendors"
          value={45}
          subtitle="Verified vendors"
          icon={Building2}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Total Orders"
          value={1234}
          subtitle="This month"
          icon={TrendingUp}
          color="purple"
          trend="+23%"
        />
        <StatCard
          title="Products"
          value={567}
          subtitle="In catalog"
          icon={Package}
          color="orange"
          trend="+5%"
        />
      </DashboardStatsGrid>

      <DashboardSection
        title="Team Members"
        description="Manage your team and their roles"
        actions={<Button size="sm">Invite User</Button>}
      >
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Get started by inviting your first team member"
            action={{ label: 'Invite User', onClick: () => {} }}
          />
        ) : (
          <DataTable
            data={users}
            columns={columns}
            searchable
            searchPlaceholder="Search users..."
            pageSize={10}
          />
        )}
      </DashboardSection>
    </ResponsiveDashboard>
  );
}
```

## Form Example

```tsx
'use client';

import { useState } from 'react';
import {
  ResponsiveForm,
  FormSection,
  FormRow,
  FormField,
} from '@/components/marketing/ui';

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Submit form data
      console.log('Submitting:', formData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveForm
      title="Create New User"
      description="Add a new team member to your organization"
      onSubmit={handleSubmit}
      submitLabel="Create User"
      onCancel={() => window.history.back()}
      isLoading={loading}
    >
      <FormSection
        title="Personal Information"
        description="Basic details about the user"
      >
        <FormRow columns={2}>
          <FormField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={(value) => setFormData({ ...formData, firstName: value })}
            error={errors.firstName}
            required
            placeholder="John"
          />
          <FormField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={(value) => setFormData({ ...formData, lastName: value })}
            error={errors.lastName}
            required
            placeholder="Doe"
          />
        </FormRow>
        
        <FormField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          error={errors.email}
          required
          placeholder="john.doe@stitchesafrica.com"
        />
        
        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          error={errors.phone}
          placeholder="+1 (555) 000-0000"
        />
      </FormSection>

      <FormSection
        title="Role & Permissions"
        description="Assign a role to the user"
      >
        <FormField
          label="Role"
          name="role"
          type="select"
          value={formData.role}
          onChange={(value) => setFormData({ ...formData, role: value })}
          error={errors.role}
          required
          options={[
            { value: 'team_lead', label: 'Team Lead' },
            { value: 'bdm', label: 'Business Development Manager' },
            { value: 'team_member', label: 'Team Member' },
          ]}
        />
      </FormSection>
    </ResponsiveForm>
  );
}
```

## Mobile-Optimized Table Example

```tsx
'use client';

import { ResponsiveTable, StatusBadge } from '@/components/marketing/ui';

interface Vendor {
  id: string;
  name: string;
  products: number;
  orders: number;
  status: 'active' | 'inactive';
}

export default function VendorsTable({ vendors }: { vendors: Vendor[] }) {
  const columns = [
    {
      key: 'name',
      label: 'Vendor Name',
      mobileLabel: 'Name',
    },
    {
      key: 'products',
      label: 'Products',
      render: (value: number) => `${value} items`,
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (value: number) => `${value} orders`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: 'active' | 'inactive') => <StatusBadge status={value} />,
    },
  ];

  return (
    <ResponsiveTable
      data={vendors}
      columns={columns}
      keyExtractor={(row) => row.id}
      emptyMessage="No vendors found"
    />
  );
}
```

## Modal Example

```tsx
'use client';

import { useState } from 'react';
import { Modal, ConfirmModal, FormField } from '@/components/marketing/ui';
import { Button } from '@/components/ui/button';

export default function ModalExamples() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [name, setName] = useState('');

  const handleDelete = async () => {
    // Delete logic
    setIsDeleteOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsEditOpen(true)}>Edit</Button>
      <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
        Delete
      </Button>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User"
        description="Update user information"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditOpen(false)}>Save Changes</Button>
          </>
        }
      >
        <FormField
          label="Name"
          name="name"
          value={name}
          onChange={setName}
          placeholder="Enter name"
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
```

## Loading States Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  LoadingSpinner,
  LoadingOverlay,
  DashboardSkeleton,
  TableSkeleton,
} from '@/components/marketing/ui';

export default function LoadingExample() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
      setData({ /* data */ });
    }, 2000);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* Your content */}
      {loading && <LoadingOverlay message="Saving changes..." />}
    </div>
  );
}
```

## Responsive Layout Example

```tsx
'use client';

import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
} from '@/components/marketing/ui';
import { Card, CardContent } from '@/components/ui/card';

export default function ResponsiveLayoutExample() {
  return (
    <ResponsiveContainer>
      <ResponsiveStack direction="responsive" gap={6}>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Main Content</h1>
        </div>
        <div>
          <Button>Action</Button>
        </div>
      </ResponsiveStack>

      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3, xl: 4 }} gap={6}>
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent>{item.name}</CardContent>
          </Card>
        ))}
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
}
```
