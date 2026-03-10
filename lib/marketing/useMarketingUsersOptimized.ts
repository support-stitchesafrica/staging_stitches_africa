/**
 * Optimized Marketing Users Hook
 * Provides cached, efficient access to marketing user data
 * Follows the same pattern as useTailorsOptimized
 * Requirements: 3.1, 3.2
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import type { UserRole } from "./user-service";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INITIAL_LOAD_LIMIT = 50; // Load 50 users initially

export interface MarketingUser {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  teamId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  profileImage?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  superAdmins: number;
  teamLeads: number;
  bdms: number;
  teamMembers: number;
}

export interface UserFilters {
  role?: UserRole;
  teamId?: string;
  isActive?: boolean;
  searchTerm?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const cache = new DataCache();

/**
 * Fetch marketing users from API (uses Admin SDK on server)
 */
async function fetchMarketingUsers(
  filters: UserFilters = {},
  limitCount: number = INITIAL_LOAD_LIMIT
): Promise<MarketingUser[]> {
  const cacheKey = `users_${JSON.stringify(filters)}_${limitCount}`;

  // Check cache first
  const cached = cache.get<MarketingUser[]>(cacheKey);
  if (cached) {
    console.log("📦 Using cached users data");
    return cached;
  }

  console.log("🔄 Fetching users from API...");
  const startTime = performance.now();

  // Build query parameters
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.teamId) params.append('teamId', filters.teamId);
  if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  params.append('limit', String(limitCount));

  // Get Firebase auth token
  const { getAuth } = await import('firebase/auth');
  const { auth } = await import('@/firebase');
  const currentUser = getAuth().currentUser;
  
  if (!currentUser) {
    throw new Error('Authentication required');
  }

  const token = await currentUser.getIdToken();

  // Fetch from API (uses Admin SDK on server, bypasses Firestore rules)
  const response = await fetch(`/api/marketing/users?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include auth cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
    throw new Error(error.error || 'Failed to fetch users');
  }

  const data = await response.json();
  const users = data.users as MarketingUser[];

  const endTime = performance.now();
  console.log(
    `✅ Fetched ${users.length} users in ${(endTime - startTime).toFixed(0)}ms`
  );

  // Cache the result
  cache.set(cacheKey, users);

  return users;
}

/**
 * Calculate user statistics
 */
function calculateUserStats(users: MarketingUser[]): UserStats {
  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    inactiveUsers: users.filter((u) => !u.isActive).length,
    superAdmins: users.filter((u) => u.role === "super_admin").length,
    teamLeads: users.filter((u) => u.role === "team_lead").length,
    bdms: users.filter((u) => u.role === "bdm").length,
    teamMembers: users.filter((u) => u.role === "team_member").length,
  };
}

/**
 * Filter users by search term (client-side filtering)
 */
function filterUsersBySearch(
  users: MarketingUser[],
  searchTerm: string
): MarketingUser[] {
  if (!searchTerm) return users;

  const term = searchTerm.toLowerCase();
  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
  );
}

/**
 * Hook for optimized marketing user loading
 */
export function useMarketingUsersOptimized(options?: {
  filters?: UserFilters;
  initialLimit?: number;
  autoLoad?: boolean;
}) {
  const {
    filters = {},
    initialLimit = INITIAL_LOAD_LIMIT,
    autoLoad = true,
  } = options || {};

  const [users, setUsers] = useState<MarketingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      console.log("📊 Loading users...");
      setLoading(true);
      setError(null);

      const fetchedUsers = await fetchMarketingUsers(filters, initialLimit);
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("❌ Error loading users:", err);
      setError(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), initialLimit]); // Stringify filters to avoid object reference issues

  const refresh = useCallback(() => {
    cache.clear();
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (autoLoad) {
      console.log("🚀 Auto-loading users...");
      loadUsers();
    }
  }, [autoLoad]); // Remove loadUsers from dependencies to prevent infinite loop

  // Calculate stats from loaded users
  const stats = useMemo(() => calculateUserStats(users), [users]);

  // Apply client-side search filtering
  const filteredUsers = useMemo(() => {
    return filterUsersBySearch(users, filters.searchTerm || "");
  }, [users, filters.searchTerm]);

  return {
    users: filteredUsers,
    allUsers: users, // Unfiltered users
    stats,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for getting users by role
 */
export function useUsersByRole(role: UserRole) {
  return useMarketingUsersOptimized({
    filters: { role, isActive: true },
    autoLoad: true,
  });
}

/**
 * Hook for getting users by team
 */
export function useUsersByTeam(teamId: string) {
  return useMarketingUsersOptimized({
    filters: { teamId, isActive: true },
    autoLoad: true,
  });
}

/**
 * Hook for getting active users only
 */
export function useActiveUsers() {
  return useMarketingUsersOptimized({
    filters: { isActive: true },
    autoLoad: true,
  });
}

/**
 * Utility to clear user cache
 */
export function clearUserCache() {
  cache.clear();
}
