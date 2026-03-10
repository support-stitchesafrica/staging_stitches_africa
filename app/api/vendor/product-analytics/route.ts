/**
 * Product Analytics API
 * Provides real-time product analytics based on shop activities
 * 
 * Validates: Requirements 22.2, 22.3, 22.4, 22.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  return NextResponse.json({ 
    message: 'Product analytics API is working',
    timestamp: new Date().toISOString(),
    usage: 'Send POST request with productId, vendorId, and dateRange'
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Product analytics API called - fetching real data');
    const body = await request.json();
    const { productId, vendorId, dateRange } = body;

    if (!productId || !vendorId) {
      return NextResponse.json(
        { error: 'Product ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    // Parse date range
    const start = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = dateRange?.end ? new Date(dateRange.end) : new Date();

    console.log(`Fetching analytics for product ${productId} from ${start.toISOString()} to ${end.toISOString()}`);

    // Get product details from tailor_works collection first
    let productData: any = null;
    console.log(`Looking for product ${productId} in tailor_works collection...`);

    // First try: Use productId as document ID
    try {
      const productDoc = await adminDb.collection("staging_tailor_works").doc(productId).get();
      if (productDoc.exists) {
        productData = productDoc.data();
        console.log('Product found by document ID in tailor_works');
      }
    } catch (error) {
      console.log('Error fetching by document ID:', error);
    }

    // Second try: Look for 'id' field in tailor_works
    if (!productData) {
      console.log(`Product not found with document ID, trying 'id' field in tailor_works`);
      const productsSnapshot = await adminDb
        .collection("staging_tailor_works")
        .where('id', '==', productId)
        .limit(1)
        .get();
      
      if (!productsSnapshot.empty) {
        productData = productsSnapshot.docs[0].data();
        console.log('Product found by id field in tailor_works');
      }
    }

    if (!productData) {
      console.log(`Product ${productId} not found in tailor_works collection`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get the actual vendor ID from the product
    const actualVendorId = productData.tailor_id || productData.tailorId || vendorId;
    console.log('Product data:', { 
      title: productData.title, 
      category: productData.category,
      productVendorId: actualVendorId,
      requestedVendorId: vendorId
    });

    // Now get activity summary using the actual vendor ID
    const activitySummary = await getProductAnalyticsSummary(
      productId,
      actualVendorId,
      { start, end }
    );

    console.log('Activity summary:', activitySummary);

    // Get activity timeline
    const timeline = await getActivityTimeline(productId, { start, end });
    console.log(`Activity timeline: ${timeline.length} activities`);

    // Get peak activity times
    const peakTimes = await getPeakActivityTimes(productId, { start, end });
    console.log('Peak times calculated');

    // Calculate ranking factors from real data
    const rankingFactors = calculateRankingFactors(activitySummary, productData);

    // Generate recommendations
    const recommendations = generateRecommendations(activitySummary, rankingFactors);

    // Extract price from tailor_works structure
    const getPrice = (priceData: any): number => {
      if (typeof priceData === 'number') return priceData;
      if (priceData && typeof priceData.base === 'number') return priceData.base;
      return 0;
    };

    // Build comprehensive analytics response
    const analytics = {
      productId,
      vendorId: actualVendorId, // Use the actual vendor ID from the product
      title: productData.title || 'Unknown Product',
      category: productData.category || 'Uncategorized',
      
      // Real view counts from activities (Requirement 22.2)
      views: activitySummary?.totalViews || 0,
      uniqueViews: activitySummary?.uniqueViews || 0,
      viewsChange: 0, // TODO: Calculate from previous period
      
      // Real add-to-cart rates from activities (Requirement 22.2)
      addToCartRate: (activitySummary?.addToCartRate || 0) / 100,
      addToCartCount: activitySummary?.addToCartCount || 0,
      
      // Real conversion rates from activities (Requirement 22.3)
      conversionRate: (activitySummary?.conversionRate || 0) / 100,
      cartConversionRate: (activitySummary?.cartConversionRate || 0) / 100,
      
      // Sales and revenue (from real orders)
      salesCount: activitySummary?.completedOrders || 0, // Use completed orders for sales count
      totalOrders: activitySummary?.purchaseCount || 0, // Total orders placed
      revenue: activitySummary?.totalRevenue || 0,
      averageOrderValue: activitySummary?.averageOrderValue || 0,
      
      // Product details from tailor_works
      averageRating: productData.averageRating || productData.rating || 0,
      reviewCount: productData.reviewCount || (productData.reviews ? productData.reviews.length : 0),
      stockLevel: productData.stock || productData.quantity || 0,
      price: getPrice(productData.price),
      isTrending: productData.isTrending || false,
      
      // Visibility and ranking
      visibilityScore: rankingFactors.overallScore,
      rankingPosition: productData.rankingPosition || 0,
      rankingFactors,
      
      // Customer feedback (using defaults since tailor_works may not have these)
      customerComments: {
        positive: productData.positiveComments || 0,
        neutral: productData.neutralComments || 0,
        negative: productData.negativeComments || 0,
        commonThemes: productData.commonThemes || []
      },
      
      // Activity timeline (Requirement 22.4)
      activityTimeline: timeline,
      
      // Peak activity times and patterns (Requirement 22.5)
      peakActivityTimes: peakTimes,
      
      // Recommendations
      recommendations,
      
      updatedAt: new Date().toISOString()
    };

    console.log('Analytics response prepared with real data');
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Gets product analytics summary from activities and real orders
 */
