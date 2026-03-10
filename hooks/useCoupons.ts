/**
 * useCoupons Hook
 * Fetches and manages coupon list with filters and pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/firebase';
import { Coupon, CouponFilters, PaginatedResult } from '@/types/coupon';

interface UseCouponsOptions {
  filters?: CouponFilters;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseCouponsReturn {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: CouponFilters) => void;
}

export function useCoupons(options: UseCouponsOptions = {}): UseCouponsReturn {
  const {
    filters: initialFilters = {},
    page: initialPage = 1,
    limit = 20,
    autoFetch = true
  } = options;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CouponFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters.email) params.append('email', filters.email);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/atlas/coupons?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch coupons');
      }

      const data: PaginatedResult<Coupon> = await response.json();

      setCoupons(data.data || []);
      
      if (data.pagination) {
        setPagination({
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalCount: data.pagination.total,
          hasNextPage: data.pagination.page < data.pagination.totalPages,
          hasPreviousPage: data.pagination.page > 1
        });
      }
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      setError(err.message || 'Failed to fetch coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchCoupons();
    }
  }, [fetchCoupons, autoFetch]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filters]);

  const handleSetFilters = useCallback((newFilters: CouponFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  }, [pagination.totalPages]);

  return {
    coupons,
    loading,
    error,
    pagination,
    refetch: fetchCoupons,
    setPage: handleSetPage,
    setFilters: handleSetFilters
  };
}
