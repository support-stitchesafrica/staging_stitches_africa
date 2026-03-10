# Promotional Pricing in Cart

This document explains how promotional pricing is automatically applied when customers add items to their cart.

## Overview

When customers add products to their cart through the storefront, the system automatically:

1. **Checks for Active Promotions**: Queries the promotion service to find active promotions for the product being added
2. **Applies Promotional Pricing**: Automatically applies discounts and BOGO offers to eligible items
3. **Updates Cart State**: Saves the promotional pricing information with the cart items
4. **Maintains Consistency**: Re-applies promotional pricing when cart quantities are updated

## Requirements Validated

- **8.3**: WHEN customers add promoted products to cart THEN the system SHALL apply promotional pricing and BOGO logic automatically

## API Endpoints

### POST /api/cart/add

Automatically applies promotional pricing when adding items to cart.

**Request Body:**
```json
{
  "item": {
    "product_id": "product-123",
    "title": "Sample Product",
    "price": 100,
    "quantity": 1,
    // ... other product fields
  },
  "storefrontContext": {
    "storefrontId": "store-123",
    "storefrontHandle": "my-store"
  }
}
```

**Response with Promotional Pricing:**
```json
{
  "success": true,
  "item": {
    "product_id": "product-123",
    "title": "Sample Product",
    "price": 80,  // Discounted price
    "discount": 20,
    "promotionalPricing": {
      "originalPrice": 100,
      "discountedPrice": 80,
      "promotionId": "promo-123",
      "promotionName": "20% OFF"
    }
  },
  "promotional": {
    "promotionsApplied": 1,
    "promotions": [...],
    "bogoApplied": false
  },
  "additionalItems": [
    // Free BOGO items if applicable
  ]
}
```

### PUT /api/cart/update

Re-applies promotional pricing when cart quantities are updated.

**Request Body:**
```json
{
  "productId": "product-123",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "action": "updated",
  "productId": "product-123",
  "quantity": 2,
  "promotional": {
    "promotionsApplied": 1,
    "promotions": [...]
  }
}
```

## Promotion Types Supported

### 1. Percentage Discounts
- Applies percentage-based discounts (e.g., 20% off)
- Updates item price and discount fields
- Preserves original price in `promotionalPricing.originalPrice`

### 2. Fixed Amount Discounts
- Applies fixed dollar amount discounts (e.g., $15 off)
- Ensures price never goes below $0
- Updates item price and discount fields

### 3. BOGO (Buy One Get One) Offers
- Automatically adds free items to cart
- Free items have `isBogoFree: true` and `price: 0`
- Links free items to main product via `bogoMainProductId`
- Preserves original price in `bogoOriginalPrice`

## Error Handling

The promotional pricing system is designed to be resilient:

- **Graceful Degradation**: If promotion service fails, items are added at regular price
- **Fallback Behavior**: Cart operations continue normally even if promotional pricing fails
- **Error Logging**: Promotional pricing errors are logged but don't block cart operations
- **User Experience**: Users always see success responses, with promotional info when available

## Data Model Extensions

### CartItem Type Extensions

```typescript
interface CartItem {
  // ... existing fields
  
  // General promotional pricing
  promotionalPricing?: {
    originalPrice: number;
    discountedPrice: number;
    promotionId: string;
    promotionName: string;
  };
  
  // BOGO-specific fields (already existed)
  isBogoFree?: boolean;
  bogoMainProductId?: string;
  bogoMappingId?: string;
  bogoPromotionName?: string;
  bogoOriginalPrice?: number;
}
```

## Testing

The promotional pricing functionality is tested through:

1. **Unit Tests**: Test promotional pricing logic in isolation
2. **Integration Tests**: Test API endpoints with promotional pricing
3. **Property Tests**: Verify promotional pricing behavior across various inputs
4. **Error Handling Tests**: Ensure graceful degradation when services fail

## Implementation Details

### Promotional Pricing Flow

1. **Item Addition**: When `POST /api/cart/add` is called
2. **Promotion Check**: System calls `storefrontPromotionService.getActivePromotionsForProducts()`
3. **Price Calculation**: Applies discounts based on promotion type and configuration
4. **BOGO Processing**: Adds free items for eligible BOGO promotions
5. **Cart Storage**: Saves all items (main + free) to cart repository
6. **Response**: Returns updated items with promotional information

### Quantity Updates

1. **Update Request**: When `PUT /api/cart/update` is called
2. **Current Cart**: Retrieves current cart items from repository
3. **Re-apply Promotions**: Checks for active promotions and re-applies pricing
4. **Batch Update**: Updates all affected items in cart repository
5. **Response**: Returns update confirmation with promotional information

### Key Features

- **Automatic Application**: No user action required - promotions apply automatically
- **Real-time Updates**: Promotional pricing updates when quantities change
- **Multiple Promotions**: Supports multiple promotion types simultaneously
- **Context Preservation**: Maintains storefront context throughout the process
- **Audit Trail**: Tracks which promotions were applied and when