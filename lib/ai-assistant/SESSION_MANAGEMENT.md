# Chat Session Management

This document describes the chat session management implementation for the AI Shopping Assistant.

## Overview

The session management system handles:
- Creating and restoring chat sessions
- Saving message history to Firestore
- Persisting conversation context (preferences, viewed products, cart items)
- Automatic session expiry after 24 hours of inactivity
- Privacy controls (session deletion)

## Architecture

### Data Models

#### ChatSession
```typescript
interface ChatSession {
  sessionId: string;           // Unique session identifier
  userId?: string;             // Optional user ID (for authenticated users)
  startedAt: Date;            // Session creation timestamp
  lastMessageAt: Date;        // Last activity timestamp
  messageCount: number;       // Total messages in session
  context: {
    preferences?: Record<string, any>;  // User preferences
    budget?: number;                    // Shopping budget
    viewedProducts?: string[];          // Product IDs viewed
    addedToCart?: string[];            // Product IDs added to cart
  };
  expiresAt: Date;           // Session expiry timestamp (24h from last message)
}
```

#### ChatMessage
```typescript
interface ChatMessage {
  messageId: string;         // Unique message identifier
  sessionId: string;         // Parent session ID
  role: 'user' | 'assistant' | 'system';  // Message sender
  content: string;           // Message text
  timestamp: Date;           // Message timestamp
  metadata?: {
    productIds?: string[];   // Products mentioned
    vendorIds?: string[];    // Vendors mentioned
    actions?: string[];      // Actions suggested
  };
}
```

## Core Functions

### Session Management

#### `createSession(userId?: string): Promise<ChatSession>`
Creates a new chat session.
- **Parameters**: Optional user ID for authenticated users
- **Returns**: New ChatSession object
- **Storage**: Saves to Firestore `chatSessions` collection

#### `getSession(sessionId: string): Promise<ChatSession | null>`
Retrieves an existing session by ID.
- **Parameters**: Session ID
- **Returns**: ChatSession or null if not found/expired
- **Behavior**: Automatically deletes expired sessions

#### `getOrCreateSession(userId?: string): Promise<{session: ChatSession, isNew: boolean}>`
Gets existing session or creates new one.
- **Parameters**: Optional user ID
- **Returns**: Session object and flag indicating if it's new
- **Behavior**: Finds most recent active session for user, or creates new one

#### `deleteSession(sessionId: string): Promise<void>`
Deletes a session and all its messages.
- **Parameters**: Session ID
- **Behavior**: Removes session and all associated messages from Firestore

### Message Management

#### `saveMessage(sessionId, role, content, metadata?): Promise<ChatMessage>`
Saves a message to the session.
- **Parameters**: 
  - `sessionId`: Session ID
  - `role`: 'user' | 'assistant' | 'system'
  - `content`: Message text
  - `metadata`: Optional metadata (products, vendors, actions)
- **Returns**: Saved ChatMessage object
- **Behavior**: Updates session's lastMessageAt and extends expiry

#### `getSessionHistory(sessionId, maxMessages?): Promise<ChatMessage[]>`
Retrieves message history for a session.
- **Parameters**: 
  - `sessionId`: Session ID
  - `maxMessages`: Maximum messages to return (default: 50)
- **Returns**: Array of ChatMessage objects in chronological order

### Context Management

#### `updateSessionContext(sessionId, contextUpdates): Promise<void>`
Updates session context (preferences, budget, etc.).
- **Parameters**: 
  - `sessionId`: Session ID
  - `contextUpdates`: Partial context object to merge
- **Behavior**: Merges updates with existing context

#### `addViewedProduct(sessionId, productId): Promise<void>`
Tracks a product view in the session.
- **Parameters**: Session ID and product ID
- **Behavior**: Adds to viewedProducts array (no duplicates)

#### `addToCartTracking(sessionId, productId): Promise<void>`
Tracks a cart addition in the session.
- **Parameters**: Session ID and product ID
- **Behavior**: Adds to addedToCart array (no duplicates)

### Maintenance

#### `cleanupExpiredSessions(): Promise<number>`
Removes expired sessions from Firestore.
- **Returns**: Number of sessions deleted
- **Usage**: Should be run periodically (e.g., daily cron job)

#### `shouldSummarizeSession(sessionId): Promise<boolean>`
Checks if session should be summarized (>50 messages).
- **Parameters**: Session ID
- **Returns**: Boolean indicating if summarization is needed

