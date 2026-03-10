import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const handle = searchParams.get('handle');

    if (!vendorId && !handle) {
      return NextResponse.json(
        { error: 'Either vendorId or handle is required' },
        { status: 400 }
      );
    }

    let storefrontData = null;
    let themeData = null;

    // Get storefront data
    if (handle) {
      const storefrontQuery = await adminDb
        .collection("staging_storefronts")
        .where('handle', '==', handle)
        .limit(1)
        .get();

      if (!storefrontQuery.empty) {
        const doc = storefrontQuery.docs[0];
        storefrontData = {
          id: doc.id,
          ...doc.data(),
          vendorId: doc.data().vendorId
        };
      }
    } else if (vendorId) {
      const storefrontQuery = await adminDb
        .collection("staging_storefronts")
        .where('vendorId', '==', vendorId)
        .limit(1)
        .get();

      if (!storefrontQuery.empty) {
        const doc = storefrontQuery.docs[0];
        storefrontData = {
          id: doc.id,
          ...doc.data()
        };
      }
    }

    // Get theme data from storefront_themes collection
    const actualVendorId = vendorId || storefrontData?.vendorId;
    if (actualVendorId) {
      const themeDoc = await adminDb
        .collection("staging_storefront_themes")
        .doc(actualVendorId)
        .get();

      if (themeDoc.exists) {
        themeData = themeDoc.data();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        storefront: storefrontData,
        theme: themeData,
        vendorId: actualVendorId,
        handle: handle || storefrontData?.handle
      }
    });

  } catch (error) {
    console.error('Error in debug theme endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug information' },
      { status: 500 }
    );
  }
}