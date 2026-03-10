/**
 * Web Traffic Analytics Service
 * 
 * This service fetches web traffic analytics from Firebase Firestore.
 * 
 * Data Source:
 * - `web_hits` collection: Website page views and visitor tracking
 * 
 * Usage:
 * ```typescript
 * import { getCumulativeWebHits } from "@/services/webTrafficAnalytics";
 * 
 * const hits = await getCumulativeWebHits();
 * ```
 */

import { db } from "@/firebase";
import { collection, getDocs, query, where, orderBy, Timestamp, getCountFromServer } from "firebase/firestore";

export interface WebHit {
  session_id: string;
  visitor_id: string;
  page_url: string;
  page_title: string;
  referrer: string;
  timestamp: Date;
  country: string;
  state: string;
  city: string;
  ip: string;
  device_type: string;
  os: string;
  browser: string;
  user_agent: string;
}

export interface WebTrafficStats {
  totalHits: number;
  uniqueVisitors: number;
  uniqueSessions: number;
}

export interface TrafficByCountry {
  country: string;
  hits: number;
  visitors: number;
}

export interface TrafficByPage {
  page_url: string;
  page_title: string;
  hits: number;
}

/**
 * Get cumulative website hits count
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Total number of page views
 */
export async function getCumulativeWebHits(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      const q = query(
        webHitsRef,
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    }
    
    const snapshot = await getCountFromServer(webHitsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching cumulative web hits:", error);
    return 0;
  }
}

/**
 * Get comprehensive web traffic statistics
 * @returns Stats with hits, unique visitors, and sessions
 */
export async function getWebTrafficStats(): Promise<WebTrafficStats> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    const snapshot = await getDocs(webHitsRef);
    
    const uniqueVisitors = new Set<string>();
    const uniqueSessions = new Set<string>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.visitor_id) {
        uniqueVisitors.add(data.visitor_id);
      }
      if (data.session_id) {
        uniqueSessions.add(data.session_id);
      }
    });
    
    return {
      totalHits: snapshot.size,
      uniqueVisitors: uniqueVisitors.size,
      uniqueSessions: uniqueSessions.size,
    };
  } catch (error) {
    console.error("Error fetching web traffic stats:", error);
    return {
      totalHits: 0,
      uniqueVisitors: 0,
      uniqueSessions: 0,
    };
  }
}

/**
 * Get traffic breakdown by country
 * @returns Array of countries with hit counts
 */
export async function getTrafficByCountry(): Promise<TrafficByCountry[]> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    const snapshot = await getDocs(webHitsRef);
    
    const countryData = new Map<string, { hits: number; visitors: Set<string> }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const country = data.country || "Unknown";
      const visitorId = data.visitor_id;
      
      if (!countryData.has(country)) {
        countryData.set(country, { hits: 0, visitors: new Set() });
      }
      
      const entry = countryData.get(country)!;
      entry.hits++;
      if (visitorId) {
        entry.visitors.add(visitorId);
      }
    });
    
    // Convert to array and sort by hits
    return Array.from(countryData.entries())
      .map(([country, data]) => ({
        country,
        hits: data.hits,
        visitors: data.visitors.size,
      }))
      .sort((a, b) => b.hits - a.hits);
  } catch (error) {
    console.error("Error fetching traffic by country:", error);
    return [];
  }
}

/**
 * Get most viewed pages
 * @param limitCount - Number of top pages to return (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of pages with hit counts
 */
export async function getTopPages(
  limitCount: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<TrafficByPage[]> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    let snapshot;
    
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      const q = query(
        webHitsRef,
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp)
      );
      snapshot = await getDocs(q);
    } else {
      snapshot = await getDocs(webHitsRef);
    }
    
    const pageData = new Map<string, { title: string; hits: number }>();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const pageUrl = data.page_url || "Unknown";
      const pageTitle = data.page_title || pageUrl;
      
      if (!pageData.has(pageUrl)) {
        pageData.set(pageUrl, { title: pageTitle, hits: 0 });
      }
      
      pageData.get(pageUrl)!.hits++;
    });
    
    // Convert to array and sort by hits
    return Array.from(pageData.entries())
      .map(([page_url, data]) => ({
        page_url,
        page_title: data.title,
        hits: data.hits,
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching top pages:", error);
    return [];
  }
}

/**
 * Get traffic by device type
 * @returns Object with hits per device type
 */
export async function getTrafficByDevice(): Promise<{
  desktop: number;
  mobile: number;
  tablet: number;
  other: number;
}> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    const snapshot = await getDocs(webHitsRef);
    
    const deviceCounts = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0,
    };
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const deviceType = (data.device_type || "other").toLowerCase();
      
      if (deviceType in deviceCounts) {
        deviceCounts[deviceType as keyof typeof deviceCounts]++;
      } else {
        deviceCounts.other++;
      }
    });
    
    return deviceCounts;
  } catch (error) {
    console.error("Error fetching traffic by device:", error);
    return {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0,
    };
  }
}