## API Endpoints

### POST /api/ai-assistant/chat
Send a message and get AI response.

**Request:**
```json
{
  "message": "I'm looking for a dress",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "message": "AI response text",
  "sessionId": "session-123",
  "isNewSession": false,
  "productIds": ["prod-1", "prod-2"],
  "vendorIds": ["vendor-1"],
  "actions": ["try_on:prod-1"],
  "suggestedQuestions": ["Show me more", "What sizes?"]
}
```

### GET /api/ai-assistant/session?sessionId=xxx
Get session details and history.

**Response:**
```json
{
  "session": {
    "sessionId": "session-123",
    "startedAt": "2024-01-01T00:00:00Z",
    "messageCount": 5,
    "context": {...}
  },
  "history": [
    {
      "messageId": "msg-1",
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/ai-assistant/session
Create a new session.

**Request:**
```json
{
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "session": {
    "sessionId": "session-123",
    "startedAt": "2024-01-01T00:00:00Z",
    ...
  }
}
```

### DELETE /api/ai-assistant/session?sessionId=xxx
Delete a session and all its messages.

**Response:**
```json
{
  "success": true
}
```

## Client Integration

### ChatWidget Component

The ChatWidget component automatically:
1. Loads or creates a session when opened
2. Stores session ID in localStorage
3. Restores message history from previous sessions
4. Sends messages with session context
5. Provides option to clear/delete session

**Session Storage:**
- Key: `ai-chat-session-id`
- Value: Session ID string
- Cleared when session is deleted

**Session Restoration:**
- On chat open, checks localStorage for session ID
- Attempts to restore session from Firestore
- If expired/not found, creates new session
- Loads message history if session restored

## Firestore Structure

### Collections

#### `chatSessions`
```
chatSessions/{sessionId}
  - userId: string | null
  - startedAt: timestamp
  - lastMessageAt: timestamp
  - messageCount: number
  - context: object
  - expiresAt: timestamp
```

#### `chatMessages`
```
chatMessages/{messageId}
  - sessionId: string
  - role: string
  - content: string
  - timestamp: timestamp
  - metadata: object
```

### Indexes

Required composite indexes:
1. `chatSessions`: `userId` (ASC) + `lastMessageAt` (DESC)
2. `chatSessions`: `expiresAt` (ASC)
3. `chatMessages`: `sessionId` (ASC) + `timestamp` (ASC)

### Security Rules

- **chatSessions**: Users can read/write their own sessions, anonymous users can access by sessionId
- **chatMessages**: Anyone can read messages from their session, messages are immutable after creation

## Session Lifecycle

1. **Creation**: User opens chat → Session created → ID stored in localStorage
2. **Active**: User sends messages → Messages saved → Session expiry extended
3. **Restoration**: User returns within 24h → Session restored → History loaded
4. **Expiry**: 24h of inactivity → Session marked expired → Deleted on next access
5. **Deletion**: User clears chat → Session deleted → localStorage cleared

## Privacy & Data Retention

- **Session Expiry**: 24 hours from last message (Requirement 1.5)
- **Automatic Cleanup**: Expired sessions deleted automatically (Requirement 17.2)
- **Manual Deletion**: Users can delete their chat history anytime (Requirement 17.3)
- **Data Encryption**: All data encrypted in transit and at rest (Requirement 17.1)

## Error Handling

All functions throw `SessionServiceError` with:
- `message`: User-friendly error description
- `code`: Error code for programmatic handling

Common error codes:
- `CREATE_SESSION_FAILED`: Failed to create session
- `GET_SESSION_FAILED`: Failed to retrieve session
- `SESSION_NOT_FOUND`: Session doesn't exist or expired
- `SAVE_MESSAGE_FAILED`: Failed to save message
- `UPDATE_CONTEXT_FAILED`: Failed to update context
- `DELETE_SESSION_FAILED`: Failed to delete session

## Testing

Run tests:
```bash
npm test -- lib/ai-assistant/__tests__/session-service.test.ts
```

Tests cover:
- Session data models
- Session expiry logic
- Context management
- Message history management
- Session ID storage

## Future Enhancements

1. **Session Summarization**: Automatically summarize long conversations (>50 messages)
2. **Multi-device Sync**: Sync sessions across devices for authenticated users
3. **Session Analytics**: Track session metrics (duration, message count, conversions)
4. **Context Intelligence**: Learn from session context to improve recommendations
5. **Session Export**: Allow users to export their chat history
