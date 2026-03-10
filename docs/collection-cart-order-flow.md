# Collection Cart & Order Flow Implementation Plan

## Overview
This document outlines the implementation of a separate cart and order flow for product collections, where collections are treated as bundles that cannot be individually modified.

## Requirements Summary

1. **One collection at a time** - Users can only have one collection in cart at a time
2. **No duplicate collections** - Cannot add the same collection twice
3. **Compulsory size/color selection** - Users must select size/color for each product before checkout
4. **Individual pricing** - Each product in collection is priced individually
5. **Out of stock handling** - Out of stock products are exempted but cannot be individually removed
6. **No mixed cart** - Collection cart and regular cart are mutually exclusive

## Architecture

### 1. Cart State Management

#### Cart Context Updates
- Add `cartType: 'regular' | 'collection' | null` to track cart type
- Add `collectionId?: string` to track current collection
- Add `collectionName?: string` for display
- Prevent adding regular items when collection cart is active
- Prevent adding collection when regular cart has items

#### Cart Item Structure
```typescript
interface CollectionCartItem {
  product_id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  quantity: number; // Always 1 for collection items
  images: string[];
  tailor_id: string;
  tailor: string;
  
  // Collection-specific fields
  collectionId: string;
  collectionName: string;
  isCollectionItem: true;
  isRemovable: false; // Individual items cannot be removed
  
  // Required selections
  selectedSize?: string | null;
  selectedColor?: string | null;
  availableSizes?: string[];
  availableColors?: string[];
  
  // Out of stock handling
  isOutOfStock?: boolean;
  canExempt?: boolean; // If out of stock, can be exempted from order
}

interface RegularCartItem {
  // Existing cart item structure
  isCollectionItem: false;
  isRemovable: true;
}
```

### 2. Cart Methods

#### New Methods in CartContext
```typescript
// Add entire collection to cart
addCollectionToCart(collectionId: string, products: Product[]): void

// Remove entire collection from cart
removeCollection(): void

// Update size/color for a collection item
updateCollectionItemSelection(
  productId: string, 
  size?: string, 
  color?: string
): void

// Exempt out of stock product from collection
exemptCollectionItem(productId: string): void

// Check if all required selections are made
validateCollectionCart(): { isValid: boolean; missingSelections: string[] }

// Clear collection cart
clearCollectionCart(): void
```

#### Modified Methods
```typescript
// Prevent adding regular items when collection cart is active
addItem(product, quantity): void {
  if (cartType === 'collection') {
    throw new Error('Cannot add regular items to collection cart');
  }
  // ... existing logic
}

// Prevent removing individual collection items
removeItem(productId): void {
  if (isCollectionItem(productId)) {
    throw new Error('Cannot remove individual collection items');
  }
  // ... existing logic
}
```

### 3. UI Components

#### Collection Cart Page (`/shops/cart/collection`)
- Show collection header with name
- Display all collection products in a list
- For each product:
  - Product image and details
  - Size selector (required if product has sizes)
  - Color selector (required if product has colors)
  - Out of stock indicator with exempt option
  - Price display
  - "Cannot remove" indicator
- Show total price
- "Remove Collection" button (removes entire collection)
- "Proceed to Checkout" button (disabled until all selections made)

#### Size/Color Selection Component
- Dropdown/selector for sizes
- Color swatches or dropdown for colors
- Required field indicators
- Validation feedback

### 4. Promotional Banner Update

#### Current Flow
```typescript
handleShopNow(collectionId) {
  // Store in sessionStorage
  sessionStorage.setItem('pendingCollectionId', collectionId);
  router.push('/shops');
}
```

#### New Flow
```typescript
handleShopNow(collectionId) {
  // Load collection and products
  // Add entire collection to cart
  // Navigate to collection cart page
  router.push('/shops/cart/collection');
}
```

### 5. Checkout Flow

#### Collection Checkout Page (`/shops/checkout/collection`)
- Similar to regular checkout
- Show collection name prominently
- Display all collection items with selected sizes/colors
- Show exempted items (if any) with note
- Standard shipping, payment, etc.
- Order creation includes collection metadata

### 6. Order Structure

#### Order Document Updates
```typescript
interface Order {
  // ... existing fields
  
  // Collection order fields
  isCollectionOrder: boolean;
  collectionId?: string;
  collectionName?: string;
  exemptedProducts?: string[]; // Product IDs that were out of stock
}
```

### 7. Validation & Error Handling

#### Pre-Checkout Validation
- All products must have size selected (if product has sizes)
- All products must have color selected (if product has colors)
- At least one product must not be exempted
- All non-exempted products must be in stock

#### Error Messages
- "Please select a size for [Product Name]"
- "Please select a color for [Product Name]"
- "At least one product must be included in the order"
- "Cannot proceed: [Product Name] is out of stock"

## Implementation Steps

1. **Update CartContext** - Add collection cart logic
2. **Update PromotionalBanner** - Change to add collection to cart
3. **Create Collection Cart Page** - `/shops/cart/collection`
4. **Create Size/Color Selectors** - Reusable components
5. **Update Checkout** - Handle collection orders
6. **Update Order Creation** - Include collection metadata
7. **Add Validation** - Pre-checkout validation
8. **Update Cart UI** - Show collection vs regular cart states

## Future Enhancements (Multiple Collections Support)

If we want to support multiple collections in the future:

### Changes Required
1. **Cart Structure**
   - Change `collectionId` to `collectionIds: string[]`
   - Group items by `collectionId` in cart
   - Allow multiple collections simultaneously

2. **UI Updates**
   - Show collections as separate groups
   - "Remove Collection" button per group
   - Validate each collection independently

3. **Checkout**
   - Show all collections in checkout
   - Create separate orders per collection OR
   - Create single order with collection grouping

### Implementation Notes
- Cart type would become `'regular' | 'collection' | 'mixed'`
- Need collection grouping logic in cart display
- Checkout would need to handle multiple collections
- Order structure would need `collections: Array<{id, name, items}>`

## Testing Checklist

- [ ] Add collection to cart from promotional banner
- [ ] Cannot add regular items when collection cart is active
- [ ] Cannot add collection when regular cart has items
- [ ] Size selection required before checkout
- [ ] Color selection required before checkout
- [ ] Out of stock products can be exempted
- [ ] Cannot remove individual collection items
- [ ] Can remove entire collection
- [ ] Checkout creates order with collection metadata
- [ ] Order shows collection information
- [ ] Validation prevents checkout with missing selections

