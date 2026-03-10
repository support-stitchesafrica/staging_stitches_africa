import { NextRequest, NextResponse } from 'next/server';
import { comparisonService } from '@/lib/vendor/comparison-service';
import { DateRange } from '@/types/vendor-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, dateRange, type } = body;

    if (!vendorId || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const range: DateRange = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
      preset: dateRange.preset
    };

    let result;

    switch (type) {
      case 'period':
        result = await comparisonService.comparePeriods(vendorId, range);
        break;
      case 'yoy':
        result = await comparisonService.compareYearOverYear(vendorId, range);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid comparison type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Comparison API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch comparison data' 
      },
      { status: 500 }
    );
  }
}
