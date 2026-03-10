/**
 * AI Assistant Products API
 * 
 * Fetches product details by IDs for display in chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductSearchService } from '@/lib/ai-assistant/product-search-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products by IDs
    const formattedProducts = await ProductSearchService.getByIds(productIds);

    // Convert FormattedProduct to Product type for frontend
    const products = formattedProducts.map(fp => ({
      product_id: fp.id,
      title: fp.title,
      description: fp.description,
      price: {
        base: fp.price,
        currency: fp.currency,
        discount: fp.discount,
      },
      discount: fp.discount,
      images: fp.images,
      thumbnail: fp.images[0],
      category: fp.category,
      type: fp.type,
      availability: fp.availability,
      tailor_id: fp.vendor.id,
      tailor: fp.vendor.name,
      vendor: {
        id: fp.vendor.id,
        name: fp.vendor.name,
        logo: fp.vendor.logo,
      },
      tags: fp.tags,
      deliveryTimeline: fp.deliveryTimeline,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[AI Products API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
