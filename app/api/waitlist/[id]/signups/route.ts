/**
 * Waitlist Signups API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/waitlist/[id]/signups - Get signups for waitlist
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'csv') {
      // Export as CSV
      const csvData = await WaitlistService.exportSignups(params.id);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="waitlist-${params.id}-signups.csv"`
        }
      });
    }

    // Return JSON data
    const signups = await WaitlistService.getWaitlistSignups(params.id);

    return NextResponse.json({
      success: true,
      data: signups
    });
  } catch (error) {
    console.error('Failed to fetch waitlist signups:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch signups'
      },
      { status: 500 }
    );
  }
}