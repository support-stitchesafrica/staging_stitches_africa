/**
 * Active User Analytics Service
 * 
 * This service fetches active user data and demographics from Firebase Firestore.
 * 
 * Data Source:
 * - `users` collection: Contains last_login_time and shopping_preference fields
 * 
 * Usage:
 * ```typescript
 * import { getActiveUsersCount } from "@/services/activeUserAnalytics";
 * 
 * const activeUsers = await getActiveUsersCount(30); // Last 30 days
 * ```
 */

import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

export interface ActiveUserStats {
  totalActiveUsers: number;
  genderDistribution: {
    male: number;
    female: number;
    unisex: number;
    kids: number;
    other: number;
  };
  percentages: {
    male: number;
    female: number;
    unisex: number;
    kids: number;
    other: number;
  };
}

export interface UserDemographic {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  shopping_preference?: string;
  last_login_time?: Date;
}

/**
 * Map shopping preference to gender category
 */
function mapShoppingPreference(preference?: string): keyof ActiveUserStats['genderDistribution'] {
  if (!preference || typeof preference !== 'string') return 'other';
  
  const normalized = preference.toLowerCase();
  
  if (normalized.includes('men') && !normalized.includes('women')) {
    return 'male';
  } else if (normalized.includes('women')) {
    return 'female';
  } else if (normalized.includes('unisex')) {
    return 'unisex';
  } else if (normalized.includes('kid')) {
    return 'kids';
  }
  
  return 'other';
}

/**
 * Get active users count and demographics
 * @param days - Number of days to look back (default: 30)
 * @returns Active user statistics with gender distribution
 */
export async function getActiveUsersStats(days: number = 30): Promise<ActiveUserStats> {
  try {
    // Calculate date threshold (X days ago)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    const thresholdTimestamp = Timestamp.fromDate(thresholdDate);
    
    // Query user_session_analytics for users with recent sessions
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    const q = query(
      sessionAnalyticsRef,
      where("last_session", ">=", thresholdTimestamp),
      orderBy("last_session", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        totalActiveUsers: 0,
        genderDistribution: {
          male: 0,
          female: 0,
          unisex: 0,
          kids: 0,
          other: 0,
        },
        percentages: {
          male: 0,
          female: 0,
          unisex: 0,
          kids: 0,
          other: 0,
        },
      };
    }
    
    // Get unique user IDs from session data
    const userIds = snapshot.docs.map((doc: any) => doc.data().user_id || doc.id);
    
    // Fetch user preferences from users collection
    const usersRef = collection(db, "staging_users");
    const genderDistribution = {
      male: 0,
      female: 0,
      unisex: 0,
      kids: 0,
      other: 0,
    };
    
    // Fetch users in batches (Firestore 'in' query limit is 10)
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const userQuery = query(usersRef, where("__name__", "in", batch));
      const userSnapshot = await getDocs(userQuery);
      
      userSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const preference = data.shopping_preference || data.shoppingPreference;
        const category = mapShoppingPreference(preference);
        genderDistribution[category]++;
      });
    }
    
    const totalActiveUsers = userIds.length;
    
    // Calculate percentages
    const percentages = {
      male: totalActiveUsers > 0 ? (genderDistribution.male / totalActiveUsers) * 100 : 0,
      female: totalActiveUsers > 0 ? (genderDistribution.female / totalActiveUsers) * 100 : 0,
      unisex: totalActiveUsers > 0 ? (genderDistribution.unisex / totalActiveUsers) * 100 : 0,
      kids: totalActiveUsers > 0 ? (genderDistribution.kids / totalActiveUsers) * 100 : 0,
      other: totalActiveUsers > 0 ? (genderDistribution.other / totalActiveUsers) * 100 : 0,
    };
    
    return {
      totalActiveUsers,
      genderDistribution,
      percentages,
    };
  } catch (error) {
    console.error("Error fetching active users stats:", error);
    return {
      totalActiveUsers: 0,
      genderDistribution: {
        male: 0,
        female: 0,
        unisex: 0,
        kids: 0,
        other: 0,
      },
      percentages: {
        male: 0,
        female: 0,
        unisex: 0,
        kids: 0,
        other: 0,
      },
    };
  }
}

/**
 * Get count of active users (logged in within X days)
 * @param days - Number of days to look back (default: 30)
 * @returns Number of active users
 */
export async function getActiveUsersCount(days: number = 30): Promise<number> {
  const stats = await getActiveUsersStats(days);
  return stats.totalActiveUsers;
}

/**
 * Get daily active users (last 24 hours)
 * @returns Daily active user stats
 */
export async function getDailyActiveUsers(): Promise<ActiveUserStats> {
  return getActiveUsersStats(1);
}

/**
 * Get weekly active users (last 7 days)
 * @returns Weekly active user stats
 */
export async function getWeeklyActiveUsers(): Promise<ActiveUserStats> {
  return getActiveUsersStats(7);
}

/**
 * Get monthly active users (last 30 days)
 * @returns Monthly active user stats
 */
export async function getMonthlyActiveUsers(): Promise<ActiveUserStats> {
  return getActiveUsersStats(30);
}

