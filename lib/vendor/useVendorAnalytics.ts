/**
 * Optimized Vendor Analytics Hook
 * Following useTailors.ts pattern for performance
 * Bumpa-like merchant analytics system
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  Timestamp,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  updateDoc,
} from "firebase/firestore";

// ============================================================================
// Types
// ============================================================================

export interface VendorProfile {
  id: string;
  brand_name: string;
  brand_category: string[];
  brand_logo?: string;
  wallet: number;
  
  // Payout Settings (NEW - Bumpa-like)
  payoutProvider?: 'stripe' | 'flutterwave';
  stripeAccountId?: string;
  flutterwaveAccountId?: string;
  preferredCurrency?: 'NGN' | 'USD' | 'GHS' | 'KES';
  payoutSchedule?: 'daily' | 'weekly' | 'monthly';
  
  // KYC
  identity_verification?: any;
  company_verification?: any;
  
  // Stats (computed)
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  totalCustomers?: number;
}

export interface VendorProduct {
  id: string;
  tailor_id: string;
  title: string;
  price: number;
  stock?: number;
  images?: string[];
  wear_category?: string;
  createdAt: any;
}

export interface VendorOrder {
  id: string;
  user_id: string;
  tailor_id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  order_status: string;
  order_id: string;
  product_order_ref: string;
  delivery_date?: string;
  shipping_fee: number;
  created_at: any;
  timestamp?: any;
  
  // User address
  user_address?: {
    first_name: string;
    last_name: string;
    city: string;
    state: string;
    country: string;
    phone_number: string;
  };
}

export interface VendorCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city?: string;
  state?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
}

export interface VendorAnalyticsSummary {
  vendor: VendorProfile;
  products: VendorProduct[];
  orders: VendorOrder[];
  customers: VendorCustomer[];
  
  // Computed metrics
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    averageOrderValue: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    availableBalance: number;
    pendingBalance: number;
  };
}

// ============================================================================
// Core Functions (Optimized like useTailors.ts)
// ============================================================================

/**
 * Get all orders for a specific vendor
 * Optimized: Parallel fetching of user orders
 */
async function getVendorOrders(vendorId: string): Promise<VendorOrder[]> {
  const orders: VendorOrder[] = [];
  
  // Get all users first
  const usersSnap = await getDocs(collection(db, "staging_users"));
  
  // Fetch orders from all users in parallel
  await Promise.all(
    usersSnap.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      
      try {
        const userOrdersSnap = await getDocs(
          collection(db, "staging_users_orders", userId, "user_orders")
        );
        
        userOrdersSnap.docs.forEach((orderDoc) => {
          const data = orderDoc.data();
          
          // Filter by vendor
          if (data.tailor_id === vendorId) {
            orders.push({
              id: orderDoc.id,
              user_id: userId,
              tailor_id: data.tailor_id,
              product_id: data.product_id || "",
              title: data.title || "",
              price: data.original_price || 0,
              quantity: data.quantity || 1,
              order_status: data.order_status || "pending",
              order_id: data.order_id || "",
              product_order_ref: data.product_order_ref || "",
              delivery_date: data.delivery_date,
              shipping_fee: data.shipping_fee || 0,
              created_at: data.created_at instanceof Timestamp
                ? data.created_at.toDate()
                : data.created_at
                ? new Date(data.created_at)
                : new Date(),
              timestamp: data.timestamp,
              user_address: data.user_address,
            });
          }
        });
      } catch (error) {
        console.warn(`Failed to fetch orders for user ${userId}:`, error);
      }
    })
  );
  
  return orders;
}

/**
 * Get vendor analytics with all related data
 * Optimized: Batch fetching with Promise.all
 */
