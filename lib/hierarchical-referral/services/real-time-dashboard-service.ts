import { 
  MotherInfluencerDashboardData,
  MiniInfluencerDashboardData,
  Influencer,
  Activity,
  Commission,
  ReferralCode,
  HierarchicalReferralErrorCode
} from '../../../types/hierarchical-referral';
import { db } from '../../firebase-client';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';

/**
 * Real-time Dashboard Service - Manages real-time updates for dashboard data
 * 
 * Implements Requirements:
 * - 3.5: Real-time dashboard updates (5-minute maximum latency)
 * - 7.5: Real-time update latency requirements
 */
export class HierarchicalRealTimeDashboardService {
  private static readonly INFLUENCERS_COLLECTION = 'hierarchical_influencers';
  private static readonly ACTIVITIES_COLLECTION = 'hierarchical_activities';
  private static readonly COMMISSIONS_COLLECTION = 'hierarchical_commissions';
  private static readonly REFERRAL_CODES_COLLECTION = 'hierarchical_referral_codes';
  
  // Store active listeners for cleanup
  private static activeListeners = new Map<string, Unsubscribe[]>();

  /**
   * Subscribe to real-time Mother Influencer dashboard updates
   * Requirements: 3.5, 7.5 - Real-time updates with 5-minute maximum latency
   */
  static subscribeToMotherInfluencerDashboard(
    influencerId: string,
    onUpdate: (data: Partial<MotherInfluencerDashboardData>) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listeners: Unsubscribe[] = [];
    const listenerId = `mother_${influencerId}`;

    try {
      // 1. Listen to influencer profile changes
      const influencerRef = doc(db, this.INFLUENCERS_COLLECTION, influencerId);
      const influencerListener = onSnapshot(
        influencerRef,
        (snapshot: DocumentSnapshot) => {
          if (snapshot.exists()) {
            const influencer = { id: snapshot.id, ...snapshot.data() } as Influencer;
            onUpdate({ influencer });
          }
        },
        (error) => {
          console.error('Error listening to influencer updates:', error);
          onError?.(error);
        }
      );
      listeners.push(influencerListener);

      // 2. Listen to recent activities (last 50)
      const activitiesQuery = query(
        collection(db, this.ACTIVITIES_COLLECTION),
        where('influencerId', '==', influencerId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const activitiesListener = onSnapshot(
        activitiesQuery,
        (snapshot: QuerySnapshot) => {
          const recentActivities = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as Activity)
          );
          onUpdate({ recentActivities });
        },
        (error) => {
          console.error('Error listening to activities updates:', error);
          onError?.(error);
        }
      );
      listeners.push(activitiesListener);

      // 3. Listen to commission changes
      const commissionsQuery = query(
        collection(db, this.COMMISSIONS_COLLECTION),
        where('motherInfluencerId', '==', influencerId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const commissionsListener = onSnapshot(
        commissionsQuery,
        (snapshot: QuerySnapshot) => {
          const commissions = snapshot.docs.map(doc => doc.data() as Commission);
          
          // Calculate updated earnings
          const directEarnings = commissions
            .filter(c => c.type === 'direct')
            .reduce((sum, c) => sum + c.amount, 0);
          
          const indirectEarnings = commissions
            .filter(c => c.type === 'indirect')
            .reduce((sum, c) => sum + c.amount, 0);

          const totalEarnings = directEarnings + indirectEarnings;

          // Update earnings history
          const earningsHistory = {
            entries: commissions.map(c => ({
              id: c.id,
              amount: c.amount,
              type: 'commission' as const,
              source: c.type === 'direct' ? 'Direct referral' : 'Mini Influencer commission',
              date: c.createdAt,
              status: c.status
            })),
            totalEarnings,
            totalPaid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
            pendingEarnings: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
          };

          onUpdate({ earningsHistory });
        },
        (error) => {
          console.error('Error listening to commissions updates:', error);
          onError?.(error);
        }
      );
      listeners.push(commissionsListener);

      // 4. Listen to referral codes changes
      const referralCodesQuery = query(
        collection(db, this.REFERRAL_CODES_COLLECTION),
        where('createdBy', '==', influencerId),
        orderBy('createdAt', 'desc')
      );
      
      const referralCodesListener = onSnapshot(
        referralCodesQuery,
        (snapshot: QuerySnapshot) => {
          const referralCodes = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as ReferralCode)
          );
          onUpdate({ referralCodes });
        },
        (error) => {
          console.error('Error listening to referral codes updates:', error);
          onError?.(error);
        }
      );
      listeners.push(referralCodesListener);

      // 5. Listen to Mini Influencers in network
      const miniInfluencersQuery = query(
        collection(db, this.INFLUENCERS_COLLECTION),
        where('parentInfluencerId', '==', influencerId)
      );
      
      const miniInfluencersListener = onSnapshot(
        miniInfluencersQuery,
        async (snapshot: QuerySnapshot) => {
          const miniInfluencers = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as Influencer)
          );

          // Calculate network metrics
          const totalNetworkEarnings = miniInfluencers.reduce((sum, mini) => sum + (mini.totalEarnings || 0), 0);
          const averageEarningsPerMini = miniInfluencers.length > 0 ? totalNetworkEarnings / miniInfluencers.length : 0;

          const networkMetrics = {
            totalNetworkSize: miniInfluencers.length,
            totalNetworkEarnings,
            averageEarningsPerMini: parseFloat(averageEarningsPerMini.toFixed(2)),
            topPerformers: [], // Would be calculated with more complex logic
            growthRate: 0, // Would need historical data
            retentionRate: 0 // Would need historical data
          };

          onUpdate({ networkMetrics });
        },
        (error) => {
          console.error('Error listening to Mini Influencers updates:', error);
          onError?.(error);
        }
      );
      listeners.push(miniInfluencersListener);