async function getProductAnalyticsSummary(
  productId: string,
  vendorId: string,
  dateRange: { start: Date; end: Date }
) {
  try {
    // Get shop activities (views, cart actions)
    const activitiesSnapshot = await adminDb
      .collection("staging_shop_activities")
      .where('productId', '==', productId)
      .where('timestamp', '>=', dateRange.start)
      .where('timestamp', '<=', dateRange.end)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => doc.data());

    const views = activities.filter(a => a.type === 'view');
    const addToCarts = activities.filter(a => a.type === 'add_to_cart');
    const uniqueUsers = new Set(views.map(a => a.userId));

    const viewCount = views.length;
    const addToCartCount = addToCarts.length;

    // Get real sales data from orders collection
    // Use the same approach as the working analytics service
    console.log(`Fetching orders for product ${productId} and vendor ${vendorId}`);
    
    const orders: any[] = [];
    
    // Get all users first
    const usersSnap = await adminDb.collection("staging_users").get();
    console.log(`Found ${usersSnap.docs.length} users to check for orders`);
    
    // Fetch orders from all users in parallel
    await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        
        try {
          const userOrdersSnap = await adminDb
            .collection("staging_users_orders")
            .doc(userId)
            .collection("user_orders")
            .get();

          userOrdersSnap.docs.forEach(orderDoc => {
            const orderData = orderDoc.data();
            
            // Show sample orders for this vendor to debug (try different field names)
            if (orderData.tailor_id === vendorId || orderData.tailorId === vendorId || orderData.vendor_id === vendorId) {
              console.log('Found order for vendor:', {
                id: orderDoc.id,
                product_id: orderData.product_id,
                tailor_id: orderData.tailor_id,
                tailorId: orderData.tailorId,
                vendor_id: orderData.vendor_id,
                status: orderData.status,
                price: orderData.price
              });
            }
            
            // Also log first few orders to see the structure
            if (orders.length < 3) {
              console.log('Sample order structure:', {
                id: orderDoc.id,
                fields: Object.keys(orderData),
                tailor_id: orderData.tailor_id,
                tailorId: orderData.tailorId,
                vendor_id: orderData.vendor_id,
                product_id: orderData.product_id
              });
            }
            
            // Filter by product and vendor
            if (orderData.product_id === productId && orderData.tailor_id === vendorId) {
              orders.push({
                id: orderDoc.id,
                userId,
                ...orderData
              });
            }
          });
        } catch (error) {
          console.log(`Error fetching orders for user ${userId}:`, error);
        }
      })
    );

    console.log(`Found ${orders.length} orders for product ${productId} and vendor ${vendorId}`);

    // Calculate real sales metrics from orders
    let totalRevenue = 0;
    let purchaseCount = 0;
    const completedOrders = [];

    orders.forEach(order => {
      console.log('Processing order:', {
        id: order.id,
        status: order.order_status || order.status,
        price: order.price,
        quantity: order.quantity,
        timestamp: order.timestamp,
        created_at: order.created_at
      });

      // Get order date from either timestamp or created_at field
      let orderDate: Date | null = null;
      if (order.timestamp?.toDate) {
        orderDate = order.timestamp.toDate();
      } else if (order.created_at?.toDate) {
        orderDate = order.created_at.toDate();
      } else if (order.timestamp) {
        orderDate = new Date(order.timestamp);
      } else if (order.created_at) {
        orderDate = new Date(order.created_at);
      }

      console.log('Order date processing:', {
        orderDate: orderDate?.toISOString(),
        dateRangeStart: dateRange.start.toISOString(),
        dateRangeEnd: dateRange.end.toISOString(),
        inRange: orderDate && orderDate >= dateRange.start && orderDate <= dateRange.end
      });

      // Filter by date range
      if (orderDate && orderDate >= dateRange.start && orderDate <= dateRange.end) {
        console.log('Valid order found:', { 
          id: order.id, 
          tailor_id: order.tailor_id,
          product_id: order.product_id,
          status: order.order_status || order.status, 
          price: order.price, 
          quantity: order.quantity,
          orderDate: orderDate.toISOString()
        });

        // Count all orders as purchases (regardless of status for now)
        purchaseCount++;
        
        // Calculate revenue from completed/delivered orders
        const orderStatus = order.order_status || order.status;
        if (orderStatus === 'completed' || orderStatus === 'delivered') {
          const orderRevenue = (order.price || 0) * (order.quantity || 1);
          totalRevenue += orderRevenue;
          completedOrders.push(order);
          console.log('Revenue calculated:', { orderRevenue, totalRevenue });
        } else {
          console.log('Order not completed:', { status: orderStatus });
        }
      } else {
        console.log('Order filtered out by date range');
      }
    });

    console.log(`Sales summary: ${purchaseCount} total orders, ${completedOrders.length} completed, $${totalRevenue} revenue`);

    return {
      totalViews: viewCount,
      uniqueViews: uniqueUsers.size,
      addToCartCount,
      removeFromCartCount: activities.filter(a => a.type === 'remove_from_cart').length,
      purchaseCount, // Total orders placed
      completedOrders: completedOrders.length, // Only completed orders
      conversionRate: viewCount > 0 ? (purchaseCount / viewCount) * 100 : 0,
      addToCartRate: viewCount > 0 ? (addToCartCount / viewCount) * 100 : 0,
      cartConversionRate: addToCartCount > 0 ? (purchaseCount / addToCartCount) * 100 : 0,
      totalRevenue, // Revenue from completed orders only
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
    };
  } catch (error) {
    console.error('Error getting product analytics summary:', error);
    return {
      totalViews: 0,
      uniqueViews: 0,
      addToCartCount: 0,
      removeFromCartCount: 0,
      purchaseCount: 0,
      completedOrders: 0,
      conversionRate: 0,
      addToCartRate: 0,
      cartConversionRate: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }
}

