/**
 * Product Analytics Data Service
 * Fetches real product analytics data from Firebase collections
 * 
 * Data Sources:
 * - shop_activities: User interactions (views, cart, purchases)
 * - product_analytics: Aggregated product statistics
 * - product_views: Individual view records
 * - tailor_works: Product details
 * - orders: Order and sales data
 */

import { db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit,
  Timestamp,
  collectionGroup
} from 'firebase/firestore';
import { ProductAnalytics } from '@/types/vendor-analytics';

interface ProductData {
  productId: string;
  title: string;
  category: string;
  price: number;
  stockLevel: number;
  vendorId: string;
  averageRating: number;
  reviewCount: number;
}

/**
 * Fetch product details from tailor_works collection
 */
async function getProductDetails(productId: string): Promise<ProductData | null> {
  try {
    const productRef = doc(db, "staging_tailor_works", productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return null;
    }
    
    const data = productDoc.data();
    
    return {
      productId,
      title: data.title || 'Unknown Product',
      category: data.category || 'Uncategorized',
      price: data.price?.base || data.price || 0,
      stockLevel: data.stock || data.quantity || 0,
      vendorId: data.tailor_id || data.tailorId || '',
      averageRating: data.averageRating || data.rating || 0,
      reviewCount: data.reviewCount || data.reviews?.length || 0
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

/**
 * Get product views from shop_activities
 */
async function getProductViews(
  productId: string,
  vendorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ totalViews: number; uniqueViews: number; viewsChange: number }> {
  try {
    const activitiesRef = collection(db, "staging_shop_activities");
    
    // Current period query
    let currentQuery = query(
      activitiesRef,
      where('productId', '==', productId),
      where('vendorId', '==', vendorId),
      where('type', '==', 'view')
    );
    
    if (dateRange) {
      currentQuery = query(
        currentQuery,
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }
    
    const currentSnapshot = await getDocs(currentQuery);
    const totalViews = currentSnapshot.size;
    
    // Count unique users
    const uniqueUsers = new Set(currentSnapshot.docs.map(doc => doc.data().userId));
    const uniqueViews = uniqueUsers.size;
    
    // Calculate previous period for comparison
    let viewsChange = 0;
    if (dateRange) {
      const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
      const previousStart = new Date(dateRange.start.getTime() - periodLength);
      const previousEnd = dateRange.start;
      
      const previousQuery = query(
        activitiesRef,
        where('productId', '==', productId),
        where('vendorId', '==', vendorId),
        where('type', '==', 'view'),
        where('timestamp', '>=', Timestamp.fromDate(previousStart)),
        where('timestamp', '<', Timestamp.fromDate(previousEnd))
      );
      
      const previousSnapshot = await getDocs(previousQuery);
      const previousViews = previousSnapshot.size;
      
      if (previousViews > 0) {
        viewsChange = ((totalViews - previousViews) / previousViews) * 100;
      }
    }
    
    return { totalViews, uniqueViews, viewsChange };
  } catch (error) {
    console.error('Error fetching product views:', error);
    return { totalViews: 0, uniqueViews: 0, viewsChange: 0 };
  }
}

/**
 * Get cart activities for a product
 */
async function getCartActivities(
  productId: string,
  vendorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ addToCartCount: number; removeFromCartCount: number; addToCartRate: number }> {
  try {
    const activitiesRef = collection(db, "staging_shop_activities");
    
    // Add to cart query
    let addQuery = query(
      activitiesRef,
      where('productId', '==', productId),
      where('vendorId', '==', vendorId),
      where('type', '==', 'add_to_cart')
    );
    
    // Remove from cart query
    let removeQuery = query(
      activitiesRef,
      where('productId', '==', productId),
      where('vendorId', '==', vendorId),
      where('type', '==', 'remove_from_cart')
    );
    
    if (dateRange) {
      const startTimestamp = Timestamp.fromDate(dateRange.start);
      const endTimestamp = Timestamp.fromDate(dateRange.end);
      
      addQuery = query(addQuery, where('timestamp', '>=', startTimestamp), where('timestamp', '<=', endTimestamp));
      removeQuery = query(removeQuery, where('timestamp', '>=', startTimestamp), where('timestamp', '<=', endTimestamp));
    }
    
    const [addSnapshot, removeSnapshot] = await Promise.all([
      getDocs(addQuery),
      getDocs(removeQuery)
    ]);
    
    const addToCartCount = addSnapshot.size;
    const removeFromCartCount = removeSnapshot.size;
    
    // Get views to calculate rate
    const { totalViews } = await getProductViews(productId, vendorId, dateRange);
    const addToCartRate = totalViews > 0 ? addToCartCount / totalViews : 0;
    
    return { addToCartCount, removeFromCartCount, addToCartRate };
  } catch (error) {
    console.error('Error fetching cart activities:', error);
    return { addToCartCount: 0, removeFromCartCount: 0, addToCartRate: 0 };
  }
}

/**
 * Get purchase data for a product
 */
async function getPurchaseData(
  productId: string,
  vendorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ salesCount: number; revenue: number; conversionRate: number }> {
  try {
    const activitiesRef = collection(db, "staging_shop_activities");
    
    let purchaseQuery = query(
      activitiesRef,
      where('productId', '==', productId),
      where('vendorId', '==', vendorId),
      where('type', '==', 'purchase')
    );
    
    if (dateRange) {
      purchaseQuery = query(
        purchaseQuery,
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
    }
    
    const purchaseSnapshot = await getDocs(purchaseQuery);
    const salesCount = purchaseSnapshot.size;
    
    // Calculate revenue
    let revenue = 0;
    purchaseSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const price = data.metadata?.price || 0;
      const quantity = data.metadata?.quantity || 1;
      revenue += price * quantity;
    });
    
    // Calculate conversion rate
    const { totalViews } = await getProductViews(productId, vendorId, dateRange);
    const conversionRate = totalViews > 0 ? salesCount / totalViews : 0;
    
    return { salesCount, revenue, conversionRate };
  } catch (error) {
    console.error('Error fetching purchase data:', error);
    return { salesCount: 0, revenue: 0, conversionRate: 0 };
  }
}

/**
 * Get customer feedback from reviews/ratings
 */
async function getCustomerFeedback(productId: string): Promise<{
  positive: number;
  negative: number;
  neutral: number;
  commonThemes: string[];
}> {
  try {
    // Check for reviews in tailor_works product document
    const productRef = doc(db, "staging_tailor_works", productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists() || !productDoc.data().reviews) {
      return {
        positive: 0,
        negative: 0,
        neutral: 0,
        commonThemes: []
      };
    }
    
    const reviews = productDoc.data().reviews || [];
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const themes: string[] = [];
    
    reviews.forEach((review: any) => {
      const rating = review.rating || review.stars || 0;
      
      // Categorize by rating
      if (rating >= 4) {
        positive++;
      } else if (rating <= 2) {
        negative++;
      } else {
        neutral++;
      }
      
      // Extract themes from comments
      if (review.comment || review.text) {
        const comment = (review.comment || review.text).toLowerCase();
        
        // Common positive themes
        if (comment.includes('quality') || comment.includes('great')) themes.push('Great quality');
        if (comment.includes('fast') || comment.includes('quick')) themes.push('Fast delivery');
        if (comment.includes('size') || comment.includes('fit')) themes.push('True to size');
        if (comment.includes('recommend')) themes.push('Highly recommended');
        
        // Common negative themes
        if (comment.includes('late') || comment.includes('slow')) themes.push('Slow delivery');
        if (comment.includes('poor') || comment.includes('bad')) themes.push('Quality issues');
        if (comment.includes('wrong') || comment.includes('incorrect')) themes.push('Incorrect item');
      }
    });
    
    // Get unique themes (top 5)
    const uniqueThemes = [...new Set(themes)].slice(0, 5);
    
    return {
      positive,
      negative,
      neutral,
      commonThemes: uniqueThemes.length > 0 ? uniqueThemes : ['No reviews yet']
    };
  } catch (error) {
    console.error('Error fetching customer feedback:', error);
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      commonThemes: []
    };
  }
}

/**
 * Get fulfillment time data from orders
 */
async function getFulfillmentData(
  productId: string,
  vendorId: string
): Promise<{ averageFulfillmentDays: number; fulfillmentSpeed: number }> {
  try {
    // Query orders from collectionGroup
    const ordersQuery = query(
      collectionGroup(db, 'user_orders'),
      where('product_id', '==', productId),
      where('tailor_id', '==', vendorId),
      where('order_status', 'in', ['completed', 'delivered'])
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    
    if (ordersSnapshot.empty) {
      return { averageFulfillmentDays: 0, fulfillmentSpeed: 0.5 };
    }
    
    const fulfillmentTimes: number[] = [];
    
    ordersSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const orderDate = data.timestamp?.toDate?.() || data.created_at?.toDate?.() || new Date();
      const deliveryDate = data.delivery_date?.toDate?.() || null;
      
      if (deliveryDate) {
        const diffMs = deliveryDate.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 0) {
          fulfillmentTimes.push(diffDays);
        }
      }
    });
    
    if (fulfillmentTimes.length === 0) {
      return { averageFulfillmentDays: 0, fulfillmentSpeed: 0.5 };
    }
    
    const avgDays = fulfillmentTimes.reduce((sum, days) => sum + days, 0) / fulfillmentTimes.length;
    
    // Score based on fulfillment time:
    // < 3 days = 1.0, 3-7 days = 0.8, 7-14 days = 0.6, 14-21 days = 0.4, > 21 days = 0.2
    let speed = 1.0;
    if (avgDays > 21) speed = 0.2;
    else if (avgDays > 14) speed = 0.4;
    else if (avgDays > 7) speed = 0.6;
    else if (avgDays > 3) speed = 0.8;
    
    return {
      averageFulfillmentDays: Math.round(avgDays * 10) / 10,
      fulfillmentSpeed: speed
    };
  } catch (error) {
    console.error('Error fetching fulfillment data:', error);
    return { averageFulfillmentDays: 0, fulfillmentSpeed: 0.5 };
  }
}

