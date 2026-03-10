/**
 * AI Assistant Analytics Service
 * 
 * Tracks AI shopping assistant usage, conversations, and conversions
 * 
 * Data Sources:
 * - `ai_assistant_sessions` collection: Session-level analytics
 * - `ai_assistant_interactions` collection: Individual interaction tracking
 * - `ai_assistant_conversions` collection: Conversion tracking (cart adds, purchases)
 * 
 * Usage:
 * ```typescript
 * import { trackConversation, trackConversion } from "@/services/aiAssistantAnalytics";
 * 
 * await trackConversation(sessionId, userId, messageCount);
 * await trackConversion(sessionId, userId, 'add_to_cart', productId);
 * ```
 */

import { db } from "@/firebase";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";
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
  Timestamp,
  increment,
  updateDoc,
  addDoc,
} from "firebase/firestore";

export interface AISessionAnalytics {
  sessionId: string;
  userId?: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  productsShown: string[];
  vendorsShown: string[];
  productsAddedToCart: string[];
  conversions: number;
  totalConversionValue: number;
  sessionDuration: number; // in seconds
  isActive: boolean;
}

export interface AIInteraction {
  interactionId: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  type: 'message' | 'product_view' | 'vendor_view' | 'add_to_cart' | 'try_on' | 'view_details';
  userMessage?: string;
  assistantResponse?: string;
  productIds?: string[];
  vendorIds?: string[];
  metadata?: Record<string, any>;
}

export interface AIConversion {
  conversionId: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  type: 'add_to_cart' | 'purchase' | 'wishlist_add';
  productId: string;
  productTitle?: string;
  productPrice?: number;
  vendorId?: string;
  vendorName?: string;
}

export interface AIAnalyticsSummary {
  totalSessions: number;
  totalInteractions: number;
  totalConversions: number;
  conversionRate: number;
  averageMessagesPerSession: number;
  averageSessionDuration: number;
  totalRevenue: number;
  topProducts: Array<{ productId: string; count: number }>;
  topVendors: Array<{ vendorId: string; count: number }>;
}

