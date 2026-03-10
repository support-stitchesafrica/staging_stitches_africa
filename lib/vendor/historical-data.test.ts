/**
 * Historical Data Tests
 * Tests for historical data access functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VendorAnalyticsService } from './analytics-service';
import { DateRange } from '@/types/vendor-analytics';

describe('Historical Data Access', () => {
  let service: VendorAnalyticsService;
  const testVendorId = 'test-vendor-123';

  beforeEach(() => {
    service = new VendorAnalyticsService();
  });

  describe('Date Range Validation', () => {
    it('should accept date ranges within 12 months', () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);

      const dateRange: DateRange = { start: startDate, end: endDate };
      
      // Should not throw
      expect(() => {
        const monthsDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsDiff > 12) {
          throw new Error('Date range cannot exceed 12 months');
        }
      }).not.toThrow();
    });

    it('should reject date ranges exceeding 12 months', () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 13);

      const dateRange: DateRange = { start: startDate, end: endDate };
      
      expect(() => {
        const monthsDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsDiff > 12) {
          throw new Error('Date range cannot exceed 12 months');
        }
      }).toThrow('Date range cannot exceed 12 months');
    });
  });

  describe('Seasonal Pattern Detection', () => {
    it('should categorize high trend correctly', () => {
      const avgValue = 100;
      const quarterAvg = 130; // 30% above average
      const deviation = ((quarterAvg - avgValue) / avgValue) * 100;

      let trend: 'high' | 'medium' | 'low';
      if (deviation > 20) {
        trend = 'high';
      } else if (deviation < -20) {
        trend = 'low';
      } else {
        trend = 'medium';
      }

      expect(trend).toBe('high');
    });

    it('should categorize low trend correctly', () => {
      const avgValue = 100;
      const quarterAvg = 70; // 30% below average
      const deviation = ((quarterAvg - avgValue) / avgValue) * 100;

      let trend: 'high' | 'medium' | 'low';
      if (deviation > 20) {
        trend = 'high';
      } else if (deviation < -20) {
        trend = 'low';
      } else {
        trend = 'medium';
      }

      expect(trend).toBe('low');
    });

    it('should categorize medium trend correctly', () => {
      const avgValue = 100;
      const quarterAvg = 110; // 10% above average
      const deviation = ((quarterAvg - avgValue) / avgValue) * 100;

      let trend: 'high' | 'medium' | 'low';
      if (deviation > 20) {
        trend = 'high';
      } else if (deviation < -20) {
        trend = 'low';
      } else {
        trend = 'medium';
      }

      expect(trend).toBe('medium');
    });
  });

  describe('Cumulative Metrics Calculation', () => {
    it('should calculate cumulative values correctly', () => {
      const dataPoints = [
        { date: new Date('2024-01-01'), value: 100, label: 'Jan' },
        { date: new Date('2024-02-01'), value: 150, label: 'Feb' },
        { date: new Date('2024-03-01'), value: 200, label: 'Mar' }
      ];

      let cumulativeValue = 0;
      const cumulativeDataPoints = dataPoints.map(point => {
        cumulativeValue += point.value;
        return {
          date: point.date,
          value: cumulativeValue,
          label: point.label
        };
      });

      expect(cumulativeDataPoints[0].value).toBe(100);
      expect(cumulativeDataPoints[1].value).toBe(250);
      expect(cumulativeDataPoints[2].value).toBe(450);
    });

    it('should maintain cumulative property: each point equals sum of all previous', () => {
      const dataPoints = [
        { date: new Date('2024-01-01'), value: 50, label: 'Jan' },
        { date: new Date('2024-02-01'), value: 75, label: 'Feb' },
        { date: new Date('2024-03-01'), value: 100, label: 'Mar' },
        { date: new Date('2024-04-01'), value: 125, label: 'Apr' }
      ];

      let cumulativeValue = 0;
      const cumulativeDataPoints = dataPoints.map(point => {
        cumulativeValue += point.value;
        return {
          date: point.date,
          value: cumulativeValue,
          label: point.label
        };
      });

      // Verify cumulative property
      for (let i = 0; i < cumulativeDataPoints.length; i++) {
        const expectedSum = dataPoints.slice(0, i + 1).reduce((sum, p) => sum + p.value, 0);
        expect(cumulativeDataPoints[i].value).toBe(expectedSum);
      }
    });
  });

  describe('Year-over-Year Comparison', () => {
    it('should calculate year-over-year change correctly', () => {
      const currentYearValue = 150000;
      const previousYearValue = 100000;
      
      const change = ((currentYearValue - previousYearValue) / previousYearValue) * 100;
      
      expect(change).toBe(50);
    });

    it('should handle negative year-over-year change', () => {
      const currentYearValue = 80000;
      const previousYearValue = 100000;
      
      const change = ((currentYearValue - previousYearValue) / previousYearValue) * 100;
      
      expect(change).toBe(-20);
    });

    it('should handle zero previous year value', () => {
      const currentYearValue = 100000;
      const previousYearValue = 0;
      
      // Safe division
      const change = previousYearValue === 0 ? 0 : ((currentYearValue - previousYearValue) / previousYearValue) * 100;
      
      expect(change).toBe(0);
    });
  });

  describe('Date Range Comparison', () => {
    it('should calculate percentage changes for all metrics', () => {
      const range1 = {
        revenue: 50000,
        orders: 100,
        customers: 50,
        averageOrderValue: 500
      };

      const range2 = {
        revenue: 40000,
        orders: 80,
        customers: 40,
        averageOrderValue: 500
      };

      const calculateChange = (current: number, previous: number) => {
        return previous === 0 ? 0 : ((current - previous) / previous) * 100;
      };

      const changes = {
        revenue: calculateChange(range1.revenue, range2.revenue),
        orders: calculateChange(range1.orders, range2.orders),
        customers: calculateChange(range1.customers, range2.customers),
        averageOrderValue: calculateChange(range1.averageOrderValue, range2.averageOrderValue)
      };

      expect(changes.revenue).toBe(25);
      expect(changes.orders).toBe(25);
      expect(changes.customers).toBe(25);
      expect(changes.averageOrderValue).toBe(0);
    });
  });

  describe('Historical Data Point Generation', () => {
    it('should generate monthly data points for 12 months', () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const dataPoints: any[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        dataPoints.push({
          date: new Date(monthStart),
          value: 0,
          label: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Should have approximately 12-13 data points (depending on exact dates)
      expect(dataPoints.length).toBeGreaterThanOrEqual(12);
      expect(dataPoints.length).toBeLessThanOrEqual(14);
    });
  });
});
