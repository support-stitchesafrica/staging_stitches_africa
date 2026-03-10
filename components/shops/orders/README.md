# Order History Components

This directory contains components for displaying and managing user order history in the e-commerce platform.

## Components

### OrderHistory
The main component that displays a user's order history with filtering and search capabilities.

**Features:**
- Displays order statistics (total, pending, processing, shipped, delivered, cancelled)
- Filter orders by status
- Search orders by title, order ID, or tailor name
- Responsive design with loading and error states
- Empty state handling

**Usage:**
```tsx
import { OrderHistory } from '@/components/orders/OrderHistory';

<OrderHistory />
```

### OrderCard
Individual order display component showing order details, status, and actions.

**Features:**
- Order summary with product image, title, and description
- Order status badge with color coding
- Pricing breakdown (product cost + shipping)
- Shipping address display
- Delivery information
- Action buttons (track package, leave review, cancel order)
- Order tracking modal integration

**Props:**
```tsx
interface OrderCardProps {
  order: UserOrder;
}
```

### OrderFilters
Filter and search controls for the order history.

**Features:**
- Status dropdown filter
- Search input with real-time filtering
- Active filter display with removal options
- Results count display
- Clear all filters functionality

**Props:**
```tsx
interface OrderFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  orderCount: number;
}
```

### OrderStatusBadge
Visual status indicator for orders with color-coded badges.

**Features:**
- Color-coded status badges
- Icon indicators for each status
- Multiple size options (sm, md, lg)
- Supports all order statuses (pending, processing, production, shipped, delivered, cancelled, refunded)

**Props:**
```tsx
interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### OrderTrackingModal
Modal component for displaying detailed order tracking information.

**Features:**
- Order summary display
- Tracking number information with external links
- Timeline of order events
- Responsive modal design
- Fallback timeline for orders without detailed tracking

**Props:**
```tsx
interface OrderTrackingModalProps {
  order: UserOrder;
  isOpen: boolean;
  onClose: () => void;
}
```

## Order Status Flow

The components support the following order statuses:

1. **Pending** - Order received, awaiting processing
2. **Processing** - Order being prepared
3. **Production** - For bespoke items, in production phase
4. **Shipped** - Order dispatched with tracking
5. **Delivered** - Order successfully delivered
6. **Cancelled** - Order cancelled by user or system
7. **Refunded** - Order refunded

## Data Structure

The components work with the `UserOrder` interface:

```typescript
interface UserOrder {
  id?: string;
  order_id: string;
  user_id: string;
  product_id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  quantity: number;
  size?: string;
  wear_category?: string;
  tailor_id: string;
  tailor_name?: string;
  delivery_type: string;
  delivery_date?: string;
  order_status: string;
  shipping_fee: number;
  user_address: UserAddress;
  packages?: Array<{
    referenceNumber: number;
    trackingNumber: string;
    trackingUrl: string;
  }>;
  timeline?: Array<{
    actor: string;
    description: string;
    location: string;
    occurredAt: string;
    status: string;
  }>;
  createdAt: Date;
  last_update?: Date;
  timestamp?: Date;
}
```

## Integration

### Repository Integration
The components integrate with the `OrderRepository` class from `@/lib/firestore`:

```typescript
import { orderRepository } from '@/lib/firestore';

// Get all orders for a user
const orders = await orderRepository.getByUserId(userId);

// Get orders by status
const pendingOrders = await orderRepository.getByStatus(userId, 'pending');

// Update order status
await orderRepository.updateStatus(userId, orderId, 'shipped');
```

### Authentication Integration
The components use the `AuthContext` to get the current user:

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();
```

### Navigation Integration
The order history is accessible through:
- `/account/orders` - Main order history page
- Account dashboard link
- Header user menu link

## Styling

The components use Tailwind CSS for styling with:
- Responsive design patterns
- Color-coded status indicators
- Hover and focus states
- Loading and error state styling
- Modal overlays and animations

## Error Handling

The components include comprehensive error handling:
- Network error recovery
- Empty state displays
- Loading state management
- Graceful fallbacks for missing data
- User-friendly error messages

## Testing

Unit tests are available for the OrderRepository functionality:
- `src/lib/__tests__/order-repository.test.ts`

The tests cover:
- Order fetching by user ID
- Order filtering by status
- Order creation and updates
- Error handling scenarios
- Firestore integration mocking