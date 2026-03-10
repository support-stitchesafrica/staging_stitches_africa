/**
 * Referral Analytics Service for Atlas Dashboard
 * Optimized for performance with caching and real-time updates
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { 
  ReferralUser, 
  Referral, 
  ReferralTransaction, 
  ReferralEvent
} from '@/lib/referral/types';
import { cacheManager, withCache } from '@/lib/utils/cache-utils';
import { performanceMonitor } from '@/lib/utils/performance-utils';

export interface ReferralAnalyticsData {
  totalReferrers: number;
  totalReferees: number;
  totalDownloads: number;
  totalClicks: number;
  totalRevenue: number;
  conversionRate: number;
  topReferrers: TopReferrer[];
  referralsByDate: ChartDataPoint[];
  downloadsByDate: ChartDataPoint[];
  clicksByDate: ChartDataPoint[];
  revenueByDate: ChartDataPoint[];
}

export interface TopReferrer {
  id: string;
  fullName: string;
  email: string;
  referralCode: string;
  totalReferrals: number;
  totalRevenue: number;
  totalPoints: number;
  totalDownloads: number;
  totalClicks: number;
  conversionRate: number;
  createdAt: Date;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ReferralDetails {
  referrer: ReferralUser;
  referrals: Referral[];
  transactions: ReferralTransaction[];
  events: ReferralEvent[];
  stats: {
    totalReferrals: number;
    totalRevenue: number;
    totalPoints: number;
    totalClicks: number;
    totalDownloads: number;
    conversionRate: number;
    averageOrderValue: number;
  };
}

export interface DateRange {
  from: Date;
  to: Date;
}

export class ReferralAnalyticsService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly COLLECTIONS = {
    REFERRAL_USERS: 'staging_referralUsers',
    REFERRALS: 'staging_referrals',
    REFERRAL_TRANSACTIONS: 'staging_referralTransactions',
    REFERRAL_EVENTS: 'staging_referralEvents'
  };

  /**
   * Get comprehensive referral analytics data
   */
  static async getReferralAnalytics(dateRange: DateRange): Promise<ReferralAnalyticsData> {
    const trackPerformance = performanceMonitor.trackComponentRender('ReferralAnalyticsService.getReferralAnalytics');
    
    try {
      const cacheKey = `referral-analytics-${dateRange.from.getTime()}-${dateRange.to.getTime()}`;
      
      // Try cache first
      const cached = cacheManager.get<ReferralAnalyticsData>(cacheKey);
      if (cached) {
        trackPerformance();
        return cached;
      }

      console.log('Fetching referral analytics data...');

      // Initialize default values
      let totalReferrers = 0;
      let totalReferees = 0;
      let totalDownloads = 0;
      let totalClicks = 0;
      let totalRevenue = 0;
      let conversionRate = 0;
      const topReferrers: TopReferrer[] = [];
      let referralsByDate: ChartDataPoint[] = [];
      let downloadsByDate: ChartDataPoint[] = [];
      let clicksByDate: ChartDataPoint[] = [];
      let revenueByDate: ChartDataPoint[] = [];

      // Calculate date range for queries
      const fromTimestamp = Timestamp.fromDate(dateRange.from);
      const toTimestamp = Timestamp.fromDate(dateRange.to);

      try {
        // Get total referrers count using getDocs instead of getCountFromServer
        console.log('Fetching referrers...');
        const referrersQuery = query(collection(db, this.COLLECTIONS.REFERRAL_USERS));
        const referrersSnapshot = await getDocs(referrersQuery);
        totalReferrers = referrersSnapshot.size;
        console.log('Total referrers:', totalReferrers);
      } catch (error) {
        console.error('Error fetching referrers:', error);
      }

      try {
        // Get total referees count
        console.log('Fetching referees...');
        const refereesQuery = query(collection(db, this.COLLECTIONS.REFERRALS));
        const refereesSnapshot = await getDocs(refereesQuery);
        totalReferees = refereesSnapshot.size;
        console.log('Total referees:', totalReferees);
      } catch (error) {
        console.error('Error fetching referees:', error);
      }

      try {
        // Get total clicks from events (with date range)
        console.log('Fetching clicks...');
        const clicksQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
          where('eventType', '==', 'click'),
          where('createdAt', '>=', fromTimestamp),
          where('createdAt', '<=', toTimestamp)
        );
        const clicksSnapshot = await getDocs(clicksQuery);
        totalClicks = clicksSnapshot.size;
        console.log('Total clicks:', totalClicks);
      } catch (error) {
        console.error('Error fetching clicks:', error);
        // If date range query fails, try without date range
        try {
          const clicksQueryFallback = query(
            collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
            where('eventType', '==', 'click')
          );
          const clicksSnapshotFallback = await getDocs(clicksQueryFallback);
          totalClicks = clicksSnapshotFallback.size;
          console.log('Total clicks (fallback):', totalClicks);
        } catch (fallbackError) {
          console.error('Error fetching clicks (fallback):', fallbackError);
        }
      }

      try {
        // Get total downloads from events (with date range)
        console.log('Fetching downloads...');
        const downloadsQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
          where('eventType', '==', 'download'),
          where('createdAt', '>=', fromTimestamp),
          where('createdAt', '<=', toTimestamp)
        );
        const downloadsSnapshot = await getDocs(downloadsQuery);
        totalDownloads = downloadsSnapshot.size;
        console.log('Total downloads:', totalDownloads);
      } catch (error) {
        console.error('Error fetching downloads:', error);
        // If date range query fails, try without date range
        try {
          const downloadsQueryFallback = query(
            collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
            where('eventType', '==', 'download')
          );
          const downloadsSnapshotFallback = await getDocs(downloadsQueryFallback);
          totalDownloads = downloadsSnapshotFallback.size;
          console.log('Total downloads (fallback):', totalDownloads);
        } catch (fallbackError) {
          console.error('Error fetching downloads (fallback):', fallbackError);
        }
      }

      try {
        // Get total revenue from transactions
        console.log('Fetching revenue...');
        const transactionsQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_TRANSACTIONS),
          where('type', '==', 'purchase'),
          where('createdAt', '>=', fromTimestamp),
          where('createdAt', '<=', toTimestamp)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          totalRevenue += data.amount || 0;
        });
        console.log('Total revenue:', totalRevenue);
      } catch (error) {
        console.error('Error fetching revenue:', error);
        // Try without date range
        try {
          const transactionsQueryFallback = query(
            collection(db, this.COLLECTIONS.REFERRAL_TRANSACTIONS),
            where('type', '==', 'purchase')
          );
          const transactionsSnapshotFallback = await getDocs(transactionsQueryFallback);
          
          transactionsSnapshotFallback.forEach((doc) => {
            const data = doc.data();
            totalRevenue += data.amount || 0;
          });
          console.log('Total revenue (fallback):', totalRevenue);
        } catch (fallbackError) {
          console.error('Error fetching revenue (fallback):', fallbackError);
        }
      }

      try {
        // Calculate conversion rate (referees who made purchases / total referees)
        console.log('Calculating conversion rate...');
        const convertedRefereesQuery = query(
          collection(db, this.COLLECTIONS.REFERRALS),
          where('totalPurchases', '>', 0)
        );
        const convertedRefereesSnapshot = await getDocs(convertedRefereesQuery);
        const convertedReferees = convertedRefereesSnapshot.size;
        conversionRate = totalReferees > 0 ? (convertedReferees / totalReferees) * 100 : 0;
        console.log('Conversion rate:', conversionRate);
      } catch (error) {
        console.error('Error calculating conversion rate:', error);
      }

      try {
        // Get top referrers with enhanced data from referralEvents
        // Use a more efficient approach for top referrers
        const topReferrersQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_USERS),
          orderBy('totalReferrals', 'desc'),
          limit(10)
        );
        const topReferrersSnapshot = await getDocs(topReferrersQuery);
        
        // Get all referral codes from top referrers
        const topReferralCodes = topReferrersSnapshot.docs
          .map(doc => doc.data().referralCode)
          .filter(code => code && code.trim() !== '');

        // Batch fetch events for top referrers only
        let topReferrersEvents: { [referralCode: string]: { clicks: number; downloads: number } } = {};
        
        if (topReferralCodes.length > 0) {
          try {
            const eventsQuery = query(
              collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
              where('referralCode', 'in', topReferralCodes.slice(0, 10)) // Firestore 'in' limit
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            
            eventsSnapshot.forEach((doc) => {
              const data = doc.data();
              const referralCode = data.referralCode;
              const eventType = data.eventType;
              
              if (!topReferrersEvents[referralCode]) {
                topReferrersEvents[referralCode] = { clicks: 0, downloads: 0 };
              }
              
              if (eventType === 'click') {
                topReferrersEvents[referralCode].clicks++;
              } else if (eventType === 'download') {
                topReferrersEvents[referralCode].downloads++;
              }
            });
          } catch (error) {
            console.error('Error fetching events for top referrers:', error);
          }
        }
        
        // Build top referrers list
        topReferrersSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const referralCode = data.referralCode || '';
          const referrerId = doc.id;
          
          const eventsData = topReferrersEvents[referralCode] || { clicks: 0, downloads: 0 };
          
          const referrerConversionRate = data.totalReferrals > 0 
            ? ((data.totalReferrals - (data.pendingReferrals || 0)) / data.totalReferrals) * 100 
            : 0;
          
          topReferrers.push({
            id: referrerId,
            fullName: data.fullName || 'Unknown',
            email: data.email || '',
            referralCode: referralCode,
            totalReferrals: data.totalReferrals || 0,
            totalRevenue: data.totalRevenue || 0,
            totalPoints: data.totalPoints || 0,
            totalDownloads: eventsData.downloads,
            totalClicks: eventsData.clicks,
            conversionRate: parseFloat(referrerConversionRate.toFixed(2)),
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });
      } catch (error) {
        console.error('Error fetching top referrers:', error);
      }

      try {
        // Get chart data
        console.log('Fetching chart data...');
        referralsByDate = await this.getReferralsByDateRange(fromTimestamp, toTimestamp);
        downloadsByDate = await this.getDownloadsByDateRange(fromTimestamp, toTimestamp);
        clicksByDate = await this.getClicksByDateRange(fromTimestamp, toTimestamp);
        revenueByDate = await this.getRevenueByDateRange(fromTimestamp, toTimestamp);
        console.log('Chart data fetched successfully');
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Provide empty arrays as fallback
        referralsByDate = [];
        downloadsByDate = [];
        clicksByDate = [];
        revenueByDate = [];
      }

      const analyticsData: ReferralAnalyticsData = {
        totalReferrers,
        totalReferees,
        totalDownloads,
        totalClicks,
        totalRevenue,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        topReferrers,
        referralsByDate,
        downloadsByDate,
        clicksByDate,
        revenueByDate
      };

      console.log('Analytics data prepared:', analyticsData);

      // Cache the result
      cacheManager.set(cacheKey, analyticsData, this.CACHE_TTL);
      
      trackPerformance();
      return analyticsData;
    } catch (error) {
      console.error('Error fetching referral analytics:', error);
      trackPerformance();
      
      // Return empty data instead of throwing to prevent infinite loading
      return {
        totalReferrers: 0,
        totalReferees: 0,
        totalDownloads: 0,
        totalClicks: 0,
        totalRevenue: 0,
        conversionRate: 0,
        topReferrers: [],
        referralsByDate: [],
        downloadsByDate: [],
        clicksByDate: [],
        revenueByDate: []
      };
    }
  }

  /**
   * Get referrals grouped by date
   */
  private static async getReferralsByDateRange(
    fromTimestamp: Timestamp, 
    toTimestamp: Timestamp
  ): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching referrals by date range...');
      const referralsQuery = query(
        collection(db, this.COLLECTIONS.REFERRALS),
        where('createdAt', '>=', fromTimestamp),
        where('createdAt', '<=', toTimestamp),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(referralsQuery);
      const dateMap = new Map<string, number>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate();
        if (date) {
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
      });

      const result = Array.from(dateMap.entries()).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      console.log('Referrals by date:', result.length, 'data points');
      return result;
    } catch (error) {
      console.error('Error fetching referrals by date:', error);
      // Try without date range as fallback
      try {
        console.log('Trying referrals query without date range...');
        const referralsQueryFallback = query(
          collection(db, this.COLLECTIONS.REFERRALS),
          orderBy('createdAt', 'desc'),
          limit(30) // Limit to recent data
        );
        
        const snapshotFallback = await getDocs(referralsQueryFallback);
        const dateMap = new Map<string, number>();
        
        snapshotFallback.forEach((doc) => {
          const data = doc.data();
          const date = data.createdAt?.toDate();
          if (date) {
            const dateKey = date.toISOString().split('T')[0];
            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
          }
        });

        const result = Array.from(dateMap.entries()).map(([date, value]) => ({
          date,
          value,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        console.log('Referrals by date (fallback):', result.length, 'data points');
        return result;
      } catch (fallbackError) {
        console.error('Error fetching referrals by date (fallback):', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get downloads grouped by date using referralEvents collection
   */
  private static async getDownloadsByDateRange(
    fromTimestamp: Timestamp, 
    toTimestamp: Timestamp
  ): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching downloads by date range from referralEvents...');
      const downloadsQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
        where('eventType', '==', 'download'),
        where('createdAt', '>=', fromTimestamp),
        where('createdAt', '<=', toTimestamp),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(downloadsQuery);
      const dateMap = new Map<string, number>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate();
        if (date) {
          const dateKey = date.toISOString().split('T')[0];
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
      });

      const result = Array.from(dateMap.entries()).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      console.log('Downloads by date:', result.length, 'data points');
      return result;
    } catch (error) {
      console.error('Error fetching downloads by date:', error);
      // Fallback: try without date range
      try {
        console.log('Trying downloads query without date range...');
        const downloadsQueryFallback = query(
          collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
          where('eventType', '==', 'download'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        
        const snapshotFallback = await getDocs(downloadsQueryFallback);
        const dateMap = new Map<string, number>();
        
        snapshotFallback.forEach((doc) => {
          const data = doc.data();
          const date = data.createdAt?.toDate();
          if (date) {
            const dateKey = date.toISOString().split('T')[0];
            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
          }
        });

        const result = Array.from(dateMap.entries()).map(([date, value]) => ({
          date,
          value,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        console.log('Downloads by date (fallback):', result.length, 'data points');
        return result;
      } catch (fallbackError) {
        console.error('Error fetching downloads by date (fallback):', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get analytics data for a specific referral code with proper validation
   */
  static async getReferralCodeAnalytics(referralCode: string, dateRange?: DateRange): Promise<{
    totalClicks: number;
    totalDownloads: number;
    clicksByDate: ChartDataPoint[];
    downloadsByDate: ChartDataPoint[];
    deviceTypes: { [key: string]: number };
    referrerId?: string;
  }> {
    const trackPerformance = performanceMonitor.trackComponentRender('ReferralAnalyticsService.getReferralCodeAnalytics');
    
    try {
      console.log('Fetching analytics for referral code:', referralCode);

      // Validate referral code
      if (!referralCode || referralCode.trim() === '') {
        console.warn('Invalid referral code provided');
        trackPerformance();
        return {
          totalClicks: 0,
          totalDownloads: 0,
          clicksByDate: [],
          downloadsByDate: [],
          deviceTypes: {},
        };
      }

      let baseQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
        where('referralCode', '==', referralCode.trim())
      );

      // Add date range filter if provided
      if (dateRange) {
        const fromTimestamp = Timestamp.fromDate(dateRange.from);
        const toTimestamp = Timestamp.fromDate(dateRange.to);
        baseQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
          where('referralCode', '==', referralCode.trim()),
          where('createdAt', '>=', fromTimestamp),
          where('createdAt', '<=', toTimestamp)
        );
      }

      const eventsSnapshot = await getDocs(baseQuery);
      
      let totalClicks = 0;
      let totalDownloads = 0;
      const clicksByDate = new Map<string, number>();
      const downloadsByDate = new Map<string, number>();
      const deviceTypes: { [key: string]: number } = {};
      let referrerId: string | undefined;

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Double-check that this event belongs to the correct referral code
        if (data.referralCode !== referralCode.trim()) {
          console.warn(`Event ${doc.id} has mismatched referral code: expected ${referralCode}, got ${data.referralCode}`);
          return;
        }

        const eventType = data.eventType;
        const date = data.createdAt?.toDate();
        const deviceType = data.deviceType || 'unknown';
        
        // Set referrerId from first event
        if (!referrerId && data.referrerId) {
          referrerId = data.referrerId;
        }

        // Count device types
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;

        if (eventType === 'click') {
          totalClicks++;
          if (date) {
            const dateKey = date.toISOString().split('T')[0];
            clicksByDate.set(dateKey, (clicksByDate.get(dateKey) || 0) + 1);
          }
        } else if (eventType === 'download') {
          totalDownloads++;
          if (date) {
            const dateKey = date.toISOString().split('T')[0];
            downloadsByDate.set(dateKey, (downloadsByDate.get(dateKey) || 0) + 1);
          }
        }
      });

      const clicksChartData = Array.from(clicksByDate.entries()).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      const downloadsChartData = Array.from(downloadsByDate.entries()).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      console.log(`Analytics for ${referralCode}: ${totalClicks} clicks, ${totalDownloads} downloads (${eventsSnapshot.size} total events)`);

      trackPerformance();
      return {
        totalClicks,
        totalDownloads,
        clicksByDate: clicksChartData,
        downloadsByDate: downloadsChartData,
        deviceTypes,
        referrerId
      };
    } catch (error) {
      console.error('Error fetching referral code analytics:', error);
      trackPerformance();
      return {
        totalClicks: 0,
        totalDownloads: 0,
        clicksByDate: [],
        downloadsByDate: [],
        deviceTypes: {},
      };
    }
  }

  /**
   * Get clicks grouped by date using referralEvents collection
   */
  private static async getClicksByDateRange(
    fromTimestamp: Timestamp, 
    toTimestamp: Timestamp
  ): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching clicks by date range from referralEvents...');
      const clicksQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
        where('eventType', '==', 'click'),
        where('createdAt', '>=', fromTimestamp),
        where('createdAt', '<=', toTimestamp),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(clicksQuery);
      const dateMap = new Map<string, number>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate();
        if (date) {
          const dateKey = date.toISOString().split('T')[0];
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
      });

      const result = Array.from(dateMap.entries()).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      console.log('Clicks by date:', result.length, 'data points');
      return result;
    } catch (error) {
      console.error('Error fetching clicks by date:', error);
      // Fallback: try without date range
      try {
        console.log('Trying clicks query without date range...');
        const clicksQueryFallback = query(
          collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
          where('eventType', '==', 'click'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        
        const snapshotFallback = await getDocs(clicksQueryFallback);
        const dateMap = new Map<string, number>();
        
        snapshotFallback.forEach((doc) => {
          const data = doc.data();
          const date = data.createdAt?.toDate();
          if (date) {
            const dateKey = date.toISOString().split('T')[0];
            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
          }
        });

        const result = Array.from(dateMap.entries()).map(([date, value]) => ({
          date,
          value,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        console.log('Clicks by date (fallback):', result.length, 'data points');
        return result;
      } catch (fallbackError) {
        console.error('Error fetching clicks by date (fallback):', fallbackError);
        return [];
      }
    }
  }
  private static async getRevenueByDateRange(
    fromTimestamp: Timestamp, 
    toTimestamp: Timestamp
  ): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching revenue by date range...');
      const revenueQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_TRANSACTIONS),
        where('type', '==', 'purchase'),
        where('createdAt', '>=', fromTimestamp),
        where('createdAt', '<=', toTimestamp),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(revenueQuery);
      const dateMap = new Map<string, number>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate();
        const amount = data.amount || 0;
        if (date) {
          const dateKey = date.toISOString().split('T')[0];
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + amount);
        }
      });

      const result = Array.from(dateMap.entries()).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      console.log('Revenue by date:', result.length, 'data points');
      return result;
    } catch (error) {
      console.error('Error fetching revenue by date:', error);
      return [];
    }
  }

  /**
   * Get detailed referral information for a specific referrer
   */
  static async getReferralDetails(referrerId: string): Promise<ReferralDetails> {
    const trackPerformance = performanceMonitor.trackComponentRender('ReferralAnalyticsService.getReferralDetails');
    
    try {
      const cacheKey = `referral-details-${referrerId}`;
      
      // Try cache first
      const cached = cacheManager.get<ReferralDetails>(cacheKey);
      if (cached) {
        trackPerformance();
        return cached;
      }

      console.log('Fetching referrer details for:', referrerId);

      // Initialize default values
      let referrerData: ReferralUser | null = null;
      const referrals: Referral[] = [];
      const transactions: ReferralTransaction[] = [];
      const events: ReferralEvent[] = [];

      try {
        // Get referrer data - comprehensive search approach
        console.log('Step 1: Fetching referrer data for ID:', referrerId);
        
        // Strategy 1: Try direct document lookup first
        try {
          const docRef = collection(db, this.COLLECTIONS.REFERRAL_USERS);
          const docSnapshot = await getDocs(docRef);
          
          // Look for exact document ID match
          let foundDoc = docSnapshot.docs.find(doc => doc.id === referrerId);
          
          if (foundDoc) {
            console.log('Found referrer by document ID');
            const docData = foundDoc.data();
            referrerData = { ...docData, id: foundDoc.id } as ReferralUser & { id: string };
          } else {
            // Look for userId field match
            foundDoc = docSnapshot.docs.find(doc => doc.data().userId === referrerId);
            
            if (foundDoc) {
              console.log('Found referrer by userId field');
              const docData = foundDoc.data();
              referrerData = { ...docData, id: foundDoc.id } as ReferralUser & { id: string };
            } else {
              // Look for referralCode match (in case ID is actually a referral code)
              foundDoc = docSnapshot.docs.find(doc => doc.data().referralCode === referrerId);
              
              if (foundDoc) {
                console.log('Found referrer by referralCode');
                const docData = foundDoc.data();
                referrerData = { ...docData, id: foundDoc.id } as ReferralUser & { id: string };
              }
            }
          }
          
          // If still not found, get all available IDs for debugging
          if (!referrerData) {
            const availableIds = docSnapshot.docs.map(doc => ({
              docId: doc.id,
              userId: doc.data().userId,
              fullName: doc.data().fullName,
              referralCode: doc.data().referralCode,
              email: doc.data().email
            }));
            console.log('Available referrer IDs:', availableIds);
            
            // Try to find a match by partial ID or email
            const partialMatch = docSnapshot.docs.find(doc => 
              doc.id.includes(referrerId) || 
              doc.data().userId?.includes(referrerId) ||
              doc.data().email?.includes(referrerId)
            );
            
            if (partialMatch) {
              console.log('Found referrer by partial match');
              const docData = partialMatch.data();
              referrerData = { ...docData, id: partialMatch.id } as ReferralUser & { id: string };
            } else {
              throw new Error(`Referrer not found with ID: ${referrerId}. Available referrers: ${JSON.stringify(availableIds.slice(0, 5), null, 2)}`);
            }
          }
        } catch (searchError) {
          console.error('Error in comprehensive referrer search:', searchError);
          throw searchError;
        }
        
        console.log('Referrer data found:', {
          docId: (referrerData as any).id,
          userId: referrerData.userId,
          fullName: referrerData.fullName,
          referralCode: referrerData.referralCode,
          email: referrerData.email
        });
      } catch (error) {
        console.error('Error fetching referrer data:', error);
        throw new Error(`Referrer not found: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Use the actual userId from the referrer data for queries
      const actualUserId = referrerData.userId || referrerId;
      const referralCode = referrerData.referralCode;

      try {
        // Get referrals for this referrer using userId
        console.log('Step 2: Fetching referrals for userId:', actualUserId);
        
        try {
          const referralsQuery = query(
            collection(db, this.COLLECTIONS.REFERRALS),
            where('referrerId', '==', actualUserId),
            orderBy('createdAt', 'desc'),
            limit(500) // Increased limit to show all referrals
          );
          const referralsSnapshot = await getDocs(referralsQuery);
          
          console.log(`Found ${referralsSnapshot.size} referrals for userId: ${actualUserId}`);
          referralsSnapshot.forEach((doc) => {
            const referralData = doc.data();
            referrals.push({ 
              id: doc.id, 
              ...referralData,
              // Ensure proper date handling
              createdAt: referralData.createdAt || Timestamp.now(),
              signUpDate: referralData.signUpDate || referralData.createdAt || Timestamp.now()
            } as Referral);
          });
        } catch (orderByError) {
          console.log('OrderBy failed for referrals, trying without orderBy...');
          // Try without orderBy if it fails
          const referralsQueryFallback = query(
            collection(db, this.COLLECTIONS.REFERRALS),
            where('referrerId', '==', actualUserId),
            limit(500) // Increased limit
          );
          const referralsSnapshotFallback = await getDocs(referralsQueryFallback);
          
          console.log(`Found ${referralsSnapshotFallback.size} referrals (fallback)`);
          referralsSnapshotFallback.forEach((doc) => {
            const referralData = doc.data();
            referrals.push({ 
              id: doc.id, 
              ...referralData,
              createdAt: referralData.createdAt || Timestamp.now(),
              signUpDate: referralData.signUpDate || referralData.createdAt || Timestamp.now()
            } as Referral);
          });
        }
        
        // If no referrals found with userId, try with document ID
        if (referrals.length === 0 && actualUserId !== referrerId) {
          console.log('No referrals found with userId, trying with document ID...');
          try {
            const referralsQueryDocId = query(
              collection(db, this.COLLECTIONS.REFERRALS),
              where('referrerId', '==', referrerId),
              limit(500) // Increased limit
            );
            const referralsSnapshotDocId = await getDocs(referralsQueryDocId);
            console.log(`Found ${referralsSnapshotDocId.size} referrals for docId: ${referrerId}`);
            
            referralsSnapshotDocId.forEach((doc) => {
              const referralData = doc.data();
              referrals.push({ 
                id: doc.id, 
                ...referralData,
                createdAt: referralData.createdAt || Timestamp.now(),
                signUpDate: referralData.signUpDate || referralData.createdAt || Timestamp.now()
              } as Referral);
            });
          } catch (docIdError) {
            console.error('Error fetching referrals with document ID:', docIdError);
          }
        }
        
        // If still no referrals but referrer has totalReferrals > 0, this indicates data inconsistency
        // Log this for debugging but don't create fake data
        if (referrals.length === 0 && referrerData.totalReferrals > 0) {
          console.warn(`Data inconsistency: Referrer ${referrerData.fullName} has totalReferrals=${referrerData.totalReferrals} but no referral documents found`);
        }
        
        console.log(`Total referrals loaded: ${referrals.length}`);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      }

      try {
        // Get transactions for this referrer using both userId and document ID
        console.log('Step 3: Fetching transactions for referrer...');
        
        // Try with the actual userId first
        let transactionsQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_TRANSACTIONS),
          where('referrerId', '==', actualUserId),
          orderBy('createdAt', 'desc'),
          limit(500) // Increased limit to show all transactions
        );
        
        try {
          const transactionsSnapshot = await getDocs(transactionsQuery);
          console.log(`Found ${transactionsSnapshot.size} transactions for userId: ${actualUserId}`);
          
          transactionsSnapshot.forEach((doc) => {
            const transactionData = doc.data();
            transactions.push({ 
              id: doc.id, 
              ...transactionData,
              // Ensure proper date handling
              createdAt: transactionData.createdAt || Timestamp.now()
            } as ReferralTransaction);
          });
        } catch (orderByError) {
          console.log('OrderBy failed, trying without orderBy...');
          // Try without orderBy if it fails
          const transactionsQueryFallback = query(
            collection(db, this.COLLECTIONS.REFERRAL_TRANSACTIONS),
            where('referrerId', '==', actualUserId),
            limit(500) // Increased limit
          );
          const transactionsSnapshotFallback = await getDocs(transactionsQueryFallback);
          console.log(`Found ${transactionsSnapshotFallback.size} transactions (fallback)`);
          
          transactionsSnapshotFallback.forEach((doc) => {
            const transactionData = doc.data();
            transactions.push({ 
              id: doc.id, 
              ...transactionData,
              createdAt: transactionData.createdAt || Timestamp.now()
            } as ReferralTransaction);
          });
        }
        
        // If no transactions found with userId, try with document ID
        if (transactions.length === 0 && actualUserId !== referrerId) {
          console.log('No transactions found with userId, trying with document ID...');
          try {
            const transactionsQueryDocId = query(
              collection(db, this.COLLECTIONS.REFERRAL_TRANSACTIONS),
              where('referrerId', '==', referrerId),
              limit(500) // Increased limit
            );
            const transactionsSnapshotDocId = await getDocs(transactionsQueryDocId);
            console.log(`Found ${transactionsSnapshotDocId.size} transactions for docId: ${referrerId}`);
            
            transactionsSnapshotDocId.forEach((doc) => {
              const transactionData = doc.data();
              transactions.push({ 
                id: doc.id, 
                ...transactionData,
                createdAt: transactionData.createdAt || Timestamp.now()
              } as ReferralTransaction);
            });
          } catch (docIdError) {
            console.error('Error fetching transactions with document ID:', docIdError);
          }
        }
        
        // If no transactions found, don't create sample data - use real data only
        console.log(`Total transactions loaded: ${transactions.length}`);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }

      try {
        // Get events for this referrer - comprehensive search
        console.log('Step 4: Fetching events for referrer...');
        console.log('Searching with referralCode:', referralCode);
        console.log('Searching with referrerId:', actualUserId);
        
        // Strategy 1: Search by referral code (most reliable) - FETCH ALL EVENTS
        if (referralCode && referralCode.trim() !== '') {
          try {
            console.log('Searching events by referralCode:', referralCode);
            const eventsQuery = query(
              collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
              where('referralCode', '==', referralCode)
              // REMOVED LIMIT to get ALL events
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            
            console.log(`Found ${eventsSnapshot.size} events by referralCode`);
            eventsSnapshot.forEach((doc) => {
              const eventData = doc.data();
              events.push({ 
                id: doc.id, 
                ...eventData,
                createdAt: eventData.createdAt || Timestamp.now()
              } as ReferralEvent);
            });
          } catch (codeError) {
            console.error('Error searching by referralCode:', codeError);
          }
        }
        
        // Strategy 2: Search by referrerId if no events found by code
        if (events.length === 0) {
          try {
            console.log('Searching events by referrerId:', actualUserId);
            const eventsQuery = query(
              collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
              where('referrerId', '==', actualUserId)
              // REMOVED LIMIT to get ALL events
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            
            console.log(`Found ${eventsSnapshot.size} events by referrerId`);
            eventsSnapshot.forEach((doc) => {
              const eventData = doc.data();
              events.push({ 
                id: doc.id, 
                ...eventData,
                createdAt: eventData.createdAt || Timestamp.now()
              } as ReferralEvent);
            });
          } catch (idError) {
            console.error('Error searching by referrerId:', idError);
          }
        }
        
        // Strategy 3: Search by document ID if still no events
        if (events.length === 0 && actualUserId !== referrerId) {
          try {
            console.log('Searching events by document ID:', referrerId);
            const eventsQuery = query(
              collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
              where('referrerId', '==', referrerId)
              // REMOVED LIMIT to get ALL events
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            
            console.log(`Found ${eventsSnapshot.size} events by document ID`);
            eventsSnapshot.forEach((doc) => {
              const eventData = doc.data();
              events.push({ 
                id: doc.id, 
                ...eventData,
                createdAt: eventData.createdAt || Timestamp.now()
              } as ReferralEvent);
            });
          } catch (docIdError) {
            console.error('Error searching by document ID:', docIdError);
          }
        }
        
        console.log(`Total events loaded: ${events.length}`);
        
        // Log event breakdown for debugging
        const clickEvents = events.filter(e => e.eventType === 'click').length;
        const downloadEvents = events.filter(e => e.eventType === 'download').length;
        console.log(`Event breakdown: ${clickEvents} clicks, ${downloadEvents} downloads`);
        
        // If we still have fewer events than expected, log a warning
        if (referrerData.totalDownloads && downloadEvents < referrerData.totalDownloads) {
          console.warn(`Missing download events: expected ${referrerData.totalDownloads}, found ${downloadEvents}`);
        }
        if (referrerData.totalClicks && clickEvents < referrerData.totalClicks) {
          console.warn(`Missing click events: expected ${referrerData.totalClicks}, found ${clickEvents}`);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }

      // Calculate stats with proper data
      const totalClicks = events.filter(e => e.eventType === 'click').length;
      const totalDownloads = events.filter(e => e.eventType === 'download').length;
      const totalPurchaseAmount = transactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const purchaseTransactions = transactions.filter(t => t.type === 'purchase');
      const averageOrderValue = purchaseTransactions.length > 0
        ? totalPurchaseAmount / purchaseTransactions.length
        : 0;
      const convertedReferrals = referrals.filter(r => (r.totalPurchases || 0) > 0).length;
      const conversionRate = referrals.length > 0 ? (convertedReferrals / referrals.length) * 100 : 0;

      const details: ReferralDetails = {
        referrer: referrerData,
        referrals,
        transactions,
        events,
        stats: {
          totalReferrals: referrals.length,
          totalRevenue: totalPurchaseAmount,
          totalPoints: referrerData.totalPoints || 0,
          totalClicks,
          totalDownloads,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
        }
      };

      console.log('Referrer details prepared successfully:', {
        referrer: referrerData.fullName,
        referrerId: actualUserId,
        totalReferrals: details.stats.totalReferrals,
        totalRevenue: details.stats.totalRevenue,
        totalClicks: details.stats.totalClicks,
        totalDownloads: details.stats.totalDownloads,
        transactionsCount: transactions.length,
        eventsCount: events.length,
        referralsCount: referrals.length
      });

      // Cache the result
      cacheManager.set(cacheKey, details, this.CACHE_TTL);
      
      trackPerformance();
      return details;
    } catch (error) {
      console.error('Error fetching referral details:', error);
      trackPerformance();
      throw error;
    }
  }

  /**
   * Get total count of referrers (optimized)
   */
  static async getTotalReferrersCount(): Promise<number> {
    try {
      // Use a simple query to get count
      const referrersQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_USERS),
        limit(1000) // Reasonable limit for counting
      );
      const referrersSnapshot = await getDocs(referrersQuery);
      return referrersSnapshot.size;
    } catch (error) {
      console.error('Error getting total referrers count:', error);
      return 0;
    }
  }

  /**
   * Get referrers list with minimal data for faster loading
   */
  static async getReferrersListFast(
    pageSize: number = 10
  ): Promise<{ referrers: TopReferrer[]; totalCount: number }> {
    try {
      // Get referrers with basic data only
      const referrersQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_USERS),
        orderBy('totalReferrals', 'desc'),
        limit(pageSize)
      );

      const [snapshot, totalCount] = await Promise.all([
        getDocs(referrersQuery),
        this.getTotalReferrersCount()
      ]);

      const referrers: TopReferrer[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const userId = data.userId || doc.id; // Use userId field, fallback to doc.id
        const conversionRate = data.totalReferrals > 0 
          ? ((data.totalReferrals - (data.pendingReferrals || 0)) / data.totalReferrals) * 100 
          : 0;
        
        return {
          id: userId, // Use userId instead of doc.id for proper referencing
          fullName: data.fullName || 'Unknown',
          email: data.email || '',
          referralCode: data.referralCode || '',
          totalReferrals: data.totalReferrals || 0,
          totalRevenue: data.totalRevenue || 0,
          totalPoints: data.totalPoints || 0,
          totalDownloads: 0, // Will be loaded separately if needed
          totalClicks: 0, // Will be loaded separately if needed
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      return { referrers, totalCount };
    } catch (error) {
      console.error('Error fetching referrers list (fast):', error);
      throw error;
    }
  }

  /**
   * Get paginated list of referrers with enhanced analytics from referralEvents
   * Optimized version that reduces database queries
   * NOTE: This method fetches real-time data from referralEvents collection
   * to ensure accuracy. Any discrepancies with cached data in referralUsers
   * collection should be resolved by using this as the source of truth.
   */
  static async getReferrersList(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    skipCache: boolean = false
  ): Promise<{ referrers: TopReferrer[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    try {
      // Clear cache if requested to ensure fresh data
      if (skipCache) {
        console.log('Skipping cache, fetching fresh referrers data...');
      }

      let referrersQuery = query(
        collection(db, this.COLLECTIONS.REFERRAL_USERS),
        orderBy('totalReferrals', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        referrersQuery = query(
          collection(db, this.COLLECTIONS.REFERRAL_USERS),
          orderBy('totalReferrals', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(referrersQuery);
      const referrers: TopReferrer[] = [];
      
      // Get all referral codes from this batch
      const referralCodes = snapshot.docs
        .map(doc => doc.data().referralCode)
        .filter(code => code && code.trim() !== '');

      console.log(`Fetching events for ${referralCodes.length} referral codes...`);

      // Batch fetch all events for these referral codes in one query
      let allEvents: { [referralCode: string]: { clicks: number; downloads: number } } = {};
      
      if (referralCodes.length > 0) {
        try {
          // Fetch all events for these referral codes in batches (Firestore 'in' limit is 10)
          const batchSize = 10;
          for (let i = 0; i < referralCodes.length; i += batchSize) {
            const batch = referralCodes.slice(i, i + batchSize);
            
            const eventsQuery = query(
              collection(db, this.COLLECTIONS.REFERRAL_EVENTS),
              where('referralCode', 'in', batch)
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            
            console.log(`Batch ${Math.floor(i / batchSize) + 1}: Found ${eventsSnapshot.size} events for ${batch.length} codes`);
            
            // Process events and group by referral code and event type
            eventsSnapshot.forEach((doc) => {
              const data = doc.data();
              const referralCode = data.referralCode;
              const eventType = data.eventType;
              
              if (!allEvents[referralCode]) {
                allEvents[referralCode] = { clicks: 0, downloads: 0 };
              }
              
              if (eventType === 'click') {
                allEvents[referralCode].clicks++;
              } else if (eventType === 'download') {
                allEvents[referralCode].downloads++;
              }
            });
          }
          
          // Log summary of events found
          console.log('Events summary by referral code:', 
            Object.entries(allEvents).map(([code, data]) => ({
              code,
              clicks: data.clicks,
              downloads: data.downloads
            }))
          );
        } catch (error) {
          console.error('Error fetching events in batch:', error);
          // Continue without events data if there's an error
        }
      }
      
      // Build referrers list with the batched events data
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const referralCode = data.referralCode || '';
        const userId = data.userId || doc.id; // Use userId field, fallback to doc.id
        
        // Get events data from our batch fetch - THIS IS THE ACCURATE DATA
        const eventsData = allEvents[referralCode] || { clicks: 0, downloads: 0 };
        
        // Log any discrepancies between cached and actual data
        if (data.totalDownloads && data.totalDownloads !== eventsData.downloads) {
          console.warn(`Data discrepancy for ${data.fullName}: cached downloads=${data.totalDownloads}, actual downloads=${eventsData.downloads}`);
        }
        if (data.totalClicks && data.totalClicks !== eventsData.clicks) {
          console.warn(`Data discrepancy for ${data.fullName}: cached clicks=${data.totalClicks}, actual clicks=${eventsData.clicks}`);
        }
        
        const conversionRate = data.totalReferrals > 0 
          ? ((data.totalReferrals - (data.pendingReferrals || 0)) / data.totalReferrals) * 100 
          : 0;
        
        referrers.push({
          id: userId, // Use userId instead of doc.id for proper referencing
          fullName: data.fullName || 'Unknown',
          email: data.email || '',
          referralCode: referralCode,
          totalReferrals: data.totalReferrals || 0,
          totalRevenue: data.totalRevenue || 0,
          totalPoints: data.totalPoints || 0,
          // Use actual event counts from referralEvents collection, not cached values
          totalDownloads: eventsData.downloads,
          totalClicks: eventsData.clicks,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });

      const lastDocument = snapshot.docs[snapshot.docs.length - 1];

      console.log(`Loaded ${referrers.length} referrers with accurate event data`);

      return {
        referrers,
        lastDoc: lastDocument
      };
    } catch (error) {
      console.error('Error fetching referrers list:', error);
      throw error;
    }
  }

  /**
   * Validate and sync referral data to ensure proper attribution
   * This method can be used to audit and fix any data inconsistencies
   */
  static async validateReferralDataIntegrity(): Promise<{
    totalReferrers: number;
    referrersWithValidCodes: number;
    referrersWithoutCodes: number;
    orphanedEvents: number;
    validEvents: number;
  }> {
    try {
      console.log('Starting referral data integrity validation...');

      // Get all referrers
      const referrersSnapshot = await getDocs(collection(db, this.COLLECTIONS.REFERRAL_USERS));
      const totalReferrers = referrersSnapshot.size;
      
      let referrersWithValidCodes = 0;
      let referrersWithoutCodes = 0;
      const validReferralCodes = new Set<string>();

      // Check referrers and collect valid referral codes
      referrersSnapshot.forEach((doc) => {
        const data = doc.data();
        const referralCode = data.referralCode;
        
        if (referralCode && referralCode.trim() !== '') {
          referrersWithValidCodes++;
          validReferralCodes.add(referralCode.trim());
        } else {
          referrersWithoutCodes++;
          console.warn(`Referrer ${data.fullName} (${doc.id}) has no valid referral code`);
        }
      });

      // Check events and count orphaned vs valid events
      const eventsSnapshot = await getDocs(collection(db, this.COLLECTIONS.REFERRAL_EVENTS));
      let validEvents = 0;
      let orphanedEvents = 0;

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        const eventReferralCode = data.referralCode;
        
        if (eventReferralCode && validReferralCodes.has(eventReferralCode.trim())) {
          validEvents++;
        } else {
          orphanedEvents++;
          console.warn(`Orphaned event ${doc.id} with referral code: ${eventReferralCode}`);
        }
      });

      const report = {
        totalReferrers,
        referrersWithValidCodes,
        referrersWithoutCodes,
        orphanedEvents,
        validEvents
      };

      console.log('Referral data integrity report:', report);
      return report;
    } catch (error) {
      console.error('Error validating referral data integrity:', error);
      throw error;
    }
  }

  /**
   * Get all unique referral codes from referralEvents collection
   * Useful for debugging and data validation
   */
  static async getUniqueReferralCodesFromEvents(): Promise<string[]> {
    try {
      const eventsSnapshot = await getDocs(collection(db, this.COLLECTIONS.REFERRAL_EVENTS));
      const uniqueCodes = new Set<string>();

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.referralCode && data.referralCode.trim() !== '') {
          uniqueCodes.add(data.referralCode.trim());
        }
      });

      return Array.from(uniqueCodes).sort();
    } catch (error) {
      console.error('Error getting unique referral codes from events:', error);
      return [];
    }
  }
  static subscribeToReferralAnalytics(
    dateRange: DateRange,
    callback: (data: ReferralAnalyticsData) => void
  ): () => void {
    // Set up real-time listeners for key collections with debouncing
    const unsubscribers: (() => void)[] = [];
    let updateTimeout: NodeJS.Timeout | null = null;

    const debouncedUpdate = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      updateTimeout = setTimeout(async () => {
        try {
          // Invalidate cache and fetch fresh data
          const cacheKey = `referral-analytics-${dateRange.from.getTime()}-${dateRange.to.getTime()}`;
          cacheManager.delete(cacheKey);
          
          const data = await this.getReferralAnalytics(dateRange);
          callback(data);
        } catch (error) {
          console.error('Error in real-time subscription:', error);
        }
      }, 2000); // 2 second debounce
    };

    // Listen to referral users changes (less frequent updates)
    const referrersUnsubscribe = onSnapshot(
      collection(db, this.COLLECTIONS.REFERRAL_USERS),
      debouncedUpdate,
      (error) => console.error('Referrers subscription error:', error)
    );
    unsubscribers.push(referrersUnsubscribe);

    // Listen to referrals changes
    const referralsUnsubscribe = onSnapshot(
      collection(db, this.COLLECTIONS.REFERRALS),
      debouncedUpdate,
      (error) => console.error('Referrals subscription error:', error)
    );
    unsubscribers.push(referralsUnsubscribe);

    // Return cleanup function
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
}

// Cached versions of frequently used methods
export const getCachedReferralAnalytics = withCache(
  ReferralAnalyticsService.getReferralAnalytics.bind(ReferralAnalyticsService),
  (dateRange: DateRange) => `referral-analytics-${dateRange.from.getTime()}-${dateRange.to.getTime()}`,
  ReferralAnalyticsService['CACHE_TTL']
);

export const getCachedReferralDetails = withCache(
  ReferralAnalyticsService.getReferralDetails.bind(ReferralAnalyticsService),
  (referrerId: string) => `referral-details-${referrerId}`,
  ReferralAnalyticsService['CACHE_TTL']
);