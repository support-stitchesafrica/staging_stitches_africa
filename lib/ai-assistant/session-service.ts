/**
 * Chat Session Management Service
 * 
 * Handles:
 * - Create/restore chat sessions
 * - Save message history to Firestore
 * - Context persistence (preferences, viewed products, cart items)
 * - Session expiry (24 hours from last message)
 * 
 * Requirements: 1.5, 7.1-7.5
 * 
 * Note: This service uses Firebase Admin SDK for server-side operations
 * to bypass security rules when called from API routes.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Session expires 24 hours after last message
const SESSION_EXPIRY_HOURS = 24;

export interface ChatSession {
  sessionId: string;
  userId?: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  context: {
    preferences?: Record<string, any>;
    budget?: number;
    viewedProducts?: string[];
    addedToCart?: string[];
  };
  expiresAt: Date;
}

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    productIds?: string[];
    vendorIds?: string[];
    actions?: string[];
  };
}

export class SessionServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'SessionServiceError';
  }
}

/**
 * Create a new chat session
 * Requirement 7.4: Start new session
 */
export async function createSession(userId?: string): Promise<ChatSession> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    const sessionData = {
      userId: userId || null,
      startedAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: 0,
      context: {
        preferences: {},
        viewedProducts: [],
        addedToCart: [],
      },
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    const sessionRef = await adminDb.collection('chatSessions').add(sessionData);

    return {
      sessionId: sessionRef.id,
      userId,
      startedAt: now,
      lastMessageAt: now,
      messageCount: 0,
      context: {
        preferences: {},
        viewedProducts: [],
        addedToCart: [],
      },
      expiresAt,
    };
  } catch (error) {
    console.error('[Session Service] Error creating session:', error);
    throw new SessionServiceError(
      'Failed to create chat session',
      'CREATE_SESSION_FAILED'
    );
  }
}

/**
 * Get an existing session by ID
 * Requirement 7.1: Restore previous conversation
 */
export async function getSession(sessionId: string): Promise<ChatSession | null> {
  try {
    const sessionRef = adminDb.collection('chatSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return null;
    }

    const data = sessionSnap.data();
    if (!data) {
      return null;
    }

    const session: ChatSession = {
      sessionId: sessionSnap.id,
      userId: data.userId,
      startedAt: data.startedAt?.toDate() || new Date(),
      lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
      messageCount: data.messageCount || 0,
      context: data.context || {
        preferences: {},
        viewedProducts: [],
        addedToCart: [],
      },
      expiresAt: data.expiresAt?.toDate() || new Date(),
    };

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Session expired, delete it
      await deleteSession(sessionId);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[Session Service] Error getting session:', error);
    throw new SessionServiceError(
      'Failed to retrieve chat session',
      'GET_SESSION_FAILED'
    );
  }
}

/**
 * Update session context (preferences, budget, etc.)
 * Requirement 7.3: Store preferences for the session
 */
export async function updateSessionContext(
  sessionId: string,
  contextUpdates: Partial<ChatSession['context']>
): Promise<void> {
  try {
    const sessionRef = adminDb.collection('chatSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      throw new SessionServiceError('Session not found', 'SESSION_NOT_FOUND');
    }

    const data = sessionSnap.data();
    const currentContext = data?.context || {};
    const updatedContext = {
      ...currentContext,
      ...contextUpdates,
    };

    await sessionRef.update({
      context: updatedContext,
      lastMessageAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('[Session Service] Error updating context:', error);
    throw new SessionServiceError(
      'Failed to update session context',
      'UPDATE_CONTEXT_FAILED'
    );
  }
}

/**
 * Save a message to the session
 * Requirement 1.5: Save conversation history
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: ChatMessage['metadata']
): Promise<ChatMessage> {
  try {
    // First verify session exists
    const session = await getSession(sessionId);
    if (!session) {
      // Session not found or expired - this is a critical error
      // Don't create a new session here as it would lose context
      // Instead, let the caller handle it
      throw new SessionServiceError('Session not found or expired', 'SESSION_NOT_FOUND');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Helper function to remove undefined values from object
    const removeUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) return {};
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    // Clean metadata to remove undefined values
    const cleanedMetadata = metadata ? removeUndefined(metadata) : {};

    // Save message
    const messageData = {
      sessionId,
      role,
      content,
      timestamp: FieldValue.serverTimestamp(),
      metadata: cleanedMetadata,
    };

    const messageRef = await adminDb.collection('chatMessages').add(messageData);

    // Update session
    const sessionRef = adminDb.collection('chatSessions').doc(sessionId);
    await sessionRef.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: session.messageCount + 1,
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    return {
      messageId: messageRef.id,
      sessionId,
      role,
      content,
      timestamp: now,
      metadata,
    };
  } catch (error) {
    console.error('[Session Service] Error saving message:', error);
    throw new SessionServiceError(
      'Failed to save message',
      'SAVE_MESSAGE_FAILED'
    );
  }
}

/**
 * Get message history for a session
 * Requirement 7.2: Reference previous messages
 */
export async function getSessionHistory(
  sessionId: string,
  maxMessages: number = 50
): Promise<ChatMessage[]> {
  try {
    const messagesRef = adminDb.collection('chatMessages');
    const querySnapshot = await messagesRef
      .where('sessionId', '==', sessionId)
      .orderBy('timestamp', 'asc')
      .limit(maxMessages)
      .get();

    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        messageId: doc.id,
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata,
      });
    });

    return messages;
  } catch (error) {
    console.error('[Session Service] Error getting history:', error);
    throw new SessionServiceError(
      'Failed to retrieve message history',
      'GET_HISTORY_FAILED'
    );
  }
}

