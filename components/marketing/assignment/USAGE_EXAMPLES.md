# Assignment UI Components - Usage Examples

## Quick Start

### 1. Basic Vendor Assignment

```tsx
import { useState } from 'react';
import { VendorCard } from '@/components/marketing/assignment';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';

function VendorGrid() {
  const { tailors, loading } = useTailorsOptimized();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tailors.map(vendor => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          onAssignmentChange={() => {
            // Refresh your data
            console.log('Assignment changed!');
          }}
        />
      ))}
    </div>
  );
}
```

### 2. Assignment List View

```tsx
import { AssignmentListView } from '@/components/marketing/assignment';

function AssignmentsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">All Assignments</h1>
      <AssignmentListView
        viewMode="all"
        onAssignmentChange={() => {
          console.log('Assignment updated!');
        }}
      />
    </div>
  );
}
```

### 3. User-Specific Assignments

```tsx
import { AssignmentListView } from '@/components/marketing/assignment';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

function MyAssignments() {
  const { user } = useMarketingAuth();
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>
      <AssignmentListView
        viewMode="by-user"
        userId={user.uid}
        onAssignmentChange={() => {
          // Refresh data
        }}
      />
    </div>
  );
}
```

## Advanced Examples

### 4. Dashboard with Tabs

```tsx
import { useState, useEffect } from 'react';
import { VendorCard, AssignmentListView } from '@/components/marketing/assignment';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import { VendorAssignmentService } from '@/lib/marketing/vendor-assignment-service';

function VendorManagementDashboard() {
  const { tailors, loading: tailorsLoading } = useTailorsOptimized({ initialLimit: 20 });
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState<'vendors' | 'assignments'>('vendors');
  const [loading, setLoading] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await VendorAssignmentService.getAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleAssignmentChange = () => {
    loadAssignments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'vendors'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Vendors ({tailors.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'assignments'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'vendors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tailorsLoading ? (
            <div>Loading vendors...</div>
          ) : (
            tailors.map(vendor => {
              const assignment = assignments.find(
                a => a.vendorId === vendor.id && a.status === 'active'
              );
              
              return (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  assignment={assignment}
                  onAssignmentChange={handleAssignmentChange}
                  onView={(v) => console.log('View vendor:', v.id)}
                  onContact={(v) => console.log('Contact vendor:', v.id)}
                />
              );
            })
          )}
        </div>
      ) : (
        <AssignmentListView
          viewMode="all"
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  );
}

export default VendorManagementDashboard;
```

### 5. Filtered Vendor List with Assignment Status

```tsx
import { useState, useMemo } from 'react';
import { VendorCard } from '@/components/marketing/assignment';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import { VendorAssignmentService } from '@/lib/marketing/vendor-assignment-service';

function FilteredVendorList() {
  const { tailors } = useTailorsOptimized();
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    const data = await VendorAssignmentService.getAssignments({ status: 'active' });
    setAssignments(data);
  };

  const filteredVendors = useMemo(() => {
    if (filter === 'all') return tailors;
    
    const assignedVendorIds = new Set(assignments.map(a => a.vendorId));
    
    if (filter === 'assigned') {
      return tailors.filter(v => assignedVendorIds.has(v.id));
    } else {
      return tailors.filter(v => !assignedVendorIds.has(v.id));
    }
  }, [tailors, assignments, filter]);

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100'
          }`}
        >
          All ({tailors.length})
        </button>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'assigned' ? 'bg-green-600 text-white' : 'bg-gray-100'
          }`}
        >
          Assigned ({assignments.length})
        </button>
        <button
          onClick={() => setFilter('unassigned')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'unassigned' ? 'bg-gray-600 text-white' : 'bg-gray-100'
          }`}
        >
          Unassigned ({tailors.length - assignments.length})
        </button>
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => {
          const assignment = assignments.find(a => a.vendorId === vendor.id);
          
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
    </div>
  );
}
```

### 6. Compact List View

```tsx
import { VendorCardCompact } from '@/components/marketing/assignment';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';

