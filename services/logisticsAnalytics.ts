/**
 * Logistics Analytics Service
 * 
 * This service fetches logistics and shipping analytics from Firebase Firestore.
 * 
 * Data Source:
 * - `users_orders/{userId}/user_orders/{orderId}` - Nested orders structure
 * - Focus on shipping field and user_address
 * 
 * Uses collectionGroup queries to handle nested structure
 * 
 * Usage:
 * ```typescript
 * import { getWeightAnalytics } from "@/services/logisticsAnalytics";
 * 
 * const stats = await getWeightAnalytics();
 * ```
 */

import { db } from "@/firebase";
import { collectionGroup, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

export interface WeightAnalytics {
  totalWeight: number;
  averageWeight: number;
  largestWeight: number;
  smallestWeight: number;
  shipmentsWithWeight: number;
  totalShipments: number;
}

export interface ShipmentByRegion {
  country: string;
  shipment_count: number;
  total_weight: number;
}

export interface TopDestination {
  location: string; // Country or City
  shipment_count: number;
  total_weight: number;
}

/**
 * Get weight analytics from orders with shipping data (only delivered orders)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Comprehensive weight statistics
 */
export async function getWeightAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<WeightAnalytics> {
  try {
    // Use collectionGroup to query all orders across all users
    // Only count delivered orders
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
        where("order_status", "==", "delivered"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(ordersRef, where("order_status", "==", "delivered"));
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        totalWeight: 0,
        averageWeight: 0,
        largestWeight: 0,
        smallestWeight: 0,
        shipmentsWithWeight: 0,
        totalShipments: 0,
      };
    }
    
    let totalWeight = 0;
    let largestWeight = 0;
    let smallestWeight = Number.MAX_VALUE;
    let shipmentsWithWeight = 0;
    const totalShipments = snapshot.size;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const shipping = data.shipping;
      const packageWeight = shipping?.package_weight || shipping?.packageWeight;
      
      if (packageWeight && packageWeight > 0) {
        const weight = typeof packageWeight === 'number' 
          ? packageWeight 
          : parseFloat(packageWeight);
        
        if (!isNaN(weight)) {
          totalWeight += weight;
          shipmentsWithWeight++;
          
          if (weight > largestWeight) {
            largestWeight = weight;
          }
          
          if (weight < smallestWeight) {
            smallestWeight = weight;
          }
        }
      }
    });
    
    // If no weights found, set smallest to 0
    if (smallestWeight === Number.MAX_VALUE) {
      smallestWeight = 0;
    }
    
    const averageWeight = shipmentsWithWeight > 0 ? totalWeight / shipmentsWithWeight : 0;
    
    return {
      totalWeight,
      averageWeight,
      largestWeight,
      smallestWeight,
      shipmentsWithWeight,
      totalShipments,
    };
  } catch (error) {
    console.error("Error fetching weight analytics:", error);
    return {
      totalWeight: 0,
      averageWeight: 0,
      largestWeight: 0,
      smallestWeight: 0,
      shipmentsWithWeight: 0,
      totalShipments: 0,
    };
  }
}

/**
 * Get shipment count by region (only delivered orders)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of regions with shipment counts
 */
export async function getShipmentsByRegion(
  startDate?: Date,
  endDate?: Date
): Promise<ShipmentByRegion[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    
    // Query only delivered orders
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
        where("order_status", "==", "delivered"),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        ordersRef,
        where("order_status", "==", "delivered")
      );
    }
    
    const snapshot = await getDocs(q);
    
    const regionShipments = new Map<string, {
      shipment_count: number;
      total_weight: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userAddress = data.user_address || {};
      const country = userAddress.country || "Unknown";
      const shipping = data.shipping;
      const packageWeight = shipping?.package_weight || shipping?.packageWeight || 0;
      const weight = typeof packageWeight === 'number' 
        ? packageWeight 
        : parseFloat(packageWeight) || 0;
      
      if (!regionShipments.has(country)) {
        regionShipments.set(country, {
          shipment_count: 0,
          total_weight: 0,
        });
      }
      
      const region = regionShipments.get(country)!;
      region.shipment_count++;
      region.total_weight += weight;
    });
    
    // Convert to array and sort by shipment count
    return Array.from(regionShipments.entries())
      .map(([country, data]) => ({
        country,
        shipment_count: data.shipment_count,
        total_weight: data.total_weight,
      }))
      .sort((a, b) => b.shipment_count - a.shipment_count);
  } catch (error) {
    console.error("Error fetching shipments by region:", error);
    return [];
  }
}

/**
 * Get all shipments count by region (regardless of status)
 * Useful for showing all order destinations
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of regions with all order counts
 */
