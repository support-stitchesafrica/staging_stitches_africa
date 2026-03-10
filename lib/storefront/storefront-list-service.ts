/**
 * Storefront List Service
 * Handles fetching storefronts for vendors
 */

import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { StorefrontConfig } from '@/types/storefront';

export interface StorefrontSummary {
  id: string;
  handle: string;
  name: string;
  isPublic: boolean;
  vendorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StorefrontListService {
  /**
   * Get all storefronts for a vendor
   */
  async getVendorStorefronts(vendorId: string): Promise<StorefrontSummary[]> {
    try {
      const storefrontsQuery = query(
        collection(db, "staging_storefronts"),
        where('vendorId', '==', vendorId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(storefrontsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as StorefrontConfig;
        return {
          id: doc.id,
          handle: data.handle,
          name: data.pages.find(p => p.type === 'home')?.title || `${data.handle} Store`,
          isPublic: data.isPublic,
          vendorId: data.vendorId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      });
    } catch (error) {
      console.error('Failed to get vendor storefronts:', error);
      throw new Error('Failed to load storefronts');
    }
  }

  /**
   * Get a single storefront by ID
   */
  async getStorefront(storefrontId: string): Promise<StorefrontSummary | null> {
    try {
      const storefrontsQuery = query(
        collection(db, "staging_storefronts"),
        where('__name__', '==', storefrontId)
      );

      const snapshot = await getDocs(storefrontsQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as StorefrontConfig;
      
      return {
        id: doc.id,
        handle: data.handle,
        name: data.pages.find(p => p.type === 'home')?.title || `${data.handle} Store`,
        isPublic: data.isPublic,
        vendorId: data.vendorId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
    } catch (error) {
      console.error('Failed to get storefront:', error);
      return null;
    }
  }

  /**
   * Check if a vendor has any storefronts
   */
  async hasStorefronts(vendorId: string): Promise<boolean> {
    try {
      const storefronts = await this.getVendorStorefronts(vendorId);
      return storefronts.length > 0;
    } catch (error) {
      console.error('Failed to check storefronts:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storefrontListService = new StorefrontListService();