/**
 * Get complaint/return rate from orders
 */
async function getComplaintData(
  productId: string,
  vendorId: string
): Promise<{ complaintScore: number; returnRate: number }> {
  try {
    // Query all orders for this product
    const ordersQuery = query(
      collectionGroup(db, 'user_orders'),
      where('product_id', '==', productId),
      where('tailor_id', '==', vendorId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    
    if (ordersSnapshot.empty) {
      return { complaintScore: 0, returnRate: 0 };
    }
    
    const totalOrders = ordersSnapshot.size;
    let returnedOrders = 0;
    let complainedOrders = 0;
    
    ordersSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      
      // Check for returns
      if (data.order_status === 'returned' || data.is_returned) {
        returnedOrders++;
      }
      
      // Check for complaints (low ratings or complaint flags)
      if (data.complaint || data.has_complaint || (data.rating && data.rating <= 2)) {
        complainedOrders++;
      }
    });
    
    const returnRate = totalOrders > 0 ? returnedOrders / totalOrders : 0;
    const complaintScore = totalOrders > 0 ? complainedOrders / totalOrders : 0;
    
    return {
      complaintScore: Math.min(1, complaintScore),
      returnRate: Math.min(1, returnRate)
    };
  } catch (error) {
    console.error('Error fetching complaint data:', error);
    return { complaintScore: 0, returnRate: 0 };
  }
}

