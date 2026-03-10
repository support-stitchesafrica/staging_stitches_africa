/**
 * Order Analytics Service
 * 
 * This service fetches order analytics from Firebase Firestore.
 * 
 * Data Source:
 * - `users_orders/{userId}/user_orders/{orderId}` - Nested orders structure
 * 
 * Uses collectionGroup queries to handle nested structure
 * 
 * Usage:
 * ```typescript
 * import { getOrderAnalytics } from "@/services/orderAnalytics";
 * 
 * const stats = await getOrderAnalytics();
 * ```
 */

import { db } from "@/firebase";
import { collectionGroup, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

export interface OrderItem {
  order_id: string;
  tailor_id: string;
  tailor_name: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  shipping_fee: number;
  timestamp: Date;
  user_address?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

export interface OrderAnalytics {
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
}

export interface TopVendor {
  tailor_id: string;
  tailor_name: string;
  total_sales: number;
  order_count: number;
}

export interface TopProduct {
  product_id: string;
  title: string;
  units_sold: number;
  total_sales: number;
}

export interface RegionalSales {
  country: string;
  total_sales: number;
  order_count: number;
}

/**
 * Get all order analytics (all orders - delivered filter commented out)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Comprehensive order statistics
 */
export async function getOrderAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<OrderAnalytics> {
  try {
    // Use collectionGroup to query all orders across all users
    // All orders included (delivered filter commented out)
    const ordersRef = collectionGroup(db, "user_orders");
    
    let q;
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      q = query(
        ordersRef,
        // where("order_status", "==", "delivered"), // Commented out to include all orders
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(ordersRef); // Removed delivered filter to include all orders
      // q = query(ordersRef, where("order_status", "==", "delivered")); // Commented out
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        totalOrders: 0,
        totalSales: 0,
        averageOrderValue: 0,
      };
    }
    
    let totalSales = 0;
    const totalOrders = snapshot.size;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const price = data.price || 0;
      const quantity = data.quantity || 1;
      const shippingFee = data.shipping_fee || 0;
      
      // Total = (price * quantity) + shipping fee
      const orderTotal = (price * quantity) + shippingFee;
      totalSales += orderTotal;
    });
    
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return {
      totalOrders,
      totalSales,
      averageOrderValue,
    };
  } catch (error) {
    console.error("Error fetching order analytics:", error);
    return {
      totalOrders: 0,
      totalSales: 0,
      averageOrderValue: 0,
    };
  }
}

/**
 * Get top selling vendors by sales amount (all orders - delivered filter commented out)
 * @param limitCount - Number of top vendors to return (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of vendors sorted by total sales
 */
export async function getTopSellingVendors(
  limitCount: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<TopVendor[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    
    let q;
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      q = query(
        ordersRef,
        // where("order_status", "==", "delivered"), // Commented out to include all orders
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(ordersRef); // Removed delivered filter to include all orders
      // q = query(ordersRef, where("order_status", "==", "delivered")); // Commented out
    }
    
    const snapshot = await getDocs(q);
    
    const vendorSales = new Map<string, {
      tailor_name: string;
      total_sales: number;
      order_count: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const tailorId = data.tailor_id || "";
      const tailorName = data.tailor_name || "Unknown Vendor";
      const price = data.price || 0;
      const quantity = data.quantity || 1;
      const shippingFee = data.shipping_fee || 0;
      const orderTotal = (price * quantity) + shippingFee;
      
      if (!vendorSales.has(tailorId)) {
        vendorSales.set(tailorId, {
          tailor_name: tailorName,
          total_sales: 0,
          order_count: 0,
        });
      }
      
      const vendor = vendorSales.get(tailorId)!;
      vendor.total_sales += orderTotal;
      vendor.order_count++;
    });
    
    // Convert to array and sort by total sales
    return Array.from(vendorSales.entries())
      .map(([tailor_id, data]) => ({
        tailor_id,
        tailor_name: data.tailor_name,
        total_sales: data.total_sales,
        order_count: data.order_count,
      }))
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching top selling vendors:", error);
    return [];
  }
}

/**
 * Get top selling products by units sold (all orders - delivered filter commented out)
 * @param limitCount - Number of top products to return (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of products sorted by units sold
 */
