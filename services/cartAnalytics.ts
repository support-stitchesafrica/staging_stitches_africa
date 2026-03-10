/**
 * Cart Analytics Service
 * 
 * This service fetches cart analytics from Firebase Firestore.
 * 
 * Data Source:
 * - `users_cart_items/{userId}/user_cart_items/{itemId}` - Nested cart items
 * 
 * Uses collectionGroup queries to handle nested structure
 * 
 * Usage:
 * ```typescript
 * import { getCartAnalytics } from "@/services/cartAnalytics";
 * 
 * const stats = await getCartAnalytics();
 * ```
 */

import { db } from "@/firebase";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";

export interface CartItem {
  price: number;
  discount: number;
  quantity: number;
  user_id?: string;
  tailor_id: string;
  product_id: string;
  title: string;
}

export interface CartAnalytics {
  averageCartValue: number;
  abandonedCartCount: number;
  abandonedCartValue: number;
  totalCartItems: number;
  totalUsersWithCarts: number;
}

/**
 * Calculate final price after discount
 */
function calculateItemPrice(price: number, discount: number, quantity: number): number {
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;
  return discountedPrice * quantity;
}

/**
 * Get all cart analytics
 * @returns Comprehensive cart statistics
 */
export async function getCartAnalytics(): Promise<CartAnalytics> {
  try {
    // Use collectionGroup to query all cart items across all users
    const cartItemsRef = collectionGroup(db, "user_cart_items");
    const snapshot = await getDocs(cartItemsRef);
    
    if (snapshot.empty) {
      return {
        averageCartValue: 0,
        abandonedCartCount: 0,
        abandonedCartValue: 0,
        totalCartItems: 0,
        totalUsersWithCarts: 0,
      };
    }
    
    // Group cart items by user
    const userCarts = new Map<string, { items: CartItem[]; totalValue: number }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const parentPath = doc.ref.parent.parent?.path || "";
      const userId = parentPath.split("/")[1] || "unknown";
      
      // Calculate item price
      const price = data.price || 0;
      const discount = data.discount || 0;
      const quantity = data.quantity || 1;
      const itemValue = calculateItemPrice(price, discount, quantity);
      
      const item: CartItem = {
        price,
        discount,
        quantity,
        user_id: userId,
        tailor_id: data.tailor_id || data.tailorId || "",
        product_id: data.product_id || data.productId || "",
        title: data.title || "",
      };
      
      if (!userCarts.has(userId)) {
        userCarts.set(userId, { items: [], totalValue: 0 });
      }
      
      const userCart = userCarts.get(userId)!;
      userCart.items.push(item);
      userCart.totalValue += itemValue;
    });
    
    // Calculate analytics
    let totalCartValue = 0;
    let totalItems = 0;
    
    userCarts.forEach((cart) => {
      totalCartValue += cart.totalValue;
      totalItems += cart.items.length;
    });
    
    const totalUsersWithCarts = userCarts.size;
    const averageCartValue = totalUsersWithCarts > 0 ? totalCartValue / totalUsersWithCarts : 0;
    
    // For abandoned carts, we assume all carts in the system are "abandoned"
    // (items added but not checked out)
    const abandonedCartCount = totalUsersWithCarts;
    const abandonedCartValue = totalCartValue;
    
    return {
      averageCartValue,
      abandonedCartCount,
      abandonedCartValue,
      totalCartItems: totalItems,
      totalUsersWithCarts,
    };
  } catch (error) {
    console.error("Error fetching cart analytics:", error);
    return {
      averageCartValue: 0,
      abandonedCartCount: 0,
      abandonedCartValue: 0,
      totalCartItems: 0,
      totalUsersWithCarts: 0,
    };
  }
}

/**
 * Get average cart value across all users
 * @returns Average cart value in currency
 */
export async function getAverageCartValue(): Promise<number> {
  const analytics = await getCartAnalytics();
  return analytics.averageCartValue;
}

/**
 * Get count of abandoned carts (carts with items)
 * @returns Number of users with items in cart
 */
