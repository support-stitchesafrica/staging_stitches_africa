/**
 * Product Ranking Service
 * Calculates product ranking scores and generates recommendations
 */

import { BaseVendorService } from './base-service';
import {
  RankingFactors,
  ProductRanking,
  ServiceResponse,
  ProductAnalytics
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
  setDoc,
  Timestamp
} from 'firebase/firestore';

export class ProductRankingService extends BaseVendorService {
  // Ranking factor weights
  private readonly WEIGHTS = {
    ctr: 0.15,
    conversionRate: 0.20,
    rating: 0.15,
    fulfillmentSpeed: 0.15,
    complaintScore: 0.10,
    stockHealth: 0.10,
    priceCompetitiveness: 0.10,
    engagementSignals: 0.05
  };

  constructor() {
    super('ProductRankingService');
  }

  /**
   * Calculates product ranking score based on multiple factors
   */
  async calculateRankingScore(
    productId: string,
    vendorId: string
  ): Promise<ServiceResponse<RankingFactors>> {
    return this.executeWithErrorHandling(async () => {
      this.validateRequired({ productId, vendorId });

      const [ctr, conversion, rating, fulfillment, complaints, stock, price, engagement] = 
        await Promise.all([
          this.calculateCTR(productId),
          this.calculateConversionRate(productId),
          this.getAverageRating(productId),
          this.getFulfillmentSpeed(productId, vendorId),
          this.getComplaintScore(productId),
          this.getStockHealth(productId),
          this.getPriceCompetitiveness(productId),
          this.getEngagementSignals(productId)
        ]);

      const factors: Omit<RankingFactors, 'overallScore'> = {
        ctr,
        conversionRate: conversion,
        rating,
        fulfillmentSpeed: fulfillment,
        complaintScore: complaints,
        stockHealth: stock,
        priceCompetitiveness: price,
        engagementSignals: engagement
      };

      const overallScore = this.computeWeightedScore(factors);

      return {
        ...factors,
        overallScore
      };
    }, 'calculateRankingScore');
  }

  /**
   * Gets complete product ranking information
   */
  async getProductRanking(
    productId: string,
    vendorId: string
  ): Promise<ServiceResponse<ProductRanking>> {
    return this.executeWithErrorHandling(async () => {
      this.validateRequired({ productId, vendorId });

      // Calculate ranking factors
      const factorsResponse = await this.calculateRankingScore(productId, vendorId);
      if (!factorsResponse.success || !factorsResponse.data) {
        throw new Error('Failed to calculate ranking factors');
      }

      const factors = factorsResponse.data;

      // Get product details
      const product = await this.getProductDetails(productId);
      const category = product?.wear_category || 'Uncategorized';

      // Calculate visibility score (1-100)
      const visibilityScore = this.calculateVisibilityScore(factors);

      // Get ranking position
      const rankingPosition = await this.calculateRankingPosition(productId, vendorId, factors.overallScore);
      const categoryRankingPosition = await this.calculateCategoryRankingPosition(
        productId,
        vendorId,
        category,
        factors.overallScore
      );

      // Get previous ranking for change calculation
      const previousRanking = await this.getPreviousRanking(productId);
      const change = previousRanking ? previousRanking.rankingPosition - rankingPosition : 0;
      const changeExplanation = this.generateChangeExplanation(change, factors, previousRanking?.factors);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(productId, factors);

      return {
        productId,
        vendorId,
        category,
        visibilityScore,
        rankingPosition,
        categoryRankingPosition,
        factors,
        change,
        changeExplanation,
        recommendations,
        lastUpdated: new Date()
      };
    }, 'getProductRanking');
  }

