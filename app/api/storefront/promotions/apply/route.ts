import { NextRequest, NextResponse } from 'next/server';
import { storefrontPromotionService } from '@/lib/storefront/promotion-integration';

/**
 * POST /api/storefront/promotions/apply
 * Apply promotions to a cart/order
 * 
 * Request body:
 * {
 *   vendorId: string;
 *   cartItems: Array<{
 *     productId: string;
 *     quantity: number;
 *     price: number;
 *   }>;
 *   promotionIds?: string[]; // Optional: specific promotions to apply
 *   currentDate?: string; // Optional: ISO date string for testing
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, cartItems, promotionIds, currentDate: currentDateParam } = body;

    // Validate required parameters
    if (!vendorId) {
      return NextResponse.json(
        { 
          error: 'Missing required field: vendorId',
          message: 'Please provide a vendorId'
        },
        { status: 400 }
      );
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { 
          error: 'Missing or invalid cartItems',
          message: 'Please provide a non-empty array of cart items'
        },
        { status: 400 }
      );
    }

    // Validate cart items structure
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { 
            error: `Invalid cart item at index ${i}: missing or invalid productId`,
            message: 'Each cart item must have a valid productId string'
          },
          { status: 400 }
        );
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { 
            error: `Invalid cart item at index ${i}: invalid quantity`,
            message: 'Each cart item must have a positive quantity number'
          },
          { status: 400 }
        );
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json(
          { 
            error: `Invalid cart item at index ${i}: invalid price`,
            message: 'Each cart item must have a non-negative price number'
          },
          { status: 400 }
        );
      }
    }

    // Validate optional parameters
    if (promotionIds && (!Array.isArray(promotionIds) || promotionIds.some(id => typeof id !== 'string'))) {
      return NextResponse.json(
        { 
          error: 'Invalid promotionIds parameter',
          message: 'promotionIds must be an array of strings'
        },
        { status: 400 }
      );
    }

    const currentDate = currentDateParam ? new Date(currentDateParam) : undefined;
    if (currentDateParam && (!currentDate || isNaN(currentDate.getTime()))) {
      return NextResponse.json(
        { 
          error: 'Invalid currentDate parameter',
          message: 'currentDate must be a valid ISO date string'
        },
        { status: 400 }
      );
    }

    // Apply promotions to cart
    const result = await storefrontPromotionService.applyPromotionsToCart(
      vendorId,
      cartItems,
      {
        currentDate,
        promotionIds
      }
    );

    // Calculate cart totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = Math.max(0, subtotal - result.discountAmount);
    const totalSavings = result.discountAmount + 
      (result.freeProducts?.reduce((sum, fp) => sum + (fp.originalPrice * fp.quantity), 0) || 0);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        application: result,
        cartSummary: {
          subtotal,
          discountAmount: result.discountAmount,
          finalTotal,
          totalSavings,
          freeShipping: result.freeShipping,
          itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          freeItemCount: result.freeProducts?.reduce((sum, fp) => sum + fp.quantity, 0) || 0
        },
        appliedPromotions: result.appliedPromotions,
        freeProducts: result.freeProducts || [],
        error: result.error
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in POST /api/storefront/promotions/apply:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to apply promotions to cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/storefront/promotions/apply
 * Alternative method for applying promotions (same as POST)
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}

/**
 * GET /api/storefront/promotions/apply
 * Get information about promotion application without actually applying
 * This is useful for preview/calculation purposes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const cartItemsParam = searchParams.get('cartItems');
    const promotionIdsParam = searchParams.get('promotionIds');
    const currentDateParam = searchParams.get('currentDate');

    // Validate required parameters
    if (!vendorId) {
      return NextResponse.json(
        { 
          error: 'Missing required parameter: vendorId',
          message: 'Please provide a vendorId'
        },
        { status: 400 }
      );
    }

    if (!cartItemsParam) {
      return NextResponse.json(
        { 
          error: 'Missing required parameter: cartItems',
          message: 'Please provide cartItems as a JSON string'
        },
        { status: 400 }
      );
    }

    // Parse cart items
    let cartItems;
    try {
      cartItems = JSON.parse(cartItemsParam);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid cartItems parameter',
          message: 'cartItems must be a valid JSON string'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid cartItems parameter',
          message: 'cartItems must be a non-empty array'
        },
        { status: 400 }
      );
    }

    // Parse optional parameters
    const promotionIds = promotionIdsParam ? promotionIdsParam.split(',').filter(id => id.trim()) : undefined;
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

    // Apply promotions to cart (preview mode)
    const result = await storefrontPromotionService.applyPromotionsToCart(
      vendorId,
      cartItems,
      {
        currentDate,
        promotionIds
      }
    );

    // Calculate cart totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = Math.max(0, subtotal - result.discountAmount);
    const totalSavings = result.discountAmount + 
      (result.freeProducts?.reduce((sum, fp) => sum + (fp.originalPrice * fp.quantity), 0) || 0);

    // Return preview response
    return NextResponse.json({
      success: true,
      preview: true,
      data: {
        vendorId,
        application: result,
        cartSummary: {
          subtotal,
          discountAmount: result.discountAmount,
          finalTotal,
          totalSavings,
          freeShipping: result.freeShipping,
          itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          freeItemCount: result.freeProducts?.reduce((sum, fp) => sum + fp.quantity, 0) || 0
        },
        appliedPromotions: result.appliedPromotions,
        freeProducts: result.freeProducts || [],
        error: result.error
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in GET /api/storefront/promotions/apply:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to preview promotion application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}