/**
 * Delete a session and all its messages
 * Requirement 17.3: Delete chat history immediately
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    // Delete all messages for this session
    const messagesRef = adminDb.collection('chatMessages');
    const querySnapshot = await messagesRef
      .where('sessionId', '==', sessionId)
      .get();

    const deletePromises = querySnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    // Delete the session
    const sessionRef = adminDb.collection('chatSessions').doc(sessionId);
    await sessionRef.delete();
  } catch (error) {
    console.error('[Session Service] Error deleting session:', error);
    throw new SessionServiceError(
      'Failed to delete session',
      'DELETE_SESSION_FAILED'
    );
  }
}

/**
 * Get or create a session for a user
 * Requirement 7.1: Restore previous conversation within 24 hours
 * Requirement 7.4: Offer to start fresh or continue
 */
export async function getOrCreateSession(userId?: string): Promise<{
  session: ChatSession;
  isNew: boolean;
}> {
  try {
    // Validate userId if provided
    if (userId !== undefined && (typeof userId !== 'string' || userId.trim() === '')) {
      throw new SessionServiceError(
        'Invalid userId provided',
        'INVALID_USER_ID'
      );
    }

    // Try to find an existing active session for this user
    if (userId) {
      const sessionsRef = adminDb.collection('chatSessions');
      const querySnapshot = await sessionsRef
        .where('userId', '==', userId)
        .orderBy('lastMessageAt', 'desc')
        .limit(1)
        .get();
      
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const data = sessionDoc.data();
        const expiresAt = data.expiresAt?.toDate() || new Date();

        // Check if session is still valid
        if (expiresAt > new Date()) {
          const session: ChatSession = {
            sessionId: sessionDoc.id,
            userId: data.userId,
            startedAt: data.startedAt?.toDate() || new Date(),
            lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
            messageCount: data.messageCount || 0,
            context: data.context || {
              preferences: {},
              viewedProducts: [],
              addedToCart: [],
            },
            expiresAt,
          };

          return { session, isNew: false };
        }
      }
    }

    // No valid session found, create a new one
    const session = await createSession(userId);
    return { session, isNew: true };
  } catch (error) {
    console.error('[Session Service] Error in getOrCreateSession:', error);
    // Re-throw SessionServiceError as-is, but wrap other errors
    if (error instanceof SessionServiceError) {
      throw error;
    } else {
      throw new SessionServiceError(
        `Failed to get or create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_OR_CREATE_FAILED'
      );
    }
  }
}

/**
 * Clean up expired sessions
 * Should be run periodically (e.g., via cron job)
 * Requirement 17.2: Automatically delete after 30 days
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    const sessionsRef = adminDb.collection('chatSessions');
    const querySnapshot = await sessionsRef
      .where('expiresAt', '<', Timestamp.fromDate(now))
      .get();

    let deletedCount = 0;

    for (const sessionDoc of querySnapshot.docs) {
      await deleteSession(sessionDoc.id);
      deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error('[Session Service] Error cleaning up sessions:', error);
    throw new SessionServiceError(
      'Failed to cleanup expired sessions',
      'CLEANUP_FAILED'
    );
  }
}

/**
 * Summarize long conversations
 * Requirement 7.5: Summarize and start new context window when exceeding 50 messages
 */
export async function shouldSummarizeSession(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  return session ? session.messageCount >= 50 : false;
}

/**
 * Add product to viewed products list
 * Tracks products the user has viewed in this session
 */
export async function addViewedProduct(
  sessionId: string,
  productId: string
): Promise<void> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      throw new SessionServiceError('Session not found', 'SESSION_NOT_FOUND');
    }

    const viewedProducts = session.context.viewedProducts || [];
    if (!viewedProducts.includes(productId)) {
      viewedProducts.push(productId);
      await updateSessionContext(sessionId, { viewedProducts });
    }
  } catch (error) {
    console.error('[Session Service] Error adding viewed product:', error);
    throw new SessionServiceError(
      'Failed to add viewed product',
      'ADD_VIEWED_PRODUCT_FAILED'
    );
  }
}

/**
 * Add product to cart tracking
 * Tracks products added to cart in this session
 */
export async function addToCartTracking(
  sessionId: string,
  productId: string
): Promise<void> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      throw new SessionServiceError('Session not found', 'SESSION_NOT_FOUND');
    }

    const addedToCart = session.context.addedToCart || [];
    if (!addedToCart.includes(productId)) {
      addedToCart.push(productId);
      await updateSessionContext(sessionId, { addedToCart });
    }
  } catch (error) {
    console.error('[Session Service] Error adding to cart tracking:', error);
    throw new SessionServiceError(
      'Failed to add to cart tracking',
      'ADD_TO_CART_TRACKING_FAILED'
    );
  }
}
