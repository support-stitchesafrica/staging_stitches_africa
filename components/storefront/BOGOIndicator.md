# BOGOIndicator Component

A comprehensive React component for displaying Buy One Get One Free (BOGO) promotional offers in storefronts. This component clearly explains BOGO offers to customers with multiple display variants and customization options.

## Features

- **Clear Offer Explanation**: Step-by-step breakdown of how the BOGO offer works
- **Multiple Variants**: Compact, detailed, and banner display options
- **Urgency Indicators**: Shows days until expiry for time-sensitive offers
- **Multiple Free Products**: Handles single or multiple free product options
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and semantic HTML
- **Customizable**: Flexible styling and content options

## Usage

```tsx
import { BOGOIndicator } from '@/components/storefront/BOGOIndicator';

// Basic usage
<BOGOIndicator
  mainProduct={{
    id: 'main-1',
    name: 'Premium T-Shirt',
    price: 29.99
  }}
  freeProducts={[{
    id: 'free-1',
    name: 'Cotton Socks',
    price: 9.99
  }]}
  totalSavings={9.99}
/>

// With urgency and custom promotion name
<BOGOIndicator
  mainProduct={mainProduct}
  freeProducts={freeProducts}
  totalSavings={25.98}
  promotionName="Holiday Special"
  daysUntilExpiry={3}
  variant="banner"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mainProduct` | `{ id: string, name: string, price: number }` | Required | The main product being purchased |
| `freeProducts` | `Array<{ id: string, name: string, price: number, image?: string }>` | Required | Array of free products available |
| `totalSavings` | `number` | Required | Total savings amount from the offer |
| `promotionName` | `string` | `"Buy One Get One FREE"` | Custom promotion title |
| `description` | `string` | `undefined` | Additional description text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |
| `variant` | `'compact' \| 'detailed' \| 'banner'` | `'detailed'` | Display variant |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showDetails` | `boolean` | `true` | Show detailed explanation section |
| `daysUntilExpiry` | `number` | `undefined` | Days until offer expires (shows urgency) |

## Variants

### Compact
Minimal BOGO badge for space-constrained areas:
```tsx
<BOGOIndicator variant="compact" {...props} />
```

### Detailed (Default)
Full explanation with step-by-step breakdown:
```tsx
<BOGOIndicator variant="detailed" {...props} />
```

### Banner
Full-width promotional banner with explanation:
```tsx
<BOGOIndicator variant="banner" {...props} />
```

## Examples

### Single Free Product
```tsx
<BOGOIndicator
  mainProduct={{ id: '1', name: 'T-Shirt', price: 29.99 }}
  freeProducts={[{ id: '2', name: 'Socks', price: 9.99 }]}
  totalSavings={9.99}
/>
```

### Multiple Free Products
```tsx
<BOGOIndicator
  mainProduct={{ id: '1', name: 'T-Shirt', price: 29.99 }}
  freeProducts={[
    { id: '2', name: 'Socks', price: 9.99 },
    { id: '3', name: 'Cap', price: 15.99 }
  ]}
  totalSavings={25.98}
/>
```

### With Urgency
```tsx
<BOGOIndicator
  mainProduct={mainProduct}
  freeProducts={freeProducts}
  totalSavings={9.99}
  daysUntilExpiry={1} // Shows "Last day!"
/>
```

## Accessibility

- Uses semantic HTML elements
- Proper ARIA labels for screen readers
- High contrast colors for visibility
- Keyboard navigation support
- Clear visual hierarchy

## Styling

The component uses Tailwind CSS classes and can be customized with:
- Custom `className` prop
- CSS custom properties
- Tailwind utility classes
- Component variants

## Integration with Storefront

This component integrates with the merchant storefront system by:
- Displaying active BOGO promotions from the promotion service
- Showing real-time savings calculations
- Handling multiple free product selections
- Providing clear call-to-action messaging

## Requirements Validation

This component satisfies the following requirements:
- **Requirement 8.1**: Displays promotional badges and banners on relevant products
- **Requirement 8.2**: Shows original and discounted pricing with clear savings indicators
- **Task 4.1**: BOGO indicator explains the offer clearly

## Testing

The component includes comprehensive tests covering:
- Basic rendering with required props
- All variant displays
- Multiple free products handling
- Urgency indicators
- Custom promotion names and descriptions
- Edge cases (no free products, etc.)

Run tests with:
```bash
npm test components/storefront/__tests__/BOGOIndicator.test.tsx
```