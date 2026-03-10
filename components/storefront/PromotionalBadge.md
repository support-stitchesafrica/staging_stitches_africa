# PromotionalBadge Component

A flexible promotional badge component for displaying discount percentages on storefront products.

## Features

- **Multiple Variants**: Default, compact, and minimal display options
- **Customizable Colors**: Red, orange, green, blue, and purple color schemes
- **Responsive Sizes**: Small, medium, and large sizing options
- **Icon Support**: Optional icons with configurable visibility
- **Input Validation**: Automatically handles invalid discount percentages
- **Accessibility**: Proper semantic markup and screen reader support

## Usage

```tsx
import { PromotionalBadge } from '@/components/storefront/PromotionalBadge';

// Basic usage
<PromotionalBadge discountPercentage={25} />

// With custom text and color
<PromotionalBadge 
  discountPercentage={50} 
  text="MEGA SALE" 
  color="orange" 
/>

// Compact variant
<PromotionalBadge 
  discountPercentage={30} 
  variant="compact" 
/>

// Minimal variant
<PromotionalBadge 
  discountPercentage={15} 
  variant="minimal" 
  color="green" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `discountPercentage` | `number` | - | **Required.** The discount percentage to display (1-100) |
| `text` | `string` | `"SAVE"` | Custom text to display (default variant only) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the badge |
| `variant` | `'default' \| 'compact' \| 'minimal'` | `'default'` | Display variant |
| `className` | `string` | - | Additional CSS classes |
| `showIcon` | `boolean` | `true` | Whether to show the icon |
| `color` | `'red' \| 'orange' \| 'green' \| 'blue' \| 'purple'` | `'red'` | Color scheme |

## Variants

### Default
Full badge with custom text and percentage display. Best for prominent promotional displays.

### Compact
Streamlined badge showing only the percentage with optional icon. Good for product cards.

### Minimal
Simple circular badge with just the percentage. Perfect for subtle promotional indicators.

## Validation

The component automatically validates the `discountPercentage` prop:
- Values ≤ 0 or > 100 will not render the component
- Decimal values are automatically rounded to the nearest integer

## Styling

The component uses Tailwind CSS classes and supports:
- Gradient backgrounds for visual appeal
- Responsive sizing with consistent proportions
- Shadow effects for depth
- Proper text contrast for accessibility

## Integration with Storefront

This component is designed to integrate seamlessly with:
- Product cards in the storefront catalog
- Promotional banners
- Cart items with active promotions
- BOGO offer displays

## Examples

See `components/storefront/examples/PromotionalBadgeExample.tsx` for comprehensive usage examples.