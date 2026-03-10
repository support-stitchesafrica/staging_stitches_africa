# AI Shopping Assistant Components

This directory contains components for the AI Shopping Assistant feature.

## Quick Start

```tsx
// Import components
import { ChatWidget } from '@/components/ai-assistant/ChatWidget';
import { ProductCard } from '@/components/ai-assistant/ProductCard';

// Use ChatWidget (includes ProductCard integration)
<ChatWidget />
```

## Components

### ChatWidget

The main chat interface component that provides a conversational shopping experience.

**Features:**
- Floating chat button (60x60px, bottom-right)
- Expandable chat window (400x600px desktop, full-screen mobile)
- Message history with timestamps
- Session persistence (24 hours)
- Auto-scroll to latest messages
- Typing indicators
- Mobile responsive

**Usage:**
```tsx
import { ChatWidget } from '@/components/ai-assistant/ChatWidget';

export default function Page() {
  return <ChatWidget />;
}
```

### ProductCard

Displays product information in chat with quick action buttons.

**Features:**
- Product image with fallback
- Product name and vendor
- Price display with discount
- Availability status indicator
- Quick action buttons:
  - Try It On (virtual try-on)
  - Add to Cart
  - View Details
- Mobile responsive (350px max width)
- Smooth hover effects
- Discount and featured badges

**Props:**
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onTryOn?: (product: Product) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { ProductCard } from '@/components/ai-assistant/ProductCard';

<ProductCard
  product={product}
  onAddToCart={(product) => console.log('Add to cart:', product)}
  onViewDetails={(product) => console.log('View details:', product)}
  onTryOn={(product) => console.log('Try on:', product)}
/>
```

**Design Specifications:**
- Max width: 350px (as per design document)
- Image height: 280px
- Responsive layout
- Touch-friendly buttons (48px minimum on mobile)
- Discount badge: top-right corner
- Featured badge: top-left corner

**Behavior:**
- Try It On button only shows for in-stock products
- Add to Cart button only shows for in-stock products
- View Details button always available
- Opens product page in new tab when clicking View Details
- Displays formatted price with currency
- Shows original price with strikethrough when discounted

## Integration

The ProductCard is integrated into the ChatWidget to display products recommended by the AI assistant. When the AI returns product IDs in its response, the ChatWidget:

1. Fetches product details from `/api/ai-assistant/products`
2. Renders ProductCard components for each product
3. Handles user interactions (add to cart, view details, try on)

## Testing

Run tests with:
```bash
npm test components/ai-assistant/ProductCard.test.tsx
```

### Avatar3DViewer

Interactive 3D avatar viewer with product visualization using Three.js and React Three Fiber.

**Features:**
- Customizable 3D avatar (height, body type, skin tone)
- Product overlay visualization
- 360-degree rotation controls (mouse/touch)
- Zoom controls
- Auto-rotate option
- Smooth breathing animation
- Shadow rendering
- Mobile optimized

**Props:**
```typescript
interface Avatar3DViewerProps {
  avatarConfig: AvatarConfig;
  product?: ProductVisualization;
  className?: string;
  enableRotation?: boolean;
  autoRotate?: boolean;
}

interface AvatarConfig {
  height: number; // in cm
  bodyType: 'slim' | 'average' | 'athletic' | 'plus-size';
  skinTone: string; // hex color
  gender?: 'male' | 'female' | 'unisex';
}

interface ProductVisualization {
  productId: string;
  category: string; // 'top', 'bottom', 'dress', 'outerwear'
  color: string; // hex color
  pattern?: string;
  thumbnail?: string;
}
```

**Usage:**
```tsx
import { Avatar3DViewer } from '@/components/ai-assistant';

const avatarConfig = {
  height: 170,
  bodyType: 'average',
  skinTone: '#D4A574',
};

const product = {
  productId: 'prod-123',
  category: 'top',
  color: '#4A90E2',
};

<Avatar3DViewer
  avatarConfig={avatarConfig}
  product={product}
  enableRotation={true}
  className="w-full h-[600px]"
/>
```

### VirtualTryOnModal

Full-screen modal for the complete virtual try-on experience.

**Features:**
- 3D avatar viewer with product
- Product information panel
- Size selection with AI recommendations
- Fit information based on avatar
- Add to cart integration
- Mobile responsive layout
- Rotation instructions
- Touch-friendly controls

**Props:**
```typescript
interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  avatarConfig: AvatarConfig;
  onAddToCart?: (product: Product, size?: string) => void;
}
```

**Usage:**
```tsx
import { VirtualTryOnModal } from '@/components/ai-assistant';

const [isOpen, setIsOpen] = useState(false);

<VirtualTryOnModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  product={product}
  avatarConfig={avatarConfig}
  onAddToCart={(product, size) => {
    // Handle add to cart
  }}
/>
```

**Size Recommendation Logic:**
The modal automatically recommends sizes based on avatar configuration:
- Slim body type: XS-M (based on height)
- Average body type: S-L (based on height)
- Athletic body type: M-XL (based on height)
- Plus-size body type: L-XXL (based on height)

## Demo Component

A demo component is available for testing and demonstration:

```tsx
import { Avatar3DViewerDemo } from '@/components/ai-assistant/Avatar3DViewerDemo';

<Avatar3DViewerDemo />
```

This provides an interactive interface to test different avatar configurations and product visualizations.

## Documentation

- [3D Viewer Documentation](./3D_VIEWER_README.md) - Detailed documentation for the 3D viewer components

## Future Enhancements

- Texture mapping for fabric patterns
- More detailed avatar models (face, hair)
- Multiple product layers (outfit combinations)
- Pose variations
- AR integration for mobile
- Screenshot/share functionality
- Product comparison view
- Wishlist integration