  /**
   * Generates actionable recommendations based on ranking factors
   */
  async generateRecommendations(
    productId: string,
    factors: RankingFactors
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // CTR recommendations
    if (factors.ctr < 0.02) {
      recommendations.push('Improve product images and title to increase click-through rate');
      recommendations.push('Add high-quality photos showing product from multiple angles');
    }

    // Conversion rate recommendations
    if (factors.conversionRate < 0.05) {
      recommendations.push('Review pricing and product description to boost conversions');
      recommendations.push('Add detailed product specifications and sizing information');
    }

    // Rating recommendations
    if (factors.rating < 4.0) {
      recommendations.push('Address customer feedback to improve product ratings');
      recommendations.push('Review recent negative reviews and resolve common issues');
    }

    // Fulfillment speed recommendations
    if (factors.fulfillmentSpeed < 0.7) {
      recommendations.push('Reduce fulfillment time to improve ranking');
      recommendations.push('Optimize your order processing workflow for faster delivery');
    }

    // Complaint score recommendations
    if (factors.complaintScore < 0.7) {
      recommendations.push('Address customer complaints to improve satisfaction');
      recommendations.push('Review complaint patterns and implement quality improvements');
    }

    // Stock health recommendations
    if (factors.stockHealth < 0.5) {
      recommendations.push('Maintain adequate stock levels to avoid visibility penalties');
      recommendations.push('Set up low-stock alerts to prevent stockouts');
    }

    // Price competitiveness recommendations
    if (factors.priceCompetitiveness < 0.5) {
      recommendations.push('Review pricing strategy compared to similar products');
      recommendations.push('Consider offering competitive pricing or highlighting unique value');
    }

    // Engagement recommendations
    if (factors.engagementSignals < 0.5) {
      recommendations.push('Increase product engagement through promotions and social sharing');
      recommendations.push('Encourage customers to leave reviews and share their purchases');
    }

    // Overall score recommendations
    if (factors.overallScore < 50) {
      recommendations.push('Focus on improving top 3 weakest factors for maximum impact');
    }

    return recommendations;
  }

  /**
   * Calculates visibility score (1-100) from ranking factors
   */
  calculateVisibilityScore(factors: RankingFactors): number {
    // Visibility score is the overall score clamped between 1 and 100
    return this.clamp(Math.round(factors.overallScore), 1, 100);
  }

  /**
   * Computes weighted overall score from individual factors
   */
  private computeWeightedScore(factors: Omit<RankingFactors, 'overallScore'>): number {
    const score = (
      factors.ctr * this.WEIGHTS.ctr +
      factors.conversionRate * this.WEIGHTS.conversionRate +
      factors.rating * this.WEIGHTS.rating +
      factors.fulfillmentSpeed * this.WEIGHTS.fulfillmentSpeed +
      factors.complaintScore * this.WEIGHTS.complaintScore +
      factors.stockHealth * this.WEIGHTS.stockHealth +
      factors.priceCompetitiveness * this.WEIGHTS.priceCompetitiveness +
      factors.engagementSignals * this.WEIGHTS.engagementSignals
    ) * 100;

    return this.roundToDecimal(score, 2);
  }

  // ============================================================================
  // Factor Calculation Methods
  // ============================================================================

