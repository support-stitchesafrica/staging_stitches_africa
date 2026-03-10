import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { vendorId } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Create test products for the vendor
    const testProducts = [
      {
        vendor_id: vendorId,
        title: 'Premium Cotton T-Shirt',
        name: 'Premium Cotton T-Shirt',
        description: 'High-quality cotton t-shirt with modern fit',
        price: { base: 29.99, amount: 29.99 },
        status: 'active',
        category: 'Clothing',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
        thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        inventory: { quantity: 100 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendor_id: vendorId,
        title: 'Designer Jeans',
        name: 'Designer Jeans',
        description: 'Stylish designer jeans with perfect fit',
        price: { base: 89.99, amount: 89.99 },
        status: 'active',
        category: 'Clothing',
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'],
        thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
        inventory: { quantity: 50 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendor_id: vendorId,
        title: 'Leather Jacket',
        name: 'Leather Jacket',
        description: 'Premium leather jacket for all seasons',
        price: { base: 199.99, amount: 199.99 },
        status: 'active',
        category: 'Outerwear',
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop'],
        thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
        inventory: { quantity: 25 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendor_id: vendorId,
        title: 'Sneakers',
        name: 'Sneakers',
        description: 'Comfortable sneakers for everyday wear',
        price: { base: 79.99, amount: 79.99 },
        status: 'active',
        category: 'Footwear',
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'],
        thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
        inventory: { quantity: 75 },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add products to Firebase
    const batch = adminDb.batch();
    const productIds: string[] = [];

    for (const product of testProducts) {
      const docRef = adminDb.collection("staging_products").doc();
      batch.set(docRef, product);
      productIds.push(docRef.id);
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Added ${testProducts.length} test products for vendor ${vendorId}`,
      productIds
    });

  } catch (error) {
    console.error('Error adding test products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}