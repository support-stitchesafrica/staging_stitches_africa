/**
 * Vendor Analytics Service
 * 
 * This service fetches vendor visit analytics from Firebase Firestore.
 * 
 * Data Sources:
 * - `vendor_analytics` collection: Aggregated vendor statistics (fast queries)
 * - `vendor_visits` collection: Individual visit records (detailed analytics)
 * 
 * Usage:
 * ```typescript
 * import { getTopVisitedVendors } from "@/services/vendorAnalytics";
 * 
 * const topVendors = await getTopVisitedVendors(10);
 * ```
 */

import { db } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, getCountFromServer, Timestamp } from "firebase/firestore";

export interface VendorVisitData {
  vendor_id: string;
  vendor_name: string;
  total_visits: number;
  first_visit?: Date;
  last_visit?: Date;
}

/**
 * Helper function to get vendor name from tailors collection
 * @param vendorId - The vendor/tailor ID
 * @returns Vendor brand name or "Unknown Vendor"
 */
async function getVendorNameFromTailors(vendorId: string): Promise<string> {
  try {
    const tailorDocRef = doc(db, "staging_tailors", vendorId);
    const tailorDoc = await getDoc(tailorDocRef);
    
    if (tailorDoc.exists()) {
      const data = tailorDoc.data();
      // Try brand_name first, then brandName for compatibility
      return data.brand_name || data.brandName || "Unknown Vendor";
    }
    
    return "Unknown Vendor";
  } catch (error) {
    console.error(`Error fetching vendor name for ${vendorId}:`, error);
    return "Unknown Vendor";
  }
}

export interface VendorVisitBySource {
  product_detail: number;
  bespoke_screen: number;
  rtw_screen: number;
}

/**
 * Get top visited vendors
 * @param limitCount - Number of top vendors to fetch (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of vendors sorted by visit count (descending)
 */
export async function getTopVisitedVendors(
  limitCount: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<VendorVisitData[]> {
  try {
    const vendorAnalyticsRef = collection(db, "staging_vendor_analytics");
    
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
        vendorAnalyticsRef,
        where("last_visit", ">=", startTimestamp),
        where("last_visit", "<=", endTimestamp),
        orderBy("last_visit", "desc"),
        orderBy("total_visits", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        vendorAnalyticsRef,
        orderBy("total_visits", "desc"),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    
    // Fetch vendor names from tailors collection in parallel
    const vendorDataPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const vendorId = data.vendor_id || doc.id;
      
      // Fetch the actual vendor name from tailors collection
      const vendorName = await getVendorNameFromTailors(vendorId);
      
      return {
        vendor_id: vendorId,
        vendor_name: vendorName,
        total_visits: data.total_visits || 0,
        first_visit: data.first_visit?.toDate?.() || undefined,
        last_visit: data.last_visit?.toDate?.() || undefined,
      };
    });
    
    return await Promise.all(vendorDataPromises);
  } catch (error) {
    console.error("Error fetching top visited vendors:", error);
    return [];
  }
}

/**
 * Get visit count for a specific vendor
 * @param vendorId - The vendor ID
 * @returns Total visit count for the vendor
 */
export async function getVendorVisitCount(vendorId: string): Promise<number> {
  try {
    const vendorDocRef = doc(db, "staging_vendor_analytics", vendorId);
    const vendorDoc = await getDoc(vendorDocRef);
    
    if (vendorDoc.exists()) {
      return vendorDoc.data().total_visits || 0;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching visit count for vendor ${vendorId}:`, error);
    return 0;
  }
}

/**
 * Get total number of vendor visits across all vendors
 * @returns Total visit count
 */
export async function getTotalVendorVisits(): Promise<number> {
  try {
    const vendorVisitsRef = collection(db, "staging_vendor_visits");
    const snapshot = await getCountFromServer(vendorVisitsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total vendor visits:", error);
    return 0;
  }
}

/**
 * Get vendor visits by source (traffic analysis)
 * @returns Object with counts for each source
 */
export async function getVendorVisitsBySource(): Promise<VendorVisitBySource> {
  try {
    const vendorVisitsRef = collection(db, "staging_vendor_visits");
    
    // Query each source
    const [productDetailSnapshot, bespokeSnapshot, rtwSnapshot] = await Promise.all([
      getCountFromServer(query(vendorVisitsRef, where("source", "==", "product_detail"))),
      getCountFromServer(query(vendorVisitsRef, where("source", "==", "bespoke_screen"))),
      getCountFromServer(query(vendorVisitsRef, where("source", "==", "rtw_screen"))),
    ]);
    
    return {
      product_detail: productDetailSnapshot.data().count,
      bespoke_screen: bespokeSnapshot.data().count,
      rtw_screen: rtwSnapshot.data().count,
    };
  } catch (error) {
    console.error("Error fetching visits by source:", error);
    return {
      product_detail: 0,
      bespoke_screen: 0,
      rtw_screen: 0,
    };
  }
}

/**
 * Get vendor visits within a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of visit records
 */
export async function getVendorVisitsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    const vendorVisitsRef = collection(db, "staging_vendor_visits");
    const q = query(
      vendorVisitsRef,
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching visits by date range:", error);
    return [];
  }
}

/**
 * Get trending vendors (most visits in recent period)
 * @param days - Number of days to look back (default: 7)
 * @param limitCount - Number of top vendors to return (default: 10)
 * @returns Array of trending vendors
 */
export async function getTrendingVendors(
  days: number = 7,
  limitCount: number = 10
): Promise<VendorVisitData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const vendorVisitsRef = collection(db, "staging_vendor_visits");
    const q = query(
      vendorVisitsRef,
      where("timestamp", ">=", startDate),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    // Group by vendor_id and count visits
    const vendorCounts: { [key: string]: number } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const vendorId = data.vendor_id;
      
      if (!vendorCounts[vendorId]) {
        vendorCounts[vendorId] = 0;
      }
      vendorCounts[vendorId]++;
    });
    
    // Convert to array and sort
    const sortedVendors = Object.entries(vendorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount);
    
    // Fetch vendor names from tailors collection in parallel
    const vendorDataPromises = sortedVendors.map(async ([vendor_id, count]) => {
      const vendorName = await getVendorNameFromTailors(vendor_id);
      
      return {
        vendor_id,
        vendor_name: vendorName,
        total_visits: count,
      };
    });
    
    return await Promise.all(vendorDataPromises);
  } catch (error) {
    console.error("Error fetching trending vendors:", error);
    return [];
  }
}

