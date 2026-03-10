# AI Shopping Assistant Analytics

This document describes the analytics integration for the AI Shopping Assistant feature.

## Overview

The analytics system tracks three main types of data:
1. **Conversations** - Session-level metrics about AI assistant usage
2. **Interactions** - Individual user interactions (messages, product views, etc.)
3. **Conversions** - Cart additions and purchases attributed to the AI assistant

## Data Collections

### ai_assistant_sessions
Tracks overall session metrics for each conversation.

**Fields:**
- `sessionId` (string) - Unique session identifier
- `userId` (string, optional) - User ID if logged in
- `startedAt` (timestamp) - When the session started
- `lastMessageAt` (timestamp) - Last message timestamp
- `messageCount` (number) - Total messages in session
- `userMessageCount` (number) - Messages from user
- `assistantMessageCount` (number) - Messages from assistant
- `productsShown` (array) - Product IDs shown in session
- `vendorsShown` (array) - Vendor IDs shown in session
- `productsAddedToCart` (array) - Products added to cart
- `conversions` (number) - Number of conversions
- `totalConversionValue` (number) - Total value of conversions
- `sessionDuration` (number) - Duration in seconds
- `isActive` (boolean) - Whether session is still active

### ai_assistant_interactions
Tracks individual interactions within sessions.

**Fields:**
- `sessionId` (string) - Associated session ID
- `userId` (string, optional) - User ID if logged in
- `timestamp` (timestamp) - When interaction occurred
- `type` (string) - Type of interaction: 'message', 'product_view', 'vendor_view', 'add_to_cart', 'try_on', 'view_details'
- `userMessage` (string, optional) - User's message
- `assistantResponse` (string, optional) - Assistant's response
- `productIds` (array) - Products involved in interaction
- `vendorIds` (array) - Vendors involved in interaction
- `metadata` (object) - Additional context data

### ai_assistant_conversions
Tracks conversions (cart additions, purchases).

**Fields:**
- `sessionId` (string) - Associated session ID
- `userId` (string, optional) - User ID if logged in
- `timestamp` (timestamp) - When conversion occurred
- `type` (string) - Type: 'add_to_cart', 'purchase', 'wishlist_add'
- `productId` (string) - Product that was converted
- `productTitle` (string, optional) - Product name
- `productPrice` (number) - Product price
- `vendorId` (string, optional) - Vendor ID
- `vendorName` (string, optional) - Vendor name

## API Endpoints

### GET /api/ai-assistant/analytics

Query parameters:
- `type` - Type of analytics to retrieve:
  - `summary` - Overall analytics summary (default)
  - `recent-sessions` - Recent conversation sessions
  - `user-sessions` - Sessions for a specific user
  - `session-details` - Details for a specific session
  - `product-conversion-rates` - Conversion rates by product
- `userId` - Filter by user ID (required for `user-sessions`)
- `sessionId` - Session ID (required for `session-details`)
- `startDate` - Start date for filtering (ISO 8601 format)
- `endDate` - End date for filtering (ISO 8601 format)
- `limit` - Number of results to return (default: 10)

**Example requests:**

```typescript
// Get overall summary
const response = await fetch('/api/ai-assistant/analytics?type=summary');

// Get summary for date range
const response = await fetch(
  '/api/ai-assistant/analytics?type=summary&startDate=2024-01-01&endDate=2024-01-31'
);

// Get recent sessions
const response = await fetch('/api/ai-assistant/analytics?type=recent-sessions&limit=20');

// Get user's sessions
const response = await fetch(
  '/api/ai-assistant/analytics?type=user-sessions&userId=user123'
);

// Get session details
const response = await fetch(
  '/api/ai-assistant/analytics?type=session-details&sessionId=session123'
);

// Get product conversion rates
const response = await fetch('/api/ai-assistant/analytics?type=product-conversion-rates');
```

## Service Functions

### trackConversation
Track a conversation message.

```typescript
import { trackConversation } from '@/services/aiAssistantAnalytics';

await trackConversation(
  sessionId,
  userId,
  messageCount,
  isUserMessage
);
```

### trackInteraction
Track a user interaction.

```typescript
import { trackInteraction } from '@/services/aiAssistantAnalytics';

await trackInteraction(sessionId, 'message', {
  userId,
  userMessage: 'Show me dresses',
  assistantResponse: 'Here are some dresses...',
  productIds: ['prod1', 'prod2'],
  vendorIds: ['vendor1'],
  metadata: { isNewSession: true }
});
```