function CompactVendorList() {
  const { tailors } = useTailorsOptimized();
  
  return (
    <div className="space-y-2">
      {tailors.map(vendor => (
        <VendorCardCompact
          key={vendor.id}
          vendor={vendor}
          onAssignmentChange={() => {
            // Refresh data
          }}
          onView={(v) => {
            // Navigate to vendor details
            window.location.href = `/vendors/${v.id}`;
          }}
        />
      ))}
    </div>
  );
}
```

### 7. Manual Assignment Dialog Trigger

```tsx
import { useState } from 'react';
import { AssignVendorDialog } from '@/components/marketing/assignment';
import { Button } from '@/components/ui/button';

function CustomAssignmentButton({ vendor }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        Assign {vendor.brand_name}
      </Button>
      
      <AssignVendorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        vendor={{
          id: vendor.id,
          name: vendor.brand_name || vendor.brandName,
          brandName: vendor.brand_name
        }}
        onSuccess={() => {
          console.log('Vendor assigned successfully!');
          // Refresh your data
        }}
      />
    </>
  );
}
```

### 8. Team Lead Dashboard Integration

```tsx
import { useState, useEffect } from 'react';
import { AssignmentListView, VendorCard } from '@/components/marketing/assignment';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { VendorAssignmentService } from '@/lib/marketing/vendor-assignment-service';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';

function TeamLeadDashboard() {
  const { user } = useMarketingAuth();
  const { tailors } = useTailorsOptimized({ initialLimit: 10 });
  const [teamAssignments, setTeamAssignments] = useState([]);
  const [unassignedVendors, setUnassignedVendors] = useState([]);

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    if (!user?.teamId) return;
    
    // Load team assignments
    const assignments = await VendorAssignmentService.getAssignments({
      status: 'active'
    });
    
    // Filter for team members
    const teamMemberAssignments = assignments.filter(a => 
      // Assuming you have a way to check if user is in team
      true // Replace with actual team member check
    );
    
    setTeamAssignments(teamMemberAssignments);
    
    // Find unassigned vendors
    const assignedVendorIds = new Set(assignments.map(a => a.vendorId));
    const unassigned = tailors.filter(v => !assignedVendorIds.has(v.id));
    setUnassignedVendors(unassigned);
  };

  return (
    <div className="space-y-8">
      {/* Unassigned Vendors Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Unassigned Vendors ({unassignedVendors.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unassignedVendors.slice(0, 6).map(vendor => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onAssignmentChange={loadTeamData}
              showPerformance={false}
            />
          ))}
        </div>
      </section>

      {/* Team Assignments Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Team Assignments ({teamAssignments.length})
        </h2>
        <AssignmentListView
          viewMode="all"
          onAssignmentChange={loadTeamData}
        />
      </section>
    </div>
  );
}
```

## Common Patterns

### Loading State

```tsx
function VendorListWithLoading() {
  const { tailors, loading } = useTailorsOptimized();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tailors.map(vendor => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
```

### Error Handling

```tsx
function VendorListWithErrorHandling() {
  const { tailors, loading, error } = useTailorsOptimized();
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Vendors</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // ... rest of component
}
```

### Empty State

```tsx
function VendorListWithEmptyState() {
  const { tailors } = useTailorsOptimized();
  
  if (tailors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Vendors Found
        </h3>
        <p className="text-gray-500">
          Start by adding your first vendor to the system.
        </p>
      </div>
    );
  }
  
  // ... rest of component
}
```

## Tips

1. **Always handle assignment changes**: Call `onAssignmentChange` to refresh data after assignments
2. **Use proper loading states**: Show skeletons or spinners while data loads
3. **Handle errors gracefully**: Display user-friendly error messages
4. **Optimize performance**: Use pagination for large vendor lists
5. **Mobile responsive**: Test on different screen sizes
6. **Accessibility**: Ensure keyboard navigation works
7. **Toast notifications**: Use toast for success/error feedback
8. **Role-based access**: Check user permissions before showing actions
