# Storefront Cart Integration

This directory contains the cart integration system for storefronts, implementing the "Add to cart button on product cards" functionality.

## Components

### Core Components

- **ProductCard.tsx** - Product card component with integrated "Add to Cart" button
- **ProductCatalog.tsx** - Product catalog that displays products with cart integration
- **CartWidget.tsx** - Cart status widget with checkout functionality

### Context & Services

- **StorefrontCartContext.tsx** - React context for managing cart state
- **cart-integration.ts** - Service layer for cart operations
- **StorefrontExample.tsx** - Example implementation

### API Routes

- **app/api/cart/add/route.ts** - API endpoint for adding items to cart
- **app/api/cart/checkout/route.ts** - API endpoint for initiating checkout

## Usage

### 1. Wrap your storefront page with the cart provider:

```tsx
import { StorefrontCartProvider } from '@/contexts/StorefrontCartContext';

function StorefrontPage() {
  return (
    <StorefrontCartProvider>
      {/* Your storefront content */}
    </StorefrontCartProvider>
  );
}
```

### 2. Set up the storefront context:

```tsx
import { useStorefrontCart } from '@/contexts/StorefrontCartContext';

function StorefrontContent({ vendorId, storefrontId, storefrontHandle }) {
  const { setStorefrontContext } = useStorefrontCart();

  useEffect(() => {
    setStorefrontContext({
      storefrontId,
      storefrontHandle,
      vendorId,
    });
  }, [storefrontId, storefrontHandle, vendorId, setStorefrontContext]);

  // ... rest of component
}
```

### 3. Use ProductCatalog with cart integration:

```tsx
import ProductCatalog from '@/components/storefront/ProductCatalog';

const productConfig = {
  layout: 'grid',
  productsPerPage: 12,
  showFilters: true,
  showSorting: true,
  cartIntegration: {
    enabled: true,
    redirectToStitchesAfrica: true,
  },
  promotionalDisplay: {
    showBadges: true,
    showBanners: true,
    highlightPromotions: true,
  },
};

<ProductCatalog
  vendorId={vendorId}
  config={productConfig}
/>
```

### 4. Add cart widget for checkout:

```tsx
import CartWidget from '@/components/storefront/CartWidget';

<CartWidget />
```

## Features

### Add to Cart Functionality

- ✅ Add products to cart with quantity and options
- ✅ Real-time cart state management
- ✅ Loading states and error handling
- ✅ Cart persistence in localStorage
- ✅ Integration with existing Stitches Africa cart system

### Cart Management

- ✅ View cart items
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Calculate totals and shipping
- ✅ Clear cart

### Checkout Integration

- ✅ Seamless checkout flow to Stitches Africa
- ✅ Storefront context preservation
- ✅ Session management
- ✅ Redirect handling

## API Endpoints

### POST /api/cart/add

Adds a product to the cart.

**Request Body:**
```json
{
  "product": { /* Product object */ },
  "quantity": 1,
  "selectedOptions": {
    "size": "M",
    "color": "Blue"
  },
  "storefrontId": "storefront_123",
  "storefrontHandle": "fashion-store"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cartItem": { /* CartItem object */ },
    "message": "Item added to cart successfully"
  }
}
```

### POST /api/cart/checkout

Initiates checkout process.

**Request Body:**
```json
{
  "items": [ /* Array of cart items */ ],
  "storefrontId": "storefront_123",
  "storefrontHandle": "fashion-store",
  "redirectUrl": "https://example.com/success"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://stitchesafrica.com/shops/cart?storefront=fashion-store",
    "sessionId": "session_123",
    "message": "Checkout initiated successfully"
  }
}
```

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 7.3**: ✅ Add to cart functionality integrated with Stitches Africa
- **Requirement 7.4**: ✅ Checkout redirects to Stitches Africa secure checkout
- **Requirement 7.5**: ✅ Purchase tracking and conversion events

## Testing

The cart integration includes:

- Input validation for cart items
- Error handling for API failures
- Loading states for better UX
- Fallback behavior for offline scenarios

## Future Enhancements

- Toast notifications for cart actions
- Cart abandonment recovery
- Wishlist integration
- Social sharing of cart items
- Advanced promotional pricing