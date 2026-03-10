/**
 * Session Analytics Service
 * 
 * This service fetches user session analytics from Firebase Firestore.
 * 
 * Data Sources:
 * - `user_session_analytics` collection: Aggregated user session statistics (fast queries)
 * - `user_sessions` collection: Individual session records (detailed analytics)
 * 
 * Usage:
 * ```typescript
 * import { getAverageSessionTime } from "@/services/sessionAnalytics";
 * 
 * const avgTime = await getAverageSessionTime();
 * ```
 */

import { db } from "@/firebase";
import { collection, query, getDocs, doc, getDoc, where, orderBy, limit, getCountFromServer, Timestamp } from "firebase/firestore";

export interface SessionStats {
  user_id: string;
  total_session_seconds: number;
  total_session_minutes: string;
  session_count: number;
  avg_session_seconds: string;
  first_session?: Date;
  last_session?: Date;
}

export interface SessionRecord {
  session_id: string;
  user_id: string;
  session_start: Date;
  session_end: Date;
  duration_seconds: number;
  duration_minutes: string;
  timestamp: Date;
}

export interface AppUsageStats {
  total_hours: number;
  total_minutes: number;
  total_sessions: number;
  total_users: number;
  avg_session_minutes: number;
  avg_session_seconds: number;
}

/**
 * Get average session time across all users
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Average session time in minutes
 */
export async function getAverageSessionTime(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    
    // First, try to get all data without date filtering to see if there's any data
    const allSnapshot = await getDocs(sessionAnalyticsRef);
    
    if (allSnapshot.empty) {
      return 0;
    }
    
    let snapshot = allSnapshot;
    
    // If date range is provided, filter the results
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      try {
        const q = query(
          sessionAnalyticsRef,
          where("last_session", ">=", startTimestamp),
          where("last_session", "<=", endTimestamp),
          orderBy("last_session", "desc")
        );
        snapshot = await getDocs(q);
      } catch (queryError) {
        console.warn("Date filtering failed, using all data:", queryError);
        // Fall back to all data if date filtering fails
        snapshot = allSnapshot;
      }
    }
    
    let totalSeconds = 0;
    let totalSessions = 0;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalSeconds += data.total_session_seconds || 0;
      totalSessions += data.session_count || 0;
    });
    
    if (totalSessions === 0) {
      return 0;
    }
    
    // Return average in minutes
    return (totalSeconds / totalSessions) / 60;
  } catch (error) {
    console.error("Error fetching average session time:", error);
    return 0;
  }
}

/**
 * Get total app usage statistics
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Comprehensive app usage stats
 */
export async function getTotalAppUsage(
  startDate?: Date,
  endDate?: Date
): Promise<AppUsageStats> {
  try {
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    
    // First, try to get all data without date filtering
    const allSnapshot = await getDocs(sessionAnalyticsRef);
    
    if (allSnapshot.empty) {
      return {
        total_hours: 0,
        total_minutes: 0,
        total_sessions: 0,
        total_users: 0,
        avg_session_minutes: 0,
        avg_session_seconds: 0,
      };
    }
    
    let snapshot = allSnapshot;
    
    // If date range is provided, filter the results
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      try {
        const q = query(
          sessionAnalyticsRef,
          where("last_session", ">=", startTimestamp),
          where("last_session", "<=", endTimestamp),
          orderBy("last_session", "desc")
        );
        snapshot = await getDocs(q);
      } catch (queryError) {
        console.warn("Date filtering failed, using all data:", queryError);
        // Fall back to all data if date filtering fails
        snapshot = allSnapshot;
      }
    }
    
    let totalSeconds = 0;
    let totalSessions = 0;
    const totalUsers = snapshot.size;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalSeconds += data.total_session_seconds || 0;
      totalSessions += data.session_count || 0;
    });
    
    const avgSessionSeconds = totalSessions > 0 ? totalSeconds / totalSessions : 0;
    
    return {
      total_hours: totalSeconds / 3600,
      total_minutes: totalSeconds / 60,
      total_sessions: totalSessions,
      total_users: totalUsers,
      avg_session_minutes: avgSessionSeconds / 60,
      avg_session_seconds: avgSessionSeconds,
    };
  } catch (error) {
    console.error("Error fetching total app usage:", error);
    return {
      total_hours: 0,
      total_minutes: 0,
      total_sessions: 0,
      total_users: 0,
      avg_session_minutes: 0,
      avg_session_seconds: 0,
    };
  }
}

/**
 * Get top engaged users by total session time
 * @param limitCount - Number of top users to fetch (default: 10)
 * @returns Array of users sorted by total session time (descending)
 */
