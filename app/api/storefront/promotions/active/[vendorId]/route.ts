import { NextRequest, NextResponse } from 'next/server';
import { storefrontPromotionService } from '@/lib/storefront/promotion-integration';

/**
 * GET /api/storefront/promotions/active/[vendorId]
 * Get active promotions for a specific vendor
 * 
 * Path parameters:
 * - vendorId: string - The vendor ID to get promotions for
 * 
 * Query parameters:
 * - productIds: string[] (optional) - Filter promotions by specific product IDs (comma-separated)
 * - includeExpired: boolean (optional) - Include expired promotions in results
 * - currentDate: string (optional) - ISO date string to use as current date for testing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = params.vendorId;
    const productIdsParam = searchParams.get('productIds');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const currentDateParam = searchParams.get('currentDate');

    // Validate vendorId
    if (!vendorId || vendorId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Invalid vendorId parameter',
          message: 'vendorId cannot be empty'
        },
        { status: 400 }
      );
    }

    // Parse optional parameters
    const productIds = productIdsParam ? productIdsParam.split(',').filter(id => id.trim()) : undefined;
    const currentDate = currentDateParam ? new Date(currentDateParam) : undefined;

    // Validate currentDate if provided
    if (currentDateParam && (!currentDate || isNaN(currentDate.getTime()))) {
      return NextResponse.json(
        { 
          error: 'Invalid currentDate parameter',
          message: 'currentDate must be a valid ISO date string'
        },
        { status: 400 }
      );
    }

    // Get active promotions
    const promotions = await storefrontPromotionService.getActivePromotionsForVendor(vendorId, {
      currentDate,
      includeExpired,
      productIds
    });

    // Add expiry information for each promotion
    const promotionsWithExpiry = await Promise.all(
      promotions.map(async (promotion) => {
        const expiryInfo = await storefrontPromotionService.getPromotionExpiryInfo(
          promotion.id,
          vendorId,
          currentDate
        );

        return {
          ...promotion,
          expiryInfo: {
            isExpiring: expiryInfo.isExpiring,
            timeRemaining: expiryInfo.timeRemaining,
            hasExpired: expiryInfo.hasExpired
          }
        };
      })
    );

    // Group promotions by type for easier consumption
    const promotionsByType = {
      bogo: promotionsWithExpiry.filter(p => p.type === 'bogo'),
      discount: promotionsWithExpiry.filter(p => p.type === 'discount'),
      bundle: promotionsWithExpiry.filter(p => p.type === 'bundle')
    };

    // Calculate summary statistics
    const summary = {
      totalCount: promotionsWithExpiry.length,
      activeCount: promotionsWithExpiry.filter(p => p.isActive).length,
      expiringCount: promotionsWithExpiry.filter(p => p.expiryInfo.isExpiring).length,
      expiredCount: promotionsWithExpiry.filter(p => p.expiryInfo.hasExpired).length,
      byType: {
        bogo: promotionsByType.bogo.length,
        discount: promotionsByType.discount.length,
        bundle: promotionsByType.bundle.length
      }
    };

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        promotions: promotionsWithExpiry,
        promotionsByType,
        summary,
        filters: {
          productIds,
          includeExpired,
          currentDate: currentDate?.toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error in GET /api/storefront/promotions/active/${params.vendorId}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve active promotions',
        details: error instanceof Error ? error.message : 'Unknown error',
        vendorId: params.vendorId
      },
      { status: 500 }
    );
  }
}