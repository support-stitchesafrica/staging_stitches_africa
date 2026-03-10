/**
 * Search Analytics Service
 * 
 * This service fetches search analytics from Firebase Firestore.
 * 
 * Data Sources:
 * - `search_analytics` collection: Aggregated search term statistics (fast queries)
 * - `searches` collection: Individual search records (detailed analytics)
 * 
 * Usage:
 * ```typescript
 * import { getTopSearchTerms } from "@/services/searchAnalytics";
 * 
 * const topSearches = await getTopSearchTerms(20);
 * ```
 */

import { db } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, getCountFromServer, Timestamp } from "firebase/firestore";

export interface SearchTermData {
  search_term: string;
  normalized_term: string;
  search_count: number;
  avg_results: number;
  category?: string;
  first_searched?: Date;
  last_searched?: Date;
}

/**
 * Get top search terms
 * @param limitCount - Number of top search terms to fetch (default: 20)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of search terms sorted by search count (descending)
 */
export async function getTopSearchTerms(
  limitCount: number = 20,
  startDate?: Date,
  endDate?: Date
): Promise<SearchTermData[]> {
  try {
    const searchAnalyticsRef = collection(db, "search_analytics");
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
        searchAnalyticsRef,
        where("last_searched", ">=", startTimestamp),
        where("last_searched", "<=", endTimestamp),
        orderBy("last_searched", "desc"),
        orderBy("search_count", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        searchAnalyticsRef,
        orderBy("search_count", "desc"),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        search_term: data.search_term || "Unknown",
        normalized_term: data.normalized_term || data.search_term || "unknown",
        search_count: data.search_count || 0,
        avg_results: data.avg_results || 0,
        category: data.category || undefined,
        first_searched: data.first_searched?.toDate?.() || undefined,
        last_searched: data.last_searched?.toDate?.() || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching top search terms:", error);
    return [];
  }
}

/**
 * Get search count for a specific term
 * @param searchTerm - The search term
 * @returns Total search count for the term
 */
export async function getSearchTermCount(searchTerm: string): Promise<number> {
  try {
    const normalizedTerm = searchTerm.toLowerCase();
    const searchDocRef = doc(db, "search_analytics", normalizedTerm);
    const searchDoc = await getDoc(searchDocRef);
    
    if (searchDoc.exists()) {
      return searchDoc.data().search_count || 0;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching search count for term "${searchTerm}":`, error);
    return 0;
  }
}

/**
 * Get total number of searches across all terms
 * @returns Total search count
 */
export async function getTotalSearches(): Promise<number> {
  try {
    const searchesRef = collection(db, "staging_searches");
    const snapshot = await getCountFromServer(searchesRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total searches:", error);
    return 0;
  }
}

/**
 * Get searches with zero results (catalog gaps)
 * @param limitCount - Number of terms to fetch (default: 50)
 * @returns Array of search terms that returned no results
 */
export async function getZeroResultSearches(limitCount: number = 50): Promise<SearchTermData[]> {
  try {
    const searchAnalyticsRef = collection(db, "search_analytics");
    const q = query(
      searchAnalyticsRef,
      where("avg_results", "==", 0),
      orderBy("search_count", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        search_term: data.search_term || "Unknown",
        normalized_term: data.normalized_term || data.search_term || "unknown",
        search_count: data.search_count || 0,
        avg_results: 0,
        category: data.category || undefined,
        first_searched: data.first_searched?.toDate?.() || undefined,
        last_searched: data.last_searched?.toDate?.() || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching zero result searches:", error);
    return [];
  }
}

/**
 * Get searches by category
 * @returns Object with counts for each category
 */
export async function getSearchesByCategory(): Promise<{ [category: string]: number }> {
  try {
    const searchesRef = collection(db, "staging_searches");
    const snapshot = await getDocs(searchesRef);
    
    const categoryCounts: { [category: string]: number } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const category = data.category || "All";
      
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });
    
    return categoryCounts;
  } catch (error) {
    console.error("Error fetching searches by category:", error);
    return {};
  }
}

/**
 * Get trending search terms (most searches in recent period)
 * @param days - Number of days to look back (default: 7)
 * @param limitCount - Number of top terms to return (default: 10)
 * @returns Array of trending search terms
 */
export async function getTrendingSearches(
  days: number = 7,
  limitCount: number = 10
): Promise<SearchTermData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const searchesRef = collection(db, "staging_searches");
    const q = query(
      searchesRef,
      where("timestamp", ">=", startDate),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    // Group by normalized_term and count searches
    const termCounts: { [key: string]: { count: number; term: string } } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const normalizedTerm = data.normalized_term || data.search_term?.toLowerCase() || "unknown";
      const originalTerm = data.search_term || "Unknown";
      
      if (!termCounts[normalizedTerm]) {
        termCounts[normalizedTerm] = { count: 0, term: originalTerm };
      }
      termCounts[normalizedTerm].count++;
    });
    
    // Convert to array and sort
    const sortedTerms = Object.entries(termCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limitCount);
    
    return sortedTerms.map(([normalized_term, data]) => ({
      search_term: data.term,
      normalized_term,
      search_count: data.count,
      avg_results: 0, // Not available for trending searches
    }));
  } catch (error) {
    console.error("Error fetching trending searches:", error);
    return [];
  }
}

/**
 * Get popular search terms (sorted by average results and search count)
 * Useful for featuring successful searches
 * @param limitCount - Number of terms to fetch (default: 10)
 * @returns Array of popular search terms
 */
export async function getPopularSearches(limitCount: number = 10): Promise<SearchTermData[]> {
  try {
    const searchAnalyticsRef = collection(db, "search_analytics");
    const q = query(
      searchAnalyticsRef,
      where("avg_results", ">", 0),
      orderBy("avg_results", "desc"),
      orderBy("search_count", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        search_term: data.search_term || "Unknown",
        normalized_term: data.normalized_term || data.search_term || "unknown",
        search_count: data.search_count || 0,
        avg_results: data.avg_results || 0,
        category: data.category || undefined,
        first_searched: data.first_searched?.toDate?.() || undefined,
        last_searched: data.last_searched?.toDate?.() || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return [];
  }
}

