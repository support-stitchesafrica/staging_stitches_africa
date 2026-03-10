/**
 * Storefront Analytics API Route
 * Provides analytics data for vendor storefronts and handles event tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storefrontId = searchParams.get('storefrontId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storefrontId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: storefrontId, startDate, endDate' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log(`📊 Fetching analytics for storefront: ${storefrontId} from ${start.toISOString()} to ${end.toISOString()}`);

    // Get shop activities for this vendor/storefront
    const activitiesQuery = adminDb
      .collection("staging_shop_activities")
      .where('vendorId', '==', storefrontId)
      .where('timestamp', '>=', Timestamp.fromDate(start))
      .where('timestamp', '<=', Timestamp.fromDate(end))
      .limit(1000);

    const activitiesSnapshot = await activitiesQuery.get();
    console.log(`Found ${activitiesSnapshot.size} activities`);

    // Process activities
    const activities = activitiesSnapshot.docs.map(doc => {
      const data = doc.data();
      let activityDate = null;
      
      // Handle different timestamp formats
      if (data.timestamp) {
        if (data.timestamp._seconds) {
          activityDate = new Date(data.timestamp._seconds * 1000);
        } else if (data.timestamp.toDate) {
          activityDate = data.timestamp.toDate();
        } else if (data.timestamp instanceof Date) {
          activityDate = data.timestamp;
        } else if (typeof data.timestamp === 'string') {
          activityDate = new Date(data.timestamp);
        }
      }
      
      return {
        type: data.type,
        userId: data.userId,
        productId: data.productId,
        metadata: data.metadata,
        timestamp: activityDate
      };
    });

    // Calculate metrics
    const pageViews = activities.filter(a => a.type === 'view').length;
    const productViews = activities.filter(a => a.type === 'product_view').length;
    const cartAdds = activities.filter(a => a.type === 'add_to_cart').length;
    const purchases = activities.filter(a => a.type === 'purchase').length;
    
    const uniqueVisitors = new Set(activities.map(a => a.userId)).size;
    const conversionRate = pageViews > 0 ? (purchases / pageViews) * 100 : 0;

    // Calculate daily stats
    const dailyStats = new Map<string, { pageViews: number; cartAdds: number; purchases: number }>();
    
    activities.forEach(activity => {
      if (activity.timestamp) {
        const dateKey = activity.timestamp.toISOString().split('T')[0];
        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, { pageViews: 0, cartAdds: 0, purchases: 0 });
        }
        
        const dayStats = dailyStats.get(dateKey)!;
        if (activity.type === 'view') dayStats.pageViews++;
        if (activity.type === 'add_to_cart') dayStats.cartAdds++;
        if (activity.type === 'purchase') dayStats.purchases++;
      }
    });

    // Get top products
    const productStats = new Map<string, { views: number; cartAdds: number; productName: string }>();
    
    activities.forEach(activity => {
      if (activity.productId) {
        if (!productStats.has(activity.productId)) {
          productStats.set(activity.productId, { 
            views: 0, 
            cartAdds: 0, 
            productName: activity.metadata?.productName || `Product ${activity.productId}` 
          });
        }
        
        const stats = productStats.get(activity.productId)!;
        if (activity.type === 'view' || activity.type === 'product_view') stats.views++;
        if (activity.type === 'add_to_cart') stats.cartAdds++;
      }
    });

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.productName,
        views: stats.views,
        cartAdds: stats.cartAdds
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const response = {
      pageViews,
      productViews,
      cartAdds,
      purchases,
      uniqueVisitors,
      conversionRate: Math.round(conversionRate * 100) / 100,
      sessionData: {
        averageSessionDuration: 180 // Default 3 minutes
      },
      dailyStats: Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        ...stats
      })),
      topProducts
    };

    console.log(`✅ Analytics response:`, {
      pageViews: response.pageViews,
      uniqueVisitors: response.uniqueVisitors,
      conversionRate: response.conversionRate,
      topProductsCount: response.topProducts.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching storefront analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storefrontId, eventType, sessionId, visitorId, userId, productId, metadata } = body;

    if (!storefrontId || !eventType || !sessionId || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required fields: storefrontId, eventType, sessionId, visitorId' },
        { status: 400 }
      );
    }

    console.log(`📝 Tracking event: ${eventType} for storefront: ${storefrontId}`, {
      sessionId,
      visitorId,
      userId,
      productId
    });

    // Map storefront event types to shop_activities types
    const activityTypeMap: Record<string, string> = {
      'storefront_visit': 'storefront_visit',
      'page_view': 'view',
      'product_view': 'view',
      'add_to_cart': 'add_to_cart',
      'remove_from_cart': 'remove_from_cart',
      'checkout_start': 'checkout_start',
      'purchase': 'purchase'
    };

    const activityType = activityTypeMap[eventType] || eventType;

    // Create activity document
    const activity = {
      type: activityType,
      userId: userId || `anon_${visitorId}`,
      sessionId,
      visitorId,
      vendorId: storefrontId,
      productId: productId || null,
      timestamp: Timestamp.now(),
      metadata: {
        ...metadata,
        source: 'storefront',
        eventType: eventType, // Keep original event type
        deviceType: metadata?.deviceType || 'desktop',
        userAgent: metadata?.userAgent || 'unknown',
        referrer: metadata?.referrer || '',
        url: metadata?.url || ''
      }
    };

    // Save to shop_activities collection
    const docRef = await adminDb.collection("staging_shop_activities").add(activity);

    // For storefront visits, also update vendor analytics
    if (eventType === 'storefront_visit') {
      try {
        // Update vendor visit count
        const vendorStatsRef = adminDb.collection("staging_vendor_stats").doc(storefrontId);
        const vendorStatsDoc = await vendorStatsRef.get();
        
        if (vendorStatsDoc.exists) {
          const currentStats = vendorStatsDoc.data();
          await vendorStatsRef.update({
            totalVisits: (currentStats?.totalVisits || 0) + 1,
            uniqueVisitors: (currentStats?.uniqueVisitors || 0) + (metadata?.isNewSession ? 1 : 0),
            lastVisit: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        } else {
          await vendorStatsRef.set({
            vendorId: storefrontId,
            totalVisits: 1,
            uniqueVisitors: 1,
            totalViews: 0,
            totalCartAdds: 0,
            totalPurchases: 0,
            lastVisit: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }
        
        console.log(`✅ Updated vendor stats for: ${storefrontId}`);
      } catch (error) {
        console.warn('Failed to update vendor stats:', error);
        // Don't fail the main tracking if vendor stats update fails
      }
    }

    // Update vendor stats for other events
    if (['view', 'add_to_cart', 'purchase'].includes(activityType)) {
      try {
        const vendorStatsRef = adminDb.collection("staging_vendor_stats").doc(storefrontId);
        const updateData: any = {
          updatedAt: Timestamp.now()
        };
        
        if (activityType === 'view') {
          updateData.totalViews = adminDb.FieldValue.increment(1);
        } else if (activityType === 'add_to_cart') {
          updateData.totalCartAdds = adminDb.FieldValue.increment(1);
        } else if (activityType === 'purchase') {
          updateData.totalPurchases = adminDb.FieldValue.increment(1);
        }
        
        await vendorStatsRef.update(updateData);
        console.log(`✅ Updated vendor stats for ${activityType}: ${storefrontId}`);
      } catch (error) {
        console.warn(`Failed to update vendor stats for ${activityType}:`, error);
        // Don't fail the main tracking if vendor stats update fails
      }
    }

    console.log(`✅ Event tracked with ID: ${docRef.id}`);

    return NextResponse.json({ 
      success: true, 
      activityId: docRef.id 
    });

  } catch (error) {
    console.error('❌ Error tracking storefront event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}