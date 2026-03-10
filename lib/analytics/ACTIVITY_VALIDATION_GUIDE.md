# Activity Validation Guide

## Quick Start

The activity validation system is automatically integrated into the `ActivityTracker`. No additional configuration is needed for basic usage.

```typescript
import { getActivityTracker } from '@/lib/analytics/activity-tracker';

const tracker = getActivityTracker();

// Activities are automatically validated, filtered, and cleaned
await tracker.trackProductView(productId, vendorId, userId);
```

## Manual Validation

If you need to validate activities manually:

```typescript
import { getActivityValidator } from '@/lib/analytics/activity-validator';

const validator = getActivityValidator();

// Validate an activity
const result = validator.validateActivity(activity);

if (result.isValid) {
  // Use the cleaned activity
  const cleanedActivity = result.cleanedActivity;
} else {
  // Handle validation errors
  console.error('Validation errors:', result.errors);
  console.warn('Validation warnings:', result.warnings);
}
```

## Bot Detection

```typescript
// Check if an activity is from a bot
const botDetection = validator.detectBot(activity);

if (botDetection.isBot) {
  console.log('Bot detected with confidence:', botDetection.confidence);
  console.log('Reasons:', botDetection.reasons);
}
```

## Duplicate Detection

```typescript
// Check if an activity is a duplicate
const duplicateCheck = validator.checkDuplicate(activity);

if (duplicateCheck.isDuplicate) {
  console.log('Duplicate of activity:', duplicateCheck.duplicateId);
  console.log('Time since last:', duplicateCheck.timeSinceLastActivity, 'ms');
}
```

## Validation Rules

### Required Fields

All activities must have:
- `id`: Non-empty string
- `type`: One of: view, add_to_cart, remove_from_cart, purchase, search
- `userId`: Non-empty string
- `sessionId`: Non-empty string
- `vendorId`: Non-empty string (except for search activities)
- `productId`: Non-empty string (except for search activities)
- `timestamp`: Valid Firestore Timestamp (not in future, not too old)
- `metadata`: Object with required fields

### Metadata Requirements

All activities must have metadata with:
- `deviceType`: One of: mobile, tablet, desktop
- `userAgent`: Non-empty string

Additional requirements by activity type:
- **add_to_cart / purchase**: `price` (number), `quantity` (integer)
- **search**: `searchQuery` (string)

### Validation Thresholds

```typescript
{
  minTimeBetweenActivities: 100,      // milliseconds
  maxActivitiesPerMinute: 60,         // activities
  maxSearchLength: 500,               // characters
  minSearchLength: 1,                 // characters
  maxQuantity: 1000,                  // items
  minPrice: 0,                        // USD
  maxPrice: 1000000,                  // USD
}
```

## Bot Detection Patterns

Activities are flagged as bots if they match:

### User Agent Patterns
- googlebot, bingbot, bot, crawler, spider, scraper
- curl, wget, python-requests
- java/, go-http-client, axios, okhttp
- headless, headlesschrome, phantom
- selenium, puppeteer, playwright

### Behavioral Patterns
- More than 60 activities per minute
- Missing or "unknown" user agent
- Headless browser indicators
- Missing referrer for non-direct traffic

### Confidence Scoring
- Bot pattern in user agent: +0.4
- Missing user agent: +0.2
- High activity rate: +0.3
- Headless browser: +0.5
- Missing referrer: +0.1
- **Threshold: 0.5 = bot**

## Duplicate Detection

Activities are considered duplicates if:
- Same `userId`
- Same `type`
- Same `productId` (or both are search)
- Same `sessionId`
- Within 5 seconds of previous activity

## Data Cleaning

The validator automatically:
- Trims whitespace from string fields
- Converts numeric strings to numbers
- Sets default currency to USD
- Validates and sanitizes all fields

## Error Handling

### Validation Failures
```typescript
{
  isValid: false,
  errors: [
    'Activity ID is required',
    'Price cannot be negative'
  ],
  warnings: [
    'Quantity is unusually high'
  ],
  cleanedActivity: undefined
}
```

### Bot Detection
```typescript
{
  isBot: true,
  confidence: 0.7,
  reasons: [
    'User agent contains bot pattern: googlebot',
    'Activity rate too high: 75 activities per minute'
  ]
}
```

### Duplicate Detection
```typescript
{
  isDuplicate: true,
  duplicateId: 'activity-123',
  timeSinceLastActivity: 2500 // milliseconds
}
```

## Monitoring

The validator logs events to:
1. Console (development)
2. Google Analytics (if gtag is available)
3. Error tracking service (integration ready)

### Events Tracked
- `activity_validation_failed`: Validation errors
- `bot_traffic_detected`: Bot detection
- `activity_logging_error`: Logging failures

## Testing

```typescript
import { ActivityValidator } from '@/lib/analytics/activity-validator';

describe('My Activity Tests', () => {
  let validator: ActivityValidator;

  beforeEach(() => {
    validator = new ActivityValidator();
    validator.clearCaches(); // Clear caches between tests
  });

  it('should validate activity', () => {
    const activity = createTestActivity();
    const result = validator.validateActivity(activity);
    expect(result.isValid).toBe(true);
  });
});
```

## Performance

- Validation overhead: ~1-2ms per activity
- No external API calls
- No database queries
- Memory-efficient caching
- Automatic cache cleanup

## Security

The validator protects against:
- SQL injection (pattern detection)
- XSS attacks (script tag filtering)
- Rate limiting attacks (activity rate tracking)
- Data corruption (type validation)
- Malicious input (sanitization)

## Best Practices

1. **Always use the integrated tracker** - Don't bypass validation
2. **Monitor validation failures** - Track error patterns
3. **Review bot detections** - Adjust patterns as needed
4. **Test edge cases** - Validate unusual inputs
5. **Clear caches in tests** - Prevent test interference

## Troubleshooting

### High Validation Failure Rate
- Check input data format
- Review validation rules
- Check for missing required fields

### False Positive Bot Detection
- Review user agent patterns
- Adjust confidence thresholds
- Check activity rate limits

### Duplicate Detection Issues
- Verify session management
- Check duplicate window timing
- Review activity key generation

## Configuration

To customize validation rules, modify the constants in `activity-validator.ts`:

```typescript
private static readonly SUSPICIOUS_PATTERNS = {
  maxActivitiesPerMinute: 60,  // Adjust rate limit
  maxPrice: 1000000,           // Adjust price limit
  // ... other thresholds
};
```

## Support

For issues or questions:
1. Check validation errors in console
2. Review test cases for examples
3. Check monitoring events
4. Consult the implementation summary
