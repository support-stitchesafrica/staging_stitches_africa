# AI Shopping Assistant - Prompts Guide

## Overview

The prompts system provides comprehensive, well-structured prompts for the AI shopping assistant. This guide explains how to use and customize the prompts.

## Architecture

The prompts are organized into specialized modules:

1. **Base System Prompt** - Defines the assistant's personality and core responsibilities
2. **Product Recommendation Prompt** - Guides product discovery and recommendations
3. **Sizing Advice Prompt** - Helps with sizing and fit guidance
4. **Avatar Creation Prompt** - Assists with creating customer avatars
5. **Vendor Recommendation Prompt** - Guides vendor/tailor recommendations

## Usage

### Basic Usage

```typescript
import { buildSystemPrompt } from './prompts';

// Build a complete system prompt with context
const systemPrompt = buildSystemPrompt(context);
```

### With Context

```typescript
import { buildSystemPrompt } from './prompts';

const context = {
  messages: [],
  userId: 'user123',
  budget: 50000,
  preferences: { style: 'traditional' },
  viewedProducts: ['prod1', 'prod2'],
  addedToCart: ['prod1']
};

const systemPrompt = buildSystemPrompt(context);
// Prompt now includes contextual information about budget, preferences, etc.
```

### Specialized Prompts

```typescript
import { getSpecializedPrompt } from './prompts';

// Get a prompt for a specific scenario
const welcomePrompt = getSpecializedPrompt('welcome');
const sizingPrompt = getSpecializedPrompt('sizing');
const checkoutPrompt = getSpecializedPrompt('checkout');
const helpPrompt = getSpecializedPrompt('help');
```

### Prompt Templates

```typescript
import { fillPromptTemplate, PROMPT_TEMPLATES } from './prompts';

// Use a pre-defined template
const cartReminder = fillPromptTemplate('cartReminder', { count: 3 });
// Result: "You have 3 item(s) in your cart! Would you like to..."

// Access templates directly
const noResultsMessage = PROMPT_TEMPLATES.noResults;
```

## Prompt Components

### 1. Shopping Assistant Persona

Defines the AI's personality:
- Warm, enthusiastic, and knowledgeable
- Patient and culturally aware
- Concise but thorough
- Proactive in offering help

### 2. Product Recommendation Logic

Guides the AI on how to recommend products:
- Understanding customer needs
- Matching criteria (style, budget, occasion)
- Presenting options effectively
- Highlighting key features
- Offering virtual try-on

**Example Flow:**
1. Ask about occasion, style, budget
2. Filter products by criteria
3. Present 2-4 options
4. Highlight unique features
5. Suggest virtual try-on
6. Follow up with more options

### 3. Sizing Advice

Helps customers find the right size:
- Gathering measurements
- Creating avatars
- Providing size recommendations
- Offering virtual try-on
- Addressing fit concerns

**Size Reference:**
- XS: Bust 81-84cm, Waist 61-64cm, Hips 86-89cm
- S: Bust 86-89cm, Waist 66-69cm, Hips 91-94cm
- M: Bust 91-94cm, Waist 71-74cm, Hips 96-99cm
- L: Bust 96-99cm, Waist 76-79cm, Hips 101-104cm
- XL: Bust 101-107cm, Waist 81-87cm, Hips 106-112cm
- XXL: Bust 109-117cm, Waist 89-97cm, Hips 114-122cm

### 4. Avatar Creation

Guides avatar creation for virtual try-on:
- Asking conversationally for details
- Being flexible with input formats
- Providing reassurance about privacy
- Confirming and creating avatar
- Offering to update existing avatars

**Required Information:**
- Height (cm, meters, or feet/inches)
- Body type (slim, athletic, curvy, plus-size)
- Skin tone (optional)

### 5. Vendor Recommendations

Helps recommend vendors/tailors:
- Understanding requirements
- Prioritizing quality (4.0+ ratings)
- Presenting vendor information
- Providing context and specialties
- Offering next steps

## Special Formats

The AI uses special markers to trigger actions:

