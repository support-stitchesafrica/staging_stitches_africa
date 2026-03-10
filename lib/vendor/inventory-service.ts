/**
 * Inventory Service
 * Handles inventory alerts, forecasting, and stock management analytics
 */

import { BaseVendorService } from './base-service';
import {
  InventoryAlert,
  InventoryForecast,
  FulfillmentMetrics,
  ServiceResponse,
  TrendDataPoint
} from '@/types/vendor-analytics';
import { db } from '@/firebase';
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_PRODUCTS_PER_BATCH = 50; // Process products in batches

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ServiceCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const serviceCache = new ServiceCache();

export class InventoryService extends BaseVendorService {
  // Alert thresholds
  private readonly LOW_STOCK_DAYS_THRESHOLD = 7; // Days until stockout
  private readonly HIGH_RETURN_RATE_THRESHOLD = 0.15; // 15%
  private readonly CRITICAL_STOCK_THRESHOLD = 5; // Units
  private readonly FORECAST_DAYS = 30; // Days to forecast ahead
  private readonly SALES_HISTORY_DAYS = 90; // Days of history to analyze

  constructor() {
    super('InventoryService');
  }

  /**
   * Clears the service cache
   */
  clearCache(): void {
    serviceCache.clear();
    this.log('info', 'Service cache cleared');
  }

