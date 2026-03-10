import { NextRequest, NextResponse } from 'next/server';
import { storefrontPromotionService } from '@/lib/storefront/promotion-integration';

/**
 * GET /api/storefront/promotions/active
 * Get active promotions for a vendor's storefront
 * 
 * Query parameters:
 * - vendorId: string (required) - The vendor ID to get promotions for
 * - productIds: string[] (optional) - Filter promotions by specific product IDs
 * - includeExpired: boolean (optional) - Include expired promotions in results
 * - currentDate: string (optional) - ISO date string to use as current date for testing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const productIdsParam = searchParams.get('productIds');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const currentDateParam = searchParams.get('currentDate');

    // Validate required parameters
    if (!vendorId) {
      return NextResponse.json(
        { 
          error: 'Missing required parameter: vendorId',
          message: 'Please provide a vendorId to get promotions for'
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

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        promotions: promotionsWithExpiry,
        totalCount: promotionsWithExpiry.length,
        activeCount: promotionsWithExpiry.filter(p => p.isActive).length,
        expiringCount: promotionsWithExpiry.filter(p => p.expiryInfo.isExpiring).length,
        filters: {
          productIds,
          includeExpired,
          currentDate: currentDate?.toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in GET /api/storefront/promotions/active:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve active promotions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/storefront/promotions/active/[vendorId]
 * Alternative endpoint with vendorId as path parameter
 */
export async function GET_BY_VENDOR_ID(
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

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        promotions: promotionsWithExpiry,
        totalCount: promotionsWithExpiry.length,
        activeCount: promotionsWithExpiry.filter(p => p.isActive).length,
        expiringCount: promotionsWithExpiry.filter(p => p.expiryInfo.isExpiring).length,
        filters: {
          productIds,
          includeExpired,
          currentDate: currentDate?.toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in GET /api/storefront/promotions/active/[vendorId]:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve active promotions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}