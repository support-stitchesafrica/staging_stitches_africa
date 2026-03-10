# Environment Variables Quick Reference

## Required Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | Your OpenAI API key from platform.openai.com |
| `OPENAI_MODEL` | ❌ No | `gpt-4-turbo-preview` | Model to use for chat |
| `OPENAI_MAX_TOKENS` | ❌ No | `1000` | Maximum response length |
| `OPENAI_TEMPERATURE` | ❌ No | `0.7` | Response creativity (0.0-1.0) |

## Model Options

| Model | Speed | Quality | Cost/1K tokens | Best For |
|-------|-------|---------|----------------|----------|
| `gpt-3.5-turbo` | ⚡ Fast | Good | $0.0015 | Testing, high volume |
| `gpt-4` | 🐢 Slow | Excellent | $0.03 | Production, quality |
| `gpt-4-turbo-preview` | ⚡ Fast | Excellent | $0.01 | Recommended |

## Configuration Examples

### Development (Cost-Effective)
```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

### Production (High Quality)
```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

### Testing (Deterministic)
```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=300
OPENAI_TEMPERATURE=0.0
```

## Validation

Run this command to verify your configuration:

```bash
npx tsx lib/ai-assistant/verify-config.ts
```

Expected output:
```
🔍 Verifying AI Shopping Assistant Configuration...

📋 OpenAI Configuration:
  API Key: ✅ Set
  Model: gpt-4-turbo-preview
  Max Tokens: 1000
  Temperature: 0.7

✅ Configuration is valid!
```

## Troubleshooting

### Missing API Key
```
❌ OPENAI_API_KEY is not set
```
**Fix:** Add to `.env` file:
```env
OPENAI_API_KEY=sk-proj-your-key-here
```

### Invalid Token Range
```
⚠️ OPENAI_MAX_TOKENS is out of range
```
**Fix:** Use value between 100-4000:
```env
OPENAI_MAX_TOKENS=1000
```

### Invalid Temperature
```
⚠️ OPENAI_TEMPERATURE is out of range
```
**Fix:** Use value between 0.0-1.0:
```env
OPENAI_TEMPERATURE=0.7
```

## Security Checklist

- [ ] API key is in `.env` or `.env.local` (not committed)
- [ ] `.gitignore` includes `.env*` files
- [ ] Different keys for dev/staging/production
- [ ] Usage limits set in OpenAI dashboard
- [ ] API key rotated regularly (every 90 days)

## Cost Monitoring

Track your usage at: https://platform.openai.com/usage

Set up alerts:
1. Go to OpenAI Dashboard
2. Navigate to Usage → Limits
3. Set monthly budget limit
4. Enable email notifications

## Next Steps

1. ✅ Environment variables configured
2. ⏭️ Install OpenAI SDK: `npm install openai`
3. ⏭️ Add ChatWidget to your layout
4. ⏭️ Test the chat interface

## Support Resources

- 📖 [Full Setup Guide](./ENV_SETUP.md)
- 🔧 [Configuration Module](./config.ts)
- ✅ [Verification Script](./verify-config.ts)
- 📚 [OpenAI Documentation](https://platform.openai.com/docs)
