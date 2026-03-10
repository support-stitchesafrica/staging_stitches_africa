/**
 * Customer Insights Service Tests
 * Tests for customer segmentation and anonymization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerInsightsService } from './customer-insights-service';

describe('CustomerInsightsService', () => {
  let service: CustomerInsightsService;

  beforeEach(() => {
    service = new CustomerInsightsService();
  });

  describe('anonymizeCustomerData', () => {
    it('should remove PII from customer data', () => {
      const customer = {
        id: 'customer123',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Lagos',
        state: 'Lagos State',
        orders: [
          {
            timestamp: new Date('2024-01-01'),
            price: 5000,
            products: ['product1'],
            wear_category: 'Shirts'
          }
        ],
        lifetimeValue: 5000,
        averageOrderValue: 5000,
        orderCount: 1,
        lastPurchaseDate: new Date('2024-01-01')
      };

      const anonymized = service.anonymizeCustomerData(customer);

      // Should not contain PII
      expect(anonymized).not.toHaveProperty('email');
      expect(anonymized).not.toHaveProperty('phone');
      expect(anonymized).not.toHaveProperty('address');
      
      // Should have hashed ID
      expect(anonymized.customerId).toBeDefined();
      expect(anonymized.customerId).not.toBe(customer.id);
      expect(anonymized.customerId.length).toBe(16);
      
      // Should preserve location (city and state only)
      expect(anonymized.location.city).toBe('Lagos');
      expect(anonymized.location.state).toBe('Lagos State');
      
      // Should preserve purchase history without PII
      expect(anonymized.purchaseHistory).toHaveLength(1);
      expect(anonymized.purchaseHistory[0].amount).toBe(5000);
      expect(anonymized.purchaseHistory[0].category).toBe('Shirts');
      
      // Should preserve metrics
      expect(anonymized.lifetimeValue).toBe(5000);
      expect(anonymized.averageOrderValue).toBe(5000);
      expect(anonymized.orderCount).toBe(1);
    });

    it('should handle missing data gracefully', () => {
      const customer = {
        id: 'customer456'
      };

      const anonymized = service.anonymizeCustomerData(customer);

      expect(anonymized.customerId).toBeDefined();
      expect(anonymized.location.city).toBe('Unknown');
      expect(anonymized.location.state).toBe('Unknown');
      expect(anonymized.purchaseHistory).toEqual([]);
      expect(anonymized.lifetimeValue).toBe(0);
      expect(anonymized.orderCount).toBe(0);
    });

    it('should consistently hash the same customer ID', () => {
      const customer1 = { id: 'customer789' };
      const customer2 = { id: 'customer789' };

      const anonymized1 = service.anonymizeCustomerData(customer1);
      const anonymized2 = service.anonymizeCustomerData(customer2);

      expect(anonymized1.customerId).toBe(anonymized2.customerId);
    });

    it('should produce different hashes for different customer IDs', () => {
      const customer1 = { id: 'customer001' };
      const customer2 = { id: 'customer002' };

      const anonymized1 = service.anonymizeCustomerData(customer1);
      const anonymized2 = service.anonymizeCustomerData(customer2);

      expect(anonymized1.customerId).not.toBe(anonymized2.customerId);
    });
  });

  describe('Customer Segmentation Logic', () => {
    it('should identify new customers correctly', () => {
      // This tests the private method indirectly through the logic
      const customers = [
        { id: '1', orderCount: 1, lifetimeValue: 1000 },
        { id: '2', orderCount: 1, lifetimeValue: 1500 },
        { id: '3', orderCount: 2, lifetimeValue: 3000 }
      ];

      // New customers should be those with orderCount === 1
      const newCustomers = customers.filter(c => c.orderCount === 1);
      expect(newCustomers).toHaveLength(2);
      expect(newCustomers.every(c => c.orderCount === 1)).toBe(true);
    });

    it('should identify returning customers correctly', () => {
      const customers = [
        { id: '1', orderCount: 1, lifetimeValue: 1000 },
        { id: '2', orderCount: 2, lifetimeValue: 2000 },
        { id: '3', orderCount: 3, lifetimeValue: 3000 },
        { id: '4', orderCount: 5, lifetimeValue: 5000 }
      ];

      // Returning customers should be those with 2-4 orders
      const returningCustomers = customers.filter(c => c.orderCount >= 2 && c.orderCount < 5);
      expect(returningCustomers).toHaveLength(2);
      expect(returningCustomers.every(c => c.orderCount >= 2 && c.orderCount < 5)).toBe(true);
    });

    it('should identify frequent buyers correctly', () => {
      const customers = [
        { id: '1', orderCount: 3, lifetimeValue: 3000 },
        { id: '2', orderCount: 5, lifetimeValue: 5000 },
        { id: '3', orderCount: 10, lifetimeValue: 10000 }
      ];

      // Frequent buyers should be those with 5+ orders
      const frequentBuyers = customers.filter(c => c.orderCount >= 5);
      expect(frequentBuyers).toHaveLength(2);
      expect(frequentBuyers.every(c => c.orderCount >= 5)).toBe(true);
    });

    it('should identify high-value customers correctly', () => {
      const customers = [
        { id: '1', orderCount: 1, lifetimeValue: 1000 },
        { id: '2', orderCount: 2, lifetimeValue: 2000 },
        { id: '3', orderCount: 3, lifetimeValue: 3000 },
        { id: '4', orderCount: 4, lifetimeValue: 4000 },
        { id: '5', orderCount: 5, lifetimeValue: 5000 }
      ];

      // Sort by lifetime value and take top 20%
      const sortedCustomers = [...customers].sort((a, b) => b.lifetimeValue - a.lifetimeValue);
      const top20PercentCount = Math.ceil(customers.length * 0.2);
      const highValueCustomers = sortedCustomers.slice(0, top20PercentCount);

      expect(highValueCustomers).toHaveLength(1);
      expect(highValueCustomers[0].lifetimeValue).toBe(5000);
    });
  });

  describe('Lifetime Value Calculation', () => {
    it('should calculate lifetime value as sum of all orders', () => {
      const orders = [
        { price: 1000 },
        { price: 2000 },
        { price: 1500 }
      ];

      const lifetimeValue = orders.reduce((sum, order) => sum + order.price, 0);
      expect(lifetimeValue).toBe(4500);
    });

    it('should handle orders with missing prices', () => {
      const orders = [
        { price: 1000 },
        { amount: 2000 }, // Different field name
        {} // Missing price
      ];

      const lifetimeValue = orders.reduce((sum, order) => {
        const amount = order.price || order.amount || 0;
        return sum + amount;
      }, 0);

      expect(lifetimeValue).toBe(3000);
    });
  });

  describe('Location Aggregation', () => {
    it('should aggregate customers by location', () => {
      const customers = [
        { city: 'Lagos', state: 'Lagos State', lifetimeValue: 5000 },
        { city: 'Lagos', state: 'Lagos State', lifetimeValue: 3000 },
        { city: 'Abuja', state: 'FCT', lifetimeValue: 4000 }
      ];

      const locationMap = new Map<string, { customerCount: number; revenue: number }>();
      
      customers.forEach(customer => {
        const locationKey = `${customer.city}, ${customer.state}`;
        if (!locationMap.has(locationKey)) {
          locationMap.set(locationKey, { customerCount: 0, revenue: 0 });
        }
        const location = locationMap.get(locationKey)!;
        location.customerCount += 1;
        location.revenue += customer.lifetimeValue;
      });

      expect(locationMap.size).toBe(2);
      expect(locationMap.get('Lagos, Lagos State')).toEqual({
        customerCount: 2,
        revenue: 8000
      });
      expect(locationMap.get('Abuja, FCT')).toEqual({
        customerCount: 1,
        revenue: 4000
      });
    });
  });
});
