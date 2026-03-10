# OpenAI Service - Quick Reference

## Basic Usage

### Send a Chat Message
```typescript
import { sendChatMessage, ChatContext } from '@/lib/ai-assistant/openai-service';

const context: ChatContext = {
  messages: [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi! How can I help you today?' }
  ],
  userId: 'user123',
  preferences: { style: 'traditional' },
  viewedProducts: ['prod1', 'prod2'],
  addedToCart: ['prod1'],
  budget: 50000
};

const response = await sendChatMessage('Show me dresses', context);

console.log(response.message); // Clean AI response
console.log(response.productIds); // ['prod123', 'prod456']
console.log(response.suggestedQuestions); // ['Show me more', 'What sizes?']
```

### Create Avatar from Description
```typescript
import { createAvatarFromDescription } from '@/lib/ai-assistant/openai-service';

const avatar = await createAvatarFromDescription(
  "I'm 5'6\", curvy build, medium skin tone"
);

console.log(avatar);
// { height: 168, bodyType: 'curvy', skinTone: 'medium' }
```

### Validate Service Configuration
```typescript
import { validateOpenAIService } from '@/lib/ai-assistant/openai-service';

try {
  validateOpenAIService();
  console.log('Service is configured correctly');
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

### Check Service Health
```typescript
import { checkServiceHealth } from '@/lib/ai-assistant/openai-service';

const health = await checkServiceHealth();

if (health.available) {
  console.log('OpenAI service is available');
} else {
  console.error('Service unavailable:', health.error);
}
```

### Manage Context Window
```typescript
import { 
  estimateTokenCount, 
  truncateContext,
  ChatMessage 
} from '@/lib/ai-assistant/openai-service';

const messages: ChatMessage[] = [
  { role: 'user', content: 'Message 1' },
  { role: 'assistant', content: 'Response 1' },
  // ... many more messages
];

// Estimate tokens
const tokens = estimateTokenCount(messages);
console.log(`Estimated tokens: ${tokens}`);

// Truncate if needed
const truncated = truncateContext(messages, 4000);
console.log(`Kept ${truncated.length} messages`);
```

## Error Handling

### Handling OpenAIServiceError
```typescript
import { 
  sendChatMessage, 
  OpenAIServiceError 
} from '@/lib/ai-assistant/openai-service';

try {
  const response = await sendChatMessage('Hello', context);
  // Handle success
} catch (error) {
  if (error instanceof OpenAIServiceError) {
    console.error('Error code:', error.code);
    console.error('Retryable:', error.retryable);
    
    if (error.retryable) {
      // Retry the request
    } else {
      // Show error to user
    }
  }
}
```

### Common Error Codes
- `INVALID_INPUT` - Empty or invalid message (not retryable)
- `INVALID_API_KEY` - API key is missing or invalid (not retryable)
- `RATE_LIMIT` - Too many requests (retryable)
- `SERVICE_UNAVAILABLE` - OpenAI service down (retryable)
- `NETWORK_ERROR` - Connection issues (retryable)
- `UNKNOWN_ERROR` - Generic error (retryable)

## API Response Format

### AIResponse Interface
```typescript
interface AIResponse {
  message: string;              // Clean message without markers
  productIds?: string[];        // Extracted product IDs
  vendorIds?: string[];         // Extracted vendor IDs
  actions?: string[];           // Extracted actions
  suggestedQuestions?: string[]; // Follow-up questions
}
```

### Parsing Markers
The AI uses special markers in responses:
- `[PRODUCT:product_id]` - Product recommendation
- `[VENDOR:vendor_id]` - Vendor recommendation
- `[ACTION:try_on:product_id]` - Try-on action
- `[ACTION:add_to_cart:product_id:size]` - Add to cart action

These are automatically parsed and removed from the user-facing message.

## Context Management

### ChatContext Interface
```typescript
interface ChatContext {
  messages: ChatMessage[];      // Conversation history
  userId?: string;              // User identifier
  preferences?: Record<string, any>; // User preferences
  viewedProducts?: string[];    // Products viewed in session
  addedToCart?: string[];       // Items in cart
  budget?: number;              // User's budget
}
```

### Best Practices
1. **Keep messages array updated** - Add each user/assistant message
2. **Limit to 10 messages** - Service automatically manages this
3. **Include context** - Add preferences, budget, etc. for better responses
4. **Track shopping behavior** - Include viewedProducts and addedToCart

## Configuration

### Environment Variables
```env
# Required
OPENAI_API_KEY=sk-...

# Optional (with defaults)
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

### Using Config
```typescript
import { 
  getOpenAIConfig,
  getSessionConfig,
  isFeatureEnabled 
} from '@/lib/ai-assistant/config';

const openaiConfig = getOpenAIConfig();
console.log(openaiConfig.model); // 'gpt-4-turbo-preview'

const sessionConfig = getSessionConfig();
console.log(sessionConfig.expiryHours); // 24

if (isFeatureEnabled('virtualTryOn')) {
  // Show try-on button
}
```

## Testing

### Running Tests
```bash
npm test -- lib/ai-assistant/openai-service.test.ts
```

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';
import { estimateTokenCount } from '@/lib/ai-assistant/openai-service';

describe('My Test', () => {
  it('should work', () => {
    const tokens = estimateTokenCount([
      { role: 'user', content: 'test' }
    ]);
    expect(tokens).toBeGreaterThan(0);
  });
});
```

## Performance Tips

1. **Reuse context** - Don't create new context objects unnecessarily
2. **Limit message history** - Keep only relevant messages
3. **Use GPT-3.5** - Faster and cheaper than GPT-4
4. **Cache responses** - For common queries
5. **Batch requests** - If possible, combine multiple queries

## Cost Estimation

### GPT-3.5-turbo
- Input: $0.0005/1K tokens
- Output: $0.0015/1K tokens
- Average conversation: ~500 tokens
- Cost per conversation: ~$0.001

### GPT-4-turbo
- Input: $0.01/1K tokens
- Output: $0.03/1K tokens
- Average conversation: ~500 tokens
- Cost per conversation: ~$0.02

## Troubleshooting

### "Missing credentials" error
- Check `.env` file has `OPENAI_API_KEY`
- Restart dev server after adding env vars
- Verify API key is valid on OpenAI dashboard

### "Rate limit exceeded"
- Wait 60 seconds before retrying
- Implement request queuing
- Consider upgrading OpenAI plan

### Slow responses
- Use GPT-3.5 instead of GPT-4
- Reduce max_tokens
- Minimize context window size

### High costs
- Switch to GPT-3.5-turbo
- Reduce max_tokens to 500
- Implement response caching
- Limit conversation length

## Support

- OpenAI API Docs: https://platform.openai.com/docs
- OpenAI Status: https://status.openai.com
- Get API Key: https://platform.openai.com/api-keys
