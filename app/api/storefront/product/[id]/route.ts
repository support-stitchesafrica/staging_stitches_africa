import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/firestore';

/**
 * GET /api/storefront/product/[id]
 * Get product details for storefront display
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product details
    const product = await productRepository.getByIdWithTailorInfo(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // If vendorId is specified, verify the product belongs to that vendor
    if (vendorId && product.tailor_id !== vendorId) {
      return NextResponse.json(
        { success: false, error: 'Product not found in this store' },
        { status: 404 }
      );
    }

    // Only return verified products
    if (product.status !== 'verified') {
      return NextResponse.json(
        { success: false, error: 'Product not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch product' 
      },
      { status: 500 }
    );
  }
}