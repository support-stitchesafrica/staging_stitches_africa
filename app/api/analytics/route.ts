/**
 * Analytics API endpoint for collecting performance and usage data
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();
    
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events must be an array' },
        { status: 400 }
      );
    }

    // In production, you might want to:
    // 1. Store events in a database
    // 2. Send to external analytics services
    // 3. Process for real-time dashboards
    
    // For now, just log performance metrics
    const performanceEvents = events.filter(e => e.category === 'performance');
    if (performanceEvents.length > 0) {
      console.log('Performance metrics:', performanceEvents);
    }

    // Log errors for monitoring
    const errorEvents = events.filter(e => e.category === 'errors');
    if (errorEvents.length > 0) {
      console.error('Client errors:', errorEvents);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    );
  }
}