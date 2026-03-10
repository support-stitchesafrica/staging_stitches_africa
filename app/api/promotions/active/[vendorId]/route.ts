import { NextRequest, NextResponse } from 'next/server';
import { bogoMappingService } from '../../../../../lib/bogo/mapping-service';
import { bogoDurationService } from '../../../../../lib/bogo/duration-service';
import type { BogoMapping } from '../../../../../types/bogo';
import type { PromotionalConfig } from '../../../../../types/storefront';

/**
 * GET /api/promotions/active/[vendorId]
 * Returns only currently active promotions for a specific vendor
 * 
 * Path parameters:
 * - vendorId: string - The vendor ID to get promotions for
 * 
 * Query parameters:
 * - includeExpiring: boolean (optional) - Include promotions expiring within 24 hours
 * - format: 'bogo' | 'storefront' (optional) - Response format, defaults to 'storefront'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const { vendorId } = params;
    const { searchParams } = new URL(request.url);
    const includeExpiring = searchParams.get('includeExpiring') === 'true';
    const format = searchParams.get('format') as 'bogo' | 'storefront' || 'storefront';

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    // Get all active BOGO mappings for the vendor
    const allMappings = await bogoMappingService.getAllMappings({
      active: true,
      createdBy: vendorId,
      orderBy: 'promotionStartDate',
      orderDirection: 'desc'
    });

    // Filter to only currently active promotions (respecting date constraints)
    const currentDate = new Date();
    const activePromotions: BogoMapping[] = [];

    for (const mapping of allMappings) {
      const status = bogoDurationService.getPromotionStatus(mapping, currentDate);
      
      // Include active promotions, and optionally include expiring ones
      if (status === 'active') {
        // Double-check with duration service for date validation
        if (bogoDurationService.isPromotionActive(mapping, currentDate)) {
          activePromotions.push(mapping);
        }
      }
    }

    // If includeExpiring is true, also get promotions expiring within 24 hours
    if (includeExpiring) {
      const expiringPromotions = await bogoDurationService.getExpiringPromotions(24, currentDate);
      
      // Add expiring promotions that aren't already included
      for (const expiring of expiringPromotions) {
        const mapping = allMappings.find(m => m.id === expiring.mappingId);
        if (mapping && !activePromotions.find(p => p.id === mapping.id)) {
          activePromotions.push(mapping);
        }
      }
    }

    // Transform to requested format
    if (format === 'bogo') {
      // Return raw BOGO mappings with additional metadata
      const promotionsWithCountdown = await Promise.all(
        activePromotions.map(async (mapping) => {
          const countdown = await bogoDurationService.getPromotionCountdown(
            mapping.mainProductId, 
            currentDate
          );
          
          return {
            ...mapping,
            countdown: countdown.hasCountdown ? countdown : undefined,
            status: bogoDurationService.getPromotionStatus(mapping, currentDate)
          };
        })
      );

      return NextResponse.json({
        success: true,
        count: promotionsWithCountdown.length,
        promotions: promotionsWithCountdown,
        timestamp: currentDate.toISOString(),
        metadata: {
          vendorId,
          includeExpiring,
          format
        }
      });
    } else {
      // Transform to storefront PromotionalConfig format
      const storefrontPromotions: PromotionalConfig[] = await Promise.all(
        activePromotions.map(async (mapping) => {
          const countdown = await bogoDurationService.getPromotionCountdown(
            mapping.mainProductId, 
            currentDate
          );

          // Determine badge text based on countdown
          let badgeText = mapping.promotionName || 'BOGO Offer';
          let bannerMessage = mapping.description || `Buy one ${mapping.mainProductId} and get a free product!`;
          
          if (countdown.hasCountdown && countdown.isExpiringSoon) {
            badgeText = `${badgeText} - Ending Soon!`;
            bannerMessage = `${bannerMessage} Hurry, offer expires in ${countdown.timeRemaining?.hours}h ${countdown.timeRemaining?.minutes}m!`;
          }

          return {
            id: mapping.id,
            vendorId: mapping.createdBy,
            type: 'bogo' as const,
            isActive: true,
            startDate: mapping.promotionStartDate.toDate(),
            endDate: mapping.promotionEndDate.toDate(),
            applicableProducts: [mapping.mainProductId, ...mapping.freeProductIds],
            displaySettings: {
              badgeText,
              badgeColor: countdown.isExpiringSoon ? '#FF4444' : '#FF6B35',
              bannerMessage,
              priority: countdown.isExpiringSoon ? 2 : 1,
              customColors: {
                background: countdown.isExpiringSoon ? '#FF4444' : '#FF6B35',
                text: '#FFFFFF',
                border: countdown.isExpiringSoon ? '#CC3333' : '#E55A2B'
              },
              customText: {
                primary: 'BOGO',
                secondary: countdown.isExpiringSoon ? 'Ending Soon!' : 'Buy 1 Get 1 Free',
                prefix: countdown.isExpiringSoon ? '⏰' : '🎉',
                suffix: ''
              },
              badgeVariant: 'savings' as const,
              showIcon: true
            }
          };
        })
      );

      return NextResponse.json({
        success: true,
        count: storefrontPromotions.length,
        promotions: storefrontPromotions,
        timestamp: currentDate.toISOString(),
        metadata: {
          vendorId,
          includeExpiring,
          format,
          hasExpiringPromotions: storefrontPromotions.some(p => 
            p.displaySettings.customText?.secondary === 'Ending Soon!'
          )
        }
      });
    }

  } catch (error) {
    console.error('Error fetching active promotions for vendor:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch active promotions',
        details: error instanceof Error ? error.message : 'Unknown error',
        vendorId: params.vendorId
      },
      { status: 500 }
    );
  }
}