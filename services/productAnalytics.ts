/**
 * Product Analytics Service
 * 
 * This service fetches product view analytics from Firebase Firestore.
 * 
 * Data Sources:
 * - `product_analytics` collection: Aggregated product statistics (fast queries)
 * - `product_views` collection: Individual view records (detailed analytics)
 * 
 * Usage:
 * ```typescript
 * import { getTopViewedProducts } from "@/services/productAnalytics";
 * 
 * const topProducts = await getTopViewedProducts(10);
 * ```
 */

import { db } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, getCountFromServer, Timestamp } from "firebase/firestore";

export interface ProductViewData {
  product_id: string;
  product_title: string;
  vendor_name?: string;
  tailor_id?: string;
  total_views: number;
  category?: string;
  price?: number;
  first_viewed?: Date;
  last_viewed?: Date;
}

/**
 * Helper function to get product details from product_views or tailor_works
 * @param productId - The product ID
 * @returns Product details or default values
 */
async function getProductDetails(productId: string): Promise<{ title: string; vendor_name?: string; tailor_id?: string; category?: string; price?: number }> {
  try {
    // First, try to get from product_views (most recent view)
    const productViewsRef = collection(db, "staging_product_views");
    const q = query(
      productViewsRef,
      where("product_id", "==", productId),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        title: data.product_title || "Unknown Product",
        vendor_name: data.vendor_name || undefined,
        tailor_id: data.vendor_id || data.tailorId || undefined,
        category: data.category || undefined,
        price: data.price || undefined,
      };
    }
    
    // If not found in product_views, try tailor_works
    const tailorWorksRef = doc(db, "staging_tailor_works", productId);
    const tailorWorkDoc = await getDoc(tailorWorksRef);
    
    if (tailorWorkDoc.exists()) {
      const data = tailorWorkDoc.data();
      return {
        title: data.title || "Unknown Product",
        vendor_name: data.vendor_name || undefined,
        tailor_id: data.tailor_id || data.tailorId || undefined,
        category: data.category || undefined,
        price: data.price || undefined,
      };
    }
    
    return { title: "Unknown Product" };
  } catch (error) {
    console.error(`Error fetching product details for ${productId}:`, error);
    return { title: "Unknown Product" };
  }
}

/**
 * Get top viewed products
 * @param limitCount - Number of top products to fetch (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of products sorted by view count (descending)
 */
/**
 * Get top viewed products
 * @param limitCount - Number of top products to fetch (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of products sorted by view count (descending)
 */
