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

    // Get all tailor works for this vendor
    const tailorWorksSnapshot = await adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', vendorId)
      .get();

    const tailorWorks = tailorWorksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || data.name,
        description: data.description,
        price: data.price,
        images: data.images,
        createdAt: data.createdAt,
        tailorId: data.tailor_id,
        category: data.category,
        isTestData: data.title === 'Custom Tailored Suit' // Flag test data
      };
    });

    return NextResponse.json({
      success: true,
      vendorId,
      count: tailorWorks.length,
      tailorWorks
    });

  } catch (error) {
    console.error('Error checking tailor works:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}