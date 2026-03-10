/**
 * Vendor Onboarding Analytics Service
 * 
 * This service fetches vendor/tailor onboarding data from Firebase Firestore.
 * 
 * Data Source:
 * - `tailors` collection: All registered vendors/tailors
 * 
 * Usage:
 * ```typescript
 * import { getTotalVendorsOnboarded } from "@/services/vendorOnboardingAnalytics";
 * 
 * const count = await getTotalVendorsOnboarded();
 * ```
 */

import { db } from "@/firebase";
import { collection, getDocs, getCountFromServer, query, where, orderBy, Timestamp } from "firebase/firestore";

export interface VendorInfo {
  vendor_id: string;
  brand_name: string;
  email?: string;
  created_at?: Date;
  is_verified?: boolean;
}

/**
 * Get total number of vendors/tailors onboarded
 * @returns Total vendor count
 */
export async function getTotalVendorsOnboarded(): Promise<number> {
  try {
    const tailorsRef = collection(db, "staging_tailors");
    const snapshot = await getCountFromServer(tailorsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total vendors:", error);
    return 0;
  }
}

/**
 * Get vendors onboarded within a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of vendors onboarded in the period
 */
export async function getVendorsOnboardedByDateRange(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const tailorsRef = collection(db, "staging_tailors");
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      tailorsRef,
      where("created_at", ">=", startTimestamp),
      where("created_at", "<=", endTimestamp)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching vendors by date range:", error);
    return 0;
  }
}

/**
 * Get verified vendors count
 * @returns Number of verified vendors
 */
export async function getVerifiedVendorsCount(): Promise<number> {
  try {
    const tailorsRef = collection(db, "staging_tailors");
    const q = query(tailorsRef, where("is_verified", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching verified vendors:", error);
    return 0;
  }
}

/**
 * Get recently onboarded vendors
 * @param limitCount - Number of recent vendors to fetch (default: 10)
 * @returns Array of recently onboarded vendors
 */
export async function getRecentlyOnboardedVendors(limitCount: number = 10): Promise<VendorInfo[]> {
  try {
    const tailorsRef = collection(db, "staging_tailors");
    const q = query(
      tailorsRef,
      orderBy("created_at", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.slice(0, limitCount).map((doc) => {
      const data = doc.data();
      return {
        vendor_id: doc.id,
        brand_name: data.brand_name || data.brandName || "Unknown",
        email: data.email,
        created_at: data.created_at?.toDate?.(),
        is_verified: data.is_verified,
      };
    });
  } catch (error) {
    console.error("Error fetching recently onboarded vendors:", error);
    return [];
  }
}

/**
 * Get number of vendors who have products in tailor_works collection
 * @returns Count of vendors with products
 */
export async function getVendorsWithProducts(): Promise<number> {
  try {
    const tailorWorksRef = collection(db, "staging_tailor_works");
    const snapshot = await getDocs(tailorWorksRef);
    
    // Get unique tailor_ids
    const uniqueTailorIds = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.tailor_id) {
        uniqueTailorIds.add(data.tailor_id);
      }
    });
    
    return uniqueTailorIds.size;
  } catch (error) {
    console.error("Error fetching vendors with products:", error);
    return 0;
  }
}

/**
 * Get vendor onboarding trend over time
 * @param days - Number of days to look back (default: 30)
 * @returns Array of daily vendor onboarding counts
 */
export async function getVendorOnboardingTrend(days: number = 30): Promise<{
  day: number;
  vendors: number;
  date: string;
}[]> {
  try {
    const tailorsRef = collection(db, "staging_tailors");
    const trend: { day: number; vendors: number; date: string }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      const q = query(
        tailorsRef,
        where("created_at", ">=", startTimestamp),
        where("created_at", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      trend.push({
        day: days - i,
        vendors: snapshot.size,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    
    return trend;
  } catch (error) {
    console.error("Error fetching vendor onboarding trend:", error);
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      vendors: 0,
      date: '',
    }));
  }
}

