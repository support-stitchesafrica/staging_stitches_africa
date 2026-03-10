/**
 * Tests for VendorAnalyticsService
 * Basic unit tests for core calculation methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VendorAnalyticsService } from './analytics-service';

describe('VendorAnalyticsService', () => {
  let service: VendorAnalyticsService;

  beforeEach(() => {
    service = new VendorAnalyticsService();
  });

  describe('Service Initialization', () => {
    it('should create an instance of VendorAnalyticsService', () => {
      expect(service).toBeInstanceOf(VendorAnalyticsService);
    });
  });

  describe('Validation Methods', () => {
    it('should validate vendor ID correctly', () => {
      // Access protected method through any cast for testing
      const validateVendorId = (service as any).validateVendorId.bind(service);
      
      expect(() => validateVendorId('valid-vendor-id')).not.toThrow();
      expect(() => validateVendorId('')).toThrow('Invalid vendor ID');
      expect(() => validateVendorId('   ')).toThrow('Invalid vendor ID');
    });

    it('should validate date range correctly', () => {
      const validateDateRange = (service as any).validateDateRange.bind(service);
      
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(() => validateDateRange(start, end)).not.toThrow();
      expect(() => validateDateRange(end, start)).toThrow('start date must be before end date');
    });
  });

  describe('Helper Methods', () => {
    it('should calculate percentage change correctly', () => {
      const calculatePercentageChange = (service as any).calculatePercentageChange.bind(service);
      
      expect(calculatePercentageChange(150, 100)).toBe(50);
      expect(calculatePercentageChange(75, 100)).toBe(-25);
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('should safely divide numbers', () => {
      const safeDivide = (service as any).safeDivide.bind(service);
      
      expect(safeDivide(100, 10)).toBe(10);
      expect(safeDivide(100, 0)).toBe(0);
      expect(safeDivide(100, 0, 50)).toBe(50);
    });

    it('should round to decimal places correctly', () => {
      const roundToDecimal = (service as any).roundToDecimal.bind(service);
      
      expect(roundToDecimal(3.14159, 2)).toBe(3.14);
      expect(roundToDecimal(3.14159, 3)).toBe(3.142);
      expect(roundToDecimal(3.14159, 0)).toBe(3);
    });

    it('should aggregate values correctly', () => {
      const aggregate = (service as any).aggregate.bind(service);
      
      const values = [10, 20, 30, 40, 50];
      
      expect(aggregate(values, 'sum')).toBe(150);
      expect(aggregate(values, 'avg')).toBe(30);
      expect(aggregate(values, 'min')).toBe(10);
      expect(aggregate(values, 'max')).toBe(50);
      expect(aggregate([], 'sum')).toBe(0);
    });
  });

  describe('Category Calculations', () => {
    it('should calculate top categories correctly', () => {
      const calculateTopCategories = (service as any).calculateTopCategories.bind(service);
      
      const orders = [
        { wear_category: 'Shirts', price: 100 },
        { wear_category: 'Shirts', price: 150 },
        { wear_category: 'Pants', price: 200 },
        { wear_category: 'Pants', price: 100 },
        { wear_category: 'Shoes', price: 300 }
      ];

      const categories = calculateTopCategories(orders);
      
      expect(categories).toHaveLength(3);
      // Sorted by revenue descending: Shoes (300), Pants (300), Shirts (250)
      // But Pants appears first because it has the same revenue as Shoes
      expect(categories[0].revenue).toBe(300);
      expect(categories.find((c: { category: string; }) => c.category === 'Shoes')).toBeDefined();
      expect(categories.find((c: { category: string; }) => c.category === 'Shirts')?.revenue).toBe(250);
    });
  });

  describe('Product Revenue Calculations', () => {
    it('should calculate revenue by product correctly', () => {
      const calculateRevenueByProduct = (service as any).calculateRevenueByProduct.bind(service);
      
      const orders = [
        { product_id: 'p1', title: 'Product 1', price: 100, quantity: 2 },
        { product_id: 'p1', title: 'Product 1', price: 100, quantity: 1 },
        { product_id: 'p2', title: 'Product 2', price: 200, quantity: 1 }
      ];

      const products = calculateRevenueByProduct(orders);
      
      expect(products).toHaveLength(2);
      expect(products[0].productId).toBe('p1');
      expect(products[0].revenue).toBe(200);
      expect(products[0].quantity).toBe(3);
    });
  });

  describe('Fulfillment Time Calculations', () => {
    it('should calculate fulfillment time in hours', () => {
      const calculateFulfillmentTime = (service as any).calculateFulfillmentTime.bind(service);
      
      const order = {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        delivery_date: new Date('2024-01-03T10:00:00Z')
      };

      const hours = calculateFulfillmentTime(order);
      expect(hours).toBe(48); // 2 days = 48 hours
    });

    it('should return 0 for orders without delivery date', () => {
      const calculateFulfillmentTime = (service as any).calculateFulfillmentTime.bind(service);
      
      const order = {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        delivery_date: null
      };

      const hours = calculateFulfillmentTime(order);
      expect(hours).toBe(0);
    });
  });

  describe('Cancellation Reasons', () => {
    it('should calculate cancellation reasons correctly', () => {
      const calculateCancellationReasons = (service as any).calculateCancellationReasons.bind(service);
      
      const cancelledOrders = [
        { cancellation_reason: 'Out of stock' },
        { cancellation_reason: 'Out of stock' },
        { cancellation_reason: 'Customer request' },
        { cancellation_reason: null }
      ];

      const reasons = calculateCancellationReasons(cancelledOrders);
      
      expect(reasons).toHaveLength(3);
      expect(reasons[0].reason).toBe('Out of stock');
      expect(reasons[0].count).toBe(2);
      expect(reasons[0].percentage).toBe(50);
    });
  });

  describe('Location Insights', () => {
    it('should calculate location insights correctly', () => {
      const calculateLocationInsights = (service as any).calculateLocationInsights.bind(service);
      
      const orders = [
        { user_address: { city: 'Lagos', state: 'Lagos' }, price: 100 },
        { user_address: { city: 'Lagos', state: 'Lagos' }, price: 200 },
        { user_address: { city: 'Abuja', state: 'FCT' }, price: 150 }
      ];

      const locations = calculateLocationInsights(orders);
      
      expect(locations).toHaveLength(2);
      expect(locations[0].city).toBe('Lagos');
      expect(locations[0].revenue).toBe(300);
      expect(locations[0].customerCount).toBe(2);
    });
  });

  describe('Payment Method Stats', () => {
    it('should calculate payment method statistics correctly', () => {
      const calculatePaymentMethodStats = (service as any).calculatePaymentMethodStats.bind(service);
      
      const orders = [
        { payment_method: 'Card', price: 100 },
        { payment_method: 'Card', price: 200 },
        { payment_method: 'Bank Transfer', price: 150 }
      ];

      const methods = calculatePaymentMethodStats(orders);
      
      expect(methods).toHaveLength(2);
      expect(methods[0].method).toBe('Card');
      expect(methods[0].count).toBe(2);
      expect(methods[0].totalAmount).toBe(300);
      expect(methods[0].successRate).toBe(100);
    });
  });
});