/**
 * Track a conversation session
 * Creates or updates session analytics
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function trackConversation(
  sessionId: string,
  userId?: string,
  messageCount: number = 1,
  isUserMessage: boolean = true
): Promise<void> {
  try {
    // Use Admin SDK for server-side access
    const sessionRef = adminDb.collection("staging_ai_assistant_sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    const now = admin.firestore.Timestamp.now();

    if (sessionDoc.exists) {
      const existingData = sessionDoc.data()!;
      // Update existing session
      await sessionRef.update({
        lastMessageAt: now,
        messageCount: admin.firestore.FieldValue.increment(1),
        userMessageCount: isUserMessage 
          ? admin.firestore.FieldValue.increment(1) 
          : existingData.userMessageCount || 0,
        assistantMessageCount: !isUserMessage 
          ? admin.firestore.FieldValue.increment(1) 
          : existingData.assistantMessageCount || 0,
        isActive: true,
      });
    } else {
      // Create new session
      await sessionRef.set({
        sessionId,
        userId: userId || null,
        startedAt: now,
        lastMessageAt: now,
        messageCount: 1,
        userMessageCount: isUserMessage ? 1 : 0,
        assistantMessageCount: !isUserMessage ? 1 : 0,
        productsShown: [],
        vendorsShown: [],
        productsAddedToCart: [],
        conversions: 0,
        totalConversionValue: 0,
        sessionDuration: 0,
        isActive: true,
      });
    }
  } catch (error) {
    console.error("Error tracking conversation:", error);
  }
}

/**
 * Track an interaction (message, product view, etc.)
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function trackInteraction(
  sessionId: string,
  type: AIInteraction['type'],
  data: {
    userId?: string;
    userMessage?: string;
    assistantResponse?: string;
    productIds?: string[];
    vendorIds?: string[];
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    // Use Admin SDK for server-side access
    const interactionsRef = adminDb.collection("staging_ai_assistant_interactions");
    
    await interactionsRef.add({
      sessionId,
      userId: data.userId || null,
      timestamp: admin.firestore.Timestamp.now(),
      type,
      userMessage: data.userMessage || null,
      assistantResponse: data.assistantResponse || null,
      productIds: data.productIds || [],
      vendorIds: data.vendorIds || [],
      metadata: data.metadata || {},
    });

    // Update session with products/vendors shown
    if (data.productIds && data.productIds.length > 0) {
      const sessionRef = adminDb.collection("staging_ai_assistant_sessions").doc(sessionId);
      const sessionDoc = await sessionRef.get();
      
      if (sessionDoc.exists) {
        const currentProducts = sessionDoc.data()!.productsShown || [];
        const updatedProducts = [...new Set([...currentProducts, ...data.productIds])];
        
        await sessionRef.update({
          productsShown: updatedProducts,
        });
      }
    }

    if (data.vendorIds && data.vendorIds.length > 0) {
      const sessionRef = adminDb.collection("staging_ai_assistant_sessions").doc(sessionId);
      const sessionDoc = await sessionRef.get();
      
      if (sessionDoc.exists) {
        const currentVendors = sessionDoc.data()!.vendorsShown || [];
        const updatedVendors = [...new Set([...currentVendors, ...data.vendorIds])];
        
        await sessionRef.update({
          vendorsShown: updatedVendors,
        });
      }
    }
  } catch (error) {
    console.error("Error tracking interaction:", error);
  }
}

/**
 * Track a conversion (add to cart, purchase, etc.)
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function trackConversion(
  sessionId: string,
  type: AIConversion['type'],
  productId: string,
  data: {
    userId?: string;
    productTitle?: string;
    productPrice?: number;
    vendorId?: string;
    vendorName?: string;
  }
): Promise<void> {
  try {
    // Use Admin SDK for server-side access
    const conversionsRef = adminDb.collection("staging_ai_assistant_conversions");
    
    await conversionsRef.add({
      sessionId,
      userId: data.userId || null,
      timestamp: admin.firestore.Timestamp.now(),
      type,
      productId,
      productTitle: data.productTitle || null,
      productPrice: data.productPrice || 0,
      vendorId: data.vendorId || null,
      vendorName: data.vendorName || null,
    });

    // Update session conversion stats
    const sessionRef = adminDb.collection("staging_ai_assistant_sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (sessionDoc.exists) {
      const currentCartProducts = sessionDoc.data()!.productsAddedToCart || [];
      const updatedCartProducts = [...new Set([...currentCartProducts, productId])];
      
      await sessionRef.update({
        conversions: admin.firestore.FieldValue.increment(1),
        totalConversionValue: admin.firestore.FieldValue.increment(data.productPrice || 0),
        productsAddedToCart: updatedCartProducts,
      });
    }
  } catch (error) {
    console.error("Error tracking conversion:", error);
  }
}

/**
 * Mark a session as ended
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    // Use Admin SDK for server-side access
    const sessionRef = adminDb.collection("staging_ai_assistant_sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (sessionDoc.exists) {
      const data = sessionDoc.data()!;
      const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt);
      const now = new Date();
      const duration = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      
      await sessionRef.update({
        isActive: false,
        sessionDuration: duration,
      });
    }
  } catch (error) {
    console.error("Error ending session:", error);
  }
}

/**
 * Get analytics summary for a date range
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function getAnalyticsSummary(
  startDate?: Date,
  endDate?: Date
): Promise<AIAnalyticsSummary> {
  try {
    console.log('[Analytics] Getting summary with date range:', { startDate, endDate });
    
    // Use Admin SDK for server-side access
    const sessionsRef = adminDb.collection("staging_ai_assistant_sessions");
    const conversionsRef = adminDb.collection("staging_ai_assistant_conversions");
    const interactionsRef = adminDb.collection("staging_ai_assistant_interactions");

    let sessionsQuery: admin.firestore.Query = sessionsRef;
    let conversionsQuery: admin.firestore.Query = conversionsRef;
    let interactionsQuery: admin.firestore.Query = interactionsRef;

    if (startDate && endDate) {
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);
      
      console.log('[Analytics] Applying date filters:', { startTimestamp, endTimestamp });
      
      sessionsQuery = sessionsRef
        .where("startedAt", ">=", startTimestamp)
        .where("startedAt", "<=", endTimestamp);
      
      conversionsQuery = conversionsRef
        .where("timestamp", ">=", startTimestamp)
        .where("timestamp", "<=", endTimestamp);
      
      interactionsQuery = interactionsRef
        .where("timestamp", ">=", startTimestamp)
        .where("timestamp", "<=", endTimestamp);
    }

    console.log('[Analytics] Fetching data from Firestore...');
    const [sessionsSnapshot, conversionsSnapshot, interactionsSnapshot] = await Promise.all([
      sessionsQuery.get(),
      conversionsQuery.get(),
      interactionsQuery.get(),
    ]);
    
    console.log('[Analytics] Data fetched:', {
      sessions: sessionsSnapshot.size,
      conversions: conversionsSnapshot.size,
      interactions: interactionsSnapshot.size,
    });

    const totalSessions = sessionsSnapshot.size;
    const totalConversions = conversionsSnapshot.size;
    const totalInteractions = interactionsSnapshot.size;

    // Calculate averages
    let totalMessages = 0;
    let totalDuration = 0;
    let totalRevenue = 0;

    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalMessages += data.messageCount || 0;
      totalDuration += data.sessionDuration || 0;
      totalRevenue += data.totalConversionValue || 0;
    });

    const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0;

    // Get top products
    const productCounts = new Map<string, number>();
    conversionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const productId = data.productId;
      productCounts.set(productId, (productCounts.get(productId) || 0) + 1);
    });

    const topProducts = Array.from(productCounts.entries())
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top vendors
    const vendorCounts = new Map<string, number>();
    conversionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const vendorId = data.vendorId;
      if (vendorId) {
        vendorCounts.set(vendorId, (vendorCounts.get(vendorId) || 0) + 1);
      }
    });

    const topVendors = Array.from(vendorCounts.entries())
      .map(([vendorId, count]) => ({ vendorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions,
      totalInteractions,
      totalConversions,
      conversionRate,
      averageMessagesPerSession,
      averageSessionDuration,
      totalRevenue,
      topProducts,
      topVendors,
    };
  } catch (error) {
    console.error("Error getting analytics summary:", error);
    return {
      totalSessions: 0,
      totalInteractions: 0,
      totalConversions: 0,
      conversionRate: 0,
      averageMessagesPerSession: 0,
      averageSessionDuration: 0,
      totalRevenue: 0,
      topProducts: [],
      topVendors: [],
    };
  }
}

/**
 * Get session details
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function getSessionDetails(sessionId: string): Promise<AISessionAnalytics | null> {
  try {
    // Use Admin SDK for server-side access
    const sessionDoc = await adminDb.collection("staging_ai_assistant_sessions").doc(sessionId).get();

    if (!sessionDoc.exists) {
      return null;
    }

    const data = sessionDoc.data()!;
    // Handle Timestamp conversion for Admin SDK
    const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt);
    const lastMessageAt = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : new Date(data.lastMessageAt);

    return {
      sessionId: data.sessionId,
      userId: data.userId || undefined,
      startedAt,
      lastMessageAt,
      messageCount: data.messageCount || 0,
      userMessageCount: data.userMessageCount || 0,
      assistantMessageCount: data.assistantMessageCount || 0,
      productsShown: data.productsShown || [],
      vendorsShown: data.vendorsShown || [],
      productsAddedToCart: data.productsAddedToCart || [],
      conversions: data.conversions || 0,
      totalConversionValue: data.totalConversionValue || 0,
      sessionDuration: data.sessionDuration || 0,
      isActive: data.isActive || false,
    };
  } catch (error) {
    console.error("Error getting session details:", error);
    return null;
  }
}

/**
 * Get recent sessions
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function getRecentSessions(limitCount: number = 10): Promise<AISessionAnalytics[]> {
  try {
    // Use Admin SDK for server-side access
    const snapshot = await adminDb
      .collection("ai_assistant_sessions")
      .orderBy("lastMessageAt", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Handle Timestamp conversion for Admin SDK
      const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt);
      const lastMessageAt = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : new Date(data.lastMessageAt);
      
      return {
        sessionId: data.sessionId,
        userId: data.userId || undefined,
        startedAt,
        lastMessageAt,
        messageCount: data.messageCount || 0,
        userMessageCount: data.userMessageCount || 0,
        assistantMessageCount: data.assistantMessageCount || 0,
        productsShown: data.productsShown || [],
        vendorsShown: data.vendorsShown || [],
        productsAddedToCart: data.productsAddedToCart || [],
        conversions: data.conversions || 0,
        totalConversionValue: data.totalConversionValue || 0,
        sessionDuration: data.sessionDuration || 0,
        isActive: data.isActive || false,
      };
    });
  } catch (error) {
    console.error("Error getting recent sessions:", error);
    return [];
  }
}

/**
 * Get user's session history
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function getUserSessions(userId: string, limitCount: number = 10): Promise<AISessionAnalytics[]> {
  try {
    // Use Admin SDK for server-side access
    const snapshot = await adminDb
      .collection("ai_assistant_sessions")
      .where("userId", "==", userId)
      .orderBy("lastMessageAt", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Handle Timestamp conversion for Admin SDK
      const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt);
      const lastMessageAt = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : new Date(data.lastMessageAt);
      
      return {
        sessionId: data.sessionId,
        userId: data.userId || undefined,
        startedAt,
        lastMessageAt,
        messageCount: data.messageCount || 0,
        userMessageCount: data.userMessageCount || 0,
        assistantMessageCount: data.assistantMessageCount || 0,
        productsShown: data.productsShown || [],
        vendorsShown: data.vendorsShown || [],
        productsAddedToCart: data.productsAddedToCart || [],
        conversions: data.conversions || 0,
        totalConversionValue: data.totalConversionValue || 0,
        sessionDuration: data.sessionDuration || 0,
        isActive: data.isActive || false,
      };
    });
  } catch (error) {
    console.error("Error getting user sessions:", error);
    return [];
  }
}

/**
 * Get conversion rate by product
 * Uses Admin SDK for server-side access (bypasses security rules)
 */
