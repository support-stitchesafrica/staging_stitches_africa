import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      paymentIntentId, 
      storefrontId, 
      storefrontHandle, 
      customerInfo, 
      items, 
      totals,
      userId 
    } = body;

    // Validate required fields
    if (!orderId || !paymentIntentId || !storefrontId || !customerInfo || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create order document
    const orderData = {
      orderId,
      paymentIntentId,
      storefrontId,
      storefrontHandle,
      customerInfo: {
        email: customerInfo.email,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zipCode: customerInfo.zipCode,
        country: customerInfo.country
      },
      items: items.map((item: any) => ({
        product_id: item.product_id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        images: item.images || [],
        tailor_id: item.tailor_id,
        tailor: item.tailor,
        type: item.type || 'ready-to-wear'
      })),
      totals: {
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax, // Note: This might be 0 now, but kept for schema consistency if needed, or check if we should remove it here too
        total: totals.total
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      userId: userId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    await adminDb.collection('storefront_orders').doc(orderId).set(orderData);

    // TODO: Send confirmation emails
    // TODO: Notify vendors
    // TODO: Update inventory

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Order created successfully' 
    });

  } catch (error) {
    console.error('Error creating storefront order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}