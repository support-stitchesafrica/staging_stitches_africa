import { ThemeConfiguration } from '@/types/storefront';

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface BusinessInfo {
  businessName: string;
  description: string;
  handle: string;
  slogan: string;
}

interface PartialHeroContent {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface PartialBusinessInfo {
  businessName?: string;
  description?: string;
  handle?: string;
  slogan?: string;
}

interface StorefrontUpdate {
  vendorId: string;
  templateId?: string;
  theme?: ThemeConfiguration;
  heroContent?: PartialHeroContent;
  businessInfo?: PartialBusinessInfo;
  timestamp: number;
}

class RealTimeSyncService {
  private subscribers: Map<string, Set<(update: StorefrontUpdate) => void>> = new Map();
  private updateQueue: Map<string, StorefrontUpdate> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Subscribe to real-time updates for a vendor's storefront
   */
  subscribe(vendorId: string, callback: (update: StorefrontUpdate) => void): () => void {
    if (!this.subscribers.has(vendorId)) {
      this.subscribers.set(vendorId, new Set());
    }
    
    this.subscribers.get(vendorId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(vendorId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(vendorId);
        }
      }
    };
  }

  /**
   * Publish an update to all subscribers
   */
  publish(update: StorefrontUpdate): void {
    const callbacks = this.subscribers.get(update.vendorId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in real-time sync callback:', error);
        }
      });
    }
  }

  /**
   * Queue an update with debouncing to prevent excessive API calls
   */
  queueUpdate(update: StorefrontUpdate, debounceMs: number = 500): void {
    const key = update.vendorId;
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Merge with existing queued update
    const existingUpdate = this.updateQueue.get(key);
    const mergedUpdate: StorefrontUpdate = {
      ...existingUpdate,
      ...update,
      timestamp: Date.now()
    };
    
    this.updateQueue.set(key, mergedUpdate);

    // Set new timer
    const timer = setTimeout(() => {
      const queuedUpdate = this.updateQueue.get(key);
      if (queuedUpdate) {
        this.processUpdate(queuedUpdate);
        this.updateQueue.delete(key);
        this.debounceTimers.delete(key);
      }
    }, debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Process and save the update
   */
  private async processUpdate(update: StorefrontUpdate): Promise<void> {
    try {
      // Publish to subscribers immediately for live preview
      this.publish(update);

      // Save to backend
      await this.saveToBackend(update);
    } catch (error) {
      console.error('Error processing storefront update:', error);
    }
  }

  /**
   * Save update to backend
   */
  private async saveToBackend(update: StorefrontUpdate): Promise<void> {
    const response = await fetch('/api/storefront/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync update: ${response.statusText}`);
    }
  }

  /**
   * Sync theme changes
   */
  syncTheme(vendorId: string, templateId: string, theme: ThemeConfiguration): void {
    this.queueUpdate({
      vendorId,
      templateId,
      theme,
      timestamp: Date.now()
    });
  }

  /**
   * Sync hero content changes
   */
  syncHeroContent(vendorId: string, heroContent: HeroContent): void {
    this.queueUpdate({
      vendorId,
      heroContent,
      timestamp: Date.now()
    });
  }

  /**
   * Sync business info changes
   */
  syncBusinessInfo(vendorId: string, businessInfo: BusinessInfo): void {
    this.queueUpdate({
      vendorId,
      businessInfo,
      timestamp: Date.now()
    });
  }

  /**
   * Sync media uploads
   */
  syncMedia(vendorId: string, theme: ThemeConfiguration): void {
    this.queueUpdate({
      vendorId,
      theme,
      timestamp: Date.now()
    }, 100); // Shorter debounce for media updates
  }

  /**
   * Force immediate sync without debouncing
   */
  async forceSyncNow(update: StorefrontUpdate): Promise<void> {
    await this.processUpdate(update);
  }

  /**
   * Clear all pending updates for a vendor
   */
  clearPendingUpdates(vendorId: string): void {
    const timer = this.debounceTimers.get(vendorId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(vendorId);
    }
    this.updateQueue.delete(vendorId);
  }

  /**
   * Get the current state for a vendor
   */
  getCurrentState(vendorId: string): StorefrontUpdate | null {
    return this.updateQueue.get(vendorId) || null;
  }
}

// Export singleton instance
export const realTimeSyncService = new RealTimeSyncService();

// Export types
export type { StorefrontUpdate, HeroContent, BusinessInfo, PartialHeroContent, PartialBusinessInfo };