/**
 * Get traffic trend over time period
 * @param days - Number of days to look back (default: 30)
 * @returns Array of daily hit counts
 */
export async function getDailyTrafficTrend(days: number = 30): Promise<{
  day: number;
  hits: number;
  date: string;
}[]> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    const trend: { day: number; hits: number; date: string }[] = [];
    
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
      
      // Query hits for this specific day
      const q = query(
        webHitsRef,
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      trend.push({
        day: days - i,
        hits: snapshot.size,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    
    return trend;
  } catch (error) {
    console.error("Error fetching daily traffic trend:", error);
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      hits: 0,
      date: '',
    }));
  }
}

/**
 * Get hits within a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of hits in the date range
 */
export async function getHitsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      webHitsRef,
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching hits by date range:", error);
    return 0;
  }
}

/**
 * Get top browsers by usage
 * @param limitCount - Number of top browsers to return (default: 10)
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of browsers with hit counts
 */
export async function getTopBrowsers(
  limitCount: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<{
  browser: string;
  hits: number;
  percentage: number;
}[]> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    let snapshot;
    
    if (startDate && endDate) {
      // Set start to beginning of day (00:00:00)
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      // Set end to end of day (23:59:59.999)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      const q = query(
        webHitsRef,
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp)
      );
      snapshot = await getDocs(q);
    } else {
      snapshot = await getDocs(webHitsRef);
    }
    
    const browserCounts = new Map<string, number>();
    const totalHits = snapshot.size;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const browser = data.browser || "Unknown";
      
      if (!browserCounts.has(browser)) {
        browserCounts.set(browser, 0);
      }
      browserCounts.set(browser, browserCounts.get(browser)! + 1);
    });
    
    // Convert to array and sort by hits
    return Array.from(browserCounts.entries())
      .map(([browser, hits]) => ({
        browser,
        hits,
        percentage: totalHits > 0 ? (hits / totalHits) * 100 : 0,
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching top browsers:", error);
    return [];
  }
}

/**
 * Get traffic by state for a specific country
 * @param country - Country name
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of states with hit counts
 */
export interface TrafficByState {
  country: string;
  state: string;
  hits: number;
}

export async function getTrafficByState(
  country?: string,
  startDate?: Date,
  endDate?: Date
): Promise<TrafficByState[]> {
  try {
    const webHitsRef = collection(db, "staging_web_hits");
    let snapshot;
    
    if (startDate && endDate) {
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(adjustedStartDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);
      
      if (country) {
        const q = query(
          webHitsRef,
          where("timestamp", ">=", startTimestamp),
          where("timestamp", "<=", endTimestamp),
          where("country", "==", country),
          where("state", "!=", null)
        );
        snapshot = await getDocs(q);
      } else {
        const q = query(
          webHitsRef,
          where("timestamp", ">=", startTimestamp),
          where("timestamp", "<=", endTimestamp),
          where("state", "!=", null)
        );
        snapshot = await getDocs(q);
      }
    } else {
      if (country) {
        const q = query(
          webHitsRef,
          where("country", "==", country),
          where("state", "!=", null)
        );
        snapshot = await getDocs(q);
      } else {
        const q = query(webHitsRef, where("state", "!=", null));
        snapshot = await getDocs(q);
      }
    }
    
    const stateCounts: { [key: string]: { country: string; state: string; hits: number } } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const hitCountry = data.country || "Unknown";
      const state = data.state || "Unknown";
      const key = `${hitCountry}|${state}`;
      
      if (!stateCounts[key]) {
        stateCounts[key] = { country: hitCountry, state, hits: 0 };
      }
      stateCounts[key].hits++;
    });
    
    return Object.values(stateCounts).sort((a, b) => b.hits - a.hits);
  } catch (error) {
    console.error("Error fetching traffic by state:", error);
    return [];
  }
}

/**
 * Get traffic grouped by country and state
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Array of countries with their states and hit counts
 */
export interface TrafficByCountryState {
  country: string;
  countryHits: number;
  states: Array<{
    state: string;
    hits: number;
  }>;
}

export async function getTrafficByCountryAndState(
  startDate?: Date,
  endDate?: Date
): Promise<TrafficByCountryState[]> {
  try {
    // Get all countries
    const countries = await getTrafficByCountry();
    
    // Get states for each country
    const countryStateData: TrafficByCountryState[] = await Promise.all(
      countries.map(async (country) => {
        const states = await getTrafficByState(country.country, startDate, endDate);
        return {
          country: country.country,
          countryHits: country.hits,
          states: states.map((s) => ({
            state: s.state,
            hits: s.hits,
          })),
        };
      })
    );
    
    return countryStateData;
  } catch (error) {
    console.error("Error fetching traffic by country and state:", error);
    return [];
  }
}