/**
 * Calculate ranking factors based on real data
 */
async function calculateRankingFactors(
  productId: string,
  vendorId: string,
  views: number,
  addToCartRate: number,
  conversionRate: number,
  rating: number,
  stockLevel: number
): Promise<any> {
  // CTR (click-through rate) - using add to cart as proxy
  const ctr = addToCartRate;
  
  // Rating normalized to 0-1
  const ratingScore = rating / 5;
  
  // Stock health (1 if in stock, decreases as stock gets low)
  const stockHealth = stockLevel > 10 ? 1 : stockLevel > 5 ? 0.7 : stockLevel > 0 ? 0.4 : 0;
  
  // Fetch real fulfillment and complaint data
  const [fulfillmentData, complaintData] = await Promise.all([
    getFulfillmentData(productId, vendorId),
    getComplaintData(productId, vendorId)
  ]);
  
  const fulfillmentSpeed = fulfillmentData.fulfillmentSpeed;
  const complaintScore = complaintData.complaintScore;
  
  // Placeholder for price competitiveness (would need market data)
  const priceCompetitiveness = 0.75;
  
  // Engagement signals based on views and interactions
  const engagementSignals = views > 100 ? 0.8 : views > 50 ? 0.6 : 0.4;
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    ctr * 15 +
    conversionRate * 20 +
    ratingScore * 15 +
    fulfillmentSpeed * 15 +
    (1 - complaintScore) * 10 +
    stockHealth * 10 +
    priceCompetitiveness * 10 +
    engagementSignals * 5
  );
  
  return {
    ctr,
    conversionRate,
    rating: ratingScore,
    fulfillmentSpeed,
    complaintScore,
    stockHealth,
    priceCompetitiveness,
    engagementSignals,
    overallScore: Math.min(100, Math.max(0, overallScore)),
    // Additional metrics
    averageFulfillmentDays: fulfillmentData.averageFulfillmentDays,
    returnRate: complaintData.returnRate
  };
}

/**
 * Generate recommendations based on analytics data
 */
