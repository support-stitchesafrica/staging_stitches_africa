/**
 * Recommendations Service
 * Generates actionable recommendations for vendors to improve store performance
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { adminDb as db } from '@/lib/firebase-admin';
import { 
  StoreSuggestion, 
  RankingFactors, 
  ProductAnalytics,
  OrderMetrics,
  SalesMetrics,
  VendorAnalytics 
} from '@/types/vendor-analytics';

export interface ProductRecommendation {
  productId: string;
  productName: string;
  type: 'pricing' | 'images' | 'description' | 'fulfillment' | 'stock' | 'quality';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionUrl: string;
  metrics?: {
    currentValue: number;
    targetValue: number;
    potentialImpact: string;
  };
}

export interface TrendingOpportunity {
  type: 'category' | 'product_type' | 'demand_pattern' | 'seasonal';
  category?: string;
  title: string;
  description: string;
  metrics: {
    growthRate: number;
    demandIncrease: number;
    competitorCount: number;
  };
  actionUrl?: string;
}

export interface FulfillmentRecommendation {
  type: 'process' | 'speed' | 'quality' | 'communication';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentMetric: number;
  targetMetric: number;
  impact: string;
}

export class RecommendationsService {
  /**
   * Generates comprehensive recommendations for a vendor
   * Validates: Requirements 14.1
   */
  async generateVendorRecommendations(
    vendorId: string,
    analytics: VendorAnalytics
  ): Promise<{
    productRecommendations: ProductRecommendation[];
    storeRecommendations: StoreSuggestion[];
    fulfillmentRecommendations: FulfillmentRecommendation[];
    trendingOpportunities: TrendingOpportunity[];
  }> {
    const [
      productRecommendations,
      storeRecommendations,
      fulfillmentRecommendations,
      trendingOpportunities
    ] = await Promise.all([
      this.generateProductRecommendations(vendorId, analytics),
      this.generateStoreRecommendations(vendorId, analytics),
      this.generateFulfillmentRecommendations(vendorId, analytics.orders),
      this.identifyTrendingOpportunities(vendorId, analytics)
    ]);

    return {
      productRecommendations,
      storeRecommendations,
      fulfillmentRecommendations,
      trendingOpportunities
    };
  }

  /**
   * Generates recommendations for underperforming products
   * Validates: Requirements 14.2
   */
  async generateProductRecommendations(
    vendorId: string,
    analytics: VendorAnalytics
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    // Get all products with analytics
    const productsSnapshot = await db
      .collection('product_analytics')
      .where('vendorId', '==', vendorId)
      .orderBy('conversionRate', 'asc')
      .limit(20)
      .get();

    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();
      const productId = productData.productId;

      // Get product details
      const productDoc = await db.collection("staging_tailor_works").doc(productId).get();
      if (!productDoc.exists) continue;

      const product = productDoc.data();
      const productName = product?.name || 'Unknown Product';

      // Pricing recommendations
      if (productData.conversionRate < 0.03 && productData.views > 50) {
        recommendations.push({
          productId,
          productName,
          type: 'pricing',
          priority: 'high',
          title: 'Review Pricing Strategy',
          description: `${productName} has high views but low conversion (${(productData.conversionRate * 100).toFixed(1)}%). Consider adjusting pricing or highlighting value proposition.`,
          impact: 'Could increase conversions by 30-50%',
          actionUrl: `/vendor/products/${productId}/analytics`,
          metrics: {
            currentValue: productData.conversionRate * 100,
            targetValue: 5,
            potentialImpact: '+30-50% conversions'
          }
        });
      }

      // Image recommendations
      if (productData.ctr < 0.02 && productData.impressions > 100) {
        recommendations.push({
          productId,
          productName,
          type: 'images',
          priority: 'high',
          title: 'Improve Product Images',
          description: `${productName} has low click-through rate (${(productData.ctr * 100).toFixed(2)}%). Add high-quality images from multiple angles to attract more clicks.`,
          impact: 'Could increase CTR by 50-100%',
          actionUrl: `/vendor/products/${productId}/edit`,
          metrics: {
            currentValue: productData.ctr * 100,
            targetValue: 3,
            potentialImpact: '+50-100% CTR'
          }
        });
      }

      // Description recommendations
      if (productData.addToCartRate > 0.1 && productData.conversionRate < 0.05) {
        recommendations.push({
          productId,
          productName,
          type: 'description',
          priority: 'medium',
          title: 'Enhance Product Description',
          description: `${productName} has good add-to-cart rate but low purchase rate. Add detailed specifications, sizing info, and customer reviews to build confidence.`,
          impact: 'Could increase conversions by 20-40%',
          actionUrl: `/vendor/products/${productId}/edit`,
          metrics: {
            currentValue: productData.conversionRate * 100,
            targetValue: 5,
            potentialImpact: '+20-40% conversions'
          }
        });
      }

      // Stock recommendations
      if (product?.stock < 5 && productData.salesVelocity > 1) {
        recommendations.push({
          productId,
          productName,
          type: 'stock',
          priority: 'high',
          title: 'Restock Product',
          description: `${productName} is selling well but has low stock (${product.stock} units). Restock to avoid losing sales and ranking penalties.`,
          impact: 'Prevent lost sales and ranking drops',
          actionUrl: `/vendor/inventory`,
          metrics: {
            currentValue: product.stock,
            targetValue: Math.ceil(productData.salesVelocity * 30),
            potentialImpact: 'Prevent stockouts'
          }
        });
      }

      // Quality recommendations
      if (productData.returnRate > 0.15) {
        recommendations.push({
          productId,
          productName,
          type: 'quality',
          priority: 'high',
          title: 'Address Quality Issues',
          description: `${productName} has high return rate (${(productData.returnRate * 100).toFixed(1)}%). Review customer feedback and improve product quality or description accuracy.`,
          impact: 'Reduce returns and improve ratings',
          actionUrl: `/vendor/products/${productId}/analytics`,
          metrics: {
            currentValue: productData.returnRate * 100,
            targetValue: 10,
            potentialImpact: 'Reduce returns by 30%'
          }
        });
      }
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generates store-level recommendations
   * Validates: Requirements 14.1, 14.4
   */
  async generateStoreRecommendations(
    vendorId: string,
    analytics: VendorAnalytics
  ): Promise<StoreSuggestion[]> {
    const suggestions: StoreSuggestion[] = [];

    // Cancellation rate recommendations
    if (analytics.orders.cancellationRate > 0.15) {
      suggestions.push({
        type: 'cancellation',
        priority: 'high',
        title: 'Reduce Order Cancellations',
        description: `Your cancellation rate is ${(analytics.orders.cancellationRate * 100).toFixed(1)}%, which is above the healthy threshold of 15%. Review cancellation reasons and address common issues.`,
        impact: 'Improve store ranking and customer trust',
        actionUrl: '/vendor/analytics/orders'
      });
    }

    // Fulfillment speed recommendations
    if (analytics.orders.averageFulfillmentTime > 72) {
      suggestions.push({
        type: 'fulfillment',
        priority: 'high',
        title: 'Improve Fulfillment Speed',
        description: `Average fulfillment time is ${Math.round(analytics.orders.averageFulfillmentTime)} hours. Faster fulfillment improves rankings and customer satisfaction.`,
        impact: 'Boost ranking by 10-15%',
        actionUrl: '/vendor/analytics/orders'
      });
    }

    // Stock management recommendations
    if (analytics.products.lowStock > 5) {
      suggestions.push({
        type: 'stock',
        priority: 'medium',
        title: 'Manage Inventory Levels',
        description: `${analytics.products.lowStock} products are running low on stock. Maintain adequate inventory to avoid visibility penalties.`,
        impact: 'Prevent ranking drops and lost sales',
        actionUrl: '/vendor/inventory/alerts'
      });
    }

    // Image quality recommendations
    const productsNeedingImages = await this.countProductsNeedingImages(vendorId);
    if (productsNeedingImages > 0) {
      suggestions.push({
        type: 'images',
        priority: 'medium',
        title: 'Improve Product Images',
        description: `${productsNeedingImages} products have low-quality or insufficient images. High-quality images increase click-through rates by 50-100%.`,
        impact: 'Increase product visibility and sales',
        actionUrl: '/vendor/products'
      });
    }

    // Pricing competitiveness
    const overpricedProducts = await this.countOverpricedProducts(vendorId);
    if (overpricedProducts > 3) {
      suggestions.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Review Pricing Strategy',
        description: `${overpricedProducts} products may be priced above market average. Review competitor pricing to stay competitive.`,
        impact: 'Improve conversion rates',
        actionUrl: '/vendor/products'
      });
    }

    // Description quality
    const productsNeedingDescriptions = await this.countProductsNeedingDescriptions(vendorId);
    if (productsNeedingDescriptions > 0) {
      suggestions.push({
        type: 'description',
        priority: 'low',
        title: 'Enhance Product Descriptions',
        description: `${productsNeedingDescriptions} products have short or incomplete descriptions. Detailed descriptions build customer confidence and improve conversions.`,
        impact: 'Increase conversion rates by 15-25%',
        actionUrl: '/vendor/products'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generates fulfillment process improvement recommendations
   * Validates: Requirements 14.3
   */
  async generateFulfillmentRecommendations(
    vendorId: string,
    orderMetrics: OrderMetrics
  ): Promise<FulfillmentRecommendation[]> {
    const recommendations: FulfillmentRecommendation[] = [];

    // Processing speed recommendations
    if (orderMetrics.averageFulfillmentTime > 72) {
      recommendations.push({
        type: 'speed',
        priority: 'high',
        title: 'Reduce Order Processing Time',
        description: 'Your average fulfillment time exceeds 3 days. Consider streamlining your order processing workflow, preparing popular items in advance, or using faster shipping methods.',
        currentMetric: orderMetrics.averageFulfillmentTime,
        targetMetric: 48,
        impact: 'Improve ranking by 10-15% and customer satisfaction'
      });
    }

    // Quality recommendations based on returns
    if (orderMetrics.returnRate > 0.10) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Improve Order Accuracy and Quality',
        description: `Return rate of ${(orderMetrics.returnRate * 100).toFixed(1)}% suggests quality or accuracy issues. Double-check orders before shipping and ensure product descriptions match actual items.`,
        currentMetric: orderMetrics.returnRate * 100,
        targetMetric: 8,
        impact: 'Reduce returns and improve customer trust'
      });
    }

    // Communication recommendations
    if (orderMetrics.complaintRate > 0.05) {
      recommendations.push({
        type: 'communication',
        priority: 'medium',
        title: 'Enhance Customer Communication',
        description: 'Proactive communication reduces complaints. Send order confirmations, shipping updates, and delivery notifications to keep customers informed.',
        currentMetric: orderMetrics.complaintRate * 100,
        targetMetric: 3,
        impact: 'Reduce complaints by 40-50%'
      });
    }

    // Process optimization
    if (orderMetrics.abandonedCheckouts > orderMetrics.totalOrders * 0.3) {
      recommendations.push({
        type: 'process',
        priority: 'medium',
        title: 'Optimize Checkout Experience',
        description: 'High cart abandonment suggests checkout friction. Ensure clear shipping costs, multiple payment options, and simple checkout flow.',
        currentMetric: (orderMetrics.abandonedCheckouts / (orderMetrics.totalOrders + orderMetrics.abandonedCheckouts)) * 100,
        targetMetric: 20,
        impact: 'Recover 10-20% of abandoned carts'
      });
    }

    return recommendations;
  }

  /**
   * Identifies trending categories and demand patterns
   * Validates: Requirements 14.5
   */
  async identifyTrendingOpportunities(
    vendorId: string,
    analytics: VendorAnalytics
  ): Promise<TrendingOpportunity[]> {
    const opportunities: TrendingOpportunity[] = [];

    // Get marketplace-wide trending categories
    const trendingCategories = await this.getTrendingCategories();

    // Check if vendor has products in trending categories
    const vendorCategories = await this.getVendorCategories(vendorId);

    for (const trending of trendingCategories) {
      const hasProducts = vendorCategories.includes(trending.category);

      if (!hasProducts && trending.growthRate > 0.3) {
        opportunities.push({
          type: 'category',
          category: trending.category,
          title: `Expand into ${trending.category}`,
          description: `${trending.category} is growing rapidly with ${(trending.growthRate * 100).toFixed(0)}% increase in demand. Consider adding products in this category.`,
          metrics: {
            growthRate: trending.growthRate,
            demandIncrease: trending.demandIncrease,
            competitorCount: trending.competitorCount
          },
          actionUrl: '/vendor/products/create'
        });
      } else if (hasProducts && trending.growthRate > 0.2) {
        opportunities.push({
          type: 'category',
          category: trending.category,
          title: `Capitalize on ${trending.category} Growth`,
          description: `Your ${trending.category} products are in a growing market (+${(trending.growthRate * 100).toFixed(0)}%). Consider expanding your inventory in this category.`,
          metrics: {
            growthRate: trending.growthRate,
            demandIncrease: trending.demandIncrease,
            competitorCount: trending.competitorCount
          },
          actionUrl: '/vendor/products'
        });
      }
    }

    // Identify seasonal opportunities
    const seasonalOpportunities = await this.identifySeasonalOpportunities(vendorId);
    opportunities.push(...seasonalOpportunities);

    // Identify demand patterns
    const demandPatterns = await this.identifyDemandPatterns(vendorId, analytics);
    opportunities.push(...demandPatterns);

    return opportunities;
  }

  /**
   * Gets trending categories from marketplace data
   */
  private async getTrendingCategories(): Promise<Array<{
    category: string;
    growthRate: number;
    demandIncrease: number;
    competitorCount: number;
  }>> {
    // Get category performance from last 30 days vs previous 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentSnapshot = await db
      .collection('orders')
      .where('createdAt', '>=', thirtyDaysAgo)
      .where('status', '==', 'completed')
      .get();

    const previousSnapshot = await db
      .collection('orders')
      .where('createdAt', '>=', sixtyDaysAgo)
      .where('createdAt', '<', thirtyDaysAgo)
      .where('status', '==', 'completed')
      .get();

    // Aggregate by category
    const recentByCategory: Record<string, number> = {};
    const previousByCategory: Record<string, number> = {};

    for (const doc of recentSnapshot.docs) {
      const order = doc.data();
      for (const item of order.items || []) {
        const category = item.category || 'Other';
        recentByCategory[category] = (recentByCategory[category] || 0) + item.quantity;
      }
    }

    for (const doc of previousSnapshot.docs) {
      const order = doc.data();
      for (const item of order.items || []) {
        const category = item.category || 'Other';
        previousByCategory[category] = (previousByCategory[category] || 0) + item.quantity;
      }
    }

    // Calculate growth rates
    const trending: Array<{
      category: string;
      growthRate: number;
      demandIncrease: number;
      competitorCount: number;
    }> = [];

    for (const category in recentByCategory) {
      const recent = recentByCategory[category];
      const previous = previousByCategory[category] || 0;

      if (previous > 0) {
        const growthRate = (recent - previous) / previous;
        if (growthRate > 0.2) {
          // Get competitor count
          const competitorSnapshot = await db
            .collection('tailor_works')
            .where('category', '==', category)
            .select('tailor_id')
            .get();

          const uniqueVendors = new Set(competitorSnapshot.docs.map(d => d.data().tailor_id));

          trending.push({
            category,
            growthRate,
            demandIncrease: recent - previous,
            competitorCount: uniqueVendors.size
          });
        }
      }
    }

    return trending.sort((a, b) => b.growthRate - a.growthRate).slice(0, 5);
  }

  /**
   * Gets categories where vendor has products
   */
  private async getVendorCategories(vendorId: string): Promise<string[]> {
    const snapshot = await db
      .collection('tailor_works')
      .where('tailor_id', '==', vendorId)
      .select('category')
      .get();

    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) categories.add(category);
    });

    return Array.from(categories);
  }

  /**
   * Identifies seasonal opportunities
   */
  private async identifySeasonalOpportunities(vendorId: string): Promise<TrendingOpportunity[]> {
    const opportunities: TrendingOpportunity[] = [];
    const currentMonth = new Date().getMonth();

    // Define seasonal patterns (simplified)
    const seasonalPatterns: Record<number, { categories: string[]; title: string; description: string }> = {
      11: { // December
        categories: ['Fashion', 'Accessories', 'Gifts'],
        title: 'Holiday Season Opportunity',
        description: 'December sees 40-60% increase in fashion and gift purchases. Stock up on popular items.'
      },
      0: { // January
        categories: ['Fitness', 'Home', 'Organization'],
        title: 'New Year Resolution Demand',
        description: 'January shows increased demand for fitness and home organization products.'
      },
      1: { // February
        categories: ['Fashion', 'Accessories', 'Gifts'],
        title: 'Valentine\'s Day Opportunity',
        description: 'February sees spike in fashion and gift purchases for Valentine\'s Day.'
      }
    };

    const pattern = seasonalPatterns[currentMonth];
    if (pattern) {
      const vendorCategories = await this.getVendorCategories(vendorId);
      const hasRelevantProducts = pattern.categories.some(cat => vendorCategories.includes(cat));

      if (hasRelevantProducts) {
        opportunities.push({
          type: 'seasonal',
          title: pattern.title,
          description: pattern.description,
          metrics: {
            growthRate: 0.5,
            demandIncrease: 50,
            competitorCount: 0
          }
        });
      }
    }

    return opportunities;
  }

  /**
   * Identifies demand patterns from vendor's own data
   */
  private async identifyDemandPatterns(
    vendorId: string,
    analytics: VendorAnalytics
  ): Promise<TrendingOpportunity[]> {
    const opportunities: TrendingOpportunity[] = [];

    // Identify products with increasing demand
    const productsSnapshot = await db
      .collection('product_analytics')
      .where('vendorId', '==', vendorId)
      .orderBy('viewsChange', 'desc')
      .limit(5)
      .get();

    for (const doc of productsSnapshot.docs) {
      const data = doc.data();
      if (data.viewsChange > 0.3) {
        const productDoc = await db.collection("staging_tailor_works").doc(data.productId).get();
        const product = productDoc.data();

        opportunities.push({
          type: 'demand_pattern',
          title: `Growing Interest in ${product?.name}`,
          description: `Views for ${product?.name} increased by ${(data.viewsChange * 100).toFixed(0)}%. Consider increasing stock or creating similar products.`,
          metrics: {
            growthRate: data.viewsChange,
            demandIncrease: data.views - (data.views / (1 + data.viewsChange)),
            competitorCount: 0
          },
          actionUrl: `/vendor/products/${data.productId}/analytics`
        });
      }
    }

    return opportunities;
  }

  /**
   * Helper: Count products needing better images
   */
  private async countProductsNeedingImages(vendorId: string): Promise<number> {
    const snapshot = await db
      .collection('product_analytics')
      .where('vendorId', '==', vendorId)
      .where('ctr', '<', 0.02)
      .where('impressions', '>', 100)
      .get();

    return snapshot.size;
  }

  /**
   * Helper: Count overpriced products
   */
  private async countOverpricedProducts(vendorId: string): Promise<number> {
    const snapshot = await db
      .collection('vendor_rankings')
      .doc(vendorId)
      .get();

    if (!snapshot.exists) return 0;

    const data = snapshot.data();
    const products = data?.products || {};

    let count = 0;
    for (const productId in products) {
      const product = products[productId];
      if (product.factors?.priceCompetitiveness < 0.5) {
        count++;
      }
    }

    return count;
  }

  /**
   * Helper: Count products needing better descriptions
   */
  private async countProductsNeedingDescriptions(vendorId: string): Promise<number> {
    const snapshot = await db
      .collection('tailor_works')
      .where('tailor_id', '==', vendorId)
      .get();

    let count = 0;
    for (const doc of snapshot.docs) {
      const product = doc.data();
      const description = product.description || '';
      if (description.length < 100) {
        count++;
      }
    }

    return count;
  }
}

export const recommendationsService = new RecommendationsService();
