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

    const results: any = {};

    // Check products collection with different field combinations
    console.log('Checking products collection...');
    
    // Try tailor_id field
    const productsByTailorId = await adminDb
      .collection("staging_products")
      .where('tailor_id', '==', vendorId)
      .limit(5)
      .get();

    results.productsByTailorId = {
      count: productsByTailorId.size,
      products: productsByTailorId.docs.map(doc => ({
        id: doc.id,
        tailor_id: doc.data().tailor_id,
        vendor_id: doc.data().vendor_id,
        status: doc.data().status,
        title: doc.data().title,
        price: doc.data().price
      }))
    };

    // Try vendor_id field
    const productsByVendorId = await adminDb
      .collection("staging_products")
      .where('vendor_id', '==', vendorId)
      .limit(5)
      .get();

    results.productsByVendorId = {
      count: productsByVendorId.size,
      products: productsByVendorId.docs.map(doc => ({
        id: doc.id,
        tailor_id: doc.data().tailor_id,
        vendor_id: doc.data().vendor_id,
        status: doc.data().status,
        title: doc.data().title,
        price: doc.data().price
      }))
    };

    // Try tailor field (string)
    const productsByTailor = await adminDb
      .collection("staging_products")
      .where('tailor', '==', vendorId)
      .limit(5)
      .get();

    results.productsByTailor = {
      count: productsByTailor.size,
      products: productsByTailor.docs.map(doc => ({
        id: doc.id,
        tailor: doc.data().tailor,
        tailor_id: doc.data().tailor_id,
        status: doc.data().status,
        title: doc.data().title,
        price: doc.data().price
      }))
    };

    // Get a few products to see the structure
    const sampleProducts = await adminDb
      .collection("staging_products")
      .limit(3)
      .get();

    results.sampleProductStructure = sampleProducts.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fields: Object.keys(data),
        tailor_id: data.tailor_id,
        vendor_id: data.vendor_id,
        tailor: data.tailor,
        status: data.status,
        title: data.title
      };
    });

    return NextResponse.json({
      success: true,
      vendorId,
      results
    });

  } catch (error) {
    console.error('Error finding vendor products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}