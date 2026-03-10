# Coupon Management Hooks

This document describes the custom React hooks for managing coupons in the Atlas admin dashboard.

## useCoupons

A hook for fetching and managing the coupon list with filters and pagination.

### Usage

```typescript
import { useCoupons } from '@/hooks/useCoupons';

function CouponList() {
  const {
    coupons,
    loading,
    error,
    pagination,
    refetch,
    setPage,
    setFilters
  } = useCoupons({
    filters: { status: 'ACTIVE' },
    page: 1,
    limit: 20,
    autoFetch: true
  });

  // Use the data...
}
```

### Options

- `filters?: CouponFilters` - Filter criteria (email, status, search, date range)
- `page?: number` - Current page number (default: 1)
- `limit?: number` - Items per page (default: 20)
- `autoFetch?: boolean` - Auto-fetch on mount (default: true)

### Returns

- `coupons: Coupon[]` - Array of coupons
- `loading: boolean` - Loading state
- `error: string | null` - Error message if any
- `pagination` - Pagination info (currentPage, totalPages, totalCount, hasNextPage, hasPreviousPage)
- `refetch: () => Promise<void>` - Manually refetch data
- `setPage: (page: number) => void` - Change page
- `setFilters: (filters: CouponFilters) => void` - Update filters

### Features

- Automatic refetch when filters or page changes
- Resets to page 1 when filters change
- Handles authentication automatically
- Comprehensive error handling

## useCouponMutations

A hook for performing coupon mutations (create, update, delete, resend email).

### Usage

```typescript
import { useCouponMutations } from '@/hooks/useCouponMutations';

function CouponForm() {
  const {
    createCoupon,
    creating,
    updateCoupon,
    updating,
    deleteCoupon,
    deleting,
    resendEmail,
    resending,
    generateCode,
    generating
  } = useCouponMutations();

  const handleCreate = async () => {
    const coupon = await createCoupon({
      discountType: 'PERCENTAGE',
      discountValue: 10,
      assignedEmail: 'user@example.com',
      usageLimit: 1,
      sendEmail: true
    });
    
    if (coupon) {
      console.log('Created:', coupon);
    }
  };
}
```

### Methods

#### createCoupon(input: CreateCouponInput): Promise<Coupon | null>
Creates a new coupon. Shows success/error toast automatically.

#### updateCoupon(id: string, input: UpdateCouponInput): Promise<Coupon | null>
Updates an existing coupon. Shows success/error toast automatically.

#### deleteCoupon(id: string): Promise<boolean>
Deletes a coupon. Shows success/error toast automatically.

#### resendEmail(id: string): Promise<boolean>
Resends the coupon email. Shows success/error toast automatically.

#### generateCode(): Promise<string | null>
Generates a unique coupon code.

#### clearErrors(): void
Clears all error states.

### Returns

For each mutation, the hook returns:
- `{action}ing: boolean` - Loading state (e.g., `creating`, `updating`)
- `{action}Error: string | null` - Error message if any

### Features

- Automatic authentication handling
- Built-in toast notifications
- Individual loading states for each operation
- Comprehensive error handling
- Returns null/false on error for easy error checking

## Example: Complete Component

```typescript
import { useCoupons } from '@/hooks/useCoupons';
import { useCouponMutations } from '@/hooks/useCouponMutations';

function CouponManagement() {
  const [filters, setFilters] = useState({});
  
  const {
    coupons,
    loading,
    pagination,
    refetch,
    setPage
  } = useCoupons({ filters });

  const {
    createCoupon,
    creating,
    deleteCoupon,
    deleting
  } = useCouponMutations();

  const handleCreate = async (data) => {
    const coupon = await createCoupon(data);
    if (coupon) {
      refetch(); // Refresh the list
    }
  };

  const handleDelete = async (id) => {
    const success = await deleteCoupon(id);
    if (success) {
      refetch(); // Refresh the list
    }
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

## Best Practices

1. **Always refetch after mutations**: Call `refetch()` after successful create/update/delete operations
2. **Check return values**: Both hooks return null/false on error, making it easy to check success
3. **Use loading states**: Display loading indicators using the `loading`, `creating`, etc. states
4. **Handle errors gracefully**: Errors are automatically shown in toasts, but you can also check error states
5. **Optimize filters**: Debounce search inputs to avoid excessive API calls

## Integration with Existing Components

These hooks are already integrated into:
- `CouponListTable` - Uses `useCoupons` for fetching
- `CreateCouponDialog` - Uses `useCouponMutations` for creation and code generation
- `CouponDetailsDialog` - Can use `useCouponMutations` for update/delete operations
- `EditCouponDialog` - Can use `useCouponMutations` for updates
