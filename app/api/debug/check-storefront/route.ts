import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Check if storefront exists for this vendor
    const storefrontQuery = await adminDb
      .collection("staging_storefronts")
      .where('vendorId', '==', vendorId)
      .get();

    if (storefrontQuery.empty) {
      return NextResponse.json({
        success: true,
        hasStorefront: false,
        message: 'No storefront found for this vendor'
      });
    }

    const storefronts = storefrontQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      hasStorefront: true,
      storefronts
    });

  } catch (error) {
    console.error('Error checking storefront:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}