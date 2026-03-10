/**
 * Real-time Storefront Analytics Service
 * Provides WebSocket-based real-time updates for storefront analytics
 */

import { DateRange, StorefrontAnalyticsData } from '../types';

export class RealtimeStorefrontService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Subscribe to real-time storefront analytics updates via WebSocket
   */
  subscribeToRealtimeUpdates(
    dateRange: DateRange,
    callback: (data: StorefrontAnalyticsData) => void,
    onError?: (error: Error) => void
  ): () => void {
    // For now, fall back to polling since WebSocket infrastructure isn't set up
    // This can be enhanced later with actual WebSocket implementation
    return this.fallbackToPolling(dateRange, callback, onError);
  }

  /**
   * Fallback polling implementation
   */
  private fallbackToPolling(
    dateRange: DateRange,
    callback: (data: StorefrontAnalyticsData) => void,
    onError?: (error: Error) => void
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        });

        const response = await fetch(`/api/atlas/storefront-analytics?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        callback(data);
      } catch (error) {
        console.error('Error in real-time polling:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    }, 15000); // Poll every 15 seconds for real-time feel

    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Future WebSocket implementation (placeholder)
   */
  private connectWebSocket(
    dateRange: DateRange,
    callback: (data: StorefrontAnalyticsData) => void,
    onError?: (error: Error) => void
  ): () => void {
    // This would connect to a WebSocket endpoint for real-time updates
    // Implementation would depend on WebSocket server setup
    
    // For now, return the polling fallback
    return this.fallbackToPolling(dateRange, callback, onError);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }
}

// Export singleton instance
export const realtimeStorefrontService = new RealtimeStorefrontService();