import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    const vendorId = searchParams.get('vendorId');

    if (handle) {
      // Check if storefront exists by handle
      const storefrontQuery = await adminDb
        .collection("staging_storefronts")
        .where('handle', '==', handle)
        .limit(1)
        .get();

      return NextResponse.json({
        success: true,
        found: !storefrontQuery.empty,
        data: storefrontQuery.empty ? null : {
          id: storefrontQuery.docs[0].id,
          ...storefrontQuery.docs[0].data()
        }
      });
    }

    if (vendorId) {
      // Check if storefront exists by vendor ID
      const storefrontQuery = await adminDb
        .collection("staging_storefronts")
        .where('vendorId', '==', vendorId)
        .limit(1)
        .get();

      // Also check products for this vendor
      const productsQuery = await adminDb
        .collection("staging_products")
        .where('vendor_id', '==', vendorId)
        .limit(10)
        .get();

      const products = productsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({
        success: true,
        storefront: {
          found: !storefrontQuery.empty,
          data: storefrontQuery.empty ? null : {
            id: storefrontQuery.docs[0].id,
            ...storefrontQuery.docs[0].data()
          }
        },
        products: {
          count: products.length,
          data: products
        }
      });
    }

    // List all storefronts and some products for debugging
    const storefrontsQuery = await adminDb
      .collection("staging_storefronts")
      .limit(10)
      .get();

    const storefronts = storefrontsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also get some products to check the collection
    const productsQuery = await adminDb
      .collection("staging_products")
      .limit(5)
      .get();

    const products = productsQuery.docs.map(doc => ({
      id: doc.id,
      vendor_id: doc.data().vendor_id,
      status: doc.data().status,
      title: doc.data().title || doc.data().name,
      price: doc.data().price
    }));

    return NextResponse.json({
      success: true,
      storefronts: {
        count: storefronts.length,
        data: storefronts
      },
      products: {
        count: products.length,
        data: products
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}