export async function getAbandonedCartCount(): Promise<number> {
  const analytics = await getCartAnalytics();
  return analytics.abandonedCartCount;
}

/**
 * Get total value of all abandoned carts
 * @returns Total value of items in all carts
 */
export async function getAbandonedCartValue(): Promise<number> {
  const analytics = await getCartAnalytics();
  return analytics.abandonedCartValue;
}

/**
 * Get cart items for a specific user
 * @param userId - The user ID
 * @returns Array of cart items for the user
 */
export async function getUserCartItems(userId: string): Promise<CartItem[]> {
  try {
    const cartItemsRef = collectionGroup(db, "user_cart_items");
    const q = query(cartItemsRef, where("user_id", "==", userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        price: data.price || 0,
        discount: data.discount || 0,
        quantity: data.quantity || 1,
        user_id: userId,
        tailor_id: data.tailor_id || data.tailorId || "",
        product_id: data.product_id || data.productId || "",
        title: data.title || "",
      };
    });
  } catch (error) {
    console.error(`Error fetching cart items for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get top products in carts (most frequently added)
 * @param limitCount - Number of top products to return (default: 10)
 * @returns Array of products with their cart counts
 */
export async function getTopCartProducts(limitCount: number = 10): Promise<{
  product_id: string;
  title: string;
  count: number;
  total_value: number;
}[]> {
  try {
    const cartItemsRef = collectionGroup(db, "user_cart_items");
    const snapshot = await getDocs(cartItemsRef);
    
    const productCounts = new Map<string, {
      title: string;
      count: number;
      total_value: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const productId = data.product_id || data.productId || "";
      const title = data.title || "Unknown Product";
      const price = data.price || 0;
      const discount = data.discount || 0;
      const quantity = data.quantity || 1;
      const itemValue = calculateItemPrice(price, discount, quantity);
      
      if (!productCounts.has(productId)) {
        productCounts.set(productId, {
          title,
          count: 0,
          total_value: 0,
        });
      }
      
      const product = productCounts.get(productId)!;
      product.count++;
      product.total_value += itemValue;
    });
    
    // Convert to array and sort by count
    return Array.from(productCounts.entries())
      .map(([product_id, data]) => ({
        product_id,
        title: data.title,
        count: data.count,
        total_value: data.total_value,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching top cart products:", error);
    return [];
  }
}

/**
 * Get cart value distribution
 * @returns Object with counts for each value range
 */
export async function getCartValueDistribution(): Promise<{
  "0-100": number;
  "100-500": number;
  "500-1000": number;
  "1000-5000": number;
  "5000+": number;
}> {
  try {
    const cartItemsRef = collectionGroup(db, "user_cart_items");
    const snapshot = await getDocs(cartItemsRef);
    
    // Group by user and calculate cart values
    const userCarts = new Map<string, number>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const parentPath = doc.ref.parent.parent?.path || "";
      const userId = parentPath.split("/")[1] || "unknown";
      
      const price = data.price || 0;
      const discount = data.discount || 0;
      const quantity = data.quantity || 1;
      const itemValue = calculateItemPrice(price, discount, quantity);
      
      if (!userCarts.has(userId)) {
        userCarts.set(userId, 0);
      }
      
      userCarts.set(userId, userCarts.get(userId)! + itemValue);
    });
    
    const distribution = {
      "0-100": 0,
      "100-500": 0,
      "500-1000": 0,
      "1000-5000": 0,
      "5000+": 0,
    };
    
    userCarts.forEach((value) => {
      if (value < 100) {
        distribution["0-100"]++;
      } else if (value < 500) {
        distribution["100-500"]++;
      } else if (value < 1000) {
        distribution["500-1000"]++;
      } else if (value < 5000) {
        distribution["1000-5000"]++;
      } else {
        distribution["5000+"]++;
      }
    });
    
    return distribution;
  } catch (error) {
    console.error("Error fetching cart value distribution:", error);
    return {
      "0-100": 0,
      "100-500": 0,
      "500-1000": 0,
      "1000-5000": 0,
      "5000+": 0,
    };
  }
}

