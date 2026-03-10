import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { StorefrontCartItem } from '@/lib/storefront/cart-integration';

/**
 * Initiate checkout from storefront cart
 * 
 * POST /api/cart/checkout
 * 
 * Requirements validated:
 * - 7.4: WHEN customers proceed to checkout THEN the system SHALL redirect to Stitches Africa's secure checkout process
 * - Cart items include storefront context during checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, storefrontId, storefrontHandle, returnUrl } = body;

    // Validate cart items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate each cart item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id || !item.title || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { error: `Invalid cart item at index ${i}` },
          { status: 400 }
        );
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for item at index ${i}` },
          { status: 400 }
        );
      }
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
        // Continue without user ID for guest checkout
      }
    }

    // Prepare checkout data with storefront context
    const checkoutData = {
      items: items.map((item: StorefrontCartItem) => ({
        ...item,
        storefrontContext: {
          storefrontId,
          storefrontHandle,
          source: 'storefront' as const
        }
      })),
      userId,
      storefrontId,
      storefrontHandle,
      returnUrl: returnUrl || (storefrontHandle ? `/store/${storefrontHandle}` : '/'),
      timestamp: new Date().toISOString()
    };

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: StorefrontCartItem) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const total = subtotal + shippingCost;

    // Create checkout session URL
    // This would integrate with your existing checkout system
    const checkoutSessionId = `storefront_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store checkout session data (you might want to use Redis or database for this)
    // For now, we'll create a URL with encoded data
    const checkoutParams = new URLSearchParams({
      session: checkoutSessionId,
      source: 'storefront',
      storefront_id: storefrontId || '',
      storefront_handle: storefrontHandle || '',
      return_url: checkoutData.returnUrl,
      subtotal: subtotal.toString(),
      shipping: shippingCost.toString(),
      total: total.toString(),
      items: JSON.stringify(items.map(item => ({
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        images: item.images?.[0] || '',
        tailor_id: item.tailor_id,
        tailor: item.tailor
      })))
    });

    // Redirect to main Stitches Africa checkout with storefront context
    const redirectUrl = `/shops/cart?${checkoutParams.toString()}`;

    return NextResponse.json({
      success: true,
      redirectUrl,
      checkoutData: {
        sessionId: checkoutSessionId,
        subtotal,
        shippingCost,
        total,
        itemCount: items.length
      }
    });

  } catch (error) {
    console.error('[Cart Checkout API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate checkout' },
      { status: 500 }
    );
  }
}