/**
 * Client-side Storefront Analytics Service for Atlas Unified Analytics
 * This service calls API routes instead of using Firebase Admin directly
 */

import { 
  DateRange, 
  StorefrontAnalyticsData
} from '../types';
import { IStorefrontAnalyticsService } from '../interfaces';

/**
 * Client-side StorefrontAnalyticsService implementation
 * Uses API routes to fetch data instead of direct Firebase Admin access
 */
export class ClientStorefrontAnalyticsService implements IStorefrontAnalyticsService {
  private readonly API_BASE = '/api/atlas/storefront-analytics';

  /**
   * Get aggregated storefront performance metrics across all storefronts
   */
  async getStorefrontPerformanceMetrics(dateRange: DateRange): Promise<StorefrontAnalyticsData> {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      });

      const response = await fetch(`${this.API_BASE}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting storefront performance metrics:', error);
      throw new Error('Failed to retrieve storefront analytics data');
    }
  }

  /**
   * Subscribe to real-time storefront data updates
   * Note: This is a simplified implementation for client-side use
   */
  subscribeToStorefrontUpdates(
    dateRange: DateRange,
    callback: (data: StorefrontAnalyticsData) => void
  ): () => void {
    // Set up polling for real-time updates (simplified approach)
    const intervalId = setInterval(async () => {
      try {
        const updatedData = await this.getStorefrontPerformanceMetrics(dateRange);
        callback(updatedData);
      } catch (error) {
        console.error('Error in storefront updates subscription:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Get storefront analytics for specific storefronts
   */
  async getStorefrontAnalyticsById(
    storefrontIds: string[], 
    dateRange: DateRange
  ): Promise<StorefrontAnalyticsData> {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        storefrontIds: storefrontIds.join(',')
      });

      const response = await fetch(`${this.API_BASE}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting storefront analytics by ID:', error);
      throw new Error('Failed to retrieve specific storefront analytics data');
    }
  }

  /**
   * Generate storefront optimization recommendations
   */
  async generateOptimizationRecommendations(
    storefrontData: StorefrontAnalyticsData
  ): Promise<Array<{
    type: 'performance' | 'conversion' | 'engagement';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    recommendation: string;
  }>> {
    try {
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storefrontData })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { recommendations } = await response.json();
      return recommendations;
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance for client-side use
export const clientStorefrontAnalyticsService = new ClientStorefrontAnalyticsService();