/**
 * AI Assistant User Preferences API
 * 
 * Tracks user preferences based on browsing behavior and AI interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface UserPreference {
  userId: string;
  productId: string;
  interactionType: 'view' | 'click' | 'chat_mention' | 'purchase' | 'wishlist';
  weight: number; // Weight based on interaction type (view=1, click=3, chat_mention=5, purchase=10, wishlist=7)
  timestamp: Date;
  sessionId?: string;
  context?: string; // Additional context about where the interaction occurred
}

// Interaction weights - higher weight means stronger preference
const INTERACTION_WEIGHTS = {
  view: 1,
  click: 3,
  chat_mention: 5,
  wishlist: 7,
  purchase: 10
} as const;

// Type for interaction types
type InteractionType = keyof typeof INTERACTION_WEIGHTS;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, interactionType, sessionId, context } = body;

    // Log incoming request for debugging
    console.log('[AI User Preferences API] Received POST request:', { userId, productId, interactionType, sessionId, context });

    if (!userId || !productId || !interactionType) {
      return NextResponse.json(
        { error: 'userId, productId, and interactionType are required' },
        { status: 400 }
      );
    }

    // Validate interaction type
    if (!(interactionType in INTERACTION_WEIGHTS)) {
      return NextResponse.json(
        { error: 'Invalid interactionType' },
        { status: 400 }
      );
    }

    // Validate userId and productId are strings
    if (typeof userId !== 'string' || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'userId and productId must be strings' },
        { status: 400 }
      );
    }

    // Validate interactionType is a valid string
    if (typeof interactionType !== 'string') {
      return NextResponse.json(
        { error: 'interactionType must be a string' },
        { status: 400 }
      );
    }

    // Create user preference record
    const userPreferenceRef = adminDb.collection('ai_user_preferences').doc();
    
    const userPreference: UserPreference = {
      userId,
      productId,
      interactionType: interactionType as InteractionType,
      weight: INTERACTION_WEIGHTS[interactionType as InteractionType],
      timestamp: new Date(),
      sessionId,
      context
    };
    
    // Log before database operation
    console.log('[AI User Preferences API] Saving preference to database');
    
    await userPreferenceRef.set(userPreference);

    console.log('[AI User Preferences API] Successfully saved preference');

    return NextResponse.json({ 
      success: true, 
      message: 'User preference tracked successfully' 
    });
  } catch (error) {
    console.error('[AI User Preferences API] Error tracking preference:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    return NextResponse.json(
      { 
        error: 'Failed to track user preference',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const daysBack = parseInt(searchParams.get('daysBack') || '30');

    console.log('[AI User Preferences API] Received GET request:', { userId, limit, daysBack });

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate userId is a string
    if (typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId must be a string' },
        { status: 400 }
      );
    }

    // Validate limit and daysBack are positive numbers
    if (isNaN(limit) || limit <= 0 || isNaN(daysBack) || daysBack <= 0) {
      return NextResponse.json(
        { error: 'limit and daysBack must be positive numbers' },
        { status: 400 }
      );
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Log before database operation
    console.log('[AI User Preferences API] Fetching preferences from database');

    // Get user preferences
    const snapshot = await adminDb
      .collection('ai_user_preferences')
      .where('userId', '==', userId)
      .where('timestamp', '>=', cutoffDate)
      .orderBy('timestamp', 'desc')
      .limit(limit * 3) // Get more to aggregate
      .get();

    // Log results
    console.log(`[AI User Preferences API] Found ${snapshot.size} preference records`);

    // Aggregate preferences by product ID with weighted scores
    const productScores = new Map<string, number>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const currentScore = productScores.get(data.productId) || 0;
      productScores.set(data.productId, currentScore + data.weight);
    });

    // Convert to array and sort by score (preference strength)
    const sortedPreferences = Array.from(productScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId, score]) => ({
        productId,
        score
      }));

    console.log(`[AI User Preferences API] Returning ${sortedPreferences.length} aggregated preferences`);

    return NextResponse.json({
      success: true,
      preferences: sortedPreferences,
      total: sortedPreferences.length
    });
  } catch (error) {
    console.error('[AI User Preferences API] Error fetching preferences:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user preferences',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}