import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { vendorId } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Find and delete test products from the products collection
    const productsQuery = await adminDb
      .collection("staging_products")
      .where('vendor_id', '==', vendorId)
      .get();

    const batch = adminDb.batch();
    let deletedCount = 0;

    productsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} test products for vendor ${vendorId}`,
      deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up test products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}