# BOGO Integration with Storefront Promotions

This document explains how the existing BOGO (Buy One Get One) system integrates with the new Storefront Promotion system.

## Overview

The storefront promotion system seamlessly integrates with the existing BOGO mappings to provide:

1. **Unified Promotion Display**: BOGO offers are automatically transformed into storefront-compatible promotional configurations
2. **Real-time Validation**: Promotions are validated for expiry and activity status
3. **Consistent API Interface**: Both vendor-specific and product-specific promotion queries are supported
4. **Cart Integration**: Promotional pricing is automatically applied to cart items

## Integration Points

### 1. StorefrontPromotionService

The `StorefrontPromotionService` acts as the bridge between BOGO mappings and storefront displays:

```typescript
// Get active promotions for a vendor
const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
  vendorId,
  { includeExpiring: true, currentDate: new Date() }
);

// Get promotions for specific products
const productPromotions = await storefrontPromotionService.getActivePromotionsForProducts(
  ['product1', 'product2'],
  { currentDate: new Date() }
);
```

### 2. Active Promotions API

**GET /api/promotions/active**
- Query parameter: `vendorId` (required)
- Query parameter: `includeExpiring` (optional)
- Query parameter: `format` (optional: 'bogo' | 'storefront')

**POST /api/promotions/active**
- Request body: `{ productIds: string[], currentDate?: string }`
- Returns promotions for specific products

### 3. Apply Promotions API

**POST /api/promotions/apply**
- Request body: `{ cartItems: CartItem[], vendorId?: string, currentDate?: string }`
- Applies promotional pricing to cart items
- Returns updated cart with BOGO items and savings

## BOGO Mapping Integration

### Existing BOGO Mappings

The system integrates with the existing BOGO mappings defined in `lib/bogo/configure-specific-mappings.ts`:

1. **OUCH SNEAKERS** ($240) → **TTDALK LONG WALLET** ($96)
2. **TRAX PANTS WIDE LEG PANT** → **TTDALK LONG WALLET** ($96)
3. **TRAX PANTS SPLATTERED SHORTS** → **TTDALK LONG WALLET** ($96)
4. **HAUTE AFRIKANA AKWETE MAXI DRESS** ($120) → **BY ORE SEQUIN PURSE** ($79)
5. **NANCY HANSON SILENT POWER TOP** ($120) → Choice of:
   - **LOLA SIGNATURE CANDY** ($108)
   - **LOLA SIGNATURE EWA BEAD BAG** ($98)
6. **NANCY HANSON PEARL NEUTRAL** ($78) → Choice of:
   - **LOLA SIGNATURE CANDY** ($108)
   - **LOLA SIGNATURE EWA BEAD BAG** ($98)
7. **IYANGA WOMAN AINA DRESS** ($366) → Choice of:
   - **LOLA SIGNATURE CANDY** ($108)
   - **LOLA SIGNATURE EWA BEAD BAG** ($98)

### Transformation to Storefront Format

BOGO mappings are automatically transformed to `PromotionalConfig` format:

```typescript
interface PromotionalConfig {
  id: string;
  vendorId: string;
  type: 'bogo';
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  applicableProducts: string[]; // [mainProductId, ...freeProductIds]
  displaySettings: {
    badgeText: string; // e.g., "December BOGO - OUCH SNEAKERS"
    badgeColor: string; // e.g., "#FF6B35"
    bannerMessage: string; // e.g., "Buy OUCH SNEAKERS and get TTDALK LONG WALLET free"
    priority: number; // 1 for normal, 2 for expiring soon
    customColors: {
      background: string;
      text: string;
      border: string;
    };
    customText: {
      primary: string; // "BOGO"
      secondary: string; // "Buy 1 Get 1 Free" or "Ending Soon!"
      prefix: string; // "🎉" or "⏰"
      suffix: string;
    };
    badgeVariant: 'savings';
    showIcon: boolean;
  };
}
```

## Features

### 1. Expiry Handling

- Promotions are automatically filtered based on current date
- Expiring promotions (within 24 hours) get special styling:
  - Red background color (`#FF4444`)
  - "Ending Soon!" text
  - Higher priority (2)
  - Clock emoji prefix

### 2. Multiple Free Product Options

For promotions with multiple free product choices (like NANCY HANSON products), the system:
- Includes all free products in `applicableProducts` array
- Requires user selection during cart operations
- Maintains 1:1 quantity ratios between main and free products

### 3. Free Shipping

All BOGO promotions automatically include free shipping when:
- `autoFreeShipping` is enabled in the mapping
- Cart contains at least one BOGO pair

### 4. Real-time Validation

The system validates promotions in real-time:
- Checks promotion start/end dates
- Verifies mapping is active
- Confirms product availability
- Handles expired promotions gracefully

## Usage Examples

### Display Promotional Badges

```typescript
// Get promotions for products on storefront
const promotions = await storefrontPromotionService.getActivePromotionsForProducts(
  productIds,
  { currentDate: new Date() }
);

// Render promotional badges
promotions.forEach(promotion => {
  if (promotion.displaySettings.showIcon) {
    renderBadge({
      text: promotion.displaySettings.badgeText,
      color: promotion.displaySettings.badgeColor,
      icon: promotion.displaySettings.customText.prefix
    });
  }
});
```

### Apply Cart Promotions

```typescript
// Apply promotions to cart
const response = await fetch('/api/promotions/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cartItems: currentCartItems,
    vendorId: 'vendor123'
  })
});

const { cartItems, summary } = await response.json();

// Display savings
console.log(`Total BOGO savings: $${summary.totalSavings}`);
console.log(`Free shipping: ${summary.freeShipping ? 'Yes' : 'No'}`);
```

## Testing

The integration is thoroughly tested with:

1. **Unit Tests**: Individual service methods
2. **Integration Tests**: End-to-end BOGO mapping integration
3. **API Tests**: HTTP endpoint functionality
4. **Property-Based Tests**: Edge cases and error handling

Run tests with:
```bash
npx vitest run lib/storefront/__tests__/bogo-integration.test.ts
npx vitest run app/api/promotions/active/route.test.ts
npx vitest run app/api/promotions/apply/route.test.ts
```

## Error Handling

The system gracefully handles:
- Missing or invalid product IDs
- Expired promotions
- Network errors
- Invalid cart states
- Conflicting promotions

All errors are logged and return user-friendly messages while maintaining system stability.