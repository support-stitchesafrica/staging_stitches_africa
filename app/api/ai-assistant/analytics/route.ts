/**
 * AI Assistant Analytics API
 * 
 * Provides analytics data for the AI shopping assistant
 * Tracks usage metrics, conversions, and performance
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalyticsSummary,
  getRecentSessions,
  getUserSessions,
  getSessionDetails,
  getProductConversionRates,
} from '@/services/aiAssistantAnalytics';

/**
 * GET /api/ai-assistant/analytics
 * Get analytics summary or specific analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Parse dates if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    switch (type) {
      case 'summary':
        // Get overall analytics summary
        const summary = await getAnalyticsSummary(start, end);
        return NextResponse.json({
          success: true,
          data: summary,
        });

      case 'recent-sessions':
        // Get recent sessions
        const recentSessions = await getRecentSessions(limit);
        return NextResponse.json({
          success: true,
          data: recentSessions,
        });

      case 'user-sessions':
        // Get sessions for a specific user
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for user-sessions type' },
            { status: 400 }
          );
        }
        const userSessions = await getUserSessions(userId, limit);
        return NextResponse.json({
          success: true,
          data: userSessions,
        });

      case 'session-details':
        // Get details for a specific session
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required for session-details type' },
            { status: 400 }
          );
        }
        const sessionDetails = await getSessionDetails(sessionId);
        if (!sessionDetails) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: sessionDetails,
        });

      case 'product-conversion-rates':
        // Get conversion rates by product
        const conversionRates = await getProductConversionRates();
        return NextResponse.json({
          success: true,
          data: conversionRates,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI Analytics API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analytics data'
      },
      { status: 500 }
    );
  }
}
