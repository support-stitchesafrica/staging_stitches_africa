# PromotionalBanner Component

A flexible and feature-rich promotional banner component for displaying storefront-wide offers and promotions.

## Features

- **Multiple Display Positions**: Top, middle, bottom, or all positions
- **Auto-rotation**: Automatically cycle through multiple promotions
- **Interactive Controls**: Navigation arrows, indicators, and close buttons
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Accessibility**: Full ARIA support and keyboard navigation
- **Customizable**: Flexible styling and behavior options
- **Time-based Display**: Shows countdown timers for limited-time offers
- **Priority Sorting**: Displays promotions based on priority settings

## Basic Usage

```tsx
import { PromotionalBanner } from '@/components/storefront/PromotionalBanner';

function StorefrontPage() {
  return (
    <div>
      <PromotionalBanner 
        vendorId="your-vendor-id"
        position="top"
        maxBanners={3}
        showCloseButton={true}
        autoRotate={true}
        onPromotionClick={(promotion) => {
          // Handle promotion click
          console.log('Clicked promotion:', promotion);
        }}
        onPromotionClose={(promotionId) => {
          // Handle promotion dismissal
          console.log('Closed promotion:', promotionId);
        }}
      />
    </div>
  );
}
```

## Specialized Components

For convenience, we provide position-specific components:

```tsx
import { 
  TopPromotionalBanner,
  MiddlePromotionalBanner,
  BottomPromotionalBanner 
} from '@/components/storefront/PromotionalBanner';

// Header area banner
<TopPromotionalBanner vendorId="vendor-id" />

// Content area banner
<MiddlePromotionalBanner vendorId="vendor-id" />

// Footer area banner
<BottomPromotionalBanner vendorId="vendor-id" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `vendorId` | `string` | **required** | The vendor ID to load promotions for |
| `position` | `'top' \| 'middle' \| 'bottom' \| 'all'` | `'all'` | Filter promotions by display position |
| `maxBanners` | `number` | `3` | Maximum number of promotions to display |
| `showCloseButton` | `boolean` | `true` | Whether to show close/dismiss button |
| `autoRotate` | `boolean` | `true` | Enable automatic rotation for multiple banners |
| `rotationInterval` | `number` | `5000` | Time between rotations in milliseconds |
| `className` | `string` | `undefined` | Additional CSS classes |
| `onPromotionClick` | `(promotion: StorefrontPromotion) => void` | `undefined` | Callback when banner is clicked |
| `onPromotionClose` | `(promotionId: string) => void` | `undefined` | Callback when banner is dismissed |

## Promotion Data Structure

The component expects promotions to follow this structure:

```typescript
interface StorefrontPromotion {
  id: string;
  vendorId: string;
  type: 'storefront_wide' | 'product_specific' | 'bogo' | 'discount';
  title: string;
  description: string;
  bannerMessage: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  displaySettings: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    position: 'top' | 'middle' | 'bottom';
    priority: number;
    showIcon: boolean;
    iconType?: 'percent' | 'tag' | 'star' | 'fire';
  };
  discountInfo?: {
    type: 'percentage' | 'fixed_amount';
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
  };
}
```

## Styling

The component uses Tailwind CSS classes and supports custom styling through:

1. **CSS Custom Properties**: Banner colors are applied via inline styles
2. **className Prop**: Add additional Tailwind classes
3. **Theme Integration**: Respects your app's color scheme

### Example Custom Styling

```tsx
<PromotionalBanner 
  vendorId="vendor-id"
  className="shadow-lg border-2 border-dashed"
/>
```

## Behavior

### Single Promotion
- Displays the promotion message with optional countdown timer
- Shows close button if enabled
- Clickable area for the entire banner

### Multiple Promotions
- Shows navigation arrows and indicators
- Auto-rotates if enabled
- Manual navigation via arrows or indicators
- Maintains current index when promotions are dismissed

### Responsive Design
- Mobile: Stacked layout with touch-friendly controls
- Desktop: Horizontal layout with hover effects
- Adaptive text sizing and spacing

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader Support**: Proper semantic markup
- **Focus Management**: Visible focus indicators

## Integration with Promotion Service

The component automatically integrates with the `PromotionService`:

```typescript
// Loads active promotions for the vendor
const promotions = await PromotionService.getPromotionDisplayData(vendorId);

// Filters by position and sorts by priority
const filtered = PromotionService.sortPromotionsByPriority(promotions);

// Calculates time remaining for countdown display
const timeRemaining = PromotionService.formatTimeRemaining(promotion);
```

## Performance Considerations

- **Lazy Loading**: Only loads promotions when component mounts
- **Memoization**: Prevents unnecessary re-renders
- **Efficient Updates**: Minimal DOM manipulation for rotations
- **Memory Management**: Cleans up timers on unmount

## Testing

The component includes comprehensive tests covering:

- Rendering with different promotion data
- User interactions (click, close, navigation)
- Auto-rotation behavior
- Position filtering
- Error handling

Run tests with:
```bash
npm test components/storefront/__tests__/PromotionalBanner.test.tsx
```

## Examples

See `components/storefront/examples/PromotionalBannerExample.tsx` for complete usage examples and integration patterns.

## Related Components

- `PromotionalBadge`: For product-specific discount indicators
- `BOGOIndicator`: For Buy-One-Get-One promotions
- `StorefrontRenderer`: Main storefront display component