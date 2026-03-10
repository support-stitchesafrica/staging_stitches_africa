/**
 * Unit tests for StorefrontAnalyticsService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorefrontAnalyticsService } from '../storefront-analytics-service';
import { DateRange } from '../../types';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          docs: []
        }))
      })),
      onSnapshot: vi.fn(() => vi.fn())
    }))
  }
}));

// Mock existing storefront analytics service
vi.mock('@/lib/storefront/analytics-service', () => ({
  storefrontAnalyticsService: {
    getAnalytics: vi.fn(() => Promise.resolve({
      pageViews: 100,
      productViews: 50,
      cartAdds: 10,
      uniqueVisitors: 75,
      conversionRate: 20,
      topProducts: [],
      dailyStats: [],
      sessionData: {
        averageSessionDuration: 180,
        bounceRate: 0.4,
        pagesPerSession: 2.5
      }
    }))
  }
}));

describe('StorefrontAnalyticsService', () => {
  let service: StorefrontAnalyticsService;
  let dateRange: DateRange;

  beforeEach(() => {
    service = new StorefrontAnalyticsService();
    dateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31')
    };
  });

  describe('getStorefrontPerformanceMetrics', () => {
    it('should return storefront analytics data', async () => {
      const result = await service.getStorefrontPerformanceMetrics(dateRange);

      expect(result).toHaveProperty('totalStorefronts');
      expect(result).toHaveProperty('aggregatedViews');
      expect(result).toHaveProperty('aggregatedConversions');
      expect(result).toHaveProperty('averageConversionRate');
      expect(result).toHaveProperty('topPerformingStorefronts');
      expect(result).toHaveProperty('customerJourneyMetrics');
      expect(result).toHaveProperty('sessionAnalytics');
    });

    it('should handle errors gracefully', async () => {
      // Mock error scenario
      const mockError = new Error('Database connection failed');
      vi.spyOn(service as any, 'getActiveStorefronts').mockRejectedValueOnce(mockError);

      await expect(service.getStorefrontPerformanceMetrics(dateRange))
        .rejects.toThrow('Failed to retrieve storefront analytics data');
    });
  });

  describe('getStorefrontAnalyticsById', () => {
    it('should return analytics for specific storefronts', async () => {
      const storefrontIds = ['storefront1', 'storefront2'];
      
      const result = await service.getStorefrontAnalyticsById(storefrontIds, dateRange);

      expect(result).toHaveProperty('totalStorefronts');
      expect(result).toHaveProperty('aggregatedViews');
      expect(result).toHaveProperty('aggregatedConversions');
      expect(result).toHaveProperty('averageConversionRate');
    });
  });

  describe('subscribeToStorefrontUpdates', () => {
    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      
      const unsubscribe = service.subscribeToStorefrontUpdates(dateRange, callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should generate recommendations for high bounce rate', async () => {
      const storefrontData = {
        totalStorefronts: 5,
        aggregatedViews: 1000,
        aggregatedConversions: 50,
        averageConversionRate: 0.05,
        topPerformingStorefronts: [],
        customerJourneyMetrics: [],
        sessionAnalytics: {
          averageSessionDuration: 60,
          bounceRate: 0.7, // High bounce rate
          pagesPerSession: 1.2,
          newVsReturningVisitors: { new: 800, returning: 200 }
        }
      };

      const recommendations = await service.generateOptimizationRecommendations(storefrontData);

      expect(recommendations).toHaveLength(2); // High bounce rate + short session duration
      expect(recommendations[0]).toHaveProperty('type', 'engagement');
      expect(recommendations[0]).toHaveProperty('priority', 'high');
      expect(recommendations[0].title).toContain('High Bounce Rate');
    });

    it('should generate recommendations for low conversion rate', async () => {
      const storefrontData = {
        totalStorefronts: 5,
        aggregatedViews: 1000,
        aggregatedConversions: 10,
        averageConversionRate: 0.01, // Low conversion rate
        topPerformingStorefronts: [],
        customerJourneyMetrics: [],
        sessionAnalytics: {
          averageSessionDuration: 180,
          bounceRate: 0.3,
          pagesPerSession: 3.5,
          newVsReturningVisitors: { new: 600, returning: 400 }
        }
      };

      const recommendations = await service.generateOptimizationRecommendations(storefrontData);

      expect(recommendations.some(r => r.title.includes('Low Conversion Rate'))).toBe(true);
    });

    it('should generate positive recommendations for good performance', async () => {
      const storefrontData = {
        totalStorefronts: 5,
        aggregatedViews: 1000,
        aggregatedConversions: 50,
        averageConversionRate: 0.05,
        topPerformingStorefronts: [],
        customerJourneyMetrics: [],
        sessionAnalytics: {
          averageSessionDuration: 300,
          bounceRate: 0.2,
          pagesPerSession: 5.2, // High engagement
          newVsReturningVisitors: { new: 600, returning: 400 }
        }
      };

      const recommendations = await service.generateOptimizationRecommendations(storefrontData);

      expect(recommendations.some(r => r.title.includes('Strong User Engagement'))).toBe(true);
    });
  });
});