export async function getAllOrdersByRegion(
  startDate?: Date,
  endDate?: Date
): Promise<ShipmentByRegion[]> {
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
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(ordersRef);
    }
    
    const snapshot = await getDocs(q);
    
    const regionOrders = new Map<string, {
      shipment_count: number;
      total_weight: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userAddress = data.user_address || {};
      const country = userAddress.country || "Unknown";
      const shipping = data.shipping;
      const packageWeight = shipping?.package_weight || shipping?.packageWeight || 0;
      const weight = typeof packageWeight === 'number' 
        ? packageWeight 
        : parseFloat(packageWeight) || 0;
      
      if (!regionOrders.has(country)) {
        regionOrders.set(country, {
          shipment_count: 0,
          total_weight: 0,
        });
      }
      
      const region = regionOrders.get(country)!;
      region.shipment_count++;
      region.total_weight += weight;
    });
    
    // Convert to array and sort by shipment count
    return Array.from(regionOrders.entries())
      .map(([country, data]) => ({
        country,
        shipment_count: data.shipment_count,
        total_weight: data.total_weight,
      }))
      .sort((a, b) => b.shipment_count - a.shipment_count);
  } catch (error) {
    console.error("Error fetching all orders by region:", error);
    return [];
  }
}

/**
 * Get top destinations (by country)
 * @param limitCount - Number of top destinations to return (default: 10)
 * @param onlyDelivered - Only count delivered orders (default: true)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of top destinations
 */
export async function getTopDestinations(
  limitCount: number = 10,
  onlyDelivered: boolean = false,
  startDate?: Date,
  endDate?: Date
): Promise<TopDestination[]> {
  try {
    const data = onlyDelivered 
      ? await getShipmentsByRegion(startDate, endDate)
      : await getAllOrdersByRegion(startDate, endDate);
    
    return data.slice(0, limitCount).map(region => ({
      location: region.country,
      shipment_count: region.shipment_count,
      total_weight: region.total_weight,
    }));
  } catch (error) {
    console.error("Error fetching top destinations:", error);
    return [];
  }
}

/**
 * Get top city destinations (more granular)
 * @param limitCount - Number of top cities to return (default: 10)
 * @param onlyDelivered - Only count delivered orders (default: false)
 * @returns Array of top city destinations
 */
export async function getTopCityDestinations(
  limitCount: number = 10,
  onlyDelivered: boolean = false
): Promise<TopDestination[]> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    let q;
    
    if (onlyDelivered) {
      q = query(ordersRef, where("order_status", "==", "delivered"));
    } else {
      q = query(ordersRef);
    }
    
    const snapshot = await getDocs(q);
    
    const cityShipments = new Map<string, {
      shipment_count: number;
      total_weight: number;
    }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userAddress = data.user_address || {};
      const city = userAddress.city || "Unknown";
      const country = userAddress.country || "";
      const location = country ? `${city}, ${country}` : city;
      
      const shipping = data.shipping;
      const packageWeight = shipping?.package_weight || shipping?.packageWeight || 0;
      const weight = typeof packageWeight === 'number' 
        ? packageWeight 
        : parseFloat(packageWeight) || 0;
      
      if (!cityShipments.has(location)) {
        cityShipments.set(location, {
          shipment_count: 0,
          total_weight: 0,
        });
      }
      
      const dest = cityShipments.get(location)!;
      dest.shipment_count++;
      dest.total_weight += weight;
    });
    
    // Convert to array and sort by shipment count
    return Array.from(cityShipments.entries())
      .map(([location, data]) => ({
        location,
        shipment_count: data.shipment_count,
        total_weight: data.total_weight,
      }))
      .sort((a, b) => b.shipment_count - a.shipment_count)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching top city destinations:", error);
    return [];
  }
}

/**
 * Get shipment status breakdown
 * @returns Object with counts for each status
 */
export async function getShipmentStatusBreakdown(): Promise<{
  [status: string]: number;
}> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    const snapshot = await getDocs(ordersRef);
    
    const statusCounts: { [status: string]: number } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const status = data.order_status || "unknown";
      
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status]++;
    });
    
    return statusCounts;
  } catch (error) {
    console.error("Error fetching shipment status breakdown:", error);
    return {};
  }
}

/**
 * Get delivered orders count
 * @returns Number of delivered orders
 */
export async function getDeliveredOrdersCount(): Promise<number> {
  try {
    const ordersRef = collectionGroup(db, "user_orders");
    const q = query(ordersRef, where("order_status", "==", "delivered"));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching delivered orders count:", error);
    return 0;
  }
}

/**
 * Format weight with unit
 * @param weight - Weight in kg
 * @returns Formatted weight string
 */
export function formatWeight(weight: number): string {
  if (weight === 0) return "0 kg";
  if (weight < 1) return `${(weight * 1000).toFixed(0)} g`;
  return `${weight.toFixed(2)} kg`;
}

