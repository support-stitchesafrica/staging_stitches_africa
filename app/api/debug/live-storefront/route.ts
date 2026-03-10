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

    console.log('Debug: Searching for storefront with handle:', handle);

    // Get all storefronts to see what exists
    const allStorefrontsQuery = await adminDb
      .collection("staging_storefronts")
      .limit(10)
      .get();

    console.log('Debug: Total storefronts in database:', allStorefrontsQuery.size);

    const allStorefronts = allStorefrontsQuery.docs.map(doc => ({
      id: doc.id,
      handle: doc.data().handle,
      vendorId: doc.data().vendorId,
      isPublic: doc.data().isPublic,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || 'No date'
    }));

    // Search for specific storefront
    const storefrontQuery = await adminDb
      .collection("staging_storefronts")
      .where('handle', '==', handle)
      .get();

    console.log('Debug: Specific storefront query result:', {
      empty: storefrontQuery.empty,
      size: storefrontQuery.size
    });

    let targetStorefront = null;
    if (!storefrontQuery.empty) {
      const doc = storefrontQuery.docs[0];
      targetStorefront = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || 'No date',
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || 'No date'
      };
    }

    // Check products for the vendor if storefront exists
    let productsInfo = null;
    if (targetStorefront) {
      const productsQuery = await adminDb
        .collection("staging_products")
        .where('vendorId', '==', targetStorefront.vendorId)
        .limit(5)
        .get();

      productsInfo = {
        total: productsQuery.size,
        samples: productsQuery.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().title,
          status: doc.data().status,
          vendorId: doc.data().vendorId
        }))
      };
    }

    // Check theme
    let themeInfo = null;
    if (targetStorefront) {
      const themeDoc = await adminDb
        .collection("staging_storefront_themes")
        .doc(targetStorefront.vendorId)
        .get();

      themeInfo = {
        exists: themeDoc.exists,
        data: themeDoc.exists ? {
          templateId: themeDoc.data()?.templateId,
          hasMedia: !!themeDoc.data()?.theme?.media,
          colors: themeDoc.data()?.theme?.colors
        } : null
      };
    }

    return NextResponse.json({
      success: true,
      debug: {
        searchHandle: handle,
        totalStorefronts: allStorefrontsQuery.size,
        allStorefronts,
        targetStorefront,
        productsInfo,
        themeInfo,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in live storefront debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}