/**
 * Gets activity timeline for a product
 * Validates: Requirement 22.4
 */
async function getActivityTimeline(
  productId: string,
  dateRange: { start: Date; end: Date }
) {
  try {
    const snapshot = await adminDb
      .collection("staging_shop_activities")
      .where('productId', '==', productId)
      .where('timestamp', '>=', dateRange.start)
      .where('timestamp', '<=', dateRange.end)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: data.userId,
        deviceType: data.metadata?.deviceType || 'unknown',
        location: data.metadata?.location,
        metadata: {
          price: data.metadata?.price,
          quantity: data.metadata?.quantity
        }
      };
    });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    return [];
  }
}

/**
 * Calculates peak activity times and patterns
 * Validates: Requirement 22.5
 */
async function getPeakActivityTimes(
  productId: string,
  dateRange: { start: Date; end: Date }
) {
  try {
    const snapshot = await adminDb
      .collection("staging_shop_activities")
      .where('productId', '==', productId)
      .where('timestamp', '>=', dateRange.start)
      .where('timestamp', '<=', dateRange.end)
      .orderBy('timestamp', 'asc')
      .get();
    
    // Group activities by hour of day
    const hourlyActivity: { [hour: number]: number } = {};
    const dailyActivity: { [day: string]: number } = {};
    const deviceActivity: { [device: string]: number } = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || new Date();
      
      // Hour of day (0-23)
      const hour = timestamp.getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      
      // Day of week (0-6)
      const day = timestamp.toLocaleDateString('en-US', { weekday: 'long' });
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
      
      // Device type
      const device = data.metadata?.deviceType || 'unknown';
      deviceActivity[device] = (deviceActivity[device] || 0) + 1;
    });
    
    // Find peak hour
    const peakHour = Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b - a)[0];
    
    // Find peak day
    const peakDay = Object.entries(dailyActivity)
      .sort(([, a], [, b]) => b - a)[0];
    
    // Find most common device
    const topDevice = Object.entries(deviceActivity)
      .sort(([, a], [, b]) => b - a)[0];
    
    return {
      peakHour: peakHour ? {
        hour: parseInt(peakHour[0]),
        count: peakHour[1],
        label: formatHour(parseInt(peakHour[0]))
      } : null,
      peakDay: peakDay ? {
        day: peakDay[0],
        count: peakDay[1]
      } : null,
      topDevice: topDevice ? {
        device: topDevice[0],
        count: topDevice[1],
        percentage: (topDevice[1] / snapshot.size) * 100
      } : null,
      hourlyDistribution: Object.entries(hourlyActivity).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        label: formatHour(parseInt(hour))
      })),
      dailyDistribution: Object.entries(dailyActivity).map(([day, count]) => ({
        day,
        count
      })),
      deviceDistribution: Object.entries(deviceActivity).map(([device, count]) => ({
        device,
        count,
        percentage: (count / snapshot.size) * 100
      }))
    };
  } catch (error) {
    console.error('Error calculating peak activity times:', error);
    return {
      peakHour: null,
      peakDay: null,
      topDevice: null,
      hourlyDistribution: [],
      dailyDistribution: [],
      deviceDistribution: []
    };
  }
}

