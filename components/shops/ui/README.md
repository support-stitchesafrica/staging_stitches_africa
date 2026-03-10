# UI Components

## Button System

All buttons in the application are now black by default. You can use different variants by adding specific CSS classes:

### Global Button Styles
- **Default**: All buttons are black with white text
- **Hover**: Darker gray background
- **Disabled**: Gray background with reduced opacity

### Button Variants
Use these CSS classes to override the default black styling:

- `btn-secondary` - Light gray background with dark text
- `btn-outline` - Transparent background with black border
- `btn-danger` - Red background for destructive actions
- `btn-warning` - Orange background for warning actions
- `btn-success` - Green background for success actions

### Button Component
Use the `Button` component for consistent styling:

```tsx
import { Button } from '@/components/ui/Button';

// Primary (black) button
<Button>Click me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Outline button
<Button variant="outline">Learn More</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Loading state
<Button loading>Processing...</Button>

// Full width
<Button fullWidth>Submit</Button>
```

### BrandLogo Component
Displays brand logos with automatic fallback to initials:

```tsx
import { BrandLogo } from '@/components/ui/BrandLogo';

<BrandLogo
  src={logoUrl}
  alt="Brand Name"
  brandName="Brand Name"
  size={60}
/>
```

## Usage Examples

### In Components
```tsx
// Use regular button with default black styling
<button className="px-4 py-2 rounded-lg">
  Default Black Button
</button>

// Use secondary variant
<button className="btn-secondary px-4 py-2 rounded-lg">
  Secondary Button
</button>

// Use Button component
<Button variant="primary" size="lg">
  Large Primary Button
</Button>
```