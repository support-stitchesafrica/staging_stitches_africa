# Response Parser Guide

## Overview

The response parser extracts structured data from AI responses, enabling the chat interface to display product cards, vendor information, and quick action buttons.

## Marker Formats

### Product IDs
```
Format: [PRODUCT:product_id]
Example: "Check out this dress [PRODUCT:dress_123]"
```

The AI includes product markers when recommending products. The parser extracts these IDs so the UI can fetch and display product cards.

### Vendor IDs
```
Format: [VENDOR:vendor_id]
Example: "Visit [VENDOR:tailor_lagos_01] for more options"
```

Vendor markers indicate recommended vendors/tailors. The UI can display vendor cards with ratings, location, and specialties.

### Actions
```
Format: [ACTION:action_type:key1=value1:key2=value2]

Examples:
- [ACTION:add_to_cart:productId=dress_123:size=M]
- [ACTION:view_product:productId=dress_123]
- [ACTION:visit_vendor:vendorId=tailor_01]
- [ACTION:try_on:productId=dress_123:size=M]
```

Actions represent quick buttons the user can click. Each action has a type and optional data fields.

## API Reference

### `parseAIResponse(message: string)`

Main parsing function that extracts all structured data.

**Returns:**
```typescript
{
  cleanMessage: string;      // Message with markers removed
  productIds: string[];      // Extracted product IDs
  vendorIds: string[];       // Extracted vendor IDs
  actions: ParsedAction[];   // Parsed actions with data
}
```

**Example:**
```typescript
import { parseAIResponse } from '@/lib/ai-assistant';

const result = parseAIResponse(
  'Check out [PRODUCT:dress_123] [ACTION:add_to_cart:productId=dress_123:size=M]'
);

console.log(result.productIds);  // ['dress_123']
console.log(result.actions);     // [{ type: 'add_to_cart', data: { productId: 'dress_123', size: 'M' } }]
console.log(result.cleanMessage); // 'Check out'
```

### `extractProductIds(message: string)`

Extract only product IDs from a message.

**Returns:** `string[]`

**Example:**
```typescript
const products = extractProductIds('Products: [PRODUCT:p1] and [PRODUCT:p2]');
// ['p1', 'p2']
```

### `extractVendorIds(message: string)`

Extract only vendor IDs from a message.

**Returns:** `string[]`

**Example:**
```typescript
const vendors = extractVendorIds('Vendors: [VENDOR:v1] and [VENDOR:v2]');
// ['v1', 'v2']
```

### `extractActions(message: string)`

Extract and parse actions from a message.

**Returns:** `ParsedAction[]`

```typescript
interface ParsedAction {
  type: string;
  data?: Record<string, string>;
}
```

**Example:**
```typescript
const actions = extractActions('[ACTION:add_to_cart:productId=p1:size=M]');
// [{ type: 'add_to_cart', data: { productId: 'p1', size: 'M' } }]
```

### `cleanMessageMarkers(message: string)`

Remove all markers from a message and normalize whitespace.

**Returns:** `string`

**Example:**
```typescript
const clean = cleanMessageMarkers('Text [PRODUCT:p1] more [VENDOR:v1] text');
// 'Text more text'
```

### `hasStructuredData(message: string)`

Check if a message contains any structured data markers.

**Returns:** `boolean`

**Example:**
```typescript
hasStructuredData('Just text');              // false
hasStructuredData('Text [PRODUCT:p1]');      // true
```

### `countStructuredData(message: string)`

Count the number of each type of structured data element.

**Returns:**
```typescript
{
  products: number;
  vendors: number;
  actions: number;
  total: number;
}
```

**Example:**
```typescript
const counts = countStructuredData('[PRODUCT:p1] [PRODUCT:p2] [VENDOR:v1]');
// { products: 2, vendors: 1, actions: 0, total: 3 }
```

## Usage Patterns

### In API Routes

```typescript
// app/api/ai-assistant/chat/route.ts
import { parseAIResponse } from '@/lib/ai-assistant';

export async function POST(req: Request) {
  // Get AI response
  const aiMessage = await getAIResponse(userMessage);
  
  // Parse structured data
  const parsed = parseAIResponse(aiMessage);
  
  // Return to frontend
  return Response.json({
    message: parsed.cleanMessage,
    products: parsed.productIds,
    vendors: parsed.vendorIds,
    quickActions: parsed.actions,
  });
}
```

### In React Components