/**
 * Formats hour as 12-hour time
 */
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

/**
 * Calculates ranking factors from real activity data
 */
function calculateRankingFactors(activitySummary: any, productData: any) {
  const views = activitySummary?.totalViews || 0;
  const addToCartRate = activitySummary?.addToCartRate || 0;
  const conversionRate = activitySummary?.conversionRate || 0;
  
  // Get stock from tailor_works structure
  const stock = productData.stock || productData.quantity || 0;
  // Get rating from tailor_works structure
  const rating = productData.averageRating || productData.rating || 0;
  
  return {
    ctr: views > 0 ? Math.min(addToCartRate / 100, 1) : 0,
    conversionRate: conversionRate / 100,
    rating: rating / 5,
    fulfillmentSpeed: productData.fulfillmentSpeed || 0.7,
    complaintScore: 1 - (productData.complaintRate || 0),
    stockHealth: stock > 10 ? 1 : stock / 10,
    priceCompetitiveness: productData.priceCompetitiveness || 0.5,
    engagementSignals: Math.min((activitySummary?.addToCartCount || 0) / 100, 1),
    overallScore: calculateOverallScore(
      addToCartRate / 100,
      conversionRate / 100,
      rating,
      stock
    )
  };
}

/**
 * Calculates overall visibility score
 */
function calculateOverallScore(
  ctr: number,
  conversionRate: number,
  rating: number,
  stock: number
): number {
  const weights = {
    ctr: 0.25,
    conversion: 0.30,
    rating: 0.25,
    stock: 0.20
  };
  
  const normalizedRating = rating / 5;
  const normalizedStock = Math.min(stock / 50, 1);
  
  const score = (
    ctr * weights.ctr +
    conversionRate * weights.conversion +
    normalizedRating * weights.rating +
    normalizedStock * weights.stock
  ) * 100;
  
  return Math.round(Math.min(score, 100));
}

/**
 * Generates recommendations based on analytics
 */
function generateRecommendations(activitySummary: any, rankingFactors: any): string[] {
  const recommendations: string[] = [];
  
  const conversionRate = activitySummary?.conversionRate || 0;
  const addToCartRate = activitySummary?.addToCartRate || 0;
  const views = activitySummary?.totalViews || 0;
  
  if (views < 100) {
    recommendations.push('Improve product visibility by optimizing title and images');
  }
  
  if (addToCartRate < 5) {
    recommendations.push('Low add-to-cart rate - consider improving product images and description');
  }
  
  if (conversionRate < 2) {
    recommendations.push('Low conversion rate - review pricing and product details');
  }
  
  if (rankingFactors.rating < 0.8) {
    recommendations.push('Address customer feedback to improve product ratings');
  }
  
  if (rankingFactors.stockHealth < 0.5) {
    recommendations.push('Maintain adequate stock levels to avoid visibility penalties');
  }
  
  return recommendations;
}
