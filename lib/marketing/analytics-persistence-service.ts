/**
 * Analytics Persistence Service
 * Handles storing and retrieving analytics data from marketing_analytics collection
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { adminDb } from '@/lib/firebase-admin';

export interface PersistedAnalytics {
  id: string;
  type: 'organization' | 'team' | 'user' | 'vendor';
  entityId?: string; // team ID, user ID, or vendor ID
  
  // Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  
  // Growth metrics
  monthlyGrowthRate: number;
  vendorGrowthRate: number;
  revenueGrowthRate: number;
  
  // Conversion metrics
  bdmConversionRate: number;
  averageVendorOnboardingTime: number;
  
  // Counts
  totalVendors: number;
  activeVendors: number;
  totalTeams: number;
  totalUsers: number;
  
  // Metadata
  calculatedAt: Timestamp;
  lastUpdated: Timestamp;
  dataVersion: number;
}

export class AnalyticsPersistenceService {
  private static COLLECTION_NAME = 'marketing_analytics';
  private static CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Save analytics data to Firestore
   */
  static async saveAnalytics(
    type: 'organization' | 'team' | 'user' | 'vendor',
    data: Partial<PersistedAnalytics>,
    entityId?: string
  ): Promise<void> {
    try {
      const docId = entityId ? `${type}_${entityId}` : type;
      const analyticsRef = doc(db, this.COLLECTION_NAME, docId);
      
      const analyticsData: PersistedAnalytics = {
        id: docId,
        type,
        ...(entityId ? { entityId } : {}), // Only include entityId if it's defined
        totalRevenue: data.totalRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        totalOrders: data.totalOrders || 0,
        completedOrders: data.completedOrders || 0,
        averageOrderValue: data.averageOrderValue || 0,
        monthlyGrowthRate: data.monthlyGrowthRate || 0,
        vendorGrowthRate: data.vendorGrowthRate || 0,
        revenueGrowthRate: data.revenueGrowthRate || 0,
        bdmConversionRate: data.bdmConversionRate || 0,
        averageVendorOnboardingTime: data.averageVendorOnboardingTime || 0,
        totalVendors: data.totalVendors || 0,
        activeVendors: data.activeVendors || 0,
        totalTeams: data.totalTeams || 0,
        totalUsers: data.totalUsers || 0,
        calculatedAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        dataVersion: 1
      } as PersistedAnalytics;
      
      await setDoc(analyticsRef, analyticsData, { merge: true });
      console.log(`✅ Saved ${type} analytics to Firestore`);
    } catch (error) {
      console.error(`Error saving ${type} analytics:`, error);
      throw new Error(`Failed to save ${type} analytics`);
    }
  }
  
  /**
   * Get analytics data from Firestore
   */
  static async getAnalytics(
    type: 'organization' | 'team' | 'user' | 'vendor',
    entityId?: string
  ): Promise<PersistedAnalytics | null> {
    try {
      const docId = entityId ? `${type}_${entityId}` : type;
      const analyticsRef = doc(db, this.COLLECTION_NAME, docId);
      const analyticsSnap = await getDoc(analyticsRef);
      
      if (!analyticsSnap.exists()) {
        console.log(`No ${type} analytics found in Firestore`);
        return null;
      }
      
      const data = analyticsSnap.data() as PersistedAnalytics;
      
      // Check if data is stale
      const lastUpdated = data.lastUpdated.toDate();
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();
      
      if (ageMs > this.CACHE_DURATION_MS) {
        console.log(`${type} analytics data is stale (${Math.round(ageMs / 1000 / 60)} minutes old)`);
        return null;
      }
      
      console.log(`✅ Retrieved ${type} analytics from Firestore`);
      return data;
    } catch (error) {
      console.error(`Error getting ${type} analytics:`, error);
      return null;
    }
  }
  
  /**
   * Get analytics data from Firestore (server-side)
   */
  static async getAnalyticsServerSide(
    type: 'organization' | 'team' | 'user' | 'vendor',
    entityId?: string
  ): Promise<PersistedAnalytics | null> {
    try {
      if (!adminDb) {
        console.error('Firebase Admin DB is not initialized');
        return null;
      }
      
      const docId = entityId ? `${type}_${entityId}` : type;
      const analyticsRef = adminDb.collection(this.COLLECTION_NAME).doc(docId);
      const analyticsSnap = await analyticsRef.get();
      
      if (!analyticsSnap.exists) {
        console.log(`No ${type} analytics found in Firestore (server-side)`);
        return null;
      }
      
      const data = analyticsSnap.data() as any;
      
      // Check if data is stale
      const lastUpdated = data.lastUpdated.toDate();
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();
      
      if (ageMs > this.CACHE_DURATION_MS) {
        console.log(`${type} analytics data is stale (${Math.round(ageMs / 1000 / 60)} minutes old)`);
        return null;
      }
      
      console.log(`✅ Retrieved ${type} analytics from Firestore (server-side)`);
      return {
        ...data,
        calculatedAt: data.calculatedAt,
        lastUpdated: data.lastUpdated
      } as PersistedAnalytics;
    } catch (error) {
      console.error(`Error getting ${type} analytics (server-side):`, error);
      return null;
    }
  }
  
  /**
   * Check if analytics data needs refresh
   */
  static async needsRefresh(
    type: 'organization' | 'team' | 'user' | 'vendor',
    entityId?: string
  ): Promise<boolean> {
    try {
      const docId = entityId ? `${type}_${entityId}` : type;
      const analyticsRef = doc(db, this.COLLECTION_NAME, docId);
      const analyticsSnap = await getDoc(analyticsRef);
      
      if (!analyticsSnap.exists()) {
        return true;
      }
      
      const data = analyticsSnap.data() as PersistedAnalytics;
      const lastUpdated = data.lastUpdated.toDate();
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();
      
      return ageMs > this.CACHE_DURATION_MS;
    } catch (error) {
      console.error(`Error checking if ${type} analytics needs refresh:`, error);
      return true;
    }
  }
  
  /**
   * Get last updated timestamp
   */
  static async getLastUpdated(
    type: 'organization' | 'team' | 'user' | 'vendor',
    entityId?: string
  ): Promise<Date | null> {
    try {
      const docId = entityId ? `${type}_${entityId}` : type;
      const analyticsRef = doc(db, this.COLLECTION_NAME, docId);
      const analyticsSnap = await getDoc(analyticsRef);
      
      if (!analyticsSnap.exists()) {
        return null;
      }
      
      const data = analyticsSnap.data() as PersistedAnalytics;
      return data.lastUpdated.toDate();
    } catch (error) {
      console.error(`Error getting last updated for ${type} analytics:`, error);
      return null;
    }
  }
  
  /**
   * Delete analytics data
   */
  static async deleteAnalytics(
    type: 'organization' | 'team' | 'user' | 'vendor',
    entityId?: string
  ): Promise<void> {
    try {
      const docId = entityId ? `${type}_${entityId}` : type;
      const analyticsRef = doc(db, this.COLLECTION_NAME, docId);
      await setDoc(analyticsRef, { deleted: true, deletedAt: Timestamp.now() }, { merge: true });
      console.log(`✅ Deleted ${type} analytics from Firestore`);
    } catch (error) {
      console.error(`Error deleting ${type} analytics:`, error);
      throw new Error(`Failed to delete ${type} analytics`);
    }
  }
}
