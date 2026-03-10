import { NextRequest, NextResponse } from 'next/server';
import { storefrontPromotionService } from '../../../../lib/storefront/promotion-integration';
import { bogoCartService } from '../../../../lib/bogo/cart-service';
import { promotionExpiryService } from '../../../../lib/storefront/promotion-expiry-service';
import type { CartItem } from '../../../../types';

/**
 * POST /api/promotions/apply
 * Apply promotional pricing to cart items
 * 
 * Request body:
 * - cartItems: CartItem[] (required) - Current cart items
 * - vendorId?: string (optional) - Vendor ID for vendor-specific promotions
 * - currentDate?: string (optional) - ISO date string for date-based filtering
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItems, vendorId, currentDate: dateString } = body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: 'cartItems array is required' },
        { status: 400 }
      );
    }

    const currentDate = dateString ? new Date(dateString) : new Date();

    // Automatically check and handle any expired promotions before applying
    await promotionExpiryService.checkAndHandleExpiredPromotions(currentDate);

    // Get product IDs from cart items
    const productIds = cartItems.map((item: CartItem) => item.product_id);

    // Get active promotions for these products
    const activePromotions = await storefrontPromotionService.getActivePromotionsForProducts(
      productIds,
      { currentDate }
    );

    // If vendor ID is provided, also get vendor-specific promotions
    let vendorPromotions = [];
    if (vendorId) {
      vendorPromotions = await storefrontPromotionService.getActivePromotionsForVendor(
        vendorId,
        { currentDate }
      );
    }

    // Combine all promotions
    const allPromotions = [...activePromotions, ...vendorPromotions];

    // Validate that all promotions are still active (double-check for real-time expiry)
    const validationResult = await storefrontPromotionService.validatePromotions(allPromotions, currentDate);
    const validPromotions = validationResult.valid;

    // Apply promotional pricing to cart items using only valid promotions
    const updatedCartItems = await applyPromotionalPricing(cartItems, validPromotions);

    // Calculate cart summary with BOGO
    const cartSummary = bogoCartService.getBogoCartSummary(updatedCartItems);

    // Calculate shipping with BOGO considerations
    const shippingCost = bogoCartService.calculateShippingWithBogo(updatedCartItems);

    return NextResponse.json({
      success: true,
      cartItems: updatedCartItems,
      promotions: validPromotions,
      summary: {
        ...cartSummary,
        shippingCost,
        totalSavings: cartSummary.bogoSavings
      },
      timestamp: currentDate.toISOString(),
      metadata: {
        originalItemCount: cartItems.length,
        updatedItemCount: updatedCartItems.length,
        promotionsApplied: validPromotions.length,
        expiredPromotions: validationResult.expired.length,
        automaticExpiryHandling: true
      }
    });

  } catch (error) {
    console.error('Error applying promotional pricing:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to apply promotional pricing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Apply promotional pricing to cart items based on active promotions
 */
async function applyPromotionalPricing(
  cartItems: CartItem[], 
  promotions: any[]
): Promise<CartItem[]> {
  const updatedItems = [...cartItems];

  for (const promotion of promotions) {
    if (promotion.type === 'bogo') {
      // Find main products that are eligible for this BOGO promotion
      const eligibleMainProducts = updatedItems.filter(item => 
        promotion.applicableProducts.includes(item.product_id) &&
        !item.isBogoFree // Don't apply BOGO to already free items
      );

      for (const mainProduct of eligibleMainProducts) {
        // Check if this main product already has a free product associated
        const hasFreeProduct = updatedItems.some(item => 
          item.bogoMainProductId === mainProduct.product_id
        );

        if (!hasFreeProduct) {
          // Get the first free product ID (for simplicity, in real implementation 
          // this might require user selection for multiple options)
          const freeProductIds = promotion.applicableProducts.filter(
            (id: string) => id !== mainProduct.product_id
          );

          if (freeProductIds.length > 0) {
            // Add free product to cart (simplified - in real implementation,
            // this would need to fetch actual product data)
            const freeItem: CartItem = {
              ...mainProduct, // Copy structure from main product
              product_id: freeProductIds[0],
              title: `FREE - ${mainProduct.title}`,
              price: 0,
              discount: mainProduct.price,
              isBogoFree: true,
              bogoMainProductId: mainProduct.product_id,
              bogoMappingId: promotion.id,
              bogoPromotionName: promotion.displaySettings.badgeText,
              bogoOriginalPrice: mainProduct.price
            };

            updatedItems.push(freeItem);
          }
        }
      }
    }
  }

  return updatedItems;
}