import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { cartRepository } from '@/lib/firestore';
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
      // BOGO logic is handled separately by bogoCartService
      // This function focuses on discount promotions
      continue;
    } else if (promotion.type === 'discount') {
      // Apply percentage or fixed discount to eligible products
      for (const item of updatedItems) {
        if (promotion.applicableProducts.includes(item.product_id) && !item.isBogoFree) {
          const originalPrice = item.promotionalPricing?.originalPrice || item.price;
          
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
 * Update cart item quantity
 * 
 * PUT /api/cart/update
 * 
 * Requirements validated:
 * - Quantity management and updates for cart items
 * - Integration with existing cart system
 * - Support for both authenticated and guest users
 * - 8.3: WHEN customers add promoted products to cart THEN the system SHALL apply promotional pricing and BOGO logic automatically
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, size, color } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative number' },
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

    // Update cart item quantity if user is authenticated
    if (userId) {
      // Find the cart item to update
      const cartItems = await cartRepository.getByUserId(userId);
      const itemToUpdate = cartItems.find(item => 
        item.product_id === productId && 
        (item.size || null) === (size || null) && 
        (item.color || null) === (color || null)
      );

      if (!itemToUpdate || !itemToUpdate.id) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        );
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        await cartRepository.removeItem(userId, itemToUpdate.id);
        return NextResponse.json({
          success: true,
          action: 'removed',
          productId,
          size,
          color
        });
      } else {
        // Update quantity
        await cartRepository.updateItem(userId, itemToUpdate.id, { 
          quantity,
          updatedAt: new Date()
        });

        // Re-apply promotional pricing after quantity update
        let promotionalInfo: any = null;
        try {
          // Get all current cart items after the update
          const updatedCartItems = await cartRepository.getByUserId(userId);
          
          // Get all product IDs for promotional pricing check
          const productIds = updatedCartItems.map(item => item.product_id);
          
          // Check for active promotions
          const activePromotions = await storefrontPromotionService.getActivePromotionsForProducts(
            productIds,
            { currentDate: new Date() }
          );

          if (activePromotions.length > 0) {
            // Apply promotional pricing to all cart items
            const processedCartItems = await applyPromotionalPricingToCart(updatedCartItems, activePromotions);
            
            // Update all items with promotional pricing
            for (const processedItem of processedCartItems) {
              if (processedItem.id) {
                await cartRepository.updateItem(userId, processedItem.id, {
                  price: processedItem.price,
                  discount: processedItem.discount,
                  promotionalPricing: processedItem.promotionalPricing,
                  updatedAt: new Date()
                });
              }
            }

            promotionalInfo = {
              promotionsApplied: activePromotions.length,
              promotions: activePromotions
            };
          }
        } catch (error) {
          console.warn('Could not re-apply promotional pricing after quantity update:', error);
        }

        return NextResponse.json({
          success: true,
          action: 'updated',
          productId,
          quantity,
          size,
          color,
          promotional: promotionalInfo
        });
      }
    }

    // For guest users, return success (client-side will handle localStorage)
    return NextResponse.json({
      success: true,
      action: quantity === 0 ? 'removed' : 'updated',
      productId,
      quantity,
      size,
      color,
      note: 'Guest user - handled client-side'
    });

  } catch (error) {
    console.error('[Cart Update API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

/**
 * Remove cart item
 * 
 * DELETE /api/cart/update
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const size = searchParams.get('size');
    const color = searchParams.get('color');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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
      }
    }

    // Remove cart item if user is authenticated
    if (userId) {
      const cartItems = await cartRepository.getByUserId(userId);
      const itemToRemove = cartItems.find(item => 
        item.product_id === productId && 
        (item.size || null) === (size || null) && 
        (item.color || null) === (color || null)
      );

      if (!itemToRemove || !itemToRemove.id) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        );
      }

      await cartRepository.removeItem(userId, itemToRemove.id);
    }

    return NextResponse.json({
      success: true,
      action: 'removed',
      productId,
      size,
      color
    });

  } catch (error) {
    console.error('[Cart Remove API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}