/**
 * AI Assistant Recommended Products API
 * 
 * Handles storing and retrieving AI-recommended products for homepage display
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface RecommendedProduct {
  productId: string;
  userId: string;
  sessionId: string;
  recommendedAt: Date;
  interactionType?: 'view' | 'click' | 'purchase' | 'wishlist';
  score?: number; // Optional relevance score
}

// Interaction weights - higher weight means stronger preference
const INTERACTION_WEIGHTS = {
  view: 1,
  click: 3,
  purchase: 10,
  wishlist: 7
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, userId, sessionId, interactionType } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Store each recommended product with metadata
    const batch = adminDb.batch();
    
    for (const productId of productIds) {
      // Create a document for each recommended product
      const recommendedProductRef = adminDb.collection('ai_recommended_products').doc();
      
      const recommendedProduct: RecommendedProduct = {
        productId,
        userId: userId || 'anonymous',
        sessionId: sessionId || 'unknown',
        recommendedAt: new Date(),
        interactionType,
        // Calculate score based on interaction type if provided
        score: interactionType ? INTERACTION_WEIGHTS[interactionType as keyof typeof INTERACTION_WEIGHTS] : undefined
      };
      
      batch.set(recommendedProductRef, recommendedProduct);
    }
    
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Stored ${productIds.length} recommended products` 
    });
  } catch (error) {
    console.error('[AI Recommended Products API] Error storing recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to store recommended products' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const daysBack = parseInt(searchParams.get('daysBack') || '7');

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get recently recommended products
    const snapshot = await adminDb
      .collection('ai_recommended_products')
      .where('recommendedAt', '>=', cutoffDate)
      .orderBy('recommendedAt', 'desc')
      .limit(limit * 5) // Get more to deduplicate
      .get();

    // Aggregate scores for each product
    const productScores = new Map<string, number>();
    const productMetadata = new Map<string, any>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Use score if available, otherwise default to 1
      const score = data.score || 1;
      const currentScore = productScores.get(data.productId) || 0;
      productScores.set(data.productId, currentScore + score);
      // Store the latest metadata for each product
      productMetadata.set(data.productId, data);
    });

    // Convert to array and sort by score (popularity/engagement)
    const sortedProducts = Array.from(productScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId, score]) => ({
        productId,
        score,
        metadata: productMetadata.get(productId)
      }));

    return NextResponse.json({
      success: true,
      products: sortedProducts,
      total: sortedProducts.length
    });
  } catch (error) {
    console.error('[AI Recommended Products API] Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommended products' },
      { status: 500 }
    );
  }
}