```typescript
// components/ai-assistant/ChatMessage.tsx
import { parseAIResponse } from '@/lib/ai-assistant';

function ChatMessage({ message }: { message: string }) {
  const parsed = parseAIResponse(message);
  
  return (
    <div>
      <p>{parsed.cleanMessage}</p>
      
      {parsed.productIds.length > 0 && (
        <ProductCards productIds={parsed.productIds} />
      )}
      
      {parsed.vendorIds.length > 0 && (
        <VendorCards vendorIds={parsed.vendorIds} />
      )}
      
      {parsed.actions.length > 0 && (
        <QuickActions actions={parsed.actions} />
      )}
    </div>
  );
}
```

### Conditional Extraction

```typescript
// Only extract what you need
import { extractProductIds, hasStructuredData } from '@/lib/ai-assistant';

if (hasStructuredData(message)) {
  const products = extractProductIds(message);
  if (products.length > 0) {
    await fetchProductDetails(products);
  }
}
```

## Action Types

Common action types used in the system:

| Type | Description | Data Fields |
|------|-------------|-------------|
| `add_to_cart` | Add product to cart | `productId`, `size`, `color` |
| `view_product` | View product details | `productId` |
| `visit_vendor` | Visit vendor shop | `vendorId` |
| `try_on` | Virtual try-on | `productId`, `size` |
| `view_details` | View more details | `productId` or `vendorId` |

## Best Practices

### 1. Always Parse on the Server

Parse AI responses on the server side (in API routes) to keep the parsing logic centralized and testable.

```typescript
// ✅ Good: Parse in API route
export async function POST(req: Request) {
  const aiResponse = await openai.chat(...);
  const parsed = parseAIResponse(aiResponse);
  return Response.json(parsed);
}

// ❌ Avoid: Parsing in multiple components
```

### 2. Handle Missing Data Gracefully

```typescript
const parsed = parseAIResponse(message);

// Check before using
if (parsed.productIds.length > 0) {
  await fetchProducts(parsed.productIds);
}

// Provide defaults for actions
const actionData = action.data || {};
const productId = actionData.productId || '';
```

### 3. Validate Action Data

```typescript
function handleAction(action: ParsedAction) {
  if (action.type === 'add_to_cart') {
    const { productId, size } = action.data || {};
    
    if (!productId) {
      console.error('Missing productId in add_to_cart action');
      return;
    }
    
    addToCart(productId, size);
  }
}
```

### 4. Use Type Guards

```typescript
function isAddToCartAction(action: ParsedAction): action is ParsedAction & {
  data: { productId: string; size?: string }
} {
  return action.type === 'add_to_cart' && 
         action.data?.productId !== undefined;
}

if (isAddToCartAction(action)) {
  // TypeScript knows action.data.productId exists
  addToCart(action.data.productId, action.data.size);
}
```

## Testing

The response parser includes comprehensive tests covering:

- Single and multiple product/vendor extraction
- Action parsing with various data formats
- Edge cases (empty messages, malformed data)
- Whitespace normalization
- Combined structured data

Run tests:
```bash
npm test -- lib/ai-assistant/openai-service.test.ts
```

## Examples

See `lib/ai-assistant/response-parser.example.ts` for 10+ detailed usage examples including:

- Basic extraction
- Multiple products and vendors
- Complex actions
- Real-world scenarios
- API route integration
- React component usage
- Edge case handling

## Troubleshooting

### Products not showing in chat

1. Check if the AI is including product markers:
   ```typescript
   console.log('Raw AI message:', aiMessage);
   ```

2. Verify parsing is working:
   ```typescript
   const parsed = parseAIResponse(aiMessage);
   console.log('Parsed products:', parsed.productIds);
   ```

3. Ensure product IDs are valid:
   ```typescript
   const products = await fetchProducts(parsed.productIds);
   console.log('Found products:', products);
   ```

### Actions not triggering

1. Check action format:
   ```typescript
   console.log('Parsed actions:', parsed.actions);
   ```

2. Verify action handler:
   ```typescript
   function handleAction(action: ParsedAction) {
     console.log('Handling action:', action.type, action.data);
     // Your action logic
   }
   ```

### Markers showing in UI

If you see `[PRODUCT:...]` in the UI, you're not cleaning the message:

```typescript
// ✅ Use cleanMessage
<p>{parsed.cleanMessage}</p>

// ❌ Don't use raw message
<p>{rawMessage}</p>
```

## Related Documentation

- `lib/ai-assistant/README.md` - Main implementation guide
- `lib/ai-assistant/PROMPTS_GUIDE.md` - System prompts documentation
- `.kiro/specs/ai-shopping-assistant/design.md` - Design specifications
- `lib/ai-assistant/response-parser.example.ts` - Usage examples
