import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tailorId } = await params;

    console.log('=== GET VENDOR API ===');
    console.log('Tailor ID:', tailorId);

    // Get tailor document
    const tailorDoc = await adminDb.collection("staging_tailors").doc(tailorId).get();

    if (!tailorDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found' },
        { status: 404 }
      );
    }

    const tailorData = tailorDoc.data();
    console.log('Tailor data found');

    // Get all products (tailor_works) for this vendor
    console.log('Querying tailor_works with tailor_id:', tailorId);
    const worksSnapshot = await adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', tailorId)
      .get();

    console.log('Products found:', worksSnapshot.size);

    const products = worksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        name: data.title || data.name,
        images: data.images || [],
        price: data.price,
        description: data.description || '',
        category: data.category || '',
        is_disabled: data.is_disabled || false,
        stock: data.wear_quantity || 0,
      };
    });

    console.log('Processed products:', products.length);
    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products[0], null, 2).substring(0, 300));
    }

    // Get orders for this vendor (if they exist)
    let orders: any[] = [];
    try {
      const ordersSnapshot = await adminDb
        .collection("staging_orders")
        .where('vendorId', '==', tailorId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.log('No orders found or error fetching orders:', error);
    }

    // Get transactions for this vendor (if they exist)
    let transactions: any[] = [];
    try {
      const transactionsSnapshot = await adminDb
        .collection('transactions')
        .where('vendorId', '==', tailorId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.log('No transactions found or error fetching transactions:', error);
    }

    // Combine all data
    const vendorData = {
      id: tailorDoc.id,
      uid: tailorDoc.id,
      ...tailorData,
      products,
      totalProducts: products.length,
      orders,
      transactions,
      // Ensure status fields are properly set
      is_disabled: tailorData?.is_disabled || false,
      status: tailorData?.is_disabled ? 'disabled' : (tailorData?.status || 'active'),
    };

    return NextResponse.json({
      success: true,
      data: vendorData,
    });
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch vendor details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete all products (tailor_works) for this vendor
    const worksSnapshot = await adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', tailorId)
      .get();

    const batch = adminDb.batch();
    worksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the tailor document
    batch.delete(tailorDoc.ref);

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Vendor account deleted successfully',
      data: {
        productsDeleted: worksSnapshot.size,
      },
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete vendor account' },
      { status: 500 }
    );
  }
}
