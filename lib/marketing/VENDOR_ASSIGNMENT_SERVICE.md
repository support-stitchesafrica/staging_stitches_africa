# Vendor Assignment Service

## Overview

The Vendor Assignment Service manages the assignment of vendors (tailors) to marketing team members. It provides comprehensive CRUD operations, validation, and activity logging for vendor assignments.

## Features

- ✅ **Assignment Management**: Create, update, and delete vendor assignments
- ✅ **Validation**: Comprehensive validation for vendor existence, user capacity, and duplicate prevention
- ✅ **Activity Logging**: Automatic logging of all assignment operations
- ✅ **Bulk Operations**: Support for bulk assignment operations
- ✅ **Statistics**: Track assignment statistics per user
- ✅ **Capacity Management**: Enforce maximum assignments per user (default: 50)

## Data Model

### VendorAssignment Interface

```typescript
interface VendorAssignment {
  id: string;
  vendorId: string;
  vendorName: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: Timestamp;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Firestore Structure

### Collection: `vendor_assignments`

Each document represents a vendor assignment with the following fields:

- `vendorId`: Reference to the vendor (tailor) being assigned
- `vendorName`: Name of the vendor for quick access
- `userId`: ID of the user the vendor is assigned to
- `userName`: Name of the assigned user
- `userEmail`: Email of the assigned user
- `assignedBy`: ID of the user who created the assignment
- `assignedByName`: Name of the user who created the assignment
- `assignedAt`: Timestamp when the assignment was made
- `status`: Current status ('active', 'completed', 'cancelled')
- `notes`: Optional notes about the assignment
- `createdAt`: Timestamp when the document was created
- `updatedAt`: Timestamp when the document was last updated

### Firestore Indexes

The following composite indexes are configured in `firestore.indexes.json`:

1. **User + Status + Date**: `userId` (ASC) + `status` (ASC) + `assignedAt` (DESC)
2. **Vendor + Status**: `vendorId` (ASC) + `status` (ASC)
3. **Assigner + Date**: `assignedBy` (ASC) + `assignedAt` (DESC)
4. **Status + Date**: `status` (ASC) + `assignedAt` (DESC)

## API Reference

### Core Operations

#### assignVendor

Assign a vendor to a user with comprehensive validation.

```typescript
const assignment = await VendorAssignmentService.assignVendor(
  {
    vendorId: 'vendor123',
    vendorName: 'Tailor Shop',
    userId: 'user456',
    assignedBy: 'admin789',
    notes: 'High priority vendor'
  },
  'Admin Name'
);
```

**Validation Checks:**
- Vendor exists in the `tailors` collection
- User exists and is active
- No duplicate active assignment for the vendor
- User has not reached maximum capacity (50 assignments)

#### reassignVendor

Reassign a vendor from one user to another.

```typescript
const updatedAssignment = await VendorAssignmentService.reassignVendor(
  'assignment123',
  'newUser456',
  'admin789',
  'Admin Name',
  'Reassigning due to workload balance'
);
```

#### unassignVendor

Cancel a vendor assignment.

```typescript
await VendorAssignmentService.unassignVendor(
  'assignment123',
  'admin789',
  'Admin Name',
  'Vendor no longer needs attention'
);
```

#### completeAssignment

Mark an assignment as completed.

```typescript
const completedAssignment = await VendorAssignmentService.completeAssignment(
  'assignment123',
  'user456',
  'User Name',
  'Successfully onboarded vendor'
);
```

### Query Operations

#### getAssignmentById

Get a specific assignment by ID.

```typescript
const assignment = await VendorAssignmentService.getAssignmentById('assignment123');
```

#### getAssignmentsByUser

Get all assignments for a specific user, optionally filtered by status.

```typescript
// Get all assignments
const allAssignments = await VendorAssignmentService.getAssignmentsByUser('user456');

