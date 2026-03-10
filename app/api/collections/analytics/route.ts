import { NextRequest, NextResponse } from 'next/server';
import { collectionsAnalyticsAdminService } from '@/lib/collections/analytics-admin-service';

/**
 * Collections Analytics API
 * 
 * GET /api/collections/analytics
 * Query parameters:
 * - type: 'dashboard' | 'collection' - Type of analytics to retrieve
 * - collectionId: string (required for type=collection) - Specific collection ID
 * - startDate: string (optional) - Start date for analytics period (ISO string)
 * - endDate: string (optional) - End date for analytics period (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const collectionId = searchParams.get('collectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let data;

    switch (type) {
      case 'dashboard':
        data = await collectionsAnalyticsAdminService.getDashboardData(
          start && end ? { start, end } : undefined
        );
        break;

      case 'collection':
        if (!collectionId) {
          return NextResponse.json(
            { error: 'collectionId is required for collection analytics' },
            { status: 400 }
          );
        }
        data = await collectionsAnalyticsAdminService.getCollectionAnalytics(
          collectionId, 
          start, 
          end
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use "dashboard" or "collection"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString(),
      period: {
        start: start?.toISOString(),
        end: end?.toISOString()
      }
    });
  } catch (error) {
    console.error('Collections Analytics API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections/analytics
 * Track collection analytics events
 * 
 * Body:
 * {
 *   "eventType": "view" | "product_view" | "add_to_cart" | "purchase" | "share",
 *   "collectionId": string,
 *   "collectionName": string,
 *   "productId"?: string,
 *   "productName"?: string,
 *   "userId"?: string,
 *   "price"?: number,
 *   "quantity"?: number,
 *   "metadata"?: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventType,
      collectionId,
      collectionName,
      productId,
      productName,
      userId,
      price,
      quantity = 1,
      metadata
    } = body;

    if (!eventType || !collectionId || !collectionName) {
      return NextResponse.json(
        { error: 'eventType, collectionId, and collectionName are required' },
        { status: 400 }
      );
    }

    // Use specific tracking methods based on event type
    switch (eventType) {
      case 'view':
        await collectionsAnalyticsAdminService.trackCollectionView(
          collectionId,
          collectionName,
          userId,
          metadata
        );
        break;

      case 'product_view':
        if (!productId || !productName) {
          return NextResponse.json(
            { error: 'productId and productName are required for product_view events' },
            { status: 400 }
          );
        }
        await collectionsAnalyticsAdminService.trackProductView(
          collectionId,
          collectionName,
          productId,
          productName,
          userId,
          metadata
        );
        break;

      case 'add_to_cart':
        if (!productId || !productName || !price) {
          return NextResponse.json(
            { error: 'productId, productName, and price are required for add_to_cart events' },
            { status: 400 }
          );
        }
        await collectionsAnalyticsAdminService.trackAddToCart(
          collectionId,
          collectionName,
          productId,
          productName,
          price,
          quantity,
          userId,
          metadata
        );
        break;

      case 'purchase':
        if (!productId || !productName || !price) {
          return NextResponse.json(
            { error: 'productId, productName, and price are required for purchase events' },
            { status: 400 }
          );
        }
        await collectionsAnalyticsAdminService.trackPurchase(
          collectionId,
          collectionName,
          productId,
          productName,
          price,
          quantity,
          userId,
          metadata
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Collections Analytics Tracking Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to track analytics event',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}