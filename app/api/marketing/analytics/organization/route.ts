/**
 * Organization Analytics API Endpoint
 * GET /api/marketing/analytics/organization - Get organization-wide analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    
    // Check if authentication failed (returned a NextResponse)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check if force refresh is requested
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Calculate organization analytics with role-based access
    const organizationAnalytics = await AnalyticsService.calculateOrganizationAnalytics(
      user.role, 
      user.teamId,
      forceRefresh
    );

    return NextResponse.json({
      success: true,
      data: organizationAnalytics
    });

  } catch (error) {
    console.error('Error fetching organization analytics:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      // More detailed error response
      const errorDetails = {
        error: 'Failed to fetch organization analytics',
        details: error.message,
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(errorDetails, { status: 500 });
    }

    const errorDetails = {
      error: 'Internal server error',
      details: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}