export async function getTopSellingProducts(
  limitCount: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<TopProduct[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    
    let q;
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      q = query(
        ordersRef,
        // where("order_status", "==", "delivered"), // Commented out to include all orders
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(ordersRef); // Removed delivered filter to include all orders
      // q = query(ordersRef, where("order_status", "==", "delivered")); // Commented out
    }
    
    const snapshot = await getDocs(q);
    
    const productSales = new Map<string, {
      title: string;
      units_sold: number;
      total_sales: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const productId = data.product_id || "";
      const title = data.title || "Unknown Product";
      const price = data.price || 0;
      const quantity = data.quantity || 1;
      const orderTotal = price * quantity;
      
      if (!productSales.has(productId)) {
        productSales.set(productId, {
          title,
          units_sold: 0,
          total_sales: 0,
        });
      }
      
      const product = productSales.get(productId)!;
      product.units_sold += quantity;
      product.total_sales += orderTotal;
    });
    
    // Convert to array and sort by units sold
    return Array.from(productSales.entries())
      .map(([product_id, data]) => ({
        product_id,
        title: data.title,
        units_sold: data.units_sold,
        total_sales: data.total_sales,
      }))
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return [];
  }
}

/**
 * Get sales by region from user addresses (all orders - delivered filter commented out)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of regions with sales totals
 */
export async function getSalesByRegion(
  startDate?: Date,
  endDate?: Date
): Promise<RegionalSales[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    
    let q;
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      q = query(
        ordersRef,
        // where("order_status", "==", "delivered"), // Commented out to include all orders
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(ordersRef); // Removed delivered filter to include all orders
      // q = query(ordersRef, where("order_status", "==", "delivered")); // Commented out
    }
    
    const snapshot = await getDocs(q);
    
    const regionalSales = new Map<string, {
      total_sales: number;
      order_count: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userAddress = data.user_address || {};
      const country = userAddress.country || "Unknown";
      const price = data.price || 0;
      const quantity = data.quantity || 1;
      const shippingFee = data.shipping_fee || 0;
      const orderTotal = (price * quantity) + shippingFee;
      
      if (!regionalSales.has(country)) {
        regionalSales.set(country, {
          total_sales: 0,
          order_count: 0,
        });
      }
      
      const region = regionalSales.get(country)!;
      region.total_sales += orderTotal;
      region.order_count++;
    });
    
    // Convert to array and sort by total sales
    return Array.from(regionalSales.entries())
      .map(([country, data]) => ({
        country,
        total_sales: data.total_sales,
        order_count: data.order_count,
      }))
      .sort((a, b) => b.total_sales - a.total_sales);
  } catch (error) {
    console.error("Error fetching sales by region:", error);
    return [];
  }
}

/**
 * Get daily orders and sales trend
 * @param days - Number of days to look back
 * @returns Array of daily order counts and sales
 */
export async function getDailyOrdersTrend(days: number = 30): Promise<{
  day: number;
  orders: number;
  sales: number;
  date: string;
}[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    const trend: { day: number; orders: number; sales: number; date: string }[] = [];
    
    // Get data for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Query orders for this specific day
      const q = query(
        ordersRef,
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      let dailySales = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const price = data.price || 0;
        const quantity = data.quantity || 1;
        const shippingFee = data.shipping_fee || 0;
        dailySales += (price * quantity) + shippingFee;
      });
      
      trend.push({
        day: days - i,
        orders: snapshot.size,
        sales: dailySales,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    
    return trend;
  } catch (error) {
    console.error("Error fetching daily orders trend:", error);
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      orders: 0,
      sales: 0,
      date: '',
    }));
  }
}

/**
 * Get orders within a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of orders in the date range
 */
export async function getOrdersByDateRange(
  startDate: Date,
  endDate: Date
): Promise<OrderItem[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      ordersRef,
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        order_id: data.order_id || doc.id,
        tailor_id: data.tailor_id || "",
        tailor_name: data.tailor_name || "Unknown",
        product_id: data.product_id || "",
        title: data.title || "Unknown Product",
        price: data.price || 0,
        quantity: data.quantity || 1,
        shipping_fee: data.shipping_fee || 0,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        user_address: data.user_address || {},
      };
    });
  } catch (error) {
    console.error("Error fetching orders by date range:", error);
    return [];
  }
}

/**
 * Get total number of orders
 * @returns Total order count
 */
export async function getTotalOrders(): Promise<number> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    const snapshot = await getDocs(ordersRef);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching total orders:", error);
    return 0;
  }
}

/**
 * Get total sales amount
 * @returns Total sales value
 */
export async function getTotalSales(): Promise<number> {
  const analytics = await getOrderAnalytics();
  return analytics.totalSales;
}

/**
 * Get average order value
 * @returns Average order value
 */
export async function getAverageOrderValue(): Promise<number> {
  const analytics = await getOrderAnalytics();
  return analytics.averageOrderValue;
}

