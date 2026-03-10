# Assignment UI Components

This directory contains reusable UI components for managing vendor assignments in the Marketing Dashboard.

## Components

### 1. AssignVendorDialog

A dialog component for assigning or reassigning vendors to team members.

**Features:**
- Vendor selection with details
- User selection with capacity information
- Notes field for assignment context
- Validation and error handling
- Support for both new assignments and reassignments

**Usage:**

```tsx
import { AssignVendorDialog } from '@/components/marketing/assignment';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <AssignVendorDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      vendor={{
        id: 'vendor-123',
        name: 'Acme Fashion',
        brandName: 'Acme Fashion'
      }}
      onSuccess={() => {
        console.log('Assignment successful!');
        // Refresh your data
      }}
    />
  );
}
```

**For Reassignment:**

```tsx
<AssignVendorDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  vendor={{
    id: 'vendor-123',
    name: 'Acme Fashion'
  }}
  currentAssignment={{
    id: 'assignment-456',
    userId: 'user-789',
    userName: 'John Doe'
  }}
  onSuccess={() => {
    // Handle reassignment success
  }}
/>
```

### 2. VendorCard

A card component for displaying vendor information with assignment actions.

**Features:**
- Vendor details display
- Assignment status badge
- Performance metrics
- Action buttons (View, Contact, Assign/Reassign)
- Integrated assignment dialogs

**Usage:**

```tsx
import { VendorCard } from '@/components/marketing/assignment';

function VendorList() {
  const { tailors } = useTailorsOptimized();
  const [assignments, setAssignments] = useState([]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tailors.map(vendor => {
        const assignment = assignments.find(a => a.vendorId === vendor.id);
        
        return (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            assignment={assignment}
            onAssignmentChange={() => {
              // Refresh assignments
            }}
            onView={(vendor) => {
              // Handle view action
            }}
            onContact={(vendor) => {
              // Handle contact action
            }}
          />
        );
      })}
    </div>
  );
}
```

**Compact Version:**

```tsx
import { VendorCardCompact } from '@/components/marketing/assignment';

<VendorCardCompact
  vendor={vendor}
  assignment={assignment}
  onAssignmentChange={handleRefresh}
  onView={handleView}
/>
```

### 3. AssignmentListView

A comprehensive list view for displaying and managing vendor assignments.

**Features:**
- Multiple view modes (by user, by vendor, all)
- Search functionality
- Status filtering
- Sorting by multiple fields
- Reassignment actions
- Empty states

**Usage:**

```tsx
import { AssignmentListView } from '@/components/marketing/assignment';

// View all assignments
function AllAssignments() {
  return (
    <AssignmentListView
      viewMode="all"
      onAssignmentChange={() => {
        // Handle assignment changes
      }}
    />
  );
}

// View assignments for a specific user
function UserAssignments({ userId }) {
  return (
    <AssignmentListView
      viewMode="by-user"
      userId={userId}
      onAssignmentChange={() => {
        // Handle assignment changes
      }}
    />
  );
}

// View assignment history for a specific vendor
function VendorAssignmentHistory({ vendorId }) {
  return (
    <AssignmentListView
      viewMode="by-vendor"
      vendorId={vendorId}
      onAssignmentChange={() => {
        // Handle assignment changes
      }}
    />
  );
}
```

## Integration Example

Here's a complete example of integrating these components into a dashboard:

```tsx
import { useState } from 'react';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import { VendorAssignmentService } from '@/lib/marketing/vendor-assignment-service';
import { VendorCard, AssignmentListView } from '@/components/marketing/assignment';

function VendorManagementDashboard() {
  const { tailors, loading } = useTailorsOptimized({ initialLimit: 20 });
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState<'vendors' | 'assignments'>('vendors');

  const loadAssignments = async () => {
    const data = await VendorAssignmentService.getAssignments();
    setAssignments(data);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('vendors')}
            className={activeTab === 'vendors' ? 'border-b-2 border-primary' : ''}
          >
            Vendors
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={activeTab === 'assignments' ? 'border-b-2 border-primary' : ''}
          >
            Assignments
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'vendors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tailors.map(vendor => {
            const assignment = assignments.find(
              a => a.vendorId === vendor.id && a.status === 'active'
            );
            
            return (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                assignment={assignment}
                onAssignmentChange={loadAssignments}
              />
            );
          })}
        </div>
      ) : (
        <AssignmentListView
          viewMode="all"
          onAssignmentChange={loadAssignments}
        />
      )}
    </div>
  );
}
```

## Requirements Validation

These components satisfy the following requirements from the spec:

- **Requirement 12.2**: Vendor selection and user selection in assignment dialog
- **Requirement 12.3**: Notes field and confirmation in assignment dialog
- **Requirement 12.1**: "Assign" button for unassigned vendors
- **Requirement 12.2**: "Reassign" button for assigned vendors
- **Requirement 12.1**: Show assigned user info on vendor cards
- **Requirement 4.3**: Show assignments by user and by vendor with filtering and sorting

## Dependencies

These components depend on:

- `@/lib/marketing/vendor-assignment-service` - Backend service for assignment operations
- `@/lib/marketing/useMarketingUsersOptimized` - Hook for fetching marketing users
- `@/contexts/MarketingAuthContext` - Authentication context
- `@/admin-services/useTailorsOptimized` - Hook for fetching vendor data
- `@/components/ui/*` - Shadcn UI components (Dialog, Button, Input, etc.)
- `@/hooks/use-toast` - Toast notifications

## Notes

- All components include proper error handling and loading states
- Components are fully typed with TypeScript
- Components follow the existing design patterns in the marketing dashboard
- Assignment capacity limits are enforced (50 assignments per user)
- All assignment operations are logged via ActivityLogService
