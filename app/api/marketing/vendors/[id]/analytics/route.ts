/**
 * Vendor Analytics API Endpoint
 * GET /api/marketing/vendors/[id]/analytics - Get detailed vendor insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const vendorId = params.id;

    // All authenticated users can view vendor analytics
    // But team_members can only view their assigned vendors
    if (user.role === 'team_member') {
      // TODO: Add check to verify vendor is assigned to this user
      // For now, allow access
    }

    // Generate vendor insights
    const vendorInsights = await AnalyticsService.generateVendorInsights(vendorId);

    return NextResponse.json({
      success: true,
      data: vendorInsights
    });

  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Vendor not found') {
        return NextResponse.json(
          { error: 'Vendor not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}