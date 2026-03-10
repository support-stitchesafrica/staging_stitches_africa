import { NextRequest, NextResponse } from 'next/server';
import { comparisonService } from '@/lib/vendor/comparison-service';
import { DateRange } from '@/types/vendor-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, dateRange, type } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    if (!dateRange || !dateRange.start || !dateRange.end) {
      return NextResponse.json(
        { error: 'Valid date range is required' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const parsedDateRange: DateRange = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
      preset: dateRange.preset || 'custom'
    };

    if (type === 'period') {
      const result = await comparisonService.comparePeriods(vendorId, parsedDateRange);
      return NextResponse.json(result);
    } else if (type === 'yoy') {
      const result = await comparisonService.compareYearOverYear(vendorId, parsedDateRange);
      return NextResponse.json(result);
    } else if (type === 'both') {
      const [periodComparison, yearOverYear] = await Promise.all([
        comparisonService.comparePeriods(vendorId, parsedDateRange),
        comparisonService.compareYearOverYear(vendorId, parsedDateRange)
      ]);
      return NextResponse.json({
        periodComparison,
        yearOverYear
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid comparison type. Use "period", "yoy", or "both"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in comparison API:', error);
    
    if (error.code === 'permission-denied') {
      return NextResponse.json(
        { error: 'Permission denied. Unable to access analytics data.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}