  /**
   * Generates inventory alerts based on stock levels and sales velocity
   * Optimized with caching and batch processing
   */
  async generateInventoryAlerts(vendorId: string): Promise<ServiceResponse<InventoryAlert[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const startTime = performance.now();
      
      // Check cache first
      const cacheKey = `inventory_alerts_${vendorId}`;
      const cached = serviceCache.get<InventoryAlert[]>(cacheKey);
      if (cached) {
        this.log('info', '📦 Using cached inventory alerts', { vendorId });
        return cached;
      }

      this.log('info', '🔄 Generating inventory alerts', { vendorId });

      const products = await this.getVendorProductsOptimized(vendorId);
      const alerts: InventoryAlert[] = [];

      // Process products in batches to avoid overwhelming the system
      const batches = this.batchArray(products, 10);
      
      for (const batch of batches) {
        const batchAlerts = await Promise.all(
          batch.map(async (product) => {
            const productAlerts: InventoryAlert[] = [];

            // Calculate sales velocity (cached)
            const salesVelocity = await this.calculateSalesVelocity(product.id);
            const daysUntilStockout = salesVelocity > 0 
              ? product.stock / salesVelocity 
              : Infinity;

            // Out of stock alert
            if (product.stock === 0) {
              productAlerts.push({
                productId: product.id,
                productName: product.title || product.name || 'Unknown Product',
                type: 'out_of_stock',
                severity: 'critical',
                currentStock: 0,
                message: 'Product is out of stock and not visible to customers',
                createdAt: new Date()
              });
            }
            // Low stock alert
            else if (daysUntilStockout < this.LOW_STOCK_DAYS_THRESHOLD) {
              const recommendedStock = Math.ceil(salesVelocity * this.FORECAST_DAYS);
              productAlerts.push({
                productId: product.id,
                productName: product.title || product.name || 'Unknown Product',
                type: 'low_stock',
                severity: product.stock <= this.CRITICAL_STOCK_THRESHOLD ? 'critical' : 'warning',
                currentStock: product.stock,
                recommendedStock,
                message: `Stock will run out in ${Math.floor(daysUntilStockout)} days. Recommended reorder: ${recommendedStock} units`,
                createdAt: new Date()
              });
            }

            // High return rate alert (cached)
            const returnRate = await this.calculateReturnRate(product.id);
            if (returnRate > this.HIGH_RETURN_RATE_THRESHOLD) {
              productAlerts.push({
                productId: product.id,
                productName: product.title || product.name || 'Unknown Product',
                type: 'high_return_rate',
                severity: 'warning',
                message: `High return rate (${(returnRate * 100).toFixed(1)}%) - review product quality and description`,
                createdAt: new Date()
              });
            }

            // Slow fulfillment alert (cached)
            const fulfillmentMetrics = await this.getFulfillmentMetrics(product.id, vendorId);
            if (fulfillmentMetrics.fulfillmentScore < 0.6) {
              productAlerts.push({
                productId: product.id,
                productName: product.title || product.name || 'Unknown Product',
                type: 'slow_fulfillment',
                severity: 'warning',
                message: `Average fulfillment time is ${this.roundToDecimal(fulfillmentMetrics.averageFulfillmentTime / 24, 1)} days - consider optimizing your process`,
                createdAt: new Date()
              });
            }

            return productAlerts;
          })
        );

        // Flatten batch results
        alerts.push(...batchAlerts.flat());
      }

      const endTime = performance.now();
      this.log('info', `✅ Generated ${alerts.length} alerts in ${(endTime - startTime).toFixed(0)}ms`, { 
        vendorId, 
        alertCount: alerts.length 
      });

      // Cache the results
      serviceCache.set(cacheKey, alerts);

      return alerts;
    }, 'generateInventoryAlerts');
  }

  /**
   * Calculates sales velocity (units per day)
   * Optimized with caching
   */
  async calculateSalesVelocity(productId: string): Promise<number> {
    try {
      // Check cache first
      const cacheKey = `sales_velocity_${productId}`;
      const cached = serviceCache.get<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - this.SALES_HISTORY_DAYS);

      // Optimized query with limit
      const ordersQuery = query(
        collectionGroup(db, 'user_orders'),
        where('product_id', '==', productId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        where('order_status', 'in', ['completed', 'delivered', 'paid', 'processing']),
        firestoreLimit(1000) // Limit to prevent excessive reads
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        serviceCache.set(cacheKey, 0);
        return 0;
      }

      // Calculate total quantity sold
      let totalQuantity = 0;
      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalQuantity += data.quantity || 1;
      });

      // Calculate velocity (units per day)
      const velocity = totalQuantity / this.SALES_HISTORY_DAYS;
      const result = this.roundToDecimal(velocity, 4);
      
      // Cache the result
      serviceCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      this.log('warn', 'Failed to calculate sales velocity', { productId, error });
      return 0;
    }
  }

  /**
   * Forecasts inventory needs based on historical sales
   */
  async forecastInventory(
    productId: string,
    daysAhead: number = this.FORECAST_DAYS
  ): Promise<ServiceResponse<InventoryForecast>> {
    return this.executeWithErrorHandling(async () => {
      this.validateRequired({ productId });

      // Get product details
      const product = await this.getProductDetails(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Get sales history
      const salesHistory = await this.getSalesHistory(productId, this.SALES_HISTORY_DAYS);
      
      if (salesHistory.length === 0) {
        // No sales history - return conservative forecast
        return {
          productId,
          productName: product.title || product.name || 'Unknown Product',
          currentStock: product.stock || 0,
          averageDailySales: 0,
          daysUntilStockout: Infinity,
          recommendedReorderQuantity: 10, // Default minimum
          seasonalityFactor: 1.0
        };
      }

      // Calculate average daily sales
      const totalSales = salesHistory.reduce((sum, day) => sum + day.value, 0);
      const averageDailySales = totalSales / salesHistory.length;

      // Calculate seasonality factor
      const seasonalityFactor = this.calculateSeasonality(salesHistory);

      // Forecast demand
      const forecastedDailySales = averageDailySales * seasonalityFactor;
      const recommendedReorderQuantity = Math.ceil(forecastedDailySales * daysAhead);

      // Calculate days until stockout
      const currentStock = product.stock || 0;
      const daysUntilStockout = forecastedDailySales > 0
        ? currentStock / forecastedDailySales
        : Infinity;

      return {
        productId,
        productName: product.title || product.name || 'Unknown Product',
        currentStock,
        averageDailySales: this.roundToDecimal(averageDailySales, 2),
        daysUntilStockout: this.roundToDecimal(daysUntilStockout, 1),
        recommendedReorderQuantity,
        seasonalityFactor: this.roundToDecimal(seasonalityFactor, 2)
      };
    }, 'forecastInventory');
  }

  /**
   * Calculates return rate for a product
   * Optimized with caching
   */
  async calculateReturnRate(productId: string): Promise<number> {
    try {
      // Check cache first
      const cacheKey = `return_rate_${productId}`;
      const cached = serviceCache.get<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Query returns for this product (with limit)
      const returnsQuery = query(
        collection(db, "staging_returns"),
        where('product_id', '==', productId),
        firestoreLimit(500)
      );

      const returnsSnapshot = await getDocs(returnsQuery);
      const returnCount = returnsSnapshot.size;

      // Query total orders for this product (with limit)
      const ordersQuery = query(
        collectionGroup(db, 'user_orders'),
        where('product_id', '==', productId),
        where('order_status', 'in', ['completed', 'delivered']),
        firestoreLimit(500)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orderCount = ordersSnapshot.size;

      if (orderCount === 0) {
        serviceCache.set(cacheKey, 0);
        return 0;
      }

      const returnRate = this.safeDivide(returnCount, orderCount, 0);
      const result = this.roundToDecimal(returnRate, 4);
      
      // Cache the result
      serviceCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      this.log('warn', 'Failed to calculate return rate', { productId, error });
      return 0;
    }
  }

  /**
   * Gets fulfillment metrics for a product
   */
  async getFulfillmentMetrics(
    productId: string,
    vendorId: string
  ): Promise<FulfillmentMetrics> {
    try {
      // Query delivered orders for this product
      const ordersQuery = query(
        collectionGroup(db, 'user_orders'),
        where('product_id', '==', productId),
        where('tailor_id', '==', vendorId),
        where('order_status', '==', 'delivered')
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        return {
          averageFulfillmentTime: 0,
          onTimeDeliveryRate: 0,
          fulfillmentScore: 0,
          delayedOrders: 0,
          fastestFulfillment: 0,
          slowestFulfillment: 0
        };
      }

      const fulfillmentTimes: number[] = [];
      let onTimeCount = 0;
      let delayedCount = 0;
      const expectedFulfillmentHours = 7 * 24; // 7 days in hours

      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderDate = this.parseDate(data.timestamp || data.created_at);
        const deliveryDate = data.delivery_date ? this.parseDate(data.delivery_date) : null;
        
        if (deliveryDate) {
          const diffMs = deliveryDate.getTime() - orderDate.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          
          if (diffHours > 0) {
            fulfillmentTimes.push(diffHours);
            
            if (diffHours <= expectedFulfillmentHours) {
              onTimeCount++;
            } else {
              delayedCount++;
            }
          }
        }
      });

      if (fulfillmentTimes.length === 0) {
        return {
          averageFulfillmentTime: 0,
          onTimeDeliveryRate: 0,
          fulfillmentScore: 0,
          delayedOrders: 0,
          fastestFulfillment: 0,
          slowestFulfillment: 0
        };
      }

      const averageFulfillmentTime = this.aggregate(fulfillmentTimes, 'avg');
      const onTimeDeliveryRate = this.safeDivide(onTimeCount, fulfillmentTimes.length, 0);
      
      // Calculate fulfillment score (0-1)
      // Based on average time and on-time rate
      const timeScore = Math.max(0, 1 - (averageFulfillmentTime / (expectedFulfillmentHours * 2)));
      const fulfillmentScore = (timeScore * 0.5) + (onTimeDeliveryRate * 0.5);

      return {
        averageFulfillmentTime: this.roundToDecimal(averageFulfillmentTime, 2),
        onTimeDeliveryRate: this.roundToDecimal(onTimeDeliveryRate * 100, 2),
        fulfillmentScore: this.roundToDecimal(fulfillmentScore, 2),
        delayedOrders: delayedCount,
        fastestFulfillment: this.roundToDecimal(this.aggregate(fulfillmentTimes, 'min'), 2),
        slowestFulfillment: this.roundToDecimal(this.aggregate(fulfillmentTimes, 'max'), 2)
      };
    } catch (error) {
      this.log('warn', 'Failed to get fulfillment metrics', { productId, error });
      return {
        averageFulfillmentTime: 0,
        onTimeDeliveryRate: 0,
        fulfillmentScore: 0,
        delayedOrders: 0,
        fastestFulfillment: 0,
        slowestFulfillment: 0
      };
    }
  }

  /**
   * Gets all inventory alerts for a vendor
   */
  async getVendorInventoryAlerts(vendorId: string): Promise<ServiceResponse<InventoryAlert[]>> {
    return this.generateInventoryAlerts(vendorId);
  }

  /**
   * Gets inventory forecast for all vendor products
   */
  async getVendorInventoryForecasts(
    vendorId: string,
    daysAhead: number = this.FORECAST_DAYS
  ): Promise<ServiceResponse<InventoryForecast[]>> {
    return this.executeWithErrorHandling(async () => {
      this.validateVendorId(vendorId);

      const products = await this.getVendorProducts(vendorId);
      const forecasts: InventoryForecast[] = [];

      for (const product of products) {
        const forecastResponse = await this.forecastInventory(product.id, daysAhead);
        if (forecastResponse.success && forecastResponse.data) {
          forecasts.push(forecastResponse.data);
        }
      }

      // Sort by days until stockout (most urgent first)
      return forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
    }, 'getVendorInventoryForecasts');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Gets all products for a vendor (legacy method)
   */
  private async getVendorProducts(vendorId: string): Promise<any[]> {
    return this.getVendorProductsOptimized(vendorId);
  }

  /**
   * Gets all products for a vendor with optimized caching
   */
  private async getVendorProductsOptimized(vendorId: string): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = `vendor_products_${vendorId}`;
      const cached = serviceCache.get<any[]>(cacheKey);
      if (cached) {
        this.log('info', '📦 Using cached vendor products', { vendorId, count: cached.length });
        return cached;
      }

      this.log('info', '🔄 Fetching vendor products from Firestore', { vendorId });
      const startTime = performance.now();

      // Optimized query - only fetch necessary fields
      const productsQuery = query(
        collection(db, "staging_tailor_works"),
        where('tailor_id', '==', vendorId),
        firestoreLimit(MAX_PRODUCTS_PER_BATCH)
      );

      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        name: doc.data().name,
        stock: doc.data().stock || 0,
        // Only include essential fields for performance
      }));

      const endTime = performance.now();
      this.log('info', `✅ Fetched ${products.length} products in ${(endTime - startTime).toFixed(0)}ms`, { 
        vendorId 
      });

      // Cache the results
      serviceCache.set(cacheKey, products);

      return products;
    } catch (error) {
      this.log('error', 'Failed to fetch vendor products', { vendorId, error });
      return [];
    }
  }

  /**
   * Gets product details
   */
  private async getProductDetails(productId: string): Promise<any> {
    try {
      const productDoc = await getDoc(doc(db, "staging_tailor_works", productId));
      return productDoc.exists() ? { id: productDoc.id, ...productDoc.data() } : null;
    } catch (error) {
      this.log('warn', 'Failed to get product details', { productId, error });
      return null;
    }
  }

  /**
   * Gets sales history for a product
   * Optimized with caching and query limits
   */
  private async getSalesHistory(
    productId: string,
    days: number
  ): Promise<TrendDataPoint[]> {
    try {
      // Check cache first
      const cacheKey = `sales_history_${productId}_${days}`;
      const cached = serviceCache.get<TrendDataPoint[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Optimized query with limit
      const ordersQuery = query(
        collectionGroup(db, 'user_orders'),
        where('product_id', '==', productId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        where('order_status', 'in', ['completed', 'delivered', 'paid', 'processing']),
        firestoreLimit(1000) // Limit to prevent excessive reads
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Group orders by day
      const dayMap = new Map<string, number>();
      
      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderDate = this.parseDate(data.timestamp || data.created_at);
        const dayKey = orderDate.toISOString().split('T')[0];
        const quantity = data.quantity || 1;
        
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + quantity);
      });

      // Convert to trend data points
      const trendData: TrendDataPoint[] = Array.from(dayMap.entries()).map(([dateStr, value]) => ({
        date: new Date(dateStr),
        value,
        label: dateStr
      }));

      const result = this.sortBy(trendData, t => t.date.getTime(), 'asc');
      
      // Cache the result
      serviceCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      this.log('warn', 'Failed to get sales history', { productId, error });
      return [];
    }
  }

  /**
   * Calculates seasonality factor from sales history
   */
  private calculateSeasonality(salesHistory: TrendDataPoint[]): number {
    if (salesHistory.length < 14) {
      return 1.0; // Not enough data for seasonality analysis
    }

    // Compare recent sales (last 7 days) to overall average
    const recentSales = salesHistory.slice(-7);
    const recentAverage = this.aggregate(recentSales.map(d => d.value), 'avg');
    const overallAverage = this.aggregate(salesHistory.map(d => d.value), 'avg');

    if (overallAverage === 0) {
      return 1.0;
    }

    // Calculate seasonality factor
    const factor = this.safeDivide(recentAverage, overallAverage, 1.0);
    
    // Clamp between 0.5 and 2.0 to avoid extreme forecasts
    return this.clamp(factor, 0.5, 2.0);
  }
}
