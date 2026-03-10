import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle') || 'ouch';

    // Simple test to see if we can access the database
    const storefrontQuery = await adminDb
      .collection("staging_storefronts")
      .where('handle', '==', handle)
      .limit(1)
      .get();

    const exists = !storefrontQuery.empty;
    let storefrontData = null;

    if (exists) {
      const doc = storefrontQuery.docs[0];
      storefrontData = {
        id: doc.id,
        handle: doc.data().handle,
        vendorId: doc.data().vendorId,
        isPublic: doc.data().isPublic,
        templateId: doc.data().templateId
      };
    }

    // Also check how many storefronts exist in total
    const allStorefrontsQuery = await adminDb
      .collection("staging_storefronts")
      .limit(5)
      .get();

    return NextResponse.json({
      success: true,
      searchHandle: handle,
      exists,
      storefrontData,
      totalStorefronts: allStorefrontsQuery.size,
      allStorefronts: allStorefrontsQuery.docs.map(doc => ({
        id: doc.id,
        handle: doc.data().handle,
        vendorId: doc.data().vendorId,
        isPublic: doc.data().isPublic
      })),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
}