      // Store listeners for cleanup
      this.activeListeners.set(listenerId, listeners);

      // Return cleanup function
      return () => {
        this.unsubscribeFromDashboard(listenerId);
      };

    } catch (error: any) {
      // Cleanup any listeners that were created before the error
      listeners.forEach(unsubscribe => unsubscribe());
      
      const dashboardError = new Error(`Failed to subscribe to Mother Influencer dashboard: ${error.message}`);
      onError?.(dashboardError);
      
      return () => {}; // Return empty cleanup function
    }
  }

  /**
   * Subscribe to real-time Mini Influencer dashboard updates
   * Requirements: 3.5, 7.5 - Real-time updates with 5-minute maximum latency
   */
  static subscribeToMiniInfluencerDashboard(
    influencerId: string,
    onUpdate: (data: Partial<MiniInfluencerDashboardData>) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listeners: Unsubscribe[] = [];
    const listenerId = `mini_${influencerId}`;

    try {
      // 1. Listen to influencer profile changes
      const influencerRef = doc(db, this.INFLUENCERS_COLLECTION, influencerId);
      const influencerListener = onSnapshot(
        influencerRef,
        async (snapshot: DocumentSnapshot) => {
          if (snapshot.exists()) {
            const influencer = { id: snapshot.id, ...snapshot.data() } as Influencer;
            
            // Also get Mother Influencer data if parentInfluencerId exists
            if (influencer.parentInfluencerId) {
              const motherRef = doc(db, this.INFLUENCERS_COLLECTION, influencer.parentInfluencerId);
              const motherSnapshot = await motherRef.get();
              
              if (motherSnapshot.exists()) {
                const motherInfluencer = { id: motherSnapshot.id, ...motherSnapshot.data() } as Influencer;
                onUpdate({ influencer, motherInfluencer });
              } else {
                onUpdate({ influencer });
              }
            } else {
              onUpdate({ influencer });
            }
          }
        },
        (error) => {
          console.error('Error listening to Mini Influencer updates:', error);
          onError?.(error);
        }
      );
      listeners.push(influencerListener);

      // 2. Listen to recent activities
      const activitiesQuery = query(
        collection(db, this.ACTIVITIES_COLLECTION),
        where('influencerId', '==', influencerId),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      
      const activitiesListener = onSnapshot(
        activitiesQuery,
        (snapshot: QuerySnapshot) => {
          const recentActivities = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as Activity)
          );
          
          // Calculate personal metrics
          const totalActivities = recentActivities.length;
          const clicks = recentActivities.filter(a => a.type === 'click').length;
          const conversions = recentActivities.filter(a => a.type === 'conversion').length;
          const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

          const personalMetrics = {
            totalEarnings: 0, // Would be calculated from commissions
            totalActivities,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            rank: 0 // Would be calculated relative to siblings
          };

          onUpdate({ recentActivities, personalMetrics });
        },
        (error) => {
          console.error('Error listening to Mini Influencer activities updates:', error);
          onError?.(error);
        }
      );
      listeners.push(activitiesListener);

      // 3. Listen to earnings/commissions
      const commissionsQuery = query(
        collection(db, this.COMMISSIONS_COLLECTION),
        where('miniInfluencerId', '==', influencerId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const commissionsListener = onSnapshot(
        commissionsQuery,
        (snapshot: QuerySnapshot) => {
          const commissions = snapshot.docs.map(doc => doc.data() as Commission);
          
          const totalEarnings = commissions.reduce((sum, c) => sum + c.amount, 0);
          
          const earningsHistory = {
            entries: commissions.map(c => ({
              id: c.id,
              amount: c.amount,
              type: 'commission' as const,
              source: 'Mini Influencer earnings',
              date: c.createdAt,
              status: c.status
            })),
            totalEarnings,
            totalPaid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
            pendingEarnings: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
          };

          // Update personal metrics with earnings
          const personalMetrics = {
            totalEarnings,
            totalActivities: 0, // Will be updated by activities listener
            conversionRate: 0, // Will be updated by activities listener
            rank: 0 // Would be calculated relative to siblings
          };

          onUpdate({ earningsHistory, personalMetrics });
        },
        (error) => {
          console.error('Error listening to Mini Influencer commissions updates:', error);
          onError?.(error);
        }
      );
      listeners.push(commissionsListener);

      // Store listeners for cleanup
      this.activeListeners.set(listenerId, listeners);

      // Return cleanup function
      return () => {
        this.unsubscribeFromDashboard(listenerId);
      };

    } catch (error: any) {
      // Cleanup any listeners that were created before the error
      listeners.forEach(unsubscribe => unsubscribe());
      
      const dashboardError = new Error(`Failed to subscribe to Mini Influencer dashboard: ${error.message}`);
      onError?.(dashboardError);
      
      return () => {}; // Return empty cleanup function
    }
  }

  /**
   * Subscribe to real-time activity updates for specific influencer
   * Requirements: 3.5 - Real-time dashboard updates
   */
  static subscribeToActivityUpdates(
    influencerId: string,
    onUpdate: (activities: Activity[]) => void,
    onError?: (error: Error) => void,
    limit: number = 50
  ): () => void {
    try {
      const activitiesQuery = query(
        collection(db, this.ACTIVITIES_COLLECTION),
        where('influencerId', '==', influencerId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const unsubscribe = onSnapshot(
        activitiesQuery,
        (snapshot: QuerySnapshot) => {
          const activities = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as Activity)
          );
          onUpdate(activities);
        },
        (error) => {
          console.error('Error listening to activity updates:', error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (error: any) {
      const activityError = new Error(`Failed to subscribe to activity updates: ${error.message}`);
      onError?.(activityError);
      return () => {};
    }
  }

  /**
   * Subscribe to real-time commission updates for specific influencer
   * Requirements: 3.5 - Real-time dashboard updates
   */
  static subscribeToCommissionUpdates(
    influencerId: string,
    onUpdate: (commissions: Commission[]) => void,
    onError?: (error: Error) => void,
    limit: number = 100
  ): () => void {
    try {
      const commissionsQuery = query(
        collection(db, this.COMMISSIONS_COLLECTION),
        where('motherInfluencerId', '==', influencerId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const unsubscribe = onSnapshot(
        commissionsQuery,
        (snapshot: QuerySnapshot) => {
          const commissions = snapshot.docs.map(doc => doc.data() as Commission);
          onUpdate(commissions);
        },
        (error) => {
          console.error('Error listening to commission updates:', error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (error: any) {
      const commissionError = new Error(`Failed to subscribe to commission updates: ${error.message}`);
      onError?.(commissionError);
      return () => {};
    }
  }

  /**
   * Subscribe to real-time referral code updates
   * Requirements: 3.4 - Show all active and inactive Sub_Referral_Codes
   */
  static subscribeToReferralCodeUpdates(
    motherInfluencerId: string,
    onUpdate: (codes: ReferralCode[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const referralCodesQuery = query(
        collection(db, this.REFERRAL_CODES_COLLECTION),
        where('createdBy', '==', motherInfluencerId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        referralCodesQuery,
        (snapshot: QuerySnapshot) => {
          const referralCodes = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as ReferralCode)
          );
          onUpdate(referralCodes);
        },
        (error) => {
          console.error('Error listening to referral code updates:', error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (error: any) {
      const codeError = new Error(`Failed to subscribe to referral code updates: ${error.message}`);
      onError?.(codeError);
      return () => {};
    }
  }

  /**
   * Subscribe to network changes (Mini Influencers joining/leaving)
   * Requirements: 3.3 - Display each Mini_Influencer's metrics
   */
  static subscribeToNetworkUpdates(
    motherInfluencerId: string,
    onUpdate: (miniInfluencers: Influencer[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const miniInfluencersQuery = query(
        collection(db, this.INFLUENCERS_COLLECTION),
        where('parentInfluencerId', '==', motherInfluencerId)
      );
      
      const unsubscribe = onSnapshot(
        miniInfluencersQuery,
        (snapshot: QuerySnapshot) => {
          const miniInfluencers = snapshot.docs.map(doc => 
            ({ id: doc.id, ...doc.data() } as Influencer)
          );
          onUpdate(miniInfluencers);
        },
        (error) => {
          console.error('Error listening to network updates:', error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (error: any) {
      const networkError = new Error(`Failed to subscribe to network updates: ${error.message}`);
      onError?.(networkError);
      return () => {};
    }
  }

  /**
   * Unsubscribe from dashboard updates
   */
  static unsubscribeFromDashboard(listenerId: string): void {
    const listeners = this.activeListeners.get(listenerId);
    if (listeners) {
      listeners.forEach(unsubscribe => unsubscribe());
      this.activeListeners.delete(listenerId);
    }
  }

  /**
   * Unsubscribe from all active dashboard listeners
   */
  static unsubscribeFromAllDashboards(): void {
    for (const [listenerId, listeners] of this.activeListeners.entries()) {
      listeners.forEach(unsubscribe => unsubscribe());
    }
    this.activeListeners.clear();
  }

  /**
   * Get active listener count for monitoring
   */
  static getActiveListenerCount(): number {
    let totalListeners = 0;
    for (const listeners of this.activeListeners.values()) {
      totalListeners += listeners.length;
    }
    return totalListeners;
  }

  /**
   * Get active dashboard subscriptions
   */
  static getActiveDashboards(): string[] {
    return Array.from(this.activeListeners.keys());
  }

  /**
   * Check if dashboard has active subscription
   */
  static isDashboardActive(listenerId: string): boolean {
    return this.activeListeners.has(listenerId);
  }

  /**
   * Create a batched update handler to prevent excessive re-renders
   * Requirements: 3.5 - Optimize real-time update performance
   */
  static createBatchedUpdateHandler<T>(
    onUpdate: (data: T) => void,
    batchDelay: number = 100
  ): (data: T) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let pendingUpdates: T[] = [];

    return (data: T) => {
      pendingUpdates.push(data);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        // Merge all pending updates (simple approach - last update wins)
        const latestUpdate = pendingUpdates[pendingUpdates.length - 1];
        onUpdate(latestUpdate);
        
        pendingUpdates = [];
        timeoutId = null;
      }, batchDelay);
    };
  }

  /**
   * Monitor real-time update latency
   * Requirements: 7.5 - 5-minute maximum latency requirement
   */
  static monitorUpdateLatency(
    onLatencyUpdate: (latency: number) => void
  ): () => void {
    const startTime = Date.now();
    let lastUpdateTime = startTime;

    // Create a test document listener to measure latency
    const testDocRef = doc(db, 'hierarchical_latency_test', 'monitor');
    
    const unsubscribe = onSnapshot(
      testDocRef,
      (snapshot) => {
        const currentTime = Date.now();
        const latency = currentTime - lastUpdateTime;
        
        // Report latency in milliseconds
        onLatencyUpdate(latency);
        lastUpdateTime = currentTime;
      },
      (error) => {
        console.error('Error monitoring update latency:', error);
      }
    );

    return unsubscribe;
  }
}