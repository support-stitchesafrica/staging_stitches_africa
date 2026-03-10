/**
 * AI Assistant Cart API
 * 
 * Handles cart actions triggered from the AI shopping assistant
 * Integrates with the existing cart system
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { CartActionService } from '@/lib/ai-assistant/cart-action-service';
import { cartRepository } from '@/lib/firestore';
import { CartItem } from '@/types';
import { trackConversion } from '@/services/aiAssistantAnalytics';

/**
 * POST /api/ai-assistant/cart
 * Add product to cart from AI assistant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId, quantity = 1, size, color, sessionId } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate product
    const product = await CartActionService.validateProduct(productId);
    
    if (!product) {
      return NextResponse.json(
        { 
          success: false,
          error: 'product_not_found',
          message: CartActionService.formatErrorMessage('product_not_found', productId)
        },
        { status: 404 }
      );
    }

    // Check if product is out of stock
    if (product.availability === 'out_of_stock') {
      return NextResponse.json(
        {
          success: false,
          error: 'out_of_stock',
          message: CartActionService.formatErrorMessage('out_of_stock', productId)
        },
        { status: 400 }
      );
    }

    // Check if size is required but not provided
    if (CartActionService.requiresSize(product) && !size) {
      return NextResponse.json(
        {
          success: false,
          error: 'missing_size',
          message: CartActionService.formatErrorMessage('missing_size'),
          availableSizes: CartActionService.getAvailableSizes(product),
          suggestedQuestions: CartActionService.getSuggestedQuestionsForOptions(product)
        },
        { status: 400 }
      );
    }

    // Check if color is required but not provided
    if (CartActionService.requiresColor(product) && !color) {
      return NextResponse.json(
        {
          success: false,
          error: 'missing_color',
          message: CartActionService.formatErrorMessage('missing_color'),
          availableColors: CartActionService.getAvailableColors(product),
          suggestedQuestions: CartActionService.getSuggestedQuestionsForOptions(product)
        },
        { status: 400 }
      );
    }

    // Validate size if provided
    if (size && !CartActionService.isValidSize(product, size)) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_size',
          message: `That size isn't available. Available sizes: ${CartActionService.getAvailableSizes(product).join(', ')}`,
          availableSizes: CartActionService.getAvailableSizes(product)
        },
        { status: 400 }
      );
    }

    // Validate color if provided
    if (color && !CartActionService.isValidColor(product, color)) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_color',
          message: `That color isn't available. Available colors: ${CartActionService.getAvailableColors(product).join(', ')}`,
          availableColors: CartActionService.getAvailableColors(product)
        },
        { status: 400 }
      );
    }

    // Calculate price
    const basePrice = product.price?.base || 0;
    const discount = product.discount || product.price?.discount || 0;
    const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

    // Create cart item
    const cartItem: CartItem = {
      product_id: product.product_id,
      title: product.title,
      description: product.description,
      type: product.type,
      price: finalPrice,
      discount: discount,
      quantity: quantity,
      color: color || null,
      size: size || null,
      sizes: null,
      images: product.images,
      tailor_id: product.tailor_id,
      tailor: product.tailor || product.vendor?.name || '',
      user_id: userId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isCollectionItem: false,
      isRemovable: true,
    };

    // Add to cart (if user is logged in or guest)
    let cartItemCount = 0;
    if (userId && userId !== 'guest') {
      await cartRepository.addItem(userId, cartItem);
      
      // Get cart item count
      const cartItems = await cartRepository.getByUserId(userId);
      cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      // For guest users, use localStorage cart
      // Return success but indicate they need to log in
      cartItemCount = 1; // Assume 1 item for guest
    }

    // Track conversion if session ID is provided
    if (sessionId) {
      await trackConversion(
        sessionId,
        'add_to_cart',
        product.product_id,
        {
          userId,
          productTitle: product.title,
          productPrice: finalPrice,
          vendorId: product.tailor_id,
          vendorName: product.tailor || product.vendor?.name,
        }
      );
    }

    // Format success message
    const message = CartActionService.formatAddToCartMessage(product, quantity);

    return NextResponse.json({
      success: true,
      message,
      productTitle: product.title,
      cartItemCount,
      suggestedQuestions: CartActionService.getSuggestedQuestionsAfterAddToCart(),
      cartItem: {
        id: cartItem.product_id,
        title: cartItem.title,
        price: cartItem.price,
        quantity: cartItem.quantity,
        size: cartItem.size,
        color: cartItem.color,
        image: cartItem.images[0],
      }
    });
  } catch (error) {
    console.error('[AI Cart API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'server_error',
        message: 'Failed to add item to cart. Please try again.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-assistant/cart
 * Get cart summary for AI assistant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Handle undefined userId (string "undefined" or null/empty)
    if (!userId || userId === 'undefined' || userId === 'null' || userId.trim() === '') {
      // Return empty cart for guest users
      return NextResponse.json({
        success: true,
        itemCount: 0,
        totalAmount: 0,
        items: []
      });
    }

    // Get cart items
    const cartItems = await cartRepository.getByUserId(userId);

    // Calculate totals
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return NextResponse.json({
      success: true,
      itemCount,
      totalAmount,
      items: cartItems.map(item => ({
        id: item.product_id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.images[0],
      }))
    });
  } catch (error) {
    console.error('[AI Cart API] Error getting cart:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'server_error',
        message: 'Failed to get cart. Please try again.'
      },
      { status: 500 }
    );
  }
}