/**
 * Get active users with full details
 * @param days - Number of days to look back (default: 30)
 * @param limitCount - Maximum number of users to return (default: 100)
 * @returns Array of active users with demographics
 */
export async function getActiveUsersDetails(
  days: number = 30,
  limitCount: number = 100
): Promise<UserDemographic[]> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    const thresholdTimestamp = Timestamp.fromDate(thresholdDate);
    
    // Query session analytics for active users
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    const q = query(
      sessionAnalyticsRef,
      where("last_session", ">=", thresholdTimestamp),
      orderBy("last_session", "desc")
    );
    
    const snapshot = await getDocs(q);
    const userIds = snapshot.docs.slice(0, limitCount).map((doc: any) => ({
      id: doc.data().user_id || doc.id,
      last_session: doc.data().last_session?.toDate?.(),
    }));
    
    // Fetch user details from users collection
    const usersRef = collection(db, "staging_users");
    const userDetails: UserDemographic[] = [];
    
    // Fetch in batches
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const ids = batch.map((u: any )=> u.id);
      const userQuery = query(usersRef, where("__name__", "in", ids));
      const userSnapshot = await getDocs(userQuery);
      
      userSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const sessionData = batch.find((u: any) => u.id === doc.id);
        
        userDetails.push({
          user_id: doc.id,
          email: data.email || "",
          first_name: data.first_name || data.firstName,
          last_name: data.last_name || data.lastName,
          shopping_preference: data.shopping_preference || data.shoppingPreference,
          last_login_time: sessionData?.last_session,
        });
      });
    }
    
    return userDetails;
  } catch (error) {
    console.error("Error fetching active users details:", error);
    return [];
  }
}

/**
 * Get user activity comparison across different time periods
 * @returns Activity comparison stats
 */
export async function getUserActivityComparison(): Promise<{
  daily: number;
  weekly: number;
  monthly: number;
}> {
  try {
    const [daily, weekly, monthly] = await Promise.all([
      getDailyActiveUsers(),
      getWeeklyActiveUsers(),
      getMonthlyActiveUsers(),
    ]);
    
    return {
      daily: daily.totalActiveUsers,
      weekly: weekly.totalActiveUsers,
      monthly: monthly.totalActiveUsers,
    };
  } catch (error) {
    console.error("Error fetching user activity comparison:", error);
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
    };
  }
}

/**
 * Get daily active users trend over time period
 * @param days - Number of days to look back (default: 30)
 * @returns Array of daily active user counts
 */
export async function getDailyActiveUsersTrend(days: number = 30): Promise<{
  day: number;
  users: number;
  date: string;
}[]> {
  try {
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    const trend: { day: number; users: number; date: string }[] = [];
    
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
      
      // Query sessions for this specific day
      const q = query(
        sessionAnalyticsRef,
        where("last_session", ">=", startTimestamp),
        where("last_session", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      trend.push({
        day: days - i,
        users: snapshot.size,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    
    return trend;
  } catch (error) {
    console.error("Error fetching daily active users trend:", error);
    // Return mock data as fallback
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      users: 0,
      date: '',
    }));
  }
}

/**
 * Get gender distribution summary for display
 * @param stats - Active user stats
 * @returns Formatted gender distribution string
 */
export function formatGenderDistribution(stats: ActiveUserStats): string {
  const { percentages } = stats;
  
  const parts: string[] = [];
  
  if (percentages.male > 0) {
    parts.push(`Male (${percentages.male.toFixed(1)}%)`);
  }
  if (percentages.female > 0) {
    parts.push(`Female (${percentages.female.toFixed(1)}%)`);
  }
  if (percentages.unisex > 0) {
    parts.push(`Unisex (${percentages.unisex.toFixed(1)}%)`);
  }
  if (percentages.kids > 0) {
    parts.push(`Kids (${percentages.kids.toFixed(1)}%)`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'No data';
}

/**
 * Get shopping preference breakdown
 * @param days - Number of days to look back (default: 30)
 * @returns Object with shopping preference counts
 */
export async function getShoppingPreferenceBreakdown(days: number = 30): Promise<{
  [preference: string]: number;
}> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    const thresholdTimestamp = Timestamp.fromDate(thresholdDate);
    
    // Get active user IDs from session analytics
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    const q = query(
      sessionAnalyticsRef,
      where("last_session", ">=", thresholdTimestamp)
    );
    
    const snapshot = await getDocs(q);
    const userIds = snapshot.docs.map((doc: any) => doc.data().user_id || doc.id);
    
    const breakdown: { [preference: string]: number } = {};
    
    // Fetch user preferences in batches
    const usersRef = collection(db, "staging_users");
    const batchSize = 10;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const userQuery = query(usersRef, where("__name__", "in", batch));
      const userSnapshot = await getDocs(userQuery);
      
      userSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const preference = data.shopping_preference || data.shoppingPreference || "Not Set";
        
        if (!breakdown[preference]) {
          breakdown[preference] = 0;
        }
        breakdown[preference]++;
      });
    }
    
    return breakdown;
  } catch (error) {
    console.error("Error fetching shopping preference breakdown:", error);
    return {};
  }
}

