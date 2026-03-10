import { NextRequest, NextResponse } from 'next/server';
import { storefrontPromotionService } from '../../../../lib/storefront/promotion-integration';
import { bogoMappingService } from '../../../../lib/bogo/mapping-service';
import { bogoDurationService } from '../../../../lib/bogo/duration-service';
import { promotionExpiryService } from '../../../../lib/storefront/promotion-expiry-service';
import type { BogoMapping } from '../../../../types/bogo';
import type { PromotionalConfig } from '../../../../types/storefront';

/**
 * GET /api/promotions/active
 * Returns only currently active promotions for a vendor
 * 
 * Query parameters:
 * - vendorId: string (required) - The vendor ID to get promotions for
 * - includeExpiring: boolean (optional) - Include promotions expiring within 24 hours
 * - format: 'bogo' | 'storefront' (optional) - Response format, defaults to 'storefront'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const includeExpiring = searchParams.get('includeExpiring') === 'true';
    const format = searchParams.get('format') as 'bogo' | 'storefront' || 'storefront';

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    const currentDate = new Date();

    // Automatically check and handle any expired promotions before returning active ones
    await promotionExpiryService.checkAndHandleExpiredPromotions(currentDate);

    if (format === 'bogo') {
      // Get raw BOGO mappings for this vendor
      const allMappings = await bogoMappingService.getAllMappings({
        active: true,
        createdBy: vendorId,
        orderBy: 'promotionStartDate',
        orderDirection: 'desc'
      });

      // Filter to only currently active promotions (respecting date constraints)
      const activePromotions: BogoMapping[] = [];

      for (const mapping of allMappings) {
        const status = bogoDurationService.getPromotionStatus(mapping, currentDate);
        
        // Include active promotions, and optionally include expiring ones
        if (status === 'active' || (includeExpiring && status === 'active')) {
          // Double-check with duration service for date validation
          if (bogoDurationService.isPromotionActive(mapping, currentDate)) {
            activePromotions.push(mapping);
          }
        }
      }

      return NextResponse.json({
        success: true,
        count: activePromotions.length,
        promotions: activePromotions,
        timestamp: currentDate.toISOString(),
        metadata: {
          vendorId,
          includeExpiring,
          format
        }
      });
    } else {
      // Use StorefrontPromotionService for consistent transformation
      const storefrontPromotions = await storefrontPromotionService.getActivePromotionsForVendor(
        vendorId,
        {
          includeExpiring,
          currentDate
        }
      );

      return NextResponse.json({
        success: true,
        count: storefrontPromotions.length,
        promotions: storefrontPromotions,
        timestamp: currentDate.toISOString(),
        metadata: {
          vendorId,
          includeExpiring,
          format
        }
      });
    }

  } catch (error) {
    console.error('Error fetching active promotions:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch active promotions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions/active
 * Get active promotions for specific products
 * 
 * Request body:
 * - productIds: string[] (required) - Array of product IDs to check for promotions
 * - currentDate?: string (optional) - ISO date string for date-based filtering
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, currentDate: dateString } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    const currentDate = dateString ? new Date(dateString) : new Date();

    // Automatically check and handle any expired promotions
    await promotionExpiryService.checkAndHandleExpiredPromotions(currentDate);

    // Use StorefrontPromotionService to get promotions for specific products
    const promotions = await storefrontPromotionService.getActivePromotionsForProducts(
      productIds,
      { currentDate }
    );

    return NextResponse.json({
      success: true,
      count: promotions.length,
      promotions,
      timestamp: currentDate.toISOString(),
      metadata: {
        productIds,
        requestedProducts: productIds.length
      }
    });

  } catch (error) {
    console.error('Error fetching promotions for products:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch promotions for products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}