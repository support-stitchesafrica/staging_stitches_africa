/**
 * Optimized Marketing Teams Hook
 * Provides cached, efficient access to marketing team data with performance metrics
 * Follows the same pattern as useTailorsOptimized
 * Requirements: 2.1, 2.2, 2.3, 11.1, 11.2
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from "firebase/firestore";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const INITIAL_LOAD_LIMIT = 50; // Load 50 teams initially

// Team interface (duplicated here to avoid server-side imports)
export interface Team {
  id: string;
  name: string;
  description?: string;
  leadUserId: string;
  leadName?: string;
  memberUserIds: string[];
  createdByUserId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TeamWithPerformance extends Team {
  performance?: {
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    conversionRate: number;
    memberCount: number;
  };
}

export interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  inactiveTeams: number;
  totalMembers: number;
  averageMembersPerTeam: number;
  totalAssignments: number;
  averageConversionRate: number;
}

export interface TeamFilters {
  leadUserId?: string;
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
 * Fetch vendor assignments from Firestore
 */
async function fetchVendorAssignments(): Promise<any[]> {
  const cacheKey = "vendor_assignments_all";

  // Check cache first
  const cached = cache.get<any[]>(cacheKey);
  if (cached) {
    console.log("📦 Using cached vendor assignments");
    return cached;
  }

  console.log("🔄 Fetching vendor assignments from Firestore...");
  const startTime = performance.now();

  const snapshot = await getDocs(collection(db, "vendor_assignments"));
  const assignments = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const endTime = performance.now();
  console.log(
    `✅ Fetched ${assignments.length} assignments in ${(endTime - startTime).toFixed(0)}ms`
  );

  // Cache the result
  cache.set(cacheKey, assignments);

  return assignments;
}

/**
 * Calculate team performance metrics from assignments
 */
async function calculateTeamPerformance(
  team: Team
): Promise<TeamWithPerformance["performance"]> {
  try {
    // Get all assignments for team members (including lead)
    const allMemberIds = [team.leadUserId, ...team.memberUserIds];
    const assignments = await fetchVendorAssignments();

    // Filter assignments for this team's members
    const teamAssignments = assignments.filter((a) =>
      allMemberIds.includes(a.assignedToUserId)
    );

    const totalAssignments = teamAssignments.length;
    const activeAssignments = teamAssignments.filter(
      (a) => a.status === "active"
    ).length;
    const completedAssignments = teamAssignments.filter(
      (a) => a.status === "completed"
    ).length;

    // Calculate conversion rate (completed / total)
    const conversionRate =
      totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    return {
      totalAssignments,
      activeAssignments,
      completedAssignments,
      conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
      memberCount: team.memberUserIds.length + 1, // +1 for lead
    };
  } catch (error) {
    console.error("Error calculating team performance:", error);
    return {
      totalAssignments: 0,
      activeAssignments: 0,
      completedAssignments: 0,
      conversionRate: 0,
      memberCount: team.memberUserIds.length + 1,
    };
  }
}

/**
 * Fetch marketing teams from Firestore with optional filters
 */
async function fetchMarketingTeams(
  filters: TeamFilters = {},
  limitCount: number = INITIAL_LOAD_LIMIT,
  includePerformance: boolean = true
): Promise<TeamWithPerformance[]> {
  const cacheKey = `teams_${JSON.stringify(filters)}_${limitCount}_${includePerformance}`;

  // Check cache first
  const cached = cache.get<TeamWithPerformance[]>(cacheKey);
  if (cached) {
    console.log("📦 Using cached teams data");
    return cached;
  }

  console.log("🔄 Fetching teams from Firestore...");
  const startTime = performance.now();

  let q = query(collection(db, "marketing_teams"));

  // Apply filters
  if (filters.leadUserId) {
    q = query(q, where("leadUserId", "==", filters.leadUserId));
  }

  if (filters.isActive !== undefined) {
    q = query(q, where("isActive", "==", filters.isActive));
  }

  // Add ordering and limit
  q = query(q, orderBy("createdAt", "desc"), firestoreLimit(limitCount));

  const snapshot = await getDocs(q);
  const teams = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Team[];

  // Calculate performance metrics if requested
  let teamsWithPerformance: TeamWithPerformance[];
  if (includePerformance) {
    console.log("📊 Calculating performance metrics for teams...");
    const performancePromises = teams.map(async (team) => ({
      ...team,
      performance: await calculateTeamPerformance(team),
    }));
    teamsWithPerformance = await Promise.all(performancePromises);
  } else {
    teamsWithPerformance = teams;
  }

  const endTime = performance.now();
  console.log(
    `✅ Fetched ${teamsWithPerformance.length} teams in ${(endTime - startTime).toFixed(0)}ms`
  );

  // Cache the result
  cache.set(cacheKey, teamsWithPerformance);

  return teamsWithPerformance;
}

