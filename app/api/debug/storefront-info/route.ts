import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    if (!handle) {
      return NextResponse.json({
        success: false,
        error: 'Handle is required'
      }, { status: 400 });
    }

    // Get storefront info
    const storefrontQuery = await adminDb
      .collection("staging_storefronts")
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (storefrontQuery.empty) {
      return NextResponse.json({
        success: false,
        error: 'Storefront not found'
      }, { status: 404 });
    }

    const storefrontDoc = storefrontQuery.docs[0];
    const storefrontData = storefrontDoc.data();

    // Get products count for this vendor
    const productsQuery = await adminDb
      .collection("staging_products")
      .where('vendorId', '==', storefrontData.vendorId)
      .get();

    // Get products with status
    const activeProductsQuery = await adminDb
      .collection("staging_products")
      .where('vendorId', '==', storefrontData.vendorId)
      .where('status', '==', 'active')
      .get();

    return NextResponse.json({
      success: true,
      storefront: {
        id: storefrontDoc.id,
        handle: storefrontData.handle,
        vendorId: storefrontData.vendorId,
        isPublic: storefrontData.isPublic,
        templateId: storefrontData.templateId
      },
      products: {
        total: productsQuery.size,
        active: activeProductsQuery.size,
        samples: productsQuery.docs.slice(0, 3).map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().title,
          status: doc.data().status,
          vendorId: doc.data().vendorId
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching storefront info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch storefront info'
    }, { status: 500 });
  }
}