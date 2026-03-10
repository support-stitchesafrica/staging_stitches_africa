
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  Timestamp,
  DocumentSnapshot,
  getCountFromServer,
} from "firebase/firestore";
import { FreeGiftClaim } from "@/types";

export interface FreeGiftStats {
  totalRequested: number;
  totalDelivered: number;
  byCountry: Record<string, number>;
  byState: Record<string, number>;
  byCity: Record<string, number>;
  byRegion: Record<string, { requested: number; delivered: number; cities: string[] }>;
  conversionRate?: number;
  deliveryRate: number;
  topRegions: Array<{ region: string; count: number; deliveryRate: number }>;
  recentTrends: Array<{ date: string; requested: number; delivered: number }>;
}

export interface PaginatedClaimsResult {
  claims: FreeGiftClaim[];
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  currentPage: number;
  totalPages: number;
  firstDoc?: DocumentSnapshot;
  lastDoc?: DocumentSnapshot;
}

export interface ClaimsFilters {
  country?: string;
  state?: string;
  city?: string;
  status?: 'requested' | 'shipped';
  dateFrom?: Date;
  dateTo?: Date;
}

export const getFreeGiftStats = async (): Promise<FreeGiftStats> => {
  try {
    const claimsRef = collection(db, "staging_free_gift_claims");
    const snapshot = await getDocs(claimsRef);

    let totalRequested = 0;
    let totalDelivered = 0;
    const byCountry: Record<string, number> = {};
    const byState: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byRegion: Record<string, { requested: number; delivered: number; cities: string[] }> = {};
    const dailyData: Record<string, { requested: number; delivered: number }> = {};

    snapshot.forEach((doc) => {
      const data = doc.data() as FreeGiftClaim;
      
      // Total counts
      totalRequested++;
      if (data.status === "shipped") {
        totalDelivered++;
      }

      // Location aggregation
      const country = data.country || "Unknown";
      const state = data.state || "Unknown";
      const city = data.city || "Unknown";
      const regionKey = `${state}, ${country}`;

      byCountry[country] = (byCountry[country] || 0) + 1;
      byState[state] = (byState[state] || 0) + 1;
      byCity[city] = (byCity[city] || 0) + 1;

      // Regional data with delivery tracking
      if (!byRegion[regionKey]) {
        byRegion[regionKey] = { requested: 0, delivered: 0, cities: [] };
      }
      byRegion[regionKey].requested++;
      if (data.status === "shipped") {
        byRegion[regionKey].delivered++;
      }
      if (!byRegion[regionKey].cities.includes(city)) {
        byRegion[regionKey].cities.push(city);
      }

      // Daily trends (last 30 days)
      if (data.createdAt) {
        const date = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { requested: 0, delivered: 0 };
        }
        dailyData[dateKey].requested++;
        if (data.status === "shipped") {
          dailyData[dateKey].delivered++;
        }
      }
    });

    // Calculate top regions with delivery rates
    const topRegions = Object.entries(byRegion)
      .map(([region, data]) => ({
        region,
        count: data.requested,
        deliveryRate: data.requested > 0 ? (data.delivered / data.requested) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent trends (last 7 days)
    const recentTrends = Object.entries(dailyData)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7)
      .reverse()
      .map(([date, data]) => ({
        date,
        requested: data.requested,
        delivered: data.delivered
      }));

    const deliveryRate = totalRequested > 0 ? (totalDelivered / totalRequested) * 100 : 0;

    return {
      totalRequested,
      totalDelivered,
      byCountry,
      byState,
      byCity,
      byRegion,
      deliveryRate,
      topRegions,
      recentTrends,
    };
  } catch (error) {
    console.error("Error fetching free gift stats:", error);
    return {
      totalRequested: 0,
      totalDelivered: 0,
      byCountry: {},
      byState: {},
      byCity: {},
      byRegion: {},
      deliveryRate: 0,
      topRegions: [],
      recentTrends: [],
    };
  }
};

export const getPaginatedFreeGiftClaims = async (
  page: number = 1,
  pageSize: number = 20,
  filters: ClaimsFilters = {},
  lastDoc?: DocumentSnapshot,
  firstDoc?: DocumentSnapshot,
  direction: 'next' | 'prev' = 'next'
): Promise<PaginatedClaimsResult> => {
  try {
    const claimsRef = collection(db, "staging_free_gift_claims");
    
    // Build query with filters
    let queryConstraints: any[] = [orderBy("createdAt", "desc")];
    
    if (filters.country) {
      queryConstraints.push(where("country", "==", filters.country));
    }
    if (filters.state) {
      queryConstraints.push(where("state", "==", filters.state));
    }
    if (filters.city) {
      queryConstraints.push(where("city", "==", filters.city));
    }
    if (filters.status) {
      queryConstraints.push(where("status", "==", filters.status));
    }
    if (filters.dateFrom) {
      queryConstraints.push(where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom)));
    }
    if (filters.dateTo) {
      queryConstraints.push(where("createdAt", "<=", Timestamp.fromDate(filters.dateTo)));
    }

    // Get total count for pagination
    const countQuery = query(claimsRef, ...queryConstraints.filter(c => c.type !== 'orderBy' && c.type !== 'limit'));
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Add pagination
    if (direction === 'next' && lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    } else if (direction === 'prev' && firstDoc) {
      queryConstraints = queryConstraints.map(c => 
        c.type === 'orderBy' ? orderBy("createdAt", "asc") : c
      );
      queryConstraints.push(startAfter(firstDoc));
      queryConstraints.push(limitToLast(pageSize));
    }
    
    queryConstraints.push(limit(pageSize));

    const q = query(claimsRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    const claims = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : new Date(doc.data().createdAt),
      claimedAt: doc.data().claimedAt instanceof Timestamp 
        ? doc.data().claimedAt.toDate() 
        : new Date(doc.data().claimedAt || Date.now()),
    })) as FreeGiftClaim[];

    // Reverse if we used limitToLast for previous page
    if (direction === 'prev') {
      claims.reverse();
    }

    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const newFirstDoc = snapshot.docs[0];
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return {
      claims,
      totalCount,
      hasNextPage,
      hasPrevPage,
      currentPage: page,
      totalPages,
      firstDoc: newFirstDoc,
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error("Error fetching paginated free gift claims:", error);
    return {
      claims: [],
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      currentPage: 1,
      totalPages: 1,
    };
  }
};