/**
 * Calculate team statistics
 */
function calculateTeamStats(teams: TeamWithPerformance[]): TeamStats {
  const activeTeams = teams.filter((t) => t.isActive);
  const totalMembers = teams.reduce(
    (sum, t) => sum + t.memberUserIds.length + 1,
    0
  ); // +1 for lead
  const totalAssignments = teams.reduce(
    (sum, t) => sum + (t.performance?.totalAssignments || 0),
    0
  );
  const totalConversionRate = teams.reduce(
    (sum, t) => sum + (t.performance?.conversionRate || 0),
    0
  );

  return {
    totalTeams: teams.length,
    activeTeams: activeTeams.length,
    inactiveTeams: teams.length - activeTeams.length,
    totalMembers,
    averageMembersPerTeam:
      teams.length > 0 ? Math.round((totalMembers / teams.length) * 100) / 100 : 0,
    totalAssignments,
    averageConversionRate:
      teams.length > 0
        ? Math.round((totalConversionRate / teams.length) * 100) / 100
        : 0,
  };
}

/**
 * Filter teams by search term (client-side filtering)
 */
function filterTeamsBySearch(
  teams: TeamWithPerformance[],
  searchTerm: string
): TeamWithPerformance[] {
  if (!searchTerm) return teams;

  const term = searchTerm.toLowerCase();
  return teams.filter(
    (team) =>
      team.name.toLowerCase().includes(term) ||
      (team.description && team.description.toLowerCase().includes(term)) ||
      (team.leadName && team.leadName.toLowerCase().includes(term))
  );
}

/**
 * Hook for optimized marketing team loading
 */
export function useMarketingTeamsOptimized(options?: {
  filters?: TeamFilters;
  initialLimit?: number;
  autoLoad?: boolean;
  includePerformance?: boolean;
}) {
  const {
    filters = {},
    initialLimit = INITIAL_LOAD_LIMIT,
    autoLoad = true,
    includePerformance = true,
  } = options || {};

  const [teams, setTeams] = useState<TeamWithPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadTeams = useCallback(async () => {
    try {
      console.log("📊 Loading teams...");
      setLoading(true);
      setError(null);

      const fetchedTeams = await fetchMarketingTeams(
        filters,
        initialLimit,
        includePerformance
      );
      setTeams(fetchedTeams);
      hasLoadedRef.current = true;
    } catch (err: any) {
      console.error("❌ Error loading teams:", err);
      setError(err.message || "Error fetching teams");
    } finally {
      setLoading(false);
    }
  }, [filters, initialLimit, includePerformance]);

  const refresh = useCallback(() => {
    cache.clear();
    hasLoadedRef.current = false;
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (autoLoad && !hasLoadedRef.current && !loading) {
      console.log("🚀 Auto-loading teams...");
      loadTeams();
    }
  }, [autoLoad]); // Remove loadTeams from dependencies to prevent infinite loop

  // Calculate stats from loaded teams
  const stats = useMemo(() => calculateTeamStats(teams), [teams]);

  // Apply client-side search filtering
  const filteredTeams = useMemo(() => {
    return filterTeamsBySearch(teams, filters.searchTerm || "");
  }, [teams, filters.searchTerm]);

  return {
    teams: filteredTeams,
    allTeams: teams, // Unfiltered teams
    stats,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for getting teams by lead
 */
export function useTeamsByLead(leadUserId: string) {
  return useMarketingTeamsOptimized({
    filters: { leadUserId, isActive: true },
    autoLoad: true,
  });
}

/**
 * Hook for getting active teams only
 */
export function useActiveTeams() {
  return useMarketingTeamsOptimized({
    filters: { isActive: true },
    autoLoad: true,
  });
}

/**
 * Hook for getting a single team by ID
 */
export function useTeamById(teamId: string) {
  const [team, setTeam] = useState<TeamWithPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const cacheKey = `team_${teamId}`;
        const cached = cache.get<TeamWithPerformance>(cacheKey);

        if (cached) {
          setTeam(cached);
          setLoading(false);
          return;
        }

        // Fetch from Firestore directly
        const { doc, getDoc } = await import("firebase/firestore");
        const docRef = doc(db, "marketing_teams", teamId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const teamData = {
            id: docSnap.id,
            ...docSnap.data(),
          } as Team;
          
          const performance = await calculateTeamPerformance(teamData);
          const teamWithPerformance = { ...teamData, performance };
          cache.set(cacheKey, teamWithPerformance);
          setTeam(teamWithPerformance);
        } else {
          setTeam(null);
        }
      } catch (err: any) {
        setError(err.message || "Error fetching team");
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [teamId]);

  return { team, loading, error };
}

/**
 * Utility to clear team cache
 */
export function clearTeamCache() {
  cache.clear();
}
