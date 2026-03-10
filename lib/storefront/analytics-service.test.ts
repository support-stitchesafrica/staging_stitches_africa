/**
 * Tests for Storefront Analytics Service
 */

import { StorefrontAnalyticsService } from './analytics-service';
import { generateMockAnalyticsData, mockStorefrontAnalyticsService } from './mock-analytics-data';

describe('StorefrontAnalyticsService', () => {
  describe('Mock Analytics Data', () => {
    it('should generate realistic mock analytics data', () => {
      const data = generateMockAnalyticsData(30);
      
      expect(data.pageViews).toBeGreaterThan(0);
      expect(data.productViews).toBeGreaterThan(0);
      expect(data.cartAdds).toBeGreaterThan(0);
      expect(data.uniqueVisitors).toBeGreaterThan(0);
      expect(data.conversionRate).toBeGreaterThanOrEqual(0);
      expect(data.conversionRate).toBeLessThanOrEqual(100);
      
      // Check that product views <= page views (logical constraint)
      expect(data.productViews).toBeLessThanOrEqual(data.pageViews);
      
      // Check that cart adds <= product views (logical constraint)
      expect(data.cartAdds).toBeLessThanOrEqual(data.productViews);
      
      // Check daily stats
      expect(data.dailyStats).toHaveLength(30);
      expect(data.dailyStats[0].date).toBeDefined();
      expect(data.dailyStats[0].pageViews).toBeGreaterThanOrEqual(0);
      
      // Check top products
      expect(data.topProducts.length).toBeGreaterThan(0);
      expect(data.topProducts[0].productId).toBeDefined();
      expect(data.topProducts[0].productName).toBeDefined();
      expect(data.topProducts[0].views).toBeGreaterThanOrEqual(0);
      expect(data.topProducts[0].cartAdds).toBeGreaterThanOrEqual(0);
      
      // Check session data
      expect(data.sessionData.averageSessionDuration).toBeGreaterThan(0);
      expect(data.sessionData.bounceRate).toBeGreaterThanOrEqual(0);
      expect(data.sessionData.bounceRate).toBeLessThanOrEqual(100);
      expect(data.sessionData.pagesPerSession).toBeGreaterThan(0);
    });

    it('should generate different data for different date ranges', () => {
      const data7Days = generateMockAnalyticsData(7);
      const data30Days = generateMockAnalyticsData(30);
      
      expect(data7Days.dailyStats).toHaveLength(7);
      expect(data30Days.dailyStats).toHaveLength(30);
      
      // 30-day period should generally have higher totals
      expect(data30Days.pageViews).toBeGreaterThan(data7Days.pageViews);
    });
  });

  describe('Mock Service', () => {
    it('should return analytics data', async () => {
      const dateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const data = await mockStorefrontAnalyticsService.getAnalytics('test-storefront', dateRange);
      
      expect(data).toBeDefined();
      expect(data.pageViews).toBeGreaterThanOrEqual(0);
      expect(data.productViews).toBeGreaterThanOrEqual(0);
      expect(data.cartAdds).toBeGreaterThanOrEqual(0);
      expect(data.dailyStats.length).toBeGreaterThan(0);
    });

    it('should export data as CSV', async () => {
      const dateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const csvData = await mockStorefrontAnalyticsService.exportAnalytics('test-storefront', dateRange, 'csv');
      
      expect(csvData).toContain('Date,Page Views,Product Views,Cart Adds');
      expect(csvData.split('\n').length).toBeGreaterThan(1);
    });

    it('should export data as JSON', async () => {
      const dateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const jsonData = await mockStorefrontAnalyticsService.exportAnalytics('test-storefront', dateRange, 'json');
      
      expect(() => JSON.parse(jsonData)).not.toThrow();
      const parsed = JSON.parse(jsonData);
      expect(parsed.pageViews).toBeDefined();
      expect(parsed.productViews).toBeDefined();
      expect(parsed.cartAdds).toBeDefined();
    });
  });

  describe('Analytics Calculations', () => {
    it('should calculate conversion rate correctly', () => {
      const data = generateMockAnalyticsData(30);
      
      if (data.productViews > 0) {
        const expectedConversionRate = (data.cartAdds / data.productViews) * 100;
        expect(Math.abs(data.conversionRate - expectedConversionRate)).toBeLessThan(0.01);
      } else {
        expect(data.conversionRate).toBe(0);
      }
    });

    it('should have realistic product conversion rates', () => {
      const data = generateMockAnalyticsData(30);
      
      data.topProducts.forEach(product => {
        if (product.views > 0) {
          const expectedRate = (product.cartAdds / product.views) * 100;
          expect(Math.abs(product.conversionRate - expectedRate)).toBeLessThan(0.01);
        } else {
          expect(product.conversionRate).toBe(0);
        }
      });
    });

    it('should maintain logical data relationships', () => {
      const data = generateMockAnalyticsData(30);
      
      // Total product views from top products should not exceed total product views
      const topProductViews = data.topProducts.reduce((sum, p) => sum + p.views, 0);
      expect(topProductViews).toBeLessThanOrEqual(data.productViews);
      
      // Total cart adds from top products should not exceed total cart adds
      const topProductCartAdds = data.topProducts.reduce((sum, p) => sum + p.cartAdds, 0);
      expect(topProductCartAdds).toBeLessThanOrEqual(data.cartAdds);
      
      // Daily stats should sum to totals
      const dailyPageViews = data.dailyStats.reduce((sum, d) => sum + d.pageViews, 0);
      const dailyProductViews = data.dailyStats.reduce((sum, d) => sum + d.productViews, 0);
      const dailyCartAdds = data.dailyStats.reduce((sum, d) => sum + d.cartAdds, 0);
      
      expect(dailyPageViews).toBe(data.pageViews);
      expect(dailyProductViews).toBe(data.productViews);
      expect(dailyCartAdds).toBe(data.cartAdds);
    });
  });
});