// Get only active assignments
const activeAssignments = await VendorAssignmentService.getAssignmentsByUser('user456', 'active');
```

#### getAssignmentsByVendor

Get all assignments for a specific vendor.

```typescript
const vendorAssignments = await VendorAssignmentService.getAssignmentsByVendor('vendor123');
```

#### getActiveAssignmentByVendor

Get the current active assignment for a vendor (if any).

```typescript
const activeAssignment = await VendorAssignmentService.getActiveAssignmentByVendor('vendor123');
```

#### getAssignments

Get assignments with optional filters.

```typescript
const assignments = await VendorAssignmentService.getAssignments({
  userId: 'user456',
  status: 'active',
  assignedBy: 'admin789'
});
```

#### getAssignmentsByAssigner

Get all assignments created by a specific user.

```typescript
const assignments = await VendorAssignmentService.getAssignmentsByAssigner('admin789');
```

### Bulk Operations

#### bulkAssignVendors

Assign multiple vendors at once.

```typescript
const assignments = await VendorAssignmentService.bulkAssignVendors(
  [
    {
      vendorId: 'vendor1',
      vendorName: 'Vendor 1',
      userId: 'user1',
      assignedBy: 'admin',
      notes: 'Batch 1'
    },
    {
      vendorId: 'vendor2',
      vendorName: 'Vendor 2',
      userId: 'user2',
      assignedBy: 'admin',
      notes: 'Batch 1'
    }
  ],
  'Admin Name'
);
```

### Statistics & Validation

#### getUserAssignmentStats

Get assignment statistics for a user.

```typescript
const stats = await VendorAssignmentService.getUserAssignmentStats('user456');
// Returns: { total: 25, active: 15, completed: 8, cancelled: 2 }
```

#### isVendorAssigned

Check if a vendor is currently assigned.

```typescript
const isAssigned = await VendorAssignmentService.isVendorAssigned('vendor123');
```

#### canAssignVendor

Check if a vendor can be assigned to a user.

```typescript
const result = await VendorAssignmentService.canAssignVendor('vendor123', 'user456');
// Returns: { canAssign: true } or { canAssign: false, reason: 'Error message' }
```

#### getUserRemainingCapacity

Get the number of additional assignments a user can receive.

```typescript
const remaining = await VendorAssignmentService.getUserRemainingCapacity('user456');
// Returns: 35 (if user has 15 active assignments out of 50 max)
```

## Validation Rules

### Vendor Validation
- Vendor must exist in the `tailors` collection
- Vendor cannot have an active assignment to another user

### User Validation
- User must exist in the `marketing_users` collection
- User must be active (`isActive: true`)
- User cannot exceed maximum capacity (50 active assignments)

### Assignment Validation
- Cannot create duplicate active assignments for the same vendor
- Cannot reassign to the same user
- Can only reassign/complete/cancel active assignments

## Activity Logging

All assignment operations are automatically logged to the `activity_logs` collection:

- `vendor_assigned`: When a new assignment is created
- `vendor_reassigned`: When an assignment is transferred
- `vendor_unassigned`: When an assignment is cancelled
- `vendor_assignment_completed`: When an assignment is marked complete
- `vendors_bulk_assigned`: When multiple assignments are created at once

## Error Handling

The service throws descriptive errors for validation failures:

```typescript
try {
  await VendorAssignmentService.assignVendor(data, name);
} catch (error) {
  // Possible errors:
  // - "Vendor not found or does not exist"
  // - "User not found or is inactive"
  // - "Vendor is already assigned to another user"
  // - "User has reached maximum capacity of 50 active assignments"
}
```

## Usage Examples

### Example 1: Assign a Vendor

```typescript
import { VendorAssignmentService } from '@/lib/marketing';

async function assignVendorToUser() {
  try {
    const assignment = await VendorAssignmentService.assignVendor(
      {
        vendorId: 'tailor_123',
        vendorName: 'Elite Tailors',
        userId: 'user_456',
        assignedBy: 'admin_789',
        notes: 'New vendor needs onboarding'
      },
      'John Admin'
    );
    
    console.log('Assignment created:', assignment.id);
  } catch (error) {
    console.error('Failed to assign vendor:', error.message);
  }
}
```

### Example 2: Check Before Assigning

```typescript
async function safeAssignVendor(vendorId: string, userId: string) {
  // Check if assignment is possible
  const { canAssign, reason } = await VendorAssignmentService.canAssignVendor(
    vendorId,
    userId
  );
  
  if (!canAssign) {
    console.error('Cannot assign:', reason);
    return;
  }
  
  // Check user capacity
  const remaining = await VendorAssignmentService.getUserRemainingCapacity(userId);
  console.log(`User can receive ${remaining} more assignments`);
  
  // Proceed with assignment
  const assignment = await VendorAssignmentService.assignVendor(
    { vendorId, vendorName: 'Vendor', userId, assignedBy: 'admin' },
    'Admin'
  );
  
  return assignment;
}
```

### Example 3: Get User's Active Assignments

```typescript
async function getUserWorkload(userId: string) {
  const activeAssignments = await VendorAssignmentService.getAssignmentsByUser(
    userId,
    'active'
  );
  
  const stats = await VendorAssignmentService.getUserAssignmentStats(userId);
  
  console.log(`User has ${activeAssignments.length} active assignments`);
  console.log(`Total stats:`, stats);
  
  return activeAssignments;
}
```

## Configuration

### Maximum Assignments Per User

The default maximum is 50 active assignments per user. This is defined as:

```typescript
const MAX_ASSIGNMENTS_PER_USER = 50;
```

To change this limit, modify the constant in `vendor-assignment-service.ts`.

## Integration with Other Services

### UserService
- Validates user existence and active status
- Retrieves user details for assignments

### ActivityLogService
- Logs all assignment operations
- Provides audit trail for assignments

### Team Services
- Can be integrated with team-based assignment workflows
- Supports team lead assignment management

## Best Practices

1. **Always validate before assigning**: Use `canAssignVendor()` to check if an assignment is possible
2. **Check capacity**: Use `getUserRemainingCapacity()` to ensure users aren't overloaded
3. **Handle errors gracefully**: Wrap assignment operations in try-catch blocks
4. **Use bulk operations**: For multiple assignments, use `bulkAssignVendors()` for better performance
5. **Track statistics**: Regularly check `getUserAssignmentStats()` for workload monitoring
6. **Complete assignments**: Mark assignments as complete when work is done to free up capacity

## Security Considerations

- All operations require authenticated users
- Assignment creation should be restricted to authorized roles (BDM, Team Lead, Super Admin)
- Firestore security rules should enforce read/write permissions
- Activity logs provide audit trail for compliance

## Future Enhancements

- [ ] Assignment priority levels
- [ ] Due dates and reminders
- [ ] Assignment templates
- [ ] Automated assignment distribution
- [ ] Performance metrics per assignment
- [ ] Assignment history and analytics
