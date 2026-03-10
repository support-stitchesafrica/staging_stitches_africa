# AI Shopping Assistant Prompts - Quick Reference

## Quick Start

```typescript
import { buildSystemPrompt } from '@/lib/ai-assistant/prompts';

// Build a complete system prompt
const prompt = buildSystemPrompt(context);
```

## Main Functions

### `buildSystemPrompt(context?: ChatContext): string`
Builds a complete system prompt with all components and contextual information.

```typescript
const context = {
  messages: [],
  budget: 50000,
  preferences: { style: 'traditional' },
  viewedProducts: ['prod1', 'prod2'],
  addedToCart: ['prod1']
};

const prompt = buildSystemPrompt(context);
```

### `getSpecializedPrompt(scenario): string`
Get a prompt for specific scenarios.

```typescript
const welcomePrompt = getSpecializedPrompt('welcome');
const sizingPrompt = getSpecializedPrompt('sizing');
const checkoutPrompt = getSpecializedPrompt('checkout');
const helpPrompt = getSpecializedPrompt('help');
```

### `fillPromptTemplate(template, variables?): string`
Fill a prompt template with variables.

```typescript
const message = fillPromptTemplate('cartReminder', { count: 3 });
// "You have 3 item(s) in your cart! Would you like to..."
```

### `validatePromptLength(prompt, maxTokens?): boolean`
Check if a prompt is within token limits.

```typescript
const isValid = validatePromptLength(prompt, 4000);
```

### `truncatePrompt(prompt, maxTokens?): string`
Truncate a prompt to fit within token limits.

```typescript
const truncated = truncatePrompt(longPrompt, 4000);
```

## Prompt Components

### Base System Prompt
- Defines assistant personality
- Core responsibilities
- Communication guidelines
- Special format instructions

### Product Recommendation Prompt
- Understanding customer needs
- Matching criteria (style, budget, occasion)
- Presenting options
- Highlighting features
- Filtering logic

### Sizing Advice Prompt
- Gathering measurements
- Creating avatars
- Size recommendations
- Virtual try-on
- Size conversion reference

### Avatar Creation Prompt
- Conversational approach
- Flexible input handling
- Height conversions
- Body type mapping
- Privacy reassurance

### Vendor Recommendation Prompt
- Understanding requirements
- Prioritizing quality (4.0+ ratings)
- Presenting vendor information
- Providing context
- Next steps

## Special Formats

The AI uses these markers to trigger actions:

```
[PRODUCT:product_id]                    - Recommend a product
[VENDOR:vendor_id]                      - Recommend a vendor
[ACTION:try_on:product_id]              - Trigger virtual try-on
[ACTION:add_to_cart:product_id:size]    - Add to cart
[ACTION:create_avatar]                  - Create customer avatar
```

## Prompt Templates

Available templates:
- `noResults` - When no products match
- `budgetExceeded` - When products exceed budget
- `sizeUnavailable` - When size is out of stock
- `avatarNeeded` - When avatar creation is needed
- `cartReminder` - Remind about items in cart

## Context Information

The system automatically adds context:

- **Budget:** Filters recommendations
- **Preferences:** Prioritizes suggestions
- **Viewed Products:** Offers related items
- **Cart Items:** Suggests checkout
- **New Session:** Welcomes customer

## Size Reference

Quick size guide included in prompts:

| Size | Bust (cm) | Waist (cm) | Hips (cm) |
|------|-----------|------------|-----------|
| XS   | 81-84     | 61-64      | 86-89     |
| S    | 86-89     | 66-69      | 91-94     |
| M    | 91-94     | 71-74      | 96-99     |
| L    | 96-99     | 76-79      | 101-104   |
| XL   | 101-107   | 81-87      | 106-112   |
| XXL  | 109-117   | 89-97      | 114-122   |

## Example Usage

### Basic Chat

```typescript
import { buildSystemPrompt } from '@/lib/ai-assistant/prompts';
import { sendChatMessage } from '@/lib/ai-assistant/openai-service';

const context = {
  messages: [],
  userId: 'user123'
};

const response = await sendChatMessage(
  "I need a dress for a wedding",
  context
);
```

### With Budget Context

```typescript
const context = {
  messages: [],
  budget: 75000,
  preferences: { style: 'modern' }
};

const prompt = buildSystemPrompt(context);
// Prompt now includes budget and style preferences
```

### Specialized Scenario

```typescript
import { getSpecializedPrompt } from '@/lib/ai-assistant/prompts';

// When customer needs sizing help
const sizingGuidance = getSpecializedPrompt('sizing');
```

### Template Usage

```typescript
import { fillPromptTemplate } from '@/lib/ai-assistant/prompts';

// Remind about cart
const reminder = fillPromptTemplate('cartReminder', { count: 3 });
```

## Best Practices

1. **Always use context** - Pass session context for personalized responses
2. **Check token limits** - Use `validatePromptLength()` for long prompts
3. **Use specialized prompts** - For specific scenarios (welcome, sizing, etc.)
4. **Test thoroughly** - Test with various customer inputs
5. **Monitor responses** - Track how well prompts guide the AI

## Common Patterns

### Welcome New Customer

```typescript
const context = { messages: [] };
const prompt = buildSystemPrompt(context);
// Includes "New session: Welcome the customer..."
```

### Product Search

```typescript
const context = {
  messages: previousMessages,
  preferences: { style: 'traditional', occasion: 'wedding' }
};
const prompt = buildSystemPrompt(context);
// Includes preferences for filtering
```

### Sizing Help

```typescript
const sizingPrompt = getSpecializedPrompt('sizing');
// Focused on measurements and avatar creation
```

### Checkout Flow

```typescript
const context = {
  messages: previousMessages,
  addedToCart: ['prod1', 'prod2', 'prod3']
};
const prompt = buildSystemPrompt(context);
// Includes cart context and checkout suggestions
```

## Troubleshooting

### Prompt Too Long
```typescript
if (!validatePromptLength(prompt, 4000)) {
  prompt = truncatePrompt(prompt, 4000);
}
```

### Missing Context
```typescript
// ✗ Wrong
const prompt = buildSystemPrompt();

// ✓ Correct
const prompt = buildSystemPrompt(context);
```

### AI Not Following Format
Ensure special markers are in the prompt:
- Check `BASE_SYSTEM_PROMPT` includes format instructions
- Verify markers: `[PRODUCT:id]`, `[VENDOR:id]`, `[ACTION:type:data]`

## Related Files

- `prompts.ts` - Main prompts module
- `openai-service.ts` - OpenAI integration
- `PROMPTS_GUIDE.md` - Detailed documentation
- `__tests__/prompts.test.ts` - Test suite

## Support

For detailed documentation, see [PROMPTS_GUIDE.md](./PROMPTS_GUIDE.md)