export async function getTopViewedProducts(
  limitCount: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<ProductViewData[]> {
  try {
    if (startDate && endDate) {
      // Stratgey: Query product_views for the period and aggregate manually
      // This ensures we count actual views IN this period, rather than sorting by recency
      
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const productViewsRef = collection(db, "staging_product_views");
      const q = query(
        productViewsRef,
        where("timestamp", ">=", Timestamp.fromDate(adjustedStartDate)),
        where("timestamp", "<=", Timestamp.fromDate(adjustedEndDate)),
        orderBy("timestamp", "desc"),
        limit(2000) // Limit to prevent excessive data fetching
      );
      
      const snapshot = await getDocs(q);
      
      // Aggregate views by product_id
      const productMap = new Map<string, { 
        count: number; 
        latestDoc: any;
      }>();
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const productId = data.product_id;
        
        if (!process.env.NEXT_PUBLIC_IS_PRODUCTION && !productId) {
           console.warn('Found product view with no product_id', doc.id);
           return;
        }
        
        if (!productId) return;

        if (!productMap.has(productId)) {
          productMap.set(productId, { 
            count: 0, 
            latestDoc: data 
          });
        }
        productMap.get(productId)!.count++;
      });
      
      // Convert to array and sort by count
      const sortedProducts = Array.from(productMap.entries())
        .map(([productId, info]) => {
          const { count, latestDoc } = info;
          return {
            product_id: productId,
            product_title: latestDoc.product_title || "Unknown Product",
            vendor_name: latestDoc.vendor_name,
            tailor_id: latestDoc.vendor_id || latestDoc.tailorId,
            category: latestDoc.category,
            price: latestDoc.price,
            total_views: count,
            last_viewed: latestDoc.timestamp?.toDate?.() || undefined,
          };
        })
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, limitCount);
        
      return sortedProducts;

    } else {
        // Fallback to lifetime stats if no date range
        const productAnalyticsRef = collection(db, "staging_product_analytics");
        const q = query(
            productAnalyticsRef,
            orderBy("total_views", "desc"),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        
        // Fetch product details for each product
        const productDataPromises = snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const productId = data.product_id || docSnapshot.id;
        
        // Get product details from product_views or tailor_works
        const productDetails = await getProductDetails(productId);
        
        return {
            product_id: productId,
            product_title: productDetails.title,
            vendor_name: productDetails.vendor_name,
            tailor_id: productDetails.tailor_id,
            category: productDetails.category,
            price: productDetails.price,
            total_views: data.total_views || 0,
            first_viewed: data.first_viewed?.toDate?.() || undefined,
            last_viewed: data.last_viewed?.toDate?.() || undefined,
        };
        });
        
        const allProducts = await Promise.all(productDataPromises);
        
        // Sort by total_views descending to ensure correct order
        const sortedProducts = allProducts.sort((a, b) => b.total_views - a.total_views);
        
        return sortedProducts.slice(0, limitCount);
    }
  } catch (error) {
    console.error("Error fetching top viewed products:", error);
    return [];
  }
}

/**
 * Get view count for a specific product
 * @param productId - The product ID
 * @returns Total view count for the product
 */
export async function getProductViewCount(productId: string): Promise<number> {
  try {
    const productDocRef = doc(db, "staging_product_analytics", productId);
    const productDoc = await getDoc(productDocRef);
    
    if (productDoc.exists()) {
      return productDoc.data().total_views || 0;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching view count for product ${productId}:`, error);
    return 0;
  }
}

/**
 * Get total number of product views across all products
 * @returns Total view count
 */
export async function getTotalProductViews(): Promise<number> {
  try {
    const productViewsRef = collection(db, "staging_product_views");
    const snapshot = await getCountFromServer(productViewsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total product views:", error);
    return 0;
  }
}

/**
 * Get product views by category
 * @returns Object with counts for each category
 */
export async function getProductViewsByCategory(): Promise<{ [category: string]: number }> {
  try {
    const productViewsRef = collection(db, "staging_product_views");
    const snapshot = await getDocs(productViewsRef);
    
    const categoryCounts: { [category: string]: number } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const category = data.category || "Uncategorized";
      
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });
    
    return categoryCounts;
  } catch (error) {
    console.error("Error fetching views by category:", error);
    return {};
  }
}

/**
 * Get trending products (most views in recent period)
 * @param days - Number of days to look back (default: 7)
 * @param limitCount - Number of top products to return (default: 10)
 * @returns Array of trending products
 */
export async function getTrendingProducts(
  days: number = 7,
  limitCount: number = 10
): Promise<ProductViewData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const productViewsRef = collection(db, "staging_product_views");
    const q = query(
      productViewsRef,
      where("timestamp", ">=", startDate),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    // Group by product_id and count views, also store product info
    const productData: { [key: string]: { count: number; title: string; vendor: string; category?: string; price?: number } } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const productId = data.product_id;
      
      if (!productData[productId]) {
        productData[productId] = {
          count: 0,
          title: data.product_title || "Unknown Product",
          vendor: data.vendor_name || "",
          category: data.category,
          price: data.price,
        };
      }
      productData[productId].count++;
    });
    
    // Convert to array, sort, and format
    return Object.entries(productData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limitCount)
      .map(([product_id, data]) => ({
        product_id,
        product_title: data.title,
        vendor_name: data.vendor || undefined,
        category: data.category || undefined,
        price: data.price || undefined,
        total_views: data.count,
      }));
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}