export async function getVendorAnalytics(
  vendorId: string
): Promise<VendorAnalyticsSummary> {
  // Batch fetch all data in parallel
  const [vendorDoc, productsSnap, orders] = await Promise.all([
    getDoc(doc(db, "staging_tailors", vendorId)),
    getDocs(
      query(
        collection(db, "staging_tailor_works"),
        where("tailor_id", "==", vendorId)
      )
    ),
    getVendorOrders(vendorId),
  ]);
  
  if (!vendorDoc.exists()) {
    throw new Error("Vendor not found");
  }
  
  const vendor = { id: vendorDoc.id, ...vendorDoc.data() } as VendorProfile;
  
  // Map products
  const products: VendorProduct[] = productsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as VendorProduct[];
  
  // Extract unique customers from orders
  const customerMap = new Map<string, VendorCustomer>();
  
  orders.forEach((order) => {
    const customerId = order.user_id;
    
    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: customerId,
        first_name: order.user_address?.first_name || "",
        last_name: order.user_address?.last_name || "",
        email: "", // Would need to fetch from users collection
        city: order.user_address?.city,
        state: order.user_address?.state,
        orderCount: 0,
        totalSpent: 0,
      });
    }
    
    const customer = customerMap.get(customerId)!;
    customer.orderCount += 1;
    customer.totalSpent += order.price * order.quantity;
    
    const orderDate = order.created_at instanceof Date
      ? order.created_at
      : new Date(order.created_at);
    
    if (!customer.lastOrderDate || orderDate > customer.lastOrderDate) {
      customer.lastOrderDate = orderDate;
    }
  });
  
  const customers = Array.from(customerMap.values());
  
  // Calculate metrics
  const completedOrders = orders.filter(
    (o) => o.order_status === "completed" || o.order_status === "delivered"
  );
  const pendingOrders = orders.filter(
    (o) => o.order_status === "pending" || o.order_status === "processing"
  );
  const cancelledOrders = orders.filter((o) => o.order_status === "cancelled");
  
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + order.price * order.quantity,
    0
  );
  
  const averageOrderValue = completedOrders.length > 0
    ? totalRevenue / completedOrders.length
    : 0;
  
  // Calculate balances (simplified - would integrate with Stripe/Flutterwave)
  const availableBalance = vendor.wallet || 0;
  const pendingBalance = pendingOrders.reduce(
    (sum, order) => sum + order.price * order.quantity,
    0
  );
  
  return {
    vendor,
    products,
    orders,
    customers,
    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      averageOrderValue,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      availableBalance,
      pendingBalance,
    },
  };
}

/**
 * Update vendor payout settings
 */
export async function updateVendorPayoutSettings(
  vendorId: string,
  settings: {
    payoutProvider: 'stripe' | 'flutterwave';
    accountId: string;
    preferredCurrency?: string;
    payoutSchedule?: string;
  }
): Promise<void> {
  const vendorRef = doc(db, "staging_tailors", vendorId);
  
  const updateData: any = {
    payoutProvider: settings.payoutProvider,
    preferredCurrency: settings.preferredCurrency || 'NGN',
    payoutSchedule: settings.payoutSchedule || 'weekly',
  };
  
  if (settings.payoutProvider === 'stripe') {
    updateData.stripeAccountId = settings.accountId;
  } else {
    updateData.flutterwaveAccountId = settings.accountId;
  }
  
  await updateDoc(vendorRef, updateData);
}

/**
 * Get vendor payout history
 */
export async function getVendorPayoutHistory(
  vendorId: string,
  limitCount: number = 10
): Promise<any[]> {
  try {
    const payoutsSnap = await getDocs(
      query(
        collection(db, "vendor_payouts"),
        where("vendorId", "==", vendorId),
        orderBy("transferDate", "desc"),
        firestoreLimit(limitCount)
      )
    );
    
    return payoutsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      transferDate: doc.data().transferDate instanceof Timestamp
        ? doc.data().transferDate.toDate()
        : new Date(doc.data().transferDate),
    }));
  } catch (error) {
    console.warn("Payout history not available:", error);
    return [];
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to fetch vendor analytics
 * Optimized with caching and error handling
 */
export function useVendorAnalytics(vendorId: string) {
  const [data, setData] = useState<VendorAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalytics = useCallback(async () => {
    if (!vendorId) return;
    
    try {
      setLoading(true);
      setError(null);
      const analytics = await getVendorAnalytics(vendorId);
      setData(analytics);
    } catch (err: any) {
      setError(err.message || "Failed to fetch analytics");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);
  
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

/**
 * Hook to fetch vendor payout history
 */
export function useVendorPayouts(vendorId: string) {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchPayouts() {
      if (!vendorId) return;
      
      try {
        setLoading(true);
        const history = await getVendorPayoutHistory(vendorId);
        setPayouts(history);
      } catch (err: any) {
        setError(err.message || "Failed to fetch payouts");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPayouts();
  }, [vendorId]);
  
  return { payouts, loading, error };
}

/**
 * Hook to manage payout settings
 */
export function usePayoutSettings(vendorId: string) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateSettings = useCallback(
    async (settings: Parameters<typeof updateVendorPayoutSettings>[1]) => {
      try {
        setSaving(true);
        setError(null);
        await updateVendorPayoutSettings(vendorId, settings);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to update settings");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [vendorId]
  );
  
  return { updateSettings, saving, error };
}