```
[PRODUCT:product_id]        - Recommend a product
[VENDOR:vendor_id]          - Recommend a vendor
[ACTION:try_on:product_id]  - Trigger virtual try-on
[ACTION:add_to_cart:product_id:size] - Add to cart
[ACTION:create_avatar]      - Create customer avatar
```

## Contextual Additions

The system automatically adds context based on the session:

- **Budget:** Filters recommendations within range
- **Preferences:** Uses to prioritize suggestions
- **Viewed Products:** Offers related items
- **Cart Items:** Suggests checkout or complementary items
- **New Session:** Provides welcoming introduction

## Customization

### Adding New Prompt Templates

```typescript
// In prompts.ts
export const PROMPT_TEMPLATES = {
  // ... existing templates
  myNewTemplate: `Your template text with {variable} placeholders`,
};
```

### Modifying Existing Prompts

Edit the prompt constants in `prompts.ts`:

```typescript
export const BASE_SYSTEM_PROMPT = `
Your modified prompt text...
`;
```

### Creating Scenario-Specific Prompts

```typescript
export function getSpecializedPrompt(scenario: string): string {
  const prompts = {
    // ... existing scenarios
    myScenario: `Your scenario-specific prompt`,
  };
  return prompts[scenario];
}
```

## Best Practices

1. **Keep Prompts Conversational:** Write prompts as if talking to a friend
2. **Be Specific:** Provide clear guidelines and examples
3. **Include Context:** Use session context to personalize responses
4. **Stay Within Token Limits:** Use `validatePromptLength()` to check
5. **Test Thoroughly:** Test prompts with various customer inputs
6. **Update Regularly:** Refine based on customer interactions

## Token Management

```typescript
import { validatePromptLength, truncatePrompt } from './prompts';

// Check if prompt is within limits
const isValid = validatePromptLength(prompt, 4000);

// Truncate if needed
const truncated = truncatePrompt(prompt, 4000);
```

## Examples

### Example 1: Product Search

**Customer:** "I need a dress for a wedding"

**AI Response (guided by prompts):**
```
How exciting! 🎉 I'd love to help you find the perfect wedding dress. 
A few quick questions:
- What's your budget range?
- Do you prefer traditional African styles or modern designs?
- What colors do you love?

While you think about that, here are some stunning options...
[PRODUCT:dress123]
[PRODUCT:dress456]
```

### Example 2: Sizing Help

**Customer:** "What size should I get?"

**AI Response (guided by prompts):**
```
I'd love to help you find the perfect fit! To give you the best 
recommendation, could you tell me:
- Your height?
- Your body type (slim, athletic, curvy, or plus-size)?

Or if you know your measurements (bust, waist, hips), that works too! 📏

Once I have this info, I can create a virtual avatar so you can see 
how items look on you!
```

### Example 3: Avatar Creation

**Customer:** "I'm 5'6" and curvy"

**AI Response (guided by prompts):**
```
Perfect! I'm creating your avatar now - a 168cm curvy figure. 
This will help you see how clothes look on you! ✨

[ACTION:create_avatar]

Now, want to try on that beautiful dress we were looking at?
```

## Troubleshooting

### Prompt Too Long

If prompts exceed token limits:
```typescript
const truncated = truncatePrompt(prompt, 4000);
```

### Context Not Applied

Ensure you're passing context to `buildSystemPrompt()`:
```typescript
const prompt = buildSystemPrompt(context); // ✓ Correct
const prompt = buildSystemPrompt();        // ✗ Missing context
```

### AI Not Following Format

Check that special format markers are included in the prompt:
- `[PRODUCT:id]`
- `[VENDOR:id]`
- `[ACTION:type:data]`

## Related Documentation

- [OpenAI Service](./OPENAI_SERVICE_IMPLEMENTATION.md)
- [Session Management](./SESSION_MANAGEMENT.md)
- [Product Search](./PRODUCT_SEARCH_SERVICE.md)
- [Avatar Service](./AVATAR_SERVICE.md)

## Support

For questions or issues with prompts:
1. Check this guide
2. Review example interactions
3. Test with different contexts
4. Adjust prompts as needed
