# Configurable Promotional Badges

The `PromotionalBadge` component now supports fully configurable colors and text, allowing vendors to create custom promotional badges that match their brand identity.

## Features

### Custom Colors
- **Background**: Any valid CSS color (hex, rgb, rgba, hsl, hsla, named colors)
- **Text**: Custom text color for optimal contrast
- **Border**: Optional border color for enhanced styling

### Custom Text
- **Primary Text**: Main badge text (replaces default "SAVE")
- **Secondary Text**: Secondary text (replaces default "X% OFF")
- **Prefix/Suffix**: Add emojis or symbols before/after text

### Variants
- **Default**: Full badge with icon, primary and secondary text
- **Compact**: Condensed version with icon and secondary text
- **Minimal**: Just the primary text in a circular badge
- **Savings**: Shows original vs sale price with savings calculation

## Usage Examples

### Basic Custom Colors
```tsx
<PromotionalBadge 
  discountPercentage={25}
  customColors={{
    background: '#ff6b6b',
    text: '#ffffff',
    border: '#ff5252'
  }}
/>
```

### Custom Text with Emojis
```tsx
<PromotionalBadge 
  discountPercentage={30}
  customText={{
    primary: 'FLASH DEAL',
    secondary: 'Limited Time',
    prefix: '⚡',
    suffix: '⚡'
  }}
/>
```

### Using Preset Color Schemes
```tsx
import { PromotionService } from '@/lib/storefront/promotion-service';

const presets = PromotionService.getPresetColorSchemes();

<PromotionalBadge 
  discountPercentage={40}
  customColors={presets.fire}
  customText={{ primary: 'HOT DEAL' }}
/>
```

### Integration with Promotion Service
```tsx
const promotion = {
  // ... promotion configuration
  displaySettings: {
    customColors: {
      background: '#10b981',
      text: '#ffffff',
      border: '#059669'
    },
    customText: {
      primary: 'SUMMER SALE',
      secondary: 'Limited Time',
      prefix: '☀️'
    },
    badgeVariant: 'compact'
  }
};

const badgeProps = PromotionService.getPromotionalBadgeProps(
  promotion, 
  25, // discount percentage
  100, // original price
  75   // sale price
);

<PromotionalBadge {...badgeProps} />
```

## Preset Color Schemes

The promotion service includes several preset color schemes:
- **fire**: Red gradient for urgent sales
- **ocean**: Blue gradient for cool, professional look
- **forest**: Green gradient for eco-friendly or natural products
- **sunset**: Orange gradient for warm, inviting feel
- **royal**: Purple gradient for luxury items
- **gold**: Golden gradient for premium offers
- **rose**: Pink gradient for fashion/beauty
- **slate**: Gray gradient for minimalist design

## Color Validation

The system validates color formats to ensure compatibility:
- Hex colors: `#ff0000`, `#f00`
- RGB/RGBA: `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.8)`
- HSL/HSLA: `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.8)`
- Named colors: `red`, `blue`, `transparent`
- CSS gradients and other valid CSS color values (browser environment)

## Migration from Fixed Colors

### Before (Limited Options)
```tsx
<PromotionalBadge 
  discountPercentage={25}
  color="red" // Limited to predefined colors
  text="SAVE" // Limited text options
/>
```

### After (Fully Configurable)
```tsx
<PromotionalBadge 
  discountPercentage={25}
  customColors={{
    background: '#your-brand-color',
    text: '#ffffff'
  }}
  customText={{
    primary: 'YOUR BRAND MESSAGE',
    secondary: 'Custom Call-to-Action'
  }}
/>
```

## Best Practices

1. **Contrast**: Ensure sufficient contrast between background and text colors
2. **Brand Consistency**: Use colors that match your brand palette
3. **Readability**: Keep text concise and readable at small sizes
4. **Testing**: Test badges across different screen sizes and devices
5. **Accessibility**: Consider color-blind users when choosing color combinations

## TypeScript Support

Full TypeScript support with proper interfaces:
```tsx
interface CustomColors {
  background: string;
  text: string;
  border?: string;
}

interface CustomText {
  primary: string;
  secondary?: string;
  prefix?: string;
  suffix?: string;
}
```