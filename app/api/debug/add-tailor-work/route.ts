import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { tailorId } = await request.json();

    if (!tailorId) {
      return NextResponse.json(
        { success: false, error: 'Tailor ID is required' },
        { status: 400 }
      );
    }

    // Create a sample tailor work for the vendor
    const tailorWork = {
      tailorId: tailorId,
      title: 'Custom Tailored Suit',
      name: 'Custom Tailored Suit',
      description: 'Premium custom-made suit with perfect fit and attention to detail',
      details: 'Made from high-quality fabric with custom measurements',
      category: 'Formal Wear',
      price: 299.99,
      images: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
      featured: true,
      isNewArrival: false,
      isBestSeller: true,
      tags: ['custom', 'formal', 'suit', 'tailored'],
      createdAt: new Date(),
      updatedAt: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add to Firestore
    const docRef = await adminDb.collection("staging_tailor_works").add(tailorWork);

    return NextResponse.json({
      success: true,
      message: `Added tailor work for vendor ${tailorId}`,
      workId: docRef.id,
      work: tailorWork
    });

  } catch (error) {
    console.error('Error adding tailor work:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}