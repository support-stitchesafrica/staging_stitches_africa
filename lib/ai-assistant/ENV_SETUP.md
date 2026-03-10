# AI Shopping Assistant - Environment Setup

## Required Environment Variables

The AI Shopping Assistant requires the following environment variables to be configured in your `.env` or `.env.local` file:

### OpenAI Configuration

```env
# OpenAI API Key (Required)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# OpenAI Model (Optional, defaults to gpt-4-turbo-preview)
# Options: gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo
OPENAI_MODEL=gpt-4-turbo-preview

# Maximum Tokens (Optional, defaults to 1000)
# Controls the maximum length of AI responses
# Recommended range: 100-4000
OPENAI_MAX_TOKENS=1000

# Temperature (Optional, defaults to 0.7)
# Controls response creativity and randomness
# Range: 0.0 (deterministic) to 1.0 (creative)
OPENAI_TEMPERATURE=0.7
```

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the generated key (you won't be able to see it again!)

### 2. Add to Environment File

Add the OpenAI configuration to your `.env` file:

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your-actual-api-key-here
```

### 3. Verify Configuration

The configuration is automatically validated when the AI service initializes. If there are any issues, you'll see clear error messages in the console.

You can also manually validate the configuration:

```typescript
import { validateAIConfig } from '@/lib/ai-assistant/config';

try {
  validateAIConfig();
  console.log('✅ AI configuration is valid');
} catch (error) {
  console.error('❌ AI configuration error:', error.message);
}
```

## Configuration Options

### Model Selection

Choose the right model based on your needs:

- **gpt-4-turbo-preview**: Best quality, higher cost (~$0.05/conversation)
- **gpt-4**: High quality, moderate cost
- **gpt-3.5-turbo**: Fast and cost-effective (~$0.002/conversation)

### Token Limits

- **100-500 tokens**: Short, concise responses
- **500-1000 tokens**: Balanced responses (recommended)
- **1000-4000 tokens**: Detailed, comprehensive responses

### Temperature Settings

- **0.0-0.3**: Focused, deterministic responses
- **0.4-0.7**: Balanced creativity (recommended)
- **0.8-1.0**: More creative and varied responses

## Cost Estimation

### GPT-4 Turbo Preview
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- Average conversation: ~2K tokens
- **Cost per conversation: ~$0.05**
- **1000 conversations/month: ~$50**

### GPT-3.5 Turbo
- Input: $0.0005 per 1K tokens
- Output: $0.0015 per 1K tokens
- Average conversation: ~2K tokens
- **Cost per conversation: ~$0.002**
- **1000 conversations/month: ~$2**

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different API keys** for development and production
3. **Set up usage limits** in your OpenAI dashboard
4. **Monitor API usage** regularly
5. **Rotate API keys** periodically

## Troubleshooting

### Error: "OPENAI_API_KEY is not set"

**Solution**: Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=sk-proj-your-key-here
```

### Error: "Invalid API key"

**Solution**: 
1. Verify your API key is correct
2. Check if the key has been revoked
3. Generate a new key from OpenAI dashboard

### Warning: "OPENAI_MAX_TOKENS is out of range"

**Solution**: Set a value between 100 and 4000:
```env
OPENAI_MAX_TOKENS=1000
```

### Warning: "OPENAI_TEMPERATURE is out of range"

**Solution**: Set a value between 0.0 and 1.0:
```env
OPENAI_TEMPERATURE=0.7
```

## Next Steps

After setting up the environment variables:

1. ✅ Environment variables configured
2. ⏭️ Implement OpenAI service (Task 4)
3. ⏭️ Build chat widget UI (Task 5)
4. ⏭️ Test the integration

## Support

For issues or questions:
- Check the [OpenAI Documentation](https://platform.openai.com/docs)
- Review the [AI Shopping Assistant Design Doc](.kiro/specs/ai-shopping-assistant/design.md)
- Contact the development team
