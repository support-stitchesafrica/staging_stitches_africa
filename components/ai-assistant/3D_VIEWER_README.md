# 3D Avatar Viewer Component

## Overview

The 3D Avatar Viewer provides an interactive virtual try-on experience for the AI Shopping Assistant. It uses Three.js and React Three Fiber to render a customizable 3D avatar with product overlays.

## Components

### Avatar3DViewer

The main 3D viewer component that renders an animated avatar with product visualization.

**Features:**
- Customizable avatar based on user profile (height, body type, skin tone)
- Product overlay visualization
- 360-degree rotation controls (mouse/touch)
- Zoom controls
- Auto-rotate option
- Smooth animations (breathing effect)
- Shadow rendering
- Mobile optimized

**Usage:**

```tsx
import { Avatar3DViewer, AvatarConfig, ProductVisualization } from '@/components/ai-assistant';

const avatarConfig: AvatarConfig = {
  height: 170, // in cm
  bodyType: 'average', // 'slim' | 'average' | 'athletic' | 'plus-size'
  skinTone: '#D4A574', // hex color
  gender: 'unisex', // optional
};

const product: ProductVisualization = {
  productId: 'prod-123',
  category: 'top', // 'top' | 'bottom' | 'dress' | 'outerwear'
  color: '#FF5733',
  thumbnail: '/product-image.jpg',
};

<Avatar3DViewer
  avatarConfig={avatarConfig}
  product={product}
  enableRotation={true}
  autoRotate={false}
  className="w-full h-[600px]"
/>
```

### VirtualTryOnModal

A full-screen modal component that provides the complete virtual try-on experience.

**Features:**
- Full-screen 3D viewer
- Product information panel
- Size selection with recommendations
- Fit information based on avatar
- Add to cart integration
- Mobile responsive layout
- Rotation instructions
- Touch-friendly controls

**Usage:**

```tsx
import { VirtualTryOnModal } from '@/components/ai-assistant';
import type { Product } from '@/types';

const [isOpen, setIsOpen] = useState(false);

<VirtualTryOnModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  product={product}
  avatarConfig={avatarConfig}
  onAddToCart={(product, size) => {
    console.log('Adding to cart:', product, size);
  }}
/>
```

## Avatar Configuration

### AvatarConfig Interface

```typescript
interface AvatarConfig {
  height: number; // Height in cm (e.g., 170)
  bodyType: 'slim' | 'average' | 'athletic' | 'plus-size';
  skinTone: string; // Hex color (e.g., '#D4A574')
  gender?: 'male' | 'female' | 'unisex';
}
```

### Body Type Scaling

The avatar automatically adjusts proportions based on body type:

- **slim**: Narrower width (0.8x), standard depth (0.8x)
- **average**: Standard proportions (1.0x)
- **athletic**: Broader shoulders (1.1x), standard depth
- **plus-size**: Fuller proportions (1.3x width, 1.2x depth)

### Height Scaling

Avatar height is normalized to 170cm average. All body parts scale proportionally based on the configured height.

## Product Visualization

### ProductVisualization Interface

```typescript
interface ProductVisualization {
  productId: string;
  category: string; // Determines which body parts to color
  color: string; // Hex color for the garment
  pattern?: string; // Future: texture patterns
  thumbnail?: string; // Product image reference
}
```

### Category Mapping

- **top**: Colors torso and upper arms
- **bottom**: Colors hips and upper legs
- **dress**: Colors torso, arms, hips, and upper legs
- **outerwear**: Colors torso and upper arms (same as top)

## Size Recommendation Logic

The modal automatically recommends sizes based on avatar configuration:

| Body Type | Height < 165cm | Height 165-175cm | Height > 175cm |
|-----------|----------------|------------------|----------------|
| Slim      | XS             | S                | M              |
| Average   | S              | M                | L              |
| Athletic  | M              | L                | XL             |
| Plus-size | L              | XL               | XXL            |

## Controls

### Mouse Controls
- **Left Click + Drag**: Rotate avatar
- **Scroll Wheel**: Zoom in/out
- **Right Click + Drag**: Pan (disabled by default)

### Touch Controls
- **Single Finger Drag**: Rotate avatar
- **Pinch**: Zoom in/out
- **Two Finger Drag**: Pan (disabled by default)

## Performance Considerations

1. **Shadows**: Enabled with 1024x1024 shadow maps
2. **Anti-aliasing**: Enabled for smooth edges
3. **Geometry**: Uses simple primitives (spheres, cylinders, boxes) for performance
4. **Animation**: Single breathing animation loop
5. **Loading**: Suspense boundary with loading fallback

## Integration with AI Assistant

The 3D viewer integrates with the AI Shopping Assistant through:

1. **ProductCard**: "Try It On" button triggers the modal
2. **ChatWidget**: Can display try-on recommendations
3. **Avatar Service**: Generates avatar config from user profile
4. **Cart Integration**: Add to cart with recommended size

## Future Enhancements

- [ ] Texture mapping for fabric patterns
- [ ] More detailed avatar models (face, hair)
- [ ] Multiple product layers (outfit combinations)
- [ ] Pose variations (standing, walking)
- [ ] Measurement visualization
- [ ] AR integration for mobile
- [ ] Screenshot/share functionality
- [ ] Comparison view (side-by-side products)

## Testing

Due to WebGL requirements, full rendering tests are not run in the test environment. The test suite focuses on:

- Type safety validation
- Configuration structure
- Export verification

For manual testing, use the component in a browser environment.

## Dependencies

- `three`: ^0.181.2 - 3D rendering engine
- `@react-three/fiber`: ^9.4.0 - React renderer for Three.js
- `@react-three/drei`: ^10.7.7 - Useful helpers for R3F

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 15+)
- Mobile browsers: Full support with touch controls

## Troubleshooting

### Black screen or no rendering
- Check that WebGL is enabled in browser
- Verify Three.js dependencies are installed
- Check browser console for errors

### Poor performance
- Reduce shadow quality
- Disable auto-rotate
- Simplify avatar geometry

### Touch controls not working
- Ensure OrbitControls is enabled
- Check for conflicting touch event handlers
- Test on actual device (not simulator)
