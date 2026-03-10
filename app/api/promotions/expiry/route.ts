import { NextRequest, NextResponse } from 'next/server';
import { promotionExpiryService } from '../../../../lib/storefront/promotion-expiry-service';

/**
 * GET /api/promotions/expiry
 * Check for expired promotions and get expiry information
 * 
 * Query parameters:
 * - action: 'check' | 'status' | 'expiring' (optional) - Action to perform
 * - hours: number (optional) - Hours to look ahead for expiring promotions (default: 24)
 * - currentDate: string (optional) - ISO date string for date-based checking
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';
    const hours = parseInt(searchParams.get('hours') || '24');
    const currentDateString = searchParams.get('currentDate');
    const currentDate = currentDateString ? new Date(currentDateString) : new Date();

    switch (action) {
      case 'status':
        // Get service status
        const status = promotionExpiryService.getServiceStatus();
        return NextResponse.json({
          success: true,
          status,
          timestamp: currentDate.toISOString()
        });

      case 'expiring':
        // Get promotions expiring within specified hours
        const expiringResult = await promotionExpiryService.getPromotionsExpiringWithin(
          hours,
          currentDate
        );
        
        return NextResponse.json({
          success: true,
          ...expiringResult,
          timestamp: currentDate.toISOString(),
          metadata: {
            hoursAhead: hours
          }
        });

      case 'check':
      default:
        // Check for expired promotions
        const result = await promotionExpiryService.checkAndHandleExpiredPromotions(currentDate);
        
        return NextResponse.json({
          success: true,
          ...result,
          timestamp: currentDate.toISOString(),
          metadata: {
            automaticCleanup: true
          }
        });
    }

  } catch (error) {
    console.error('Error in promotion expiry endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process promotion expiry request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions/expiry
 * Force cleanup of expired promotions or check specific promotion
 * 
 * Request body:
 * - action: 'cleanup' | 'check-promotion' (required)
 * - promotionId?: string (required for 'check-promotion')
 * - currentDate?: string (optional) - ISO date string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, promotionId, currentDate: dateString } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    const currentDate = dateString ? new Date(dateString) : new Date();

    switch (action) {
      case 'cleanup':
        // Force cleanup of all expired promotions
        const cleanupResult = await promotionExpiryService.forceExpiryCleanup(currentDate);
        
        return NextResponse.json({
          success: true,
          ...cleanupResult,
          timestamp: currentDate.toISOString(),
          metadata: {
            forceCleanup: true
          }
        });

      case 'check-promotion':
        if (!promotionId) {
          return NextResponse.json(
            { error: 'promotionId is required for check-promotion action' },
            { status: 400 }
          );
        }

        // Check specific promotion expiry
        const promotionResult = await promotionExpiryService.checkPromotionExpiry(
          promotionId,
          currentDate
        );
        
        return NextResponse.json({
          success: true,
          promotionId,
          ...promotionResult,
          timestamp: currentDate.toISOString(),
          metadata: {
            specificPromotionCheck: true
          }
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in promotion expiry POST endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process promotion expiry request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/promotions/expiry
 * Start or stop automatic promotion expiry monitoring
 * 
 * Request body:
 * - action: 'start' | 'stop' (required)
 * - intervalMs?: number (optional) - Monitoring interval in milliseconds (default: 60000)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, intervalMs = 60000 } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        promotionExpiryService.startExpiryMonitoring(intervalMs);
        
        return NextResponse.json({
          success: true,
          message: 'Promotion expiry monitoring started',
          intervalMs,
          status: promotionExpiryService.getServiceStatus(),
          timestamp: new Date().toISOString()
        });

      case 'stop':
        promotionExpiryService.stopExpiryMonitoring();
        
        return NextResponse.json({
          success: true,
          message: 'Promotion expiry monitoring stopped',
          status: promotionExpiryService.getServiceStatus(),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in promotion expiry PUT endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to control promotion expiry monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}