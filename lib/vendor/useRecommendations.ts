/**
 * React Hook for Vendor Recommendations
 * Provides easy access to actionable recommendations
 */

import { useQuery } from '@tanstack/react-query';
import { 
  ProductRecommendation, 
  TrendingOpportunity, 
  FulfillmentRecommendation 
} from './recommendations-service';
import { StoreSuggestion } from '@/types/vendor-analytics';

interface RecommendationsResponse {
  productRecommendations: ProductRecommendation[];
  storeRecommendations: StoreSuggestion[];
  fulfillmentRecommendations: FulfillmentRecommendation[];
  trendingOpportunities: TrendingOpportunity[];
}

/**
 * Hook to fetch vendor recommendations
 */
export function useRecommendations(vendorId: string | undefined) {
  return useQuery<RecommendationsResponse>({
    queryKey: ['vendor-recommendations', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');

      const response = await fetch(`/api/vendor/recommendations?vendorId=${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      return response.json();
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch product-specific recommendations
 */
export function useProductRecommendations(vendorId: string | undefined) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['product-recommendations', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');

      const response = await fetch(`/api/vendor/recommendations/products?vendorId=${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product recommendations');
      }

      return response.json();
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch trending opportunities
 */
export function useTrendingOpportunities(vendorId: string | undefined) {
  return useQuery<TrendingOpportunity[]>({
    queryKey: ['trending-opportunities', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');

      const response = await fetch(`/api/vendor/recommendations/trending?vendorId=${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trending opportunities');
      }

      return response.json();
    },
    enabled: !!vendorId,
    staleTime: 10 * 60 * 1000, // 10 minutes - trending data changes less frequently
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch fulfillment recommendations
 */
export function useFulfillmentRecommendations(vendorId: string | undefined) {
  return useQuery<FulfillmentRecommendation[]>({
    queryKey: ['fulfillment-recommendations', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');

      const response = await fetch(`/api/vendor/recommendations/fulfillment?vendorId=${vendorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fulfillment recommendations');
      }

      return response.json();
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}
