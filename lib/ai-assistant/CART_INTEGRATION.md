# AI Assistant Cart Integration

## Overview

The AI Shopping Assistant now integrates with the cart system, allowing users to add products to their cart directly from the chat interface.

## Features

### 1. Add to Cart from Chat
- Users can add products to cart with a single click
- Automatic validation of product availability
- Size and color selection support
- Real-time cart count updates

### 2. Smart Product Validation
- Checks product availability before adding
- Validates size/color requirements
- Provides helpful error messages
- Suggests alternatives when needed

### 3. Quick Actions
- "Add to Cart" button on product cards
- "View Details" to see full product page
- "Try It On" for virtual try-on (coming soon)
- Context-aware button labels

## API Endpoints

### POST /api/ai-assistant/cart
Add product to cart from AI assistant

**Request:**
```json
{
  "productId": "product_123",
  "userId": "user_456",
  "quantity": 1,
  "size": "M",
  "color": "Blue"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Great! I've added 1 item...",
  "productTitle": "Blue Dress",
  "cartItemCount": 3,
  "suggestedQuestions": [...]
}
```

### GET /api/ai-assistant/cart
Get cart summary

## Usage

### In Chat Widget
```typescript
const handleAddToCart = async (product: Product) => {
  const response = await fetch('/api/ai-assistant/cart', {
    method: 'POST',
    body: JSON.stringify({ productId: product.product_id })
  });
  // Handle response
};
```

## Testing

Run tests:
```bash
npx vitest run lib/ai-assistant/__tests__/cart-action-service.test.ts
```
