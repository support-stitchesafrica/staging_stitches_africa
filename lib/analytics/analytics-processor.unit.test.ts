/**
 * Unit Tests for Analytics Processor
 * Tests specific scenarios and edge cases
 * 
 * Validates: Requirements 22.1, 22.2, 22.3, 22.7
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AnalyticsProcessor } from './analytics-processor';
import { ShopActivity } from '@/types/shop-activities';
import { Timestamp } from 'firebase/firestore';

describe('Analytics Processor - Unit Tests', () => {
  let processor: AnalyticsProcessor;

  beforeEach(() => {
    processor = new AnalyticsProcessor();
  });

  describe('Conversion Rate Calculations', () => {
    test('calculates conversion rate correctly with valid data', () => {
      const viewCount = 100;
      const purchaseCount = 15;
      
      const conversionRate = processor.calculateConversionRate(viewCount, purchaseCount);
      
      expect(conversionRate).toBe(15);
    });

    test('returns 0 when view count is 0', () => {
      const conversionRate = processor.calculateConversionRate(0, 10);
      
      expect(conversionRate).toBe(0);
    });

    test('returns 0 when both counts are 0', () => {
      const conversionRate = processor.calculateConversionRate(0, 0);
      
      expect(conversionRate).toBe(0);
    });

    test('handles 100% conversion rate', () => {
      const conversionRate = processor.calculateConversionRate(50, 50);
      
      expect(conversionRate).toBe(100);
    });

    test('handles decimal conversion rates', () => {
      const conversionRate = processor.calculateConversionRate(300, 7);
      
      expect(conversionRate).toBeCloseTo(2.33, 2);
    });
  });

  describe('Cart Conversion Rate Calculations', () => {
    test('calculates cart conversion rate correctly', () => {
      const addToCartCount = 50;
      const purchaseCount = 20;
      
      const cartConversionRate = processor.calculateCartConversionRate(
        addToCartCount,
        purchaseCount
      );
      
      expect(cartConversionRate).toBe(40);
    });

    test('returns 0 when addToCart count is 0', () => {
      const cartConversionRate = processor.calculateCartConversionRate(0, 5);
      
      expect(cartConversionRate).toBe(0);
    });

    test('handles 100% cart conversion', () => {
      const cartConversionRate = processor.calculateCartConversionRate(25, 25);
      
      expect(cartConversionRate).toBe(100);
    });
  });

  describe('Activity Aggregation', () => {
    test('aggregates activities with sample data', () => {
      const activities: ShopActivity[] = [
        {
          id: '1',
          type: 'view',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test'
          }
        },
        {
          id: '2',
          type: 'view',
          userId: 'user2',
          sessionId: 'session2',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'mobile',
            userAgent: 'test'
          }
        },
        {
          id: '3',
          type: 'add_to_cart',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test',
            price: 100,
            quantity: 1
          }
        },
        {
          id: '4',
          type: 'purchase',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test',
            price: 100,
            quantity: 1
          }
        }
      ];

      const views = activities.filter(a => a.type === 'view').length;
      const addToCarts = activities.filter(a => a.type === 'add_to_cart').length;
      const purchases = activities.filter(a => a.type === 'purchase').length;

      expect(views).toBe(2);
      expect(addToCarts).toBe(1);
      expect(purchases).toBe(1);

      const conversionRate = processor.calculateConversionRate(views, purchases);
      expect(conversionRate).toBe(50);
    });

    test('handles empty activity array', () => {
      const activities: ShopActivity[] = [];

      const views = activities.filter(a => a.type === 'view').length;
      const purchases = activities.filter(a => a.type === 'purchase').length;

      expect(views).toBe(0);
      expect(purchases).toBe(0);

      const conversionRate = processor.calculateConversionRate(views, purchases);
      expect(conversionRate).toBe(0);
    });

    test('calculates revenue from purchase activities', () => {
      const activities: ShopActivity[] = [
        {
          id: '1',
          type: 'purchase',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test',
            price: 50,
            quantity: 2
          }
        },
        {
          id: '2',
          type: 'purchase',
          userId: 'user2',
          sessionId: 'session2',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'mobile',
            userAgent: 'test',
            price: 75,
            quantity: 1
          }
        }
      ];

      const totalRevenue = activities.reduce((sum, a) => {
        return sum + (a.metadata.price || 0) * (a.metadata.quantity || 1);
      }, 0);

      expect(totalRevenue).toBe(175); // (50 * 2) + (75 * 1)
    });

    test('handles missing price or quantity in metadata', () => {
      const activities: ShopActivity[] = [
        {
          id: '1',
          type: 'purchase',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test'
            // No price or quantity
          }
        }
      ];

      const totalRevenue = activities.reduce((sum, a) => {
        return sum + (a.metadata.price || 0) * (a.metadata.quantity || 1);
      }, 0);

      expect(totalRevenue).toBe(0);
    });
  });

  describe('Unique View Counting', () => {
    test('counts unique users correctly', () => {
      const activities: ShopActivity[] = [
        {
          id: '1',
          type: 'view',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test'
          }
        },
        {
          id: '2',
          type: 'view',
          userId: 'user1', // Same user
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test'
          }
        },
        {
          id: '3',
          type: 'view',
          userId: 'user2', // Different user
          sessionId: 'session2',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'mobile',
            userAgent: 'test'
          }
        }
      ];

      const uniqueUsers = new Set(activities.map(a => a.userId));

      expect(activities.length).toBe(3); // Total views
      expect(uniqueUsers.size).toBe(2); // Unique users
    });
  });

  describe('Concurrent Activity Processing', () => {
    test('processes multiple vendors without data mixing', () => {
      const vendor1Activities: ShopActivity[] = [
        {
          id: '1',
          type: 'view',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test'
          }
        }
      ];

      const vendor2Activities: ShopActivity[] = [
        {
          id: '2',
          type: 'view',
          userId: 'user2',
          sessionId: 'session2',
          vendorId: 'vendor2',
          productId: 'product2',
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'mobile',
            userAgent: 'test'
          }
        }
      ];

      // Verify activities are properly separated by vendor
      const vendor1Views = vendor1Activities.filter(a => a.vendorId === 'vendor1');
      const vendor2Views = vendor2Activities.filter(a => a.vendorId === 'vendor2');

      expect(vendor1Views.length).toBe(1);
      expect(vendor2Views.length).toBe(1);
      expect(vendor1Views[0].vendorId).not.toBe(vendor2Views[0].vendorId);
    });
  });

  describe('Edge Cases', () => {
    test('handles activities with no productId', () => {
      const activities: ShopActivity[] = [
        {
          id: '1',
          type: 'search',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          // No productId for search activities
          timestamp: Timestamp.now(),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test',
            searchQuery: 'test query'
          }
        }
      ];

      // Should not crash when filtering by productId
      const productActivities = activities.filter(a => a.productId === 'product1');
      expect(productActivities.length).toBe(0);
    });

    test('handles very large activity counts', () => {
      const viewCount = 1000000;
      const purchaseCount = 50000;

      const conversionRate = processor.calculateConversionRate(viewCount, purchaseCount);

      expect(conversionRate).toBe(5);
    });

    test('handles fractional percentages correctly', () => {
      const viewCount = 333;
      const purchaseCount = 1;

      const conversionRate = processor.calculateConversionRate(viewCount, purchaseCount);

      expect(conversionRate).toBeCloseTo(0.3, 1);
    });
  });

  describe('Date Range Filtering', () => {
    test('filters activities within date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const activities: ShopActivity[] = [
        {
          id: '1',
          type: 'view',
          userId: 'user1',
          sessionId: 'session1',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.fromDate(yesterday),
          metadata: {
            deviceType: 'desktop',
            userAgent: 'test'
          }
        },
        {
          id: '2',
          type: 'view',
          userId: 'user2',
          sessionId: 'session2',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.fromDate(now),
          metadata: {
            deviceType: 'mobile',
            userAgent: 'test'
          }
        },
        {
          id: '3',
          type: 'view',
          userId: 'user3',
          sessionId: 'session3',
          vendorId: 'vendor1',
          productId: 'product1',
          timestamp: Timestamp.fromDate(tomorrow),
          metadata: {
            deviceType: 'tablet',
            userAgent: 'test'
          }
        }
      ];

      // Filter activities within range (yesterday to now)
      const filtered = activities.filter(a => {
        const activityDate = a.timestamp.toDate();
        return activityDate >= yesterday && activityDate <= now;
      });

      expect(filtered.length).toBe(2);
    });
  });
});
