// useTailorsPaginated.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Tailor } from "./useTailors";

interface UseTailorsPaginatedResult {
  tailors: Tailor[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => Promise<void>;
  loadAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 10; // Load 10 vendors at a time

/**
 * Paginated hook for loading tailors efficiently
 * Only loads basic tailor data, no enrichment
 */
export function useTailorsPaginated(): UseTailorsPaginatedResult {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch total count
  const fetchTotalCount = useCallback(async () => {
    try {
      const coll = collection(db, "staging_tailors");
      const snapshot = await getCountFromServer(coll);
      setTotalCount(snapshot.data().count);
    } catch (err: any) {
      console.error("Error fetching total count:", err);
    }
  }, []);

  // Initial load
  const fetchInitialTailors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: Not using orderBy("brand_name") because some tailors use "brandName" field instead
      // Using document ID for consistent ordering across pagination
      const q = query(
        collection(db, "staging_tailors"),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const tailorsList: Tailor[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tailor[];

      // Sort client-side by brand name (handles both brand_name and brandName)
      tailorsList.sort((a, b) => {
        const nameA = (a.brand_name || a.brandName || "").toLowerCase();
        const nameB = (b.brand_name || b.brandName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setTailors(tailorsList);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      await fetchTotalCount();
    } catch (err: any) {
      setError(err.message || "Error fetching tailors");
      console.error("Error fetching tailors:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchTotalCount]);

  // Load more tailors
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      setError(null);

      const q = query(
        collection(db, "staging_tailors"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newTailors: Tailor[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tailor[];

      // Sort client-side by brand name (handles both brand_name and brandName)
      newTailors.sort((a, b) => {
        const nameA = (a.brand_name || a.brandName || "").toLowerCase();
        const nameB = (b.brand_name || b.brandName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setTailors((prev) => {
        // Combine and sort all tailors
        const combined = [...prev, ...newTailors];
        combined.sort((a, b) => {
          const nameA = (a.brand_name || a.brandName || "").toLowerCase();
          const nameB = (b.brand_name || b.brandName || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        return combined;
      });
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || "Error loading more tailors");
      console.error("Error loading more tailors:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc]);

  // Load all tailors at once
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all tailors without pagination
      const q = query(collection(db, "staging_tailors"));
      
      const snapshot = await getDocs(q);
      const allTailors: Tailor[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tailor[];

      // Sort client-side by brand name (handles both brand_name and brandName)
      allTailors.sort((a, b) => {
        const nameA = (a.brand_name || a.brandName || "").toLowerCase();
        const nameB = (b.brand_name || b.brandName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setTailors(allTailors);
      setHasMore(false); // No more to load
      setLastDoc(null);
    } catch (err: any) {
      setError(err.message || "Error loading all tailors");
      console.error("Error loading all tailors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh from beginning
  const refresh = useCallback(async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchInitialTailors();
  }, [fetchInitialTailors]);

  // Initial fetch
  useEffect(() => {
    fetchInitialTailors();
  }, [fetchInitialTailors]);

  return {
    tailors,
    loading: loading || loadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    loadAll,
    refresh,
  };
}

