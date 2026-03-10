/**
 * AI Assistant Session API
 * 
 * Manages chat sessions for persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSession,
  getSessionHistory,
  deleteSession,
} from '@/lib/ai-assistant/session-service';

/**
 * GET /api/ai-assistant/session
 * Get session and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session history
    const history = await getSessionHistory(sessionId, 50);

    return NextResponse.json({
      session: { sessionId },
      history,
    });
  } catch (error) {
    console.error('[AI Session API] Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-assistant/session
 * Create new session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Ensure userId is a string or undefined (not null)
    const validUserId = userId && typeof userId === 'string' ? userId : undefined;

    const { session, isNew } = await getOrCreateSession(validUserId);

    return NextResponse.json({
      session,
      isNew,
    });
  } catch (error) {
    console.error('[AI Session API] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-assistant/session
 * Delete session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await deleteSession(sessionId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[AI Session API] Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}