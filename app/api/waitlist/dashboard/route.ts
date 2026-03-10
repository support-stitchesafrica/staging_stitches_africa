/**
 * Waitlist Dashboard API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';

/**
 * GET /api/waitlist/dashboard - Get dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const dashboardData = await WaitlistService.getDashboardData();

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data'
      },
      { status: 500 }
    );
  }
}