"use client";

import { useState, useEffect, useCallback } from 'react';
import type { BogoProductBadge } from '@/types/bogo';

/**
 * Hook to manage BOGO badges for products
 */
export const useBogoBadges = (productIds: string[]) => {
  const [badges, setBadges] = useState<Map<string, BogoProductBadge[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBadges = useCallback(async () => {
    if (productIds.length === 0) {
      setBadges(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dynamically import the badge service to avoid circular dependencies
      const { bogoBadgeService } = await import('@/lib/bogo/badge-service');
      
      // Preload badges for all products
      const badgeMap = await bogoBadgeService.preloadBadges(productIds);
      setBadges(badgeMap);
    } catch (err) {
      console.error('Failed to load BOGO badges:', err);
      setError(err instanceof Error ? err.message : 'Failed to load badges');
      setBadges(new Map());
    } finally {
      setLoading(false);
    }
  }, [productIds]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const getBadgesForProduct = useCallback((productId: string): BogoProductBadge[] => {
    return badges.get(productId) || [];
  }, [badges]);

  const hasBogoPromotion = useCallback((productId: string): boolean => {
    const productBadges = getBadgesForProduct(productId);
    return productBadges.some(badge => badge.type !== 'none');
  }, [getBadgesForProduct]);

  const isMainProduct = useCallback((productId: string): boolean => {
    const productBadges = getBadgesForProduct(productId);
    return productBadges.some(badge => badge.type === 'main_product');
  }, [getBadgesForProduct]);

  const isFreeProduct = useCallback((productId: string): boolean => {
    const productBadges = getBadgesForProduct(productId);
    return productBadges.some(badge => badge.type === 'free_product');
  }, [getBadgesForProduct]);

  const refreshBadges = useCallback(() => {
    loadBadges();
  }, [loadBadges]);

  return {
    badges,
    loading,
    error,
    getBadgesForProduct,
    hasBogoPromotion,
    isMainProduct,
    isFreeProduct,
    refreshBadges,
  };
};

/**
 * Hook to manage BOGO badge for a single product
 */
export const useBogoBadge = (productId: string) => {
  const { 
    getBadgesForProduct, 
    hasBogoPromotion, 
    isMainProduct, 
    isFreeProduct, 
    loading, 
    error, 
    refreshBadges 
  } = useBogoBadges([productId]);

  return {
    badges: getBadgesForProduct(productId),
    hasBogoPromotion: hasBogoPromotion(productId),
    isMainProduct: isMainProduct(productId),
    isFreeProduct: isFreeProduct(productId),
    loading,
    error,
    refreshBadges,
  };
};