  /**
   * Calculates click-through rate (0-1)
   */
  private async calculateCTR(productId: string): Promise<number> {
    try {
      const analyticsDoc = await getDoc(doc(db, "staging_product_analytics", productId));
      
      if (!analyticsDoc.exists()) {
        return 0;
      }

      const data = analyticsDoc.data();
      const impressions = data.impressions || 0;
      const clicks = data.clicks || data.views || 0;

      if (impressions === 0) {
        return 0;
      }

      const ctr = this.safeDivide(clicks, impressions, 0);
      return this.clamp(ctr, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to calculate CTR', { productId, error });
      return 0;
    }
  }

  /**
   * Calculates conversion rate (0-1)
   */
  private async calculateConversionRate(productId: string): Promise<number> {
    try {
      const analyticsDoc = await getDoc(doc(db, "staging_product_analytics", productId));
      
      if (!analyticsDoc.exists()) {
        return 0;
      }

      const data = analyticsDoc.data();
      const views = data.views || 0;
      const purchases = data.salesCount || data.purchases || 0;

      if (views === 0) {
        return 0;
      }

      const conversionRate = this.safeDivide(purchases, views, 0);
      return this.clamp(conversionRate, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to calculate conversion rate', { productId, error });
      return 0;
    }
  }

  /**
   * Gets average rating normalized to 0-1
   */
  private async getAverageRating(productId: string): Promise<number> {
    try {
      const productDoc = await getDoc(doc(db, "staging_tailor_works", productId));
      
      if (!productDoc.exists()) {
        return 0;
      }

      const data = productDoc.data();
      const rating = data.rating || data.averageRating || 0;

      // Normalize rating from 0-5 scale to 0-1 scale
      const normalizedRating = this.safeDivide(rating, 5, 0);
      return this.clamp(normalizedRating, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to get average rating', { productId, error });
      return 0;
    }
  }

  /**
   * Calculates fulfillment speed score (0-1)
   */
  private async getFulfillmentSpeed(productId: string, vendorId: string): Promise<number> {
    try {
      // Query recent orders for this product using correct collection
      const ordersQuery = query(
        collectionGroup(db, 'user_orders'),
        where('product_id', '==', productId),
        where('tailor_id', '==', vendorId),
        where('order_status', '==', 'delivered')
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        return 0.5; // Neutral score for products with no delivery history
      }

      const fulfillmentTimes: number[] = [];
      
      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderDate = this.parseDate(data.timestamp || data.created_at);
        const deliveryDate = data.delivery_date ? this.parseDate(data.delivery_date) : null;
        
        if (deliveryDate) {
          const diffMs = deliveryDate.getTime() - orderDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          fulfillmentTimes.push(diffDays);
        }
      });

      if (fulfillmentTimes.length === 0) {
        return 0.5;
      }

      const avgFulfillmentDays = this.aggregate(fulfillmentTimes, 'avg');
      
      // Score based on fulfillment time:
      // < 3 days = 1.0
      // 3-7 days = 0.8
      // 7-14 days = 0.6
      // 14-21 days = 0.4
      // > 21 days = 0.2
      let score = 1.0;
      if (avgFulfillmentDays > 21) score = 0.2;
      else if (avgFulfillmentDays > 14) score = 0.4;
      else if (avgFulfillmentDays > 7) score = 0.6;
      else if (avgFulfillmentDays > 3) score = 0.8;

      return this.clamp(score, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to calculate fulfillment speed', { productId, error });
      return 0.5;
    }
  }

  /**
   * Calculates complaint score (0-1, higher is better)
   */
  private async getComplaintScore(productId: string): Promise<number> {
    try {
      // Query complaints for this product
      const complaintsQuery = query(
        collection(db, 'complaints'),
        where('product_id', '==', productId)
      );

      const complaintsSnapshot = await getDocs(complaintsQuery);
      const complaintCount = complaintsSnapshot.size;

      // Get total orders for this product using correct collection
      const ordersQuery = query(
        collectionGroup(db, 'user_orders'),
        where('product_id', '==', productId)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orderCount = ordersSnapshot.size;

      if (orderCount === 0) {
        return 1.0; // Perfect score for products with no orders yet
      }

      const complaintRate = this.safeDivide(complaintCount, orderCount, 0);
      
      // Convert complaint rate to score (inverse relationship)
      // 0% complaints = 1.0
      // 5% complaints = 0.75
      // 10% complaints = 0.5
      // 20%+ complaints = 0.0
      const score = Math.max(0, 1 - (complaintRate * 5));
      
      return this.clamp(score, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to calculate complaint score', { productId, error });
      return 1.0; // Default to perfect score on error
    }
  }

  /**
   * Calculates stock health score (0-1)
   */
  private async getStockHealth(productId: string): Promise<number> {
    try {
      const productDoc = await getDoc(doc(db, "staging_tailor_works", productId));
      
      if (!productDoc.exists()) {
        return 0;
      }

      const data = productDoc.data();
      const stock = data.stock || 0;

      // Score based on stock level:
      // 0 stock = 0.0
      // 1-5 stock = 0.3
      // 6-10 stock = 0.6
      // 11-20 stock = 0.8
      // 20+ stock = 1.0
      let score = 0;
      if (stock === 0) score = 0;
      else if (stock <= 5) score = 0.3;
      else if (stock <= 10) score = 0.6;
      else if (stock <= 20) score = 0.8;
      else score = 1.0;

      return this.clamp(score, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to calculate stock health', { productId, error });
      return 0;
    }
  }

  /**
   * Calculates price competitiveness score (0-1)
   */
  private async getPriceCompetitiveness(productId: string): Promise<number> {
    try {
      const productDoc = await getDoc(doc(db, "staging_tailor_works", productId));
      
      if (!productDoc.exists()) {
        return 0.5;
      }

      const data = productDoc.data();
      const price = data.price || 0;
      const category = data.wear_category || '';

      if (price === 0) {
        return 0;
      }

      // Get similar products in the same category
      const similarQuery = query(
        collection(db, "staging_tailor_works"),
        where('wear_category', '==', category)
      );

      const similarSnapshot = await getDocs(similarQuery);
      const prices: number[] = [];

      similarSnapshot.docs.forEach(doc => {
        const similarData = doc.data();
        if (similarData.price && similarData.price > 0) {
          prices.push(similarData.price);
        }
      });

      if (prices.length < 2) {
        return 0.5; // Neutral score if not enough data
      }

      const avgPrice = this.aggregate(prices, 'avg');
      const priceRatio = this.safeDivide(price, avgPrice, 1);

      // Score based on price relative to average:
      // Much lower (< 0.7x) = 0.8 (good value but might signal quality concerns)
      // Lower (0.7-0.9x) = 1.0 (best - competitive pricing)
      // Average (0.9-1.1x) = 0.9
      // Higher (1.1-1.3x) = 0.7
      // Much higher (> 1.3x) = 0.5
      let score = 0.5;
      if (priceRatio < 0.7) score = 0.8;
      else if (priceRatio < 0.9) score = 1.0;
      else if (priceRatio < 1.1) score = 0.9;
      else if (priceRatio < 1.3) score = 0.7;
      else score = 0.5;

      return this.clamp(score, 0, 1);
    } catch (error) {
      this.log('warn', 'Failed to calculate price competitiveness', { productId, error });
      return 0.5;
    }
  }

  /**
   * Calculates engagement signals score (0-1)
   */
  private async getEngagementSignals(productId: string): Promise<number> {
    try {
      const analyticsDoc = await getDoc(doc(db, "staging_product_analytics", productId));
      
      if (!analyticsDoc.exists()) {
        return 0;
      }

      const data = analyticsDoc.data();
      
      // Engagement factors
      const views = data.views || 0;
      const addToCart = data.addToCart || 0;
      const wishlist = data.wishlistCount || 0;
      const shares = data.shares || 0;
      const reviewCount = data.reviewCount || 0;

      // Calculate engagement score based on multiple signals
      const addToCartRate = views > 0 ? this.safeDivide(addToCart, views, 0) : 0;
      const wishlistRate = views > 0 ? this.safeDivide(wishlist, views, 0) : 0;
      const shareRate = views > 0 ? this.safeDivide(shares, views, 0) : 0;
      const reviewRate = views > 0 ? this.safeDivide(reviewCount, views, 0) : 0;

      // Weighted engagement score
      const engagementScore = (
        addToCartRate * 0.4 +
        wishlistRate * 0.2 +
        shareRate * 0.2 +
        reviewRate * 0.2
      );

      return this.clamp(engagementScore * 10, 0, 1); // Scale up and clamp
    } catch (error) {
      this.log('warn', 'Failed to calculate engagement signals', { productId, error });
      return 0;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Gets product details from database
   */
  private async getProductDetails(productId: string): Promise<any> {
    try {
      const productDoc = await getDoc(doc(db, "staging_tailor_works", productId));
      return productDoc.exists() ? productDoc.data() : null;
    } catch (error) {
      this.log('warn', 'Failed to get product details', { productId, error });
      return null;
    }
  }

  /**
   * Calculates overall ranking position
   */
  private async calculateRankingPosition(
    productId: string,
    vendorId: string,
    overallScore: number
  ): Promise<number> {
    try {
      // Get all products for this vendor with their scores
      const rankingsQuery = query(
        collection(db, 'vendor_rankings'),
        where('vendorId', '==', vendorId)
      );

      const rankingsSnapshot = await getDocs(rankingsQuery);
      const scores: { productId: string; score: number }[] = [];

      rankingsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.products) {
          Object.entries(data.products).forEach(([pid, productData]: [string, any]) => {
            scores.push({
              productId: pid,
              score: productData.factors?.overallScore || 0
            });
          });
        }
      });

      // Add current product
      scores.push({ productId, score: overallScore });

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      // Find position
      const position = scores.findIndex(s => s.productId === productId) + 1;
      return position;
    } catch (error) {
      this.log('warn', 'Failed to calculate ranking position', { productId, error });
      return 0;
    }
  }

  /**
   * Calculates category ranking position
   */
  private async calculateCategoryRankingPosition(
    productId: string,
    vendorId: string,
    category: string,
    overallScore: number
  ): Promise<number> {
    try {
      // Get all products in this category with their scores
      const productsQuery = query(
        collection(db, "staging_tailor_works"),
        where('wear_category', '==', category)
      );

      const productsSnapshot = await getDocs(productsQuery);
      const scores: { productId: string; score: number }[] = [];

      for (const productDoc of productsSnapshot.docs) {
        const pid = productDoc.id;
        
        // Get ranking for each product
        const rankingDoc = await getDoc(doc(db, 'product_rankings', pid));
        const score = rankingDoc.exists() 
          ? rankingDoc.data().factors?.overallScore || 0
          : 0;

        scores.push({ productId: pid, score });
      }

      // Add current product
      scores.push({ productId, score: overallScore });

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      // Find position
      const position = scores.findIndex(s => s.productId === productId) + 1;
      return position;
    } catch (error) {
      this.log('warn', 'Failed to calculate category ranking position', { productId, error });
      return 0;
    }
  }

  /**
   * Gets previous ranking data
   */
  private async getPreviousRanking(productId: string): Promise<ProductRanking | null> {
    try {
      const rankingDoc = await getDoc(doc(db, 'product_rankings', productId));
      
      if (!rankingDoc.exists()) {
        return null;
      }

      const data = rankingDoc.data();
      return {
        productId: data.productId,
        vendorId: data.vendorId,
        category: data.category,
        visibilityScore: data.visibilityScore,
        rankingPosition: data.rankingPosition,
        categoryRankingPosition: data.categoryRankingPosition,
        factors: data.factors,
        change: data.change,
        changeExplanation: data.changeExplanation,
        recommendations: data.recommendations,
        lastUpdated: this.parseDate(data.lastUpdated)
      };
    } catch (error) {
      this.log('warn', 'Failed to get previous ranking', { productId, error });
      return null;
    }
  }

  /**
   * Generates explanation for ranking change
   */
  private generateChangeExplanation(
    change: number,
    currentFactors: RankingFactors,
    previousFactors?: RankingFactors
  ): string {
    if (change === 0) {
      return 'Your ranking position has remained stable';
    }

    if (!previousFactors) {
      return change > 0 
        ? `Your ranking improved by ${change} positions`
        : `Your ranking dropped by ${Math.abs(change)} positions`;
    }

    // Identify the factors that changed the most
    const factorChanges = [
      { name: 'click-through rate', change: currentFactors.ctr - previousFactors.ctr },
      { name: 'conversion rate', change: currentFactors.conversionRate - previousFactors.conversionRate },
      { name: 'rating', change: currentFactors.rating - previousFactors.rating },
      { name: 'fulfillment speed', change: currentFactors.fulfillmentSpeed - previousFactors.fulfillmentSpeed },
      { name: 'complaint score', change: currentFactors.complaintScore - previousFactors.complaintScore },
      { name: 'stock health', change: currentFactors.stockHealth - previousFactors.stockHealth },
      { name: 'price competitiveness', change: currentFactors.priceCompetitiveness - previousFactors.priceCompetitiveness },
      { name: 'engagement', change: currentFactors.engagementSignals - previousFactors.engagementSignals }
    ];

    // Sort by absolute change
    factorChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const topFactor = factorChanges[0];
    const direction = change > 0 ? 'improved' : 'dropped';
    const factorDirection = topFactor.change > 0 ? 'increased' : 'decreased';

    return `Your ranking ${direction} by ${Math.abs(change)} positions, primarily due to ${factorDirection} ${topFactor.name}`;
  }

  /**
   * Saves ranking data to database
   */
  async saveRanking(ranking: ProductRanking): Promise<ServiceResponse<void>> {
    return this.executeWithErrorHandling(async () => {
      const rankingRef = doc(db, 'product_rankings', ranking.productId);
      
      await setDoc(rankingRef, {
        ...ranking,
        lastUpdated: Timestamp.fromDate(ranking.lastUpdated)
      });
    }, 'saveRanking');
  }

  /**
   * Batch updates rankings for multiple products
   */
  async batchUpdateRankings(
    vendorId: string,
    productIds: string[]
  ): Promise<ServiceResponse<ProductRanking[]>> {
    return this.executeWithErrorHandling(async () => {
      const rankings: ProductRanking[] = [];

      // Process in batches to avoid overwhelming the database
      const batches = this.batchArray(productIds, 10);

      for (const batch of batches) {
        const batchRankings = await Promise.all(
          batch.map(async (productId) => {
            const rankingResponse = await this.getProductRanking(productId, vendorId);
            if (rankingResponse.success && rankingResponse.data) {
              await this.saveRanking(rankingResponse.data);
              return rankingResponse.data;
            }
            return null;
          })
        );

        rankings.push(...this.compact(batchRankings));
      }

      return rankings;
    }, 'batchUpdateRankings');
  }
}
