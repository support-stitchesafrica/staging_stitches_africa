import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { cartRepository } from '@/lib/firestore';
import { StorefrontCartItem } from '@/lib/storefront/cart-integration';
import { storefrontPromotionService } from '@/lib/storefront/promotion-integration';
import { bogoCartService } from '@/lib/bogo/cart-service';
import type { CartItem } from '@/types';

/**
 * Apply promotional pricing to cart items based on active promotions
 * 
 * Requirements validated:
 * - 8.3: WHEN customers add promoted products to cart THEN the system SHALL apply promotional pricing and BOGO logic automatically
 */
async function applyPromotionalPricingToCart(
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
            // Add free product to cart
            const freeItem: CartItem = {
              ...mainProduct, // Copy structure from main product
              product_id: freeProductIds[0],
              title: `FREE - ${mainProduct.title}`,
              price: 0,
              discount: mainProduct.price,
              isBogoFree: true,
              bogoMainProductId: mainProduct.product_id,
              bogoMappingId: promotion.id,
              bogoPromotionName: promotion.displaySettings?.badgeText || 'BOGO Offer',
              bogoOriginalPrice: mainProduct.price
            };

            updatedItems.push(freeItem);
          }
        }
      }
    } else if (promotion.type === 'discount') {
      // Apply percentage or fixed discount to eligible products
      for (const item of updatedItems) {
        if (promotion.applicableProducts.includes(item.product_id) && !item.isBogoFree) {
          const originalPrice = item.bogoOriginalPrice || item.price;
          
          if (promotion.discountType === 'percentage') {
            const discountAmount = originalPrice * (promotion.discountValue / 100);
            item.price = Math.max(0, originalPrice - discountAmount);
            item.discount = promotion.discountValue;
          } else if (promotion.discountType === 'fixed') {
            item.price = Math.max(0, originalPrice - promotion.discountValue);
            item.discount = promotion.discountValue;
          }
          
          // Mark item as having promotional pricing applied
          item.promotionalPricing = {
            originalPrice,
            discountedPrice: item.price,
            promotionId: promotion.id,
            promotionName: promotion.displaySettings?.badgeText || 'Discount Applied'
          };
        }
      }
    }
  }

  return updatedItems;
}

/**
 * Add item to cart with storefront context
 * 
 * POST /api/cart/add
 * 
 * Requirements validated:
 * - Cart items include storefront context when added from storefront
 * - Integration with existing cart system
 * - 8.3: WHEN customers add promoted products to cart THEN the system SHALL apply promotional pricing and BOGO logic automatically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item, storefrontContext } = body;

    // Validate required fields
    if (!item || !item.product_id || !item.title || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      return NextResponse.json(
        { error: 'Invalid cart item data' },
        { status: 400 }
      );
    }

    if (item.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive' },
        { status: 400 }
      );
    }

    // Get user ID from auth token if provided
    let userId: string | undefined;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn('Invalid auth token:', error);
        // Continue without user ID for guest users
      }
    }

    // Create cart item with storefront context
    const cartItem: StorefrontCartItem = {
      ...item,
      user_id: userId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      storefrontContext: storefrontContext ? {
        storefrontId: storefrontContext.storefrontId,
        storefrontHandle: storefrontContext.storefrontHandle,
        source: 'storefront' as const
      } : undefined
    };

    // Get current cart items to check for existing promotions
    let currentCartItems: CartItem[] = [];
    if (userId) {
      try {
        currentCartItems = await cartRepository.getItems(userId);
      } catch (error) {
        console.warn('Could not fetch current cart items:', error);
        // Continue with empty cart for promotional pricing calculation
      }
    }

    // Apply promotional pricing automatically when adding items
    let finalCartItems: CartItem[] = [cartItem];
    let promotionalInfo: any = null;

    try {
      // Check for active promotions for this product
      const activePromotions = await storefrontPromotionService.getActivePromotionsForProducts(
        [item.product_id],
        { currentDate: new Date() }
      );

      if (activePromotions.length > 0) {
        // Apply promotional pricing to the new item and existing cart
        const allCartItems = [...currentCartItems, cartItem];
        
        // Apply promotional pricing using the existing logic
        finalCartItems = await applyPromotionalPricingToCart(allCartItems, activePromotions);
        
        // Find the newly added item(s) in the processed cart
        const newItems = finalCartItems.filter(processedItem => 
          !currentCartItems.some(existing => 
            existing.product_id === processedItem.product_id &&
            existing.size === processedItem.size &&
            existing.color === processedItem.color
          )
        );

        promotionalInfo = {
          promotionsApplied: activePromotions.length,
          promotions: activePromotions,
          newItemsAdded: newItems.length,
          bogoApplied: newItems.some(item => item.isBogoFree)
        };

        // Update the cart item reference to the processed version
        if (newItems.length > 0) {
          // Find the main item that was added (not the free BOGO item)
          const mainItem = newItems.find(newItem => 
            newItem.product_id === item.product_id && !newItem.isBogoFree
          );
          if (mainItem) {
            Object.assign(cartItem, mainItem);
          }
        }
      }
    } catch (error) {
      console.warn('Could not apply promotional pricing:', error);
      // Continue with original item if promotional pricing fails
    }

    // Add all final items to cart repository if user is authenticated
    if (userId) {
      // Remove existing items and add all processed items
      try {
        // For simplicity, we'll add the new items individually
        // In a production system, you might want to batch this operation
        for (const processedItem of finalCartItems) {
          if (!currentCartItems.some(existing => 
            existing.product_id === processedItem.product_id &&
            existing.size === processedItem.size &&
            existing.color === processedItem.color
          )) {
            await cartRepository.addItem(userId, processedItem);
          }
        }
      } catch (error) {
        console.error('Error adding processed items to cart:', error);
        // Fallback to adding just the original item
        await cartRepository.addItem(userId, cartItem);
      }
    }

    return NextResponse.json({
      success: true,
      item: cartItem,
      promotional: promotionalInfo,
      additionalItems: finalCartItems.length > 1 ? finalCartItems.slice(1) : undefined
    });

  } catch (error) {
    console.error('[Cart Add API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}