function generateRecommendations(
  views: number,
  addToCartRate: number,
  conversionRate: number,
  rating: number,
  stockLevel: number,
  fulfillmentSpeed: number,
  complaintScore: number,
  returnRate: number
): string[] {
  const recommendations: string[] = [];
  
  if (views < 50) {
    recommendations.push('Improve product visibility by optimizing title and description with relevant keywords');
  }
  
  if (addToCartRate < 0.05) {
    recommendations.push('Improve product images and add more detailed photos to increase add-to-cart rate');
  }
  
  if (conversionRate < 0.02) {
    recommendations.push('Review pricing strategy and consider competitive pricing to boost conversions');
  }
  
  if (rating < 4.0) {
    recommendations.push('Address customer feedback to improve product ratings and reviews');
  }
  
  if (stockLevel < 10) {
    recommendations.push('Maintain adequate stock levels to avoid visibility penalties and lost sales');
  }
  
  if (fulfillmentSpeed < 0.7) {
    recommendations.push('Reduce fulfillment time to improve customer satisfaction and ranking score');
  }
  
  if (complaintScore > 0.1) {
    recommendations.push('Review customer complaints and address quality or service issues promptly');
  }
  
  if (returnRate > 0.15) {
    recommendations.push('High return rate detected - ensure product descriptions and images accurately represent the item');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great performance! Continue monitoring metrics and maintaining quality');
  }
  
  return recommendations;
}

/**
 * Main function to get complete product analytics
 */
export async function getProductAnalytics(
  productId: string,
  vendorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<ProductAnalytics | null> {
  try {
    // Fetch product details
    const productDetails = await getProductDetails(productId);
    if (!productDetails) {
      throw new Error('Product not found');
    }
    
    // Verify vendor ownership
    if (productDetails.vendorId !== vendorId) {
      throw new Error('Unauthorized: Product does not belong to this vendor');
    }
    
    // Fetch all analytics data in parallel
    const [viewsData, cartData, purchaseData, feedbackData] = await Promise.all([
      getProductViews(productId, vendorId, dateRange),
      getCartActivities(productId, vendorId, dateRange),
      getPurchaseData(productId, vendorId, dateRange),
      getCustomerFeedback(productId)
    ]);
    
    // Calculate ranking factors (now async with real fulfillment/complaint data)
    const rankingFactors = await calculateRankingFactors(
      productId,
      vendorId,
      viewsData.totalViews,
      cartData.addToCartRate,
      purchaseData.conversionRate,
      productDetails.averageRating,
      productDetails.stockLevel
    );
    
    // Generate recommendations with real data
    const recommendations = generateRecommendations(
      viewsData.totalViews,
      cartData.addToCartRate,
      purchaseData.conversionRate,
      productDetails.averageRating,
      productDetails.stockLevel,
      rankingFactors.fulfillmentSpeed,
      rankingFactors.complaintScore,
      rankingFactors.returnRate || 0
    );
    
    // Determine if trending (high views in recent period)
    const isTrending = viewsData.viewsChange > 20 && viewsData.totalViews > 50;
    
    // Calculate visibility score (same as overall ranking score)
    const visibilityScore = rankingFactors.overallScore;
    
    // Estimate ranking position (would need to compare with other products)
    const rankingPosition = Math.max(1, Math.round(100 - visibilityScore));
    
    const analytics: ProductAnalytics = {
      productId,
      title: productDetails.title,
      vendorId,
      views: viewsData.totalViews,
      viewsChange: viewsData.viewsChange,
      addToCartRate: cartData.addToCartRate,
      conversionRate: purchaseData.conversionRate,
      salesCount: purchaseData.salesCount,
      revenue: purchaseData.revenue,
      averageRating: productDetails.averageRating,
      reviewCount: productDetails.reviewCount,
      visibilityScore,
      rankingPosition,
      category: productDetails.category,
      stockLevel: productDetails.stockLevel,
      isTrending,
      customerComments: feedbackData,
      rankingFactors,
      recommendations,
      updatedAt: new Date()
    };
    
    return analytics;
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return null;
  }
}

/**
 * Get analytics for multiple products (for vendor dashboard)
 */
export async function getVendorProductsAnalytics(
  vendorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<ProductAnalytics[]> {
  try {
    // Get all products for this vendor
    const productsRef = collection(db, "staging_tailor_works");
    const productsQuery = query(
      productsRef,
      where('tailor_id', '==', vendorId)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    
    // Fetch analytics for each product
    const analyticsPromises = productsSnapshot.docs.map(doc => 
      getProductAnalytics(doc.id, vendorId, dateRange)
    );
    
    const analyticsResults = await Promise.all(analyticsPromises);
    
    // Filter out null results
    return analyticsResults.filter((a): a is ProductAnalytics => a !== null);
  } catch (error) {
    console.error('Error fetching vendor products analytics:', error);
    return [];
  }
}