export async function getTopEngagedUsers(limitCount: number = 10): Promise<SessionStats[]> {
  try {
    const sessionAnalyticsRef = collection(db, "staging_user_session_analytics");
    const q = query(
      sessionAnalyticsRef,
      orderBy("total_session_seconds", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        user_id: data.user_id || doc.id,
        total_session_seconds: data.total_session_seconds || 0,
        total_session_minutes: data.total_session_minutes || "0",
        session_count: data.session_count || 0,
        avg_session_seconds: data.avg_session_seconds || "0",
        first_session: data.first_session?.toDate?.() || undefined,
        last_session: data.last_session?.toDate?.() || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching top engaged users:", error);
    return [];
  }
}

/**
 * Get session stats for a specific user
 * @param userId - The user ID
 * @returns Session statistics for the user
 */
export async function getUserSessionStats(userId: string): Promise<SessionStats | null> {
  try {
    const sessionDocRef = doc(db, "staging_user_session_analytics", userId);
    const sessionDoc = await getDoc(sessionDocRef);
    
    if (!sessionDoc.exists()) {
      return null;
    }
    
    const data = sessionDoc.data();
    
    return {
      user_id: userId,
      total_session_seconds: data.total_session_seconds || 0,
      total_session_minutes: data.total_session_minutes || "0",
      session_count: data.session_count || 0,
      avg_session_seconds: data.avg_session_seconds || "0",
      first_session: data.first_session?.toDate?.() || undefined,
      last_session: data.last_session?.toDate?.() || undefined,
    };
  } catch (error) {
    console.error(`Error fetching session stats for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get recent sessions across all users
 * @param limitCount - Number of recent sessions to fetch (default: 50)
 * @returns Array of recent session records
 */
export async function getRecentSessions(limitCount: number = 50): Promise<SessionRecord[]> {
  try {
    const sessionsRef = collection(db, "staging_user_sessions");
    const q = query(
      sessionsRef,
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        session_id: data.session_id || doc.id,
        user_id: data.user_id || "",
        session_start: data.session_start?.toDate?.() || new Date(),
        session_end: data.session_end?.toDate?.() || new Date(),
        duration_seconds: data.duration_seconds || 0,
        duration_minutes: data.duration_minutes || "0",
        timestamp: data.timestamp?.toDate?.() || new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching recent sessions:", error);
    return [];
  }
}

/**
 * Get session distribution by duration ranges
 * @returns Object with counts for each duration range
 */
export async function getSessionDistribution(): Promise<{
  "0-5min": number;
  "5-15min": number;
  "15-30min": number;
  "30-60min": number;
  "60min+": number;
}> {
  try {
    const sessionsRef = collection(db, "staging_user_sessions");
    const snapshot = await getDocs(sessionsRef);
    
    const distribution = {
      "0-5min": 0,
      "5-15min": 0,
      "15-30min": 0,
      "30-60min": 0,
      "60min+": 0,
    };
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const minutes = (data.duration_seconds || 0) / 60;
      
      if (minutes < 5) {
        distribution["0-5min"]++;
      } else if (minutes < 15) {
        distribution["5-15min"]++;
      } else if (minutes < 30) {
        distribution["15-30min"]++;
      } else if (minutes < 60) {
        distribution["30-60min"]++;
      } else {
        distribution["60min+"]++;
      }
    });
    
    return distribution;
  } catch (error) {
    console.error("Error fetching session distribution:", error);
    return {
      "0-5min": 0,
      "5-15min": 0,
      "15-30min": 0,
      "30-60min": 0,
      "60min+": 0,
    };
  }
}

/**
 * Get total number of sessions
 * @returns Total session count
 */
export async function getTotalSessions(): Promise<number> {
  try {
    const sessionsRef = collection(db, "staging_user_sessions");
    const snapshot = await getCountFromServer(sessionsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total sessions:", error);
    return 0;
  }
}

/**
 * Get sessions within a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of session records in the date range
 */
export async function getSessionsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<SessionRecord[]> {
  try {
    const sessionsRef = collection(db, "staging_user_sessions");
    const q = query(
      sessionsRef,
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        session_id: data.session_id || doc.id,
        user_id: data.user_id || "",
        session_start: data.session_start?.toDate?.() || new Date(),
        session_end: data.session_end?.toDate?.() || new Date(),
        duration_seconds: data.duration_seconds || 0,
        duration_minutes: data.duration_minutes || "0",
        timestamp: data.timestamp?.toDate?.() || new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching sessions by date range:", error);
    return [];
  }
}

/**
 * Format seconds into readable time string
 * @param seconds - Duration in seconds
 * @returns Formatted time string (e.g., "15.5 mins", "1.2 hrs")
 */
export function formatSessionTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)} mins`;
  } else {
    return `${(seconds / 3600).toFixed(1)} hrs`;
  }
}