export const getRecentFreeGiftClaims = async (
  limitCount: number = 10
): Promise<FreeGiftClaim[]> => {
  try {
    const claimsRef = collection(db, "staging_free_gift_claims");
    const q = query(claimsRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure dates are converted if they come as timestamps
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : new Date(doc.data().createdAt),
      claimedAt: doc.data().claimedAt instanceof Timestamp 
        ? doc.data().claimedAt.toDate() 
        : new Date(doc.data().claimedAt || Date.now()),
    })) as FreeGiftClaim[];
  } catch (error) {
    console.error("Error fetching recent free gift claims:", error);
    return [];
  }
};

// Get unique filter options for dropdowns
export const getFilterOptions = async () => {
  try {
    const claimsRef = collection(db, "staging_free_gift_claims");
    const snapshot = await getDocs(claimsRef);
    
    const countries = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();
    
    snapshot.forEach((doc) => {
      const data = doc.data() as FreeGiftClaim;
      if (data.country) countries.add(data.country);
      if (data.state) states.add(data.state);
      if (data.city) cities.add(data.city);
    });
    
    return {
      countries: Array.from(countries).sort(),
      states: Array.from(states).sort(),
      cities: Array.from(cities).sort(),
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return {
      countries: [],
      states: [],
      cities: [],
    };
  }
};
