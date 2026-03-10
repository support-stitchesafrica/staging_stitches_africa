import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tailorId } = await params;

    // Get tailor document
    const tailorDoc = await adminDb.collection("staging_tailors").doc(tailorId).get();

    if (!tailorDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Update tailor document to enable
    await adminDb.collection("staging_tailors").doc(tailorId).update({
      is_disabled: false,
      updatedAt: new Date().toISOString(),
    });

    // Get all products (tailor_works) for this vendor
    const worksSnapshot = await adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', tailorId)
      .get();

    // Batch update all products to enable them
    const batch = adminDb.batch();
    worksSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        is_disabled: false,
        updatedAt: new Date().toISOString(),
      });
    });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Vendor enabled successfully',
      data: {
        is_disabled: false,
        productsUpdated: worksSnapshot.size,
      },
    });
  } catch (error) {
    console.error('Error enabling vendor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to enable vendor' },
      { status: 500 }
    );
  }
}