export async function getProductConversionRates(): Promise<Array<{
  productId: string;
  shown: number;
  converted: number;
  conversionRate: number;
}>> {
  try {
    // Use Admin SDK for server-side access
    const [sessionsSnapshot, conversionsSnapshot] = await Promise.all([
      adminDb.collection("staging_ai_assistant_sessions").get(),
      adminDb.collection("staging_ai_assistant_conversions").get(),
    ]);

    // Count how many times each product was shown
    const productShownCounts = new Map<string, number>();
    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const productsShown = data.productsShown || [];
      productsShown.forEach((productId: string) => {
        productShownCounts.set(productId, (productShownCounts.get(productId) || 0) + 1);
      });
    });

    // Count how many times each product was converted
    const productConversionCounts = new Map<string, number>();
    conversionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const productId = data.productId;
      productConversionCounts.set(productId, (productConversionCounts.get(productId) || 0) + 1);
    });

    // Calculate conversion rates
    const rates: Array<{
      productId: string;
      shown: number;
      converted: number;
      conversionRate: number;
    }> = [];

    productShownCounts.forEach((shown, productId) => {
      const converted = productConversionCounts.get(productId) || 0;
      const conversionRate = shown > 0 ? (converted / shown) * 100 : 0;
      
      rates.push({
        productId,
        shown,
        converted,
        conversionRate,
      });
    });

    // Sort by conversion rate descending
    return rates.sort((a, b) => b.conversionRate - a.conversionRate);
  } catch (error) {
    console.error("Error getting product conversion rates:", error);
    return [];
  }
}
