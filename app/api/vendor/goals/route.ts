import { NextRequest, NextResponse } from 'next/server';
import { goalTrackingService } from '@/lib/vendor/goal-tracking-service';
import { PerformanceGoal } from '@/types/vendor-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const goals = activeOnly
      ? await goalTrackingService.getActiveGoals(vendorId)
      : await goalTrackingService.getVendorGoals(vendorId);

    return NextResponse.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch goals' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, metric, targetValue, deadline } = body;

    if (!vendorId || !metric || !targetValue || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goal = await goalTrackingService.createGoal(
      vendorId,
      metric as PerformanceGoal['metric'],
      parseFloat(targetValue),
      new Date(deadline)
    );

    return NextResponse.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create goal' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalId, currentValue, targetValue, deadline } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    let goal;

    if (currentValue !== undefined) {
      goal = await goalTrackingService.updateGoalProgress(goalId, parseFloat(currentValue));
    } else if (targetValue !== undefined || deadline !== undefined) {
      const updates: any = {};
      if (targetValue !== undefined) updates.targetValue = parseFloat(targetValue);
      if (deadline !== undefined) updates.deadline = new Date(deadline);
      goal = await goalTrackingService.updateGoal(goalId, updates);
    } else {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Goals PATCH error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update goal' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    await goalTrackingService.deleteGoal(goalId);

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Goals DELETE error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete goal' 
      },
      { status: 500 }
    );
  }
}
