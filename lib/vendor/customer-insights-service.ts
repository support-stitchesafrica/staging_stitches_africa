/**
 * Customer Insights Service
 * Handles customer segmentation and anonymized insights
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 15.3
 */

import { BaseVendorService } from './base-service';
import {
  CustomerSegment,
  AnonymizedCustomer,
  ServiceResponse,
  LocationData,
  DateRange
} from '@/types/vendor-analytics';
import { createHash } from 'crypto';
import { db } from '@/firebase';
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';

export class CustomerInsightsService extends BaseVendorService {
  constructor() {
    super('CustomerInsightsService');
  }

  /**
   * Segments customers based on purchase behavior
   * Requirements: 5.1
   */
  async segmentCustomers(
    vendorId: string,
    dateRange?: DateRange
  ): Promise<ServiceResponse<CustomerSegment[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const customers = await this.getVendorCustomers(vendorId, dateRange);
      
      const segments: CustomerSegment[] = [
        this.identifyNewCustomers(customers),
        this.identifyReturningCustomers(customers),
        this.identifyFrequentBuyers(customers),
        this.identifyHighValueCustomers(customers)
      ];

      return segments;
    }, 'segmentCustomers');
  }

  /**
   * Anonymizes customer data for vendor viewing
   * Requirements: 5.5, 15.3
   * Removes all PII (email, phone, full address)
   */
  anonymizeCustomerData(customer: any): AnonymizedCustomer {
    return {
      customerId: this.hashId(customer.id || customer.user_id || 'unknown'),
      segment: customer.segment || 'new',
      location: {
        city: customer.city || customer.location?.city || 'Unknown',
        state: customer.state || customer.location?.state || 'Unknown'
        // No personal address details, email, or phone
      },
      purchaseHistory: (customer.orders || []).map((order: any) => ({
        date: this.parseDate(order.timestamp || order.date),
        amount: this.parseNumber(order.price || order.amount, 0),
        products: order.products || [order.product_id].filter(Boolean),
        category: order.wear_category || order.category || 'General'
        // No payment details or contact info
      })),
      lifetimeValue: this.parseNumber(customer.lifetimeValue, 0),
      averageOrderValue: this.parseNumber(customer.averageOrderValue, 0),
      orderCount: this.parseNumber(customer.orderCount, 0),
      lastPurchaseDate: this.parseDate(customer.lastPurchaseDate || new Date())
    };
  }

  /**
   * Calculates customer lifetime value
   * Requirements: 5.4
   */
  async calculateLifetimeValue(
    customerId: string,
    vendorId: string
  ): Promise<ServiceResponse<number>> {
    return this.executeWithErrorHandling(async () => {
      this.validateRequired({ customerId, vendorId });

      const orders = await this.getCustomerOrders(customerId, vendorId);
      const lifetimeValue = orders.reduce((sum, order) => {
        const amount = this.parseNumber(order.price || order.amount, 0);
        return sum + amount;
      }, 0);
      
      return this.roundToDecimal(lifetimeValue, 2);
    }, 'calculateLifetimeValue');
  }

  /**
   * Gets location insights aggregated by city and state
   * Requirements: 5.2
   */
  async getLocationInsights(
    vendorId: string,
    dateRange?: DateRange
  ): Promise<ServiceResponse<LocationData[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const customers = await this.getVendorCustomers(vendorId, dateRange);
      const locationInsights = this.aggregateLocationData(customers);

      return locationInsights;
    }, 'getLocationInsights');
  }

  /**
   * Gets anonymized customer list for vendor
   * Requirements: 5.5, 15.3
   */
  async getAnonymizedCustomers(
    vendorId: string,
    dateRange?: DateRange
  ): Promise<ServiceResponse<AnonymizedCustomer[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const customers = await this.getVendorCustomers(vendorId, dateRange);
      const anonymizedCustomers = customers.map(customer => 
        this.anonymizeCustomerData(customer)
      );

      return anonymizedCustomers;
    }, 'getAnonymizedCustomers');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Hashes customer ID for anonymization
   */
  private hashId(id: string): string {
    return createHash('sha256').update(id).digest('hex').substring(0, 16);
  }

  /**
   * Gets all customers for a vendor with their order history
   * OPTIMIZED: Following useTailors.ts pattern for better performance
   */
  private async getVendorCustomers(vendorId: string, dateRange?: DateRange): Promise<any[]> {
    try {
      // Get all users first (optimized approach)
      const usersSnap = await getDocs(collection(db, "staging_users"));
      const orders: any[] = [];

      // Fetch orders from all users in parallel
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const userId = userDoc.id;

          try {
            const userOrdersSnap = await getDocs(
              collection(db, 'staging_users_orders', userId, 'user_orders')
            );

            userOrdersSnap.docs.forEach((orderDoc) => {
              const data = orderDoc.data();

              // Filter by vendor and date range
              if (data.tailor_id === vendorId) {
                const orderTimestamp = data.created_at instanceof Timestamp
                  ? data.created_at.toDate()
                  : data.created_at
                  ? new Date(data.created_at)
                  : new Date();

                // Apply date range filter if provided
                if (dateRange) {
                  if (orderTimestamp >= dateRange.start && orderTimestamp <= dateRange.end) {
                    orders.push({
                      id: orderDoc.id,
                      user_id: userId,
                      ...data,
                      timestamp: orderTimestamp
                    });
                  }
                } else {
                  orders.push({
                    id: orderDoc.id,
                    user_id: userId,
                    ...data,
                    timestamp: orderTimestamp
                  });
                }
              }
            });
          } catch (error) {
            this.log('warn', `Failed to fetch orders for user ${userId}`, { error });
          }
        })
      );

      // Group orders by customer (in-memory filtering)
      const customerMap = new Map<string, any>();

      orders.forEach(order => {
        const customerId = order.user_id || 'unknown';

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            user_id: customerId,
            orders: [],
            city: order.user_address?.city || order.city || order.delivery_city,
            state: order.user_address?.state || order.state || order.delivery_state,
            orderCount: 0,
            lifetimeValue: 0,
            firstPurchaseDate: order.timestamp,
            lastPurchaseDate: order.timestamp
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.orders.push(order);
        customer.orderCount += 1;
        customer.lifetimeValue += this.parseNumber(order.price, 0);

        // Update first and last purchase dates
        if (order.timestamp < customer.firstPurchaseDate) {
          customer.firstPurchaseDate = order.timestamp;
        }
        if (order.timestamp > customer.lastPurchaseDate) {
          customer.lastPurchaseDate = order.timestamp;
        }
      });

      // Calculate average order value for each customer
      const customers = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        averageOrderValue: this.safeDivide(customer.lifetimeValue, customer.orderCount, 0)
      }));

      return customers;
    } catch (error) {
      this.log('error', 'Failed to fetch vendor customers', { vendorId, error });
      return [];
    }
  }

  /**
   * Identifies new customers (first purchase within period)
   * Requirements: 5.1
   */
  private identifyNewCustomers(customers: any[]): CustomerSegment {
    const newCustomers = customers.filter(c => c.orderCount === 1);
    const totalRevenue = this.aggregate(newCustomers.map(c => c.lifetimeValue), 'sum');
    const avgOrderValue = this.safeDivide(totalRevenue, newCustomers.length, 0);
    
    return {
      type: 'new',
      count: newCustomers.length,
      percentage: this.roundToDecimal(this.safeDivide(newCustomers.length, customers.length, 0) * 100, 2),
      averageOrderValue: this.roundToDecimal(avgOrderValue, 2),
      totalRevenue: this.roundToDecimal(totalRevenue, 2),
      averagePurchaseFrequency: 1
    };
  }

  /**
   * Identifies returning customers (2-4 purchases)
   * Requirements: 5.1
   */
  private identifyReturningCustomers(customers: any[]): CustomerSegment {
    const returningCustomers = customers.filter(c => c.orderCount >= 2 && c.orderCount < 5);
    const totalRevenue = this.aggregate(returningCustomers.map(c => c.lifetimeValue), 'sum');
    const avgOrderValue = this.safeDivide(totalRevenue, 
      this.aggregate(returningCustomers.map(c => c.orderCount), 'sum'), 0);
    const avgFrequency = this.safeDivide(
      this.aggregate(returningCustomers.map(c => c.orderCount), 'sum'),
      returningCustomers.length,
      0
    );
    
    return {
      type: 'returning',
      count: returningCustomers.length,
      percentage: this.roundToDecimal(this.safeDivide(returningCustomers.length, customers.length, 0) * 100, 2),
      averageOrderValue: this.roundToDecimal(avgOrderValue, 2),
      totalRevenue: this.roundToDecimal(totalRevenue, 2),
      averagePurchaseFrequency: this.roundToDecimal(avgFrequency, 2)
    };
  }

  /**
   * Identifies frequent buyers (5+ purchases)
   * Requirements: 5.1
   */
  private identifyFrequentBuyers(customers: any[]): CustomerSegment {
    const frequentBuyers = customers.filter(c => c.orderCount >= 5);
    const totalRevenue = this.aggregate(frequentBuyers.map(c => c.lifetimeValue), 'sum');
    const avgOrderValue = this.safeDivide(totalRevenue, 
      this.aggregate(frequentBuyers.map(c => c.orderCount), 'sum'), 0);
    const avgFrequency = this.safeDivide(
      this.aggregate(frequentBuyers.map(c => c.orderCount), 'sum'),
      frequentBuyers.length,
      0
    );
    
    return {
      type: 'frequent',
      count: frequentBuyers.length,
      percentage: this.roundToDecimal(this.safeDivide(frequentBuyers.length, customers.length, 0) * 100, 2),
      averageOrderValue: this.roundToDecimal(avgOrderValue, 2),
      totalRevenue: this.roundToDecimal(totalRevenue, 2),
      averagePurchaseFrequency: this.roundToDecimal(avgFrequency, 2)
    };
  }

  /**
   * Identifies high-value customers (top 20% by revenue)
   * Requirements: 5.1
   */
  private identifyHighValueCustomers(customers: any[]): CustomerSegment {
    if (customers.length === 0) {
      return {
        type: 'high-value',
        count: 0,
        percentage: 0,
        averageOrderValue: 0,
        totalRevenue: 0,
        averagePurchaseFrequency: 0
      };
    }

    // Sort by lifetime value and take top 20%
    const sortedCustomers = this.sortBy(customers, c => c.lifetimeValue, 'desc');
    const top20PercentCount = Math.max(1, Math.ceil(customers.length * 0.2));
    const highValueCustomers = sortedCustomers.slice(0, top20PercentCount);
    
    const totalRevenue = this.aggregate(highValueCustomers.map(c => c.lifetimeValue), 'sum');
    const avgOrderValue = this.safeDivide(totalRevenue, 
      this.aggregate(highValueCustomers.map(c => c.orderCount), 'sum'), 0);
    const avgFrequency = this.safeDivide(
      this.aggregate(highValueCustomers.map(c => c.orderCount), 'sum'),
      highValueCustomers.length,
      0
    );
    
    return {
      type: 'high-value',
      count: highValueCustomers.length,
      percentage: this.roundToDecimal(this.safeDivide(highValueCustomers.length, customers.length, 0) * 100, 2),
      averageOrderValue: this.roundToDecimal(avgOrderValue, 2),
      totalRevenue: this.roundToDecimal(totalRevenue, 2),
      averagePurchaseFrequency: this.roundToDecimal(avgFrequency, 2)
    };
  }

  /**
   * Gets customer orders for a specific vendor
   * OPTIMIZED: Using correct users_orders structure
   */
  private async getCustomerOrders(customerId: string, vendorId: string): Promise<any[]> {
    try {
      const userOrdersSnap = await getDocs(
        collection(db, 'staging_users_orders', customerId, 'user_orders')
      );

      const orders: any[] = [];

      userOrdersSnap.docs.forEach((orderDoc) => {
        const data = orderDoc.data();

        // Filter by vendor
        if (data.tailor_id === vendorId) {
          orders.push({
            id: orderDoc.id,
            ...data,
            timestamp: data.created_at instanceof Timestamp
              ? data.created_at.toDate()
              : data.created_at
              ? new Date(data.created_at)
              : new Date(),
            amount: data.price || 0
          });
        }
      });

      return orders;
    } catch (error) {
      this.log('error', 'Failed to fetch customer orders', { customerId, vendorId, error });
      return [];
    }
  }

  /**
   * Aggregates location data from customers
   * Requirements: 5.2
   */
  private aggregateLocationData(customers: any[]): LocationData[] {
    const locationMap = new Map<string, { customerCount: number; revenue: number }>();
    
    customers.forEach(customer => {
      const city = customer.city || 'Unknown';
      const state = customer.state || 'Unknown';
      const locationKey = `${city}, ${state}`;
      
      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, { customerCount: 0, revenue: 0 });
      }
      
      const location = locationMap.get(locationKey)!;
      location.customerCount += 1;
      location.revenue += customer.lifetimeValue || 0;
    });

    const totalRevenue = this.aggregate(customers.map(c => c.lifetimeValue || 0), 'sum');
    
    const locations: LocationData[] = Array.from(locationMap.entries()).map(([locationKey, data]) => {
      const [city, state] = locationKey.split(', ');
      return {
        city,
        state,
        country: 'Nigeria', // Default for now
        customerCount: data.customerCount,
        revenue: this.roundToDecimal(data.revenue, 2),
        percentage: this.roundToDecimal(this.safeDivide(data.revenue, totalRevenue, 0) * 100, 2)
      };
    });

    return this.sortBy(locations, l => l.revenue, 'desc');
  }
}