### trackConversion
Track a conversion (cart addition, purchase).

```typescript
import { trackConversion } from '@/services/aiAssistantAnalytics';

await trackConversion(sessionId, 'add_to_cart', productId, {
  userId,
  productTitle: 'Blue Dress',
  productPrice: 15000,
  vendorId: 'vendor123',
  vendorName: 'Fashion House'
});
```

### getAnalyticsSummary
Get overall analytics summary.

```typescript
import { getAnalyticsSummary } from '@/services/aiAssistantAnalytics';

const summary = await getAnalyticsSummary(startDate, endDate);
// Returns: AIAnalyticsSummary
```

### getRecentSessions
Get recent conversation sessions.

```typescript
import { getRecentSessions } from '@/services/aiAssistantAnalytics';

const sessions = await getRecentSessions(10);
// Returns: AISessionAnalytics[]
```

### getUserSessions
Get sessions for a specific user.

```typescript
import { getUserSessions } from '@/services/aiAssistantAnalytics';

const sessions = await getUserSessions(userId, 10);
// Returns: AISessionAnalytics[]
```

### getSessionDetails
Get details for a specific session.

```typescript
import { getSessionDetails } from '@/services/aiAssistantAnalytics';

const session = await getSessionDetails(sessionId);
// Returns: AISessionAnalytics | null
```

### getProductConversionRates
Get conversion rates by product.

```typescript
import { getProductConversionRates } from '@/services/aiAssistantAnalytics';

const rates = await getProductConversionRates();
// Returns: Array<{ productId, shown, converted, conversionRate }>
```

### endSession
Mark a session as ended.

```typescript
import { endSession } from '@/services/aiAssistantAnalytics';

await endSession(sessionId);
```

## Analytics Dashboard Component

A pre-built dashboard component is available for displaying analytics:

```typescript
import { AnalyticsDashboard } from '@/components/ai-assistant/AnalyticsDashboard';

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1>AI Assistant Analytics</h1>
      <AnalyticsDashboard />
    </div>
  );
}
```

## Key Metrics

The analytics system tracks these key metrics:

1. **Engagement Metrics**
   - Total sessions
   - Total interactions
   - Average messages per session
   - Average session duration

2. **Conversion Metrics**
   - Total conversions
   - Conversion rate (conversions / sessions)
   - Total revenue from AI-assisted sales
   - Conversion rate by product

3. **Product Performance**
   - Top products shown
   - Top products added to cart
   - Product conversion rates

4. **Vendor Performance**
   - Top vendors shown
   - Top vendors by conversions
   - Vendor attribution

## Firestore Indexes

The following Firestore indexes are required (already added to firestore.indexes.json):

```json
{
  "collectionGroup": "ai_assistant_sessions",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "ai_assistant_interactions",
  "fields": [
    { "fieldPath": "sessionId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "ai_assistant_conversions",
  "fields": [
    { "fieldPath": "sessionId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

## Integration Points

Analytics tracking is automatically integrated at these points:

1. **Chat API** (`/api/ai-assistant/chat`)
   - Tracks conversations (user and assistant messages)
   - Tracks interactions with products/vendors shown

2. **Cart API** (`/api/ai-assistant/cart`)
   - Tracks conversions when products are added to cart
   - Includes product and vendor attribution

3. **Chat Widget** (`components/ai-assistant/ChatWidget.tsx`)
   - Passes session ID for conversion tracking
   - Tracks user interactions

## Privacy Considerations

- User IDs are optional and only tracked for logged-in users
- Chat history is stored separately from analytics
- Analytics data can be aggregated without exposing individual conversations
- Session data expires based on chat session expiry (24 hours)

## Performance Considerations

- Analytics writes are non-blocking (fire-and-forget)
- Failed analytics writes don't affect user experience
- Queries use Firestore indexes for optimal performance
- Summary calculations are done on-demand (consider caching for high traffic)

## Future Enhancements

Potential improvements to the analytics system:

1. Real-time analytics dashboard with live updates
2. A/B testing integration for AI prompt variations
3. Sentiment analysis of user messages
4. Product recommendation effectiveness tracking
5. Vendor performance benchmarking
6. Export functionality for analytics data
7. Automated reports and alerts
8. Integration with Google Analytics or other platforms
