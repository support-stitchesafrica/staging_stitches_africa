/**
 * User Location Analytics Service
 * 
 * This service fetches user registration and login location data from Firebase Firestore.
 * 
 * Data Source:
 * - `users` collection: Contains registration_country, registration_state fields
 * 
 * Usage:
 * ```typescript
 * import { getUsersByCountry } from "@/services/userLocationAnalytics";
 * 
 * const countryCounts = await getUsersByCountry();
 * ```
 */

import { db } from "@/firebase";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";

export interface CountryData {
  country: string;
  count: number;
  percentage?: number;
}

export interface StateData {
  country: string;
  state: string;
  count: number;
}

/**
 * Get user count by registration country
 * @returns Array of countries with user counts, sorted by count (descending)
 */
export async function getUsersByCountry(): Promise<CountryData[]> {
  try {
    const usersRef = collection(db, "staging_users");
    const q = query(usersRef, where("registration_country", "!=", null));
    
    const snapshot = await getDocs(q);
    
    // Group by country and count
    const countryCounts: { [country: string]: number } = {};
    let totalUsers = 0;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const country = data.registration_country || "Unknown";
      
      if (!countryCounts[country]) {
        countryCounts[country] = 0;
      }
      countryCounts[country]++;
      totalUsers++;
    });
    
    // Convert to array, calculate percentages, and sort
    return Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching users by country:", error);
    return [];
  }
}

/**
 * Get user count by registration state/province
 * @param country - Optional: Filter by specific country
 * @returns Array of states with user counts, sorted by count (descending)
 */
export async function getUsersByState(country?: string): Promise<StateData[]> {
  try {
    const usersRef = collection(db, "staging_users");
    let q;
    
    if (country) {
      q = query(
        usersRef,
        where("registration_country", "==", country),
        where("registration_state", "!=", null)
      );
    } else {
      q = query(usersRef, where("registration_state", "!=", null));
    }
    
    const snapshot = await getDocs(q);
    
    // Group by country and state
    const stateCounts: { [key: string]: { country: string; state: string; count: number } } = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userCountry = data.registration_country || "Unknown";
      const state = data.registration_state || "Unknown";
      const key = `${userCountry}|${state}`;
      
      if (!stateCounts[key]) {
        stateCounts[key] = { country: userCountry, state, count: 0 };
      }
      stateCounts[key].count++;
    });
    
    // Convert to array and sort
    return Object.values(stateCounts)
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching users by state:", error);
    return [];
  }
}

/**
 * Get total users with location data
 * @returns Total count of users who have registration location data
 */
export async function getTotalUsersWithLocation(): Promise<number> {
  try {
    const usersRef = collection(db, "staging_users");
    const q = query(usersRef, where("registration_country", "!=", null));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total users with location:", error);
    return 0;
  }
}

/**
 * Get user count for a specific country
 * @param country - Country name
 * @returns Count of users registered from that country
 */
export async function getUserCountByCountry(country: string): Promise<number> {
  try {
    const usersRef = collection(db, "staging_users");
    const q = query(usersRef, where("registration_country", "==", country));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error fetching user count for ${country}:`, error);
    return 0;
  }
}

/**
 * Get top N countries by user registration
 * @param limitCount - Number of top countries to return (default: 10)
 * @returns Array of top countries with user counts
 */
export async function getTopCountries(limitCount: number = 10): Promise<CountryData[]> {
  const allCountries = await getUsersByCountry();
  return allCountries.slice(0, limitCount);
}

/**
 * Get recently active login locations
 * @param limitCount - Number of recent locations to fetch (default: 10)
 * @returns Array of recent login countries with counts
 */
export async function getRecentLoginLocations(limitCount: number = 10): Promise<CountryData[]> {
  try {
    const usersRef = collection(db, "staging_users");
    const q = query(usersRef, where("last_login_country", "!=", null));
    
    const snapshot = await getDocs(q);
    
    // Group by login country and count
    const countryCounts: { [country: string]: number } = {};
    let totalUsers = 0;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const country = data.last_login_country || "Unknown";
      
      if (!countryCounts[country]) {
        countryCounts[country] = 0;
      }
      countryCounts[country]++;
      totalUsers++;
    });
    
    // Convert to array, calculate percentages, and sort
    return Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recent login locations:", error);
    return [];
  }
}

/**
 * Get geographic distribution summary
 * @returns Object with key metrics about geographic distribution
 */
export async function getGeographicSummary(): Promise<{
  totalCountries: number;
  totalUsersWithLocation: number;
  topCountry: string | null;
  topCountryCount: number;
}> {
  try {
    const countries = await getUsersByCountry();
    
    return {
      totalCountries: countries.length,
      totalUsersWithLocation: countries.reduce((sum, c) => sum + c.count, 0),
      topCountry: countries.length > 0 ? countries[0].country : null,
      topCountryCount: countries.length > 0 ? countries[0].count : 0,
    };
  } catch (error) {
    console.error("Error fetching geographic summary:", error);
    return {
      totalCountries: 0,
      totalUsersWithLocation: 0,
      topCountry: null,
      topCountryCount: 0,
    };
  }
}

/**
 * Get users grouped by country and state
 * @returns Array of countries with their states and counts
 */
export interface CountryStateData {
  country: string;
  countryCount: number;
  states: Array<{
    state: string;
    count: number;
  }>;
}

export async function getUsersByCountryAndState(): Promise<CountryStateData[]> {
  try {
    // Get all countries
    const countries = await getUsersByCountry();
    
    // Get states for each country
    const countryStateData: CountryStateData[] = await Promise.all(
      countries.map(async (country) => {
        const states = await getUsersByState(country.country);
        return {
          country: country.country,
          countryCount: country.count,
          states: states.map((s) => ({
            state: s.state,
            count: s.count,
          })),
        };
      })
    );
    
    return countryStateData;
  } catch (error) {
    console.error("Error fetching users by country and state:", error);
    return [];
  }
}

