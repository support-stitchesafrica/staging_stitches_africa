/**
 * Bundling Insights Service
 * 
 * Provides product bundling analysis including:
 * - Frequently bought together analysis
 * - Product bundle suggestions
 * - Average items per order
 * - Cross-sell conversion rates
 * - Complementary product relationships
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { adminDb as db } from '@/lib/firebase-admin';
import {
  BundlingInsight,
  ProductPair,
  SuggestedBundle,
  ServiceResponse,
  ServiceError
} from '@/types/vendor-analytics';

export class BundlingInsightsService {
  /**
   * Gets comprehensive bundling insights for a vendor's products
   * Requirement 18.1, 18.2, 18.3, 18.4, 18.5
   */
  async getBundlingInsights(
    vendorId: string,
    productId?: string
  ): Promise<ServiceResponse<BundlingInsight[]>> {
    try {
      if (productId) {
        const insight = await this.getProductBundlingInsight(vendorId, productId);
        return {
          success: true,
          data: insight ? [insight] : [],
          timestamp: new Date()
        };
      }

      // Get insights for all vendor products
      const productsSnapshot = await db
        .collection('tailor_works')
        .where('tailor_id', '==', vendorId)
        .get();

      const insights: BundlingInsight[] = [];

      for (const productDoc of productsSnapshot.docs) {
        const insight = await this.getProductBundlingInsight(vendorId, productDoc.id);
        if (insight) {
          insights.push(insight);
        }
      }

      return {
        success: true,
        data: insights,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BUNDLING_INSIGHTS_ERROR',
          message: 'Failed to retrieve bundling insights',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Gets bundling insight for a specific product
   * Analyzes purchase patterns to identify bundling opportunities
   */
  private async getProductBundlingInsight(
    vendorId: string,
    productId: string
  ): Promise<BundlingInsight | null> {
    try {
      const product = await db.collection("staging_tailor_works").doc(productId).get();
      if (!product.exists || (product.data()?.tailor_id !== vendorId && product.data()?.tailorId !== vendorId)) {
        return null;
      }

      const [frequentlyBoughtWith, averageItems, crossSellRate, suggestedBundles] = 
        await Promise.all([
          this.findFrequentlyBoughtTogether(vendorId, productId),
          this.calculateAverageItemsPerOrder(vendorId, productId),
          this.calculateCrossSellConversionRate(vendorId, productId),
          this.generateSuggestedBundles(vendorId, productId)
        ]);

      return {
        productId,
        productName: product.data()?.name || 'Unknown Product',
        frequentlyBoughtWith,
        averageItemsPerOrder: averageItems,
        crossSellConversionRate: crossSellRate,
        suggestedBundles
      };
    } catch (error) {
      console.error(`Error getting bundling insight for product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Identifies products frequently bought together
   * Requirement 18.1: Identify frequently bought together product combinations
   */
  private async findFrequentlyBoughtTogether(
    vendorId: string,
    productId: string
  ): Promise<ProductPair[]> {
    try {
      // Get all orders containing this product
      const ordersSnapshot = await db
        .collection('orders')
        .where('vendorId', '==', vendorId)
        .where('status', '==', 'completed')
        .get();

      // Track co-occurrence of products
      const coOccurrence = new Map<string, { count: number; revenue: number; name: string }>();

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const items = orderData.items || [];
        
        // Check if this order contains our target product
        const hasTargetProduct = items.some((item: any) => item.productId === productId);
        
        if (hasTargetProduct) {
          // Count other products in the same order
          for (const item of items) {
            if (item.productId !== productId) {
              const existing = coOccurrence.get(item.productId) || { 
                count: 0, 
                revenue: 0,
                name: item.productName || 'Unknown'
              };
              coOccurrence.set(item.productId, {
                count: existing.count + 1,
                revenue: existing.revenue + (item.price * item.quantity),
                name: item.productName || existing.name
              });
            }
          }
        }
      }

      // Convert to ProductPair array and sort by frequency
      const pairs: ProductPair[] = Array.from(coOccurrence.entries())
        .map(([id, data]) => ({
          productId: id,
          productName: data.name,
          frequency: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10); // Top 10 most frequently bought together

      return pairs;
    } catch (error) {
      console.error('Error finding frequently bought together:', error);
      return [];
    }
  }

  /**
   * Calculates average items per order for orders containing this product
   * Requirement 18.3: Show average items per order
   */
  private async calculateAverageItemsPerOrder(
    vendorId: string,
    productId: string
  ): Promise<number> {
    try {
      const ordersSnapshot = await db
        .collection('orders')
        .where('vendorId', '==', vendorId)
        .where('status', '==', 'completed')
        .get();

      let totalItems = 0;
      let orderCount = 0;

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const items = orderData.items || [];
        
        // Check if this order contains our target product
        const hasTargetProduct = items.some((item: any) => item.productId === productId);
        
        if (hasTargetProduct) {
          // Count total items in this order
          const itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          totalItems += itemCount;
          orderCount++;
        }
      }

      return orderCount > 0 ? totalItems / orderCount : 0;
    } catch (error) {
      console.error('Error calculating average items per order:', error);
      return 0;
    }
  }

  /**
   * Calculates cross-sell conversion rate
   * Requirement 18.4: Display cross-sell conversion rates
   * 
   * Cross-sell conversion rate = (Orders with multiple items / Total orders) * 100
   */
  private async calculateCrossSellConversionRate(
    vendorId: string,
    productId: string
  ): Promise<number> {
    try {
      const ordersSnapshot = await db
        .collection('orders')
        .where('vendorId', '==', vendorId)
        .where('status', '==', 'completed')
        .get();

      let ordersWithProduct = 0;
      let ordersWithMultipleItems = 0;

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const items = orderData.items || [];
        
        // Check if this order contains our target product
        const hasTargetProduct = items.some((item: any) => item.productId === productId);
        
        if (hasTargetProduct) {
          ordersWithProduct++;
          
          // Check if order has multiple distinct products
          const uniqueProducts = new Set(items.map((item: any) => item.productId));
          if (uniqueProducts.size > 1) {
            ordersWithMultipleItems++;
          }
        }
      }

      return ordersWithProduct > 0 
        ? (ordersWithMultipleItems / ordersWithProduct) * 100 
        : 0;
    } catch (error) {
      console.error('Error calculating cross-sell conversion rate:', error);
      return 0;
    }
  }

  /**
   * Generates suggested product bundles based on purchase patterns
   * Requirement 18.2: Suggest potential product bundles
   * Requirement 18.5: Highlight complementary product relationships
   */
  private async generateSuggestedBundles(
    vendorId: string,
    productId: string
  ): Promise<SuggestedBundle[]> {
    try {
      // Get frequently bought together products
      const frequentPairs = await this.findFrequentlyBoughtTogether(vendorId, productId);
      
      if (frequentPairs.length === 0) {
        return [];
      }

      const bundles: SuggestedBundle[] = [];

      // Create 2-product bundles with the most frequent pairs
      for (let i = 0; i < Math.min(3, frequentPairs.length); i++) {
        const pair = frequentPairs[i];
        
        // Calculate confidence based on frequency
        const confidence = Math.min(pair.frequency / 10, 1); // Normalize to 0-1
        
        bundles.push({
          products: [productId, pair.productId],
          estimatedRevenue: pair.revenue,
          confidence: confidence * 100 // Convert to percentage
        });
      }

      // Create 3-product bundles by combining top pairs
      if (frequentPairs.length >= 2) {
        const topTwo = frequentPairs.slice(0, 2);
        const combinedRevenue = topTwo.reduce((sum, p) => sum + p.revenue, 0);
        const avgFrequency = topTwo.reduce((sum, p) => sum + p.frequency, 0) / 2;
        const confidence = Math.min(avgFrequency / 10, 1);

        bundles.push({
          products: [productId, topTwo[0].productId, topTwo[1].productId],
          estimatedRevenue: combinedRevenue,
          confidence: confidence * 80 // Slightly lower confidence for 3-product bundles
        });
      }

      return bundles.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating suggested bundles:', error);
      return [];
    }
  }

  /**
   * Gets complementary product relationships for the entire store
   * Requirement 18.5: Highlight complementary product relationships
   */
  async getComplementaryProducts(
    vendorId: string
  ): Promise<ServiceResponse<Map<string, ProductPair[]>>> {
    try {
      const productsSnapshot = await db
        .collection('tailor_works')
        .where('tailor_id', '==', vendorId)
        .get();

      const complementaryMap = new Map<string, ProductPair[]>();

      for (const productDoc of productsSnapshot.docs) {
        const pairs = await this.findFrequentlyBoughtTogether(vendorId, productDoc.id);
        if (pairs.length > 0) {
          complementaryMap.set(productDoc.id, pairs);
        }
      }

      return {
        success: true,
        data: complementaryMap,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPLEMENTARY_PRODUCTS_ERROR',
          message: 'Failed to retrieve complementary products',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Gets overall bundling statistics for the vendor
   */
  async getOverallBundlingStats(
    vendorId: string
  ): Promise<ServiceResponse<{
    averageItemsPerOrder: number;
    overallCrossSellRate: number;
    topBundleOpportunities: SuggestedBundle[];
  }>> {
    try {
      // Get all completed orders for this vendor
      const ordersSnapshot = await db
        .collection('orders')
        .where('vendorId', '==', vendorId)
        .where('status', '==', 'completed')
        .get();

      let totalItems = 0;
      let ordersWithMultipleItems = 0;
      const totalOrders = ordersSnapshot.size;

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        const items = orderData.items || [];
        
        const itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        totalItems += itemCount;
        
        const uniqueProducts = new Set(items.map((item: any) => item.productId));
        if (uniqueProducts.size > 1) {
          ordersWithMultipleItems++;
        }
      }

      const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;
      const overallCrossSellRate = totalOrders > 0 
        ? (ordersWithMultipleItems / totalOrders) * 100 
        : 0;

      // Get top bundle opportunities across all products
      const insights = await this.getBundlingInsights(vendorId);
      const allBundles: SuggestedBundle[] = [];
      
      if (insights.success && insights.data) {
        for (const insight of insights.data) {
          allBundles.push(...insight.suggestedBundles);
        }
      }

      const topBundleOpportunities = allBundles
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

      return {
        success: true,
        data: {
          averageItemsPerOrder,
          overallCrossSellRate,
          topBundleOpportunities
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BUNDLING_STATS_ERROR',
          message: 'Failed to retrieve bundling statistics',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }
}

// Export singleton instance
export const bundlingInsightsService = new BundlingInsightsService();
