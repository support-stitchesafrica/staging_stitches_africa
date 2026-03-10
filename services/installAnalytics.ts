/**
 * App Install Analytics Service
 * 
 * This service fetches app installation data from Firebase Firestore.
 * 
 * Data Source: `app_installs` collection
 * - Each document represents a unique app installation
 * - Documents have a `device_type` field: "android" or "ios"
 * - Documents include timestamp, device info, and optional user info
 * 
 * Usage:
 * ```typescript
 * import { getInstallsByPlatform } from "@/services/installAnalytics";
 * 
 * const counts = await getInstallsByPlatform();
 * console.log(`Android: ${counts.android}`);
 * console.log(`iOS: ${counts.ios}`);
 * console.log(`Total: ${counts.total}`);
 * ```
 */

import { db } from "@/firebase";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";

export interface InstallCounts {
  android: number;
  ios: number;
  total: number;
}

export interface UserAnalytics {
  totalUsers: number;
  installCounts: InstallCounts;
}

/**
 * Get total registered users from Firebase
 */
export async function getTotalUsers(): Promise<number> {
  try {
    const usersRef = collection(db, "staging_users");
    const snapshot = await getCountFromServer(usersRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total users:", error);
    return 0;
  }
}

/**
 * Get total app installs from Firebase
 */
export async function getTotalInstalls(): Promise<number> {
  try {
    const installsRef = collection(db, "staging_app_installs");
    const snapshot = await getCountFromServer(installsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total installs:", error);
    return 0;
  }
}

/**
 * Get install counts by platform (Android and iOS)
 */
export async function getInstallsByPlatform(): Promise<InstallCounts> {
  try {
    const installsRef = collection(db, "staging_app_installs");
    
    // Query for Android installs
    const androidQuery = query(installsRef, where("device_type", "==", "android"));
    const androidSnapshot = await getCountFromServer(androidQuery);
    const androidCount = androidSnapshot.data().count;
    
    // Query for iOS installs
    const iosQuery = query(installsRef, where("device_type", "==", "ios"));
    const iosSnapshot = await getCountFromServer(iosQuery);
    const iosCount = iosSnapshot.data().count;
    
    return {
      android: androidCount,
      ios: iosCount,
      total: androidCount + iosCount,
    };
  } catch (error) {
    console.error("Error fetching installs by platform:", error);
    return {
      android: 0,
      ios: 0,
      total: 0,
    };
  }
}

/**
 * Get installs within a date range
 */
export async function getInstallsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<InstallCounts> {
  try {
    const installsRef = collection(db, "staging_app_installs");
    
    // Query for Android installs in date range
    const androidQuery = query(
      installsRef,
      where("device_type", "==", "android"),
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate)
    );
    const androidSnapshot = await getDocs(androidQuery);
    const androidCount = androidSnapshot.size;
    
    // Query for iOS installs in date range
    const iosQuery = query(
      installsRef,
      where("device_type", "==", "ios"),
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate)
    );
    const iosSnapshot = await getDocs(iosQuery);
    const iosCount = iosSnapshot.size;
    
    return {
      android: androidCount,
      ios: iosCount,
      total: androidCount + iosCount,
    };
  } catch (error) {
    console.error("Error fetching installs by date range:", error);
    return {
      android: 0,
      ios: 0,
      total: 0,
    };
  }
}

/**
 * Get web signup count from web_signUp collection
 */
export async function getWebSignupCount(): Promise<number> {
  try {
    const webSignupRef = collection(db, "staging_web_signUp");
    const snapshot = await getCountFromServer(webSignupRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching web signup count:", error);
    return 0;
  }
}

/**
 * Get all user analytics data (users + installs + web signups)
 */
export async function getUserAnalytics(): Promise<UserAnalytics> {
  try {
    const [totalUsers, installCounts] = await Promise.all([
      getTotalUsers(),
      getInstallsByPlatform(),
    ]);
    
    return {
      totalUsers,
      installCounts,
    };
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return {
      totalUsers: 0,
      installCounts: {
        android: 0,
        ios: 0,
        total: 0,
      },
    };
  }
}

/**
 * Get install trend data for charts (last N days)
 */
export async function getInstallTrend(days: number = 30): Promise<{
  date: string;
  android: number;
  ios: number;
  total: number;
}[]> {
  try {
    const installsRef = collection(db, "staging_app_installs");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all installs in the date range
    const q = query(
      installsRef,
      where("timestamp", ">=", startDate)
    );
    const snapshot = await getDocs(q);
    
    // Group by date
    const installsByDate: { [key: string]: { android: number; ios: number } } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
      const dateKey = timestamp.toISOString().split('T')[0];
      
      if (!installsByDate[dateKey]) {
        installsByDate[dateKey] = { android: 0, ios: 0 };
      }
      
      if (data.device_type === "android") {
        installsByDate[dateKey].android++;
      } else if (data.device_type === "ios") {
        installsByDate[dateKey].ios++;
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(installsByDate)
      .map(([date, counts]) => ({
        date,
        android: counts.android,
        ios: counts.ios,
        total: counts.android + counts.ios,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching install trend:", error);
    return [];
  }
}

