/**
 * Collection Waitlist Service
 * Handles CRUD operations for vendor collection waitlists
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  CollectionWaitlist,
  WaitlistSubscription,
  ProductReference,
  CreateCollectionForm,
  SubscriptionForm,
  CollectionAnalytics,
  CollectionWaitlistStatus
} from '@/types/vendor-waitlist';

// Collections
const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'staging_collection_waitlists',
  WAITLIST_SUBSCRIPTIONS: 'staging_waitlist_subscriptions',
  TAILOR_WORKS: 'staging_tailor_works'
} as const;

/**
 * Collection Waitlist Management Service
 */
export class CollectionWaitlistService {
  /**
   * Generate URL-friendly slug from collection name
   */
  private static generateSlug(name: string, vendorId: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Add vendor prefix to ensure uniqueness
    const vendorPrefix = vendorId.substring(0, 8);
    return `${vendorPrefix}-${baseSlug}`;
  }

  /**
   * Create a new collection waitlist
   */
  static async createCollection(
    data: CreateCollectionForm, 
    vendorId: string
  ): Promise<CollectionWaitlist> {
    // Validate products exist
    const validProductIds = await this.verifyProducts(
      data.pairedProducts.flatMap(pair => [pair.primaryProductId, pair.secondaryProductId])
    );
    
    if (validProductIds.length === 0) {
      throw new Error('No valid products found');
    }

    // Generate collection ID and slug
    const collectionId = adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc().id;
    const slug = this.generateSlug(data.name, vendorId);
    const now = Timestamp.now();

    // Create collection object
    const collection: CollectionWaitlist = {
      id: collectionId,
      vendorId,
      name: data.name.trim(),
      description: data.description.trim(),
      imageUrl: data.imageUrl.trim(),
      pairedProducts: data.pairedProducts,
      minSubscribers: data.minSubscribers,
      currentSubscribers: 0,
      status: 'draft',
      slug,
      createdAt: now,
      updatedAt: now
    };

    // Save to Firestore
    await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(collectionId).set(collection);

    return collection;
  }

  /**
   * Update an existing collection
   */
  static async updateCollection(
    id: string, 
    data: Partial<CreateCollectionForm>,
    vendorId: string
  ): Promise<CollectionWaitlist> {
    const existingCollection = await this.getCollectionById(id);
    if (!existingCollection) {
      throw new Error('Collection not found');
    }

    // Verify ownership
    if (existingCollection.vendorId !== vendorId) {
      throw new Error('Unauthorized: You can only edit your own collections');
    }

    // Prevent editing published collections' minimum subscribers
    if (existingCollection.status === 'published' && data.minSubscribers !== undefined) {
      throw new Error('Cannot change minimum subscribers for published collections');
    }

    // Prepare update data
    const updateData: Partial<CollectionWaitlist> = {
      updatedAt: Timestamp.now()
    };

    // Update fields if provided
    if (data.name) {
      updateData.name = data.name.trim();
      updateData.slug = this.generateSlug(data.name, vendorId);
    }
    if (data.description) updateData.description = data.description.trim();
    if (data.imageUrl) updateData.imageUrl = data.imageUrl.trim();
    if (data.minSubscribers !== undefined) updateData.minSubscribers = data.minSubscribers;
    if (data.pairedProducts) {
      // Verify products exist
      const productIds = data.pairedProducts.flatMap(pair => [
        pair.primaryProductId, 
        pair.secondaryProductId
      ]);
      const validIds = await this.verifyProducts(productIds);
      if (validIds.length > 0) {
        updateData.pairedProducts = data.pairedProducts;
      }
    }

    // Update in Firestore
    await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(id).update(updateData);

    // Return updated collection
    return { ...existingCollection, ...updateData } as CollectionWaitlist;
  }

  /**
   * Delete a collection
   */
  static async deleteCollection(id: string, vendorId: string): Promise<void> {
    const collection = await this.getCollectionById(id);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Verify ownership
    if (collection.vendorId !== vendorId) {
      throw new Error('Unauthorized: You can only delete your own collections');
    }

    // Prevent deleting published collections
    if (collection.status === 'published') {
      throw new Error('Cannot delete published collections. Archive them instead.');
    }

    // Delete all subscriptions first
    const subscriptionsSnapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
      .where('collectionId', '==', id)
      .get();

    const batch = adminDb.batch();
    subscriptionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the collection
    batch.delete(adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(id));

    await batch.commit();
  }

  /**
   * Publish a collection
   */
  static async publishCollection(id: string, vendorId: string): Promise<CollectionWaitlist> {
    const collection = await this.getCollectionById(id);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Verify ownership
    if (collection.vendorId !== vendorId) {
      throw new Error('Unauthorized: You can only publish your own collections');
    }

    if (collection.status !== 'draft') {
      throw new Error('Only draft collections can be published');
    }

    const now = Timestamp.now();
    await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(id).update({
      status: 'published',
      publishedAt: now,
      updatedAt: now
    });

    return { ...collection, status: 'published', publishedAt: now };
  }

  /**
   * Archive a collection
   */
  static async archiveCollection(id: string, vendorId: string): Promise<CollectionWaitlist> {
    const collection = await this.getCollectionById(id);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Verify ownership
    if (collection.vendorId !== vendorId) {
      throw new Error('Unauthorized: You can only archive your own collections');
    }

    await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(id).update({
      status: 'archived',
      updatedAt: Timestamp.now()
    });

    return { ...collection, status: 'archived' };
  }

  /**
   * Get collection by ID
   */
  static async getCollectionById(id: string): Promise<CollectionWaitlist | null> {
    const doc = await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as CollectionWaitlist;
  }

  /**
   * Get collection by slug (public access)
   */
  static async getCollectionBySlug(slug: string): Promise<CollectionWaitlist | null> {
    const snapshot = await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CollectionWaitlist;
  }

  /**
   * Get collections by vendor
   */
  static async getCollectionsByVendor(
    vendorId: string,
    status?: CollectionWaitlistStatus
  ): Promise<CollectionWaitlist[]> {
    let query = adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('vendorId', '==', vendorId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CollectionWaitlist[];
  }

  /**
   * Get published collections (public access)
   */
  static async getPublishedCollections(): Promise<CollectionWaitlist[]> {
    const snapshot = await adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CollectionWaitlist[];
  }

  /**
   * Verify products exist in tailor_works collection
   */
  private static async verifyProducts(productIds: string[]): Promise<string[]> {
    const validIds: string[] = [];
    
    // Check products in batches of 10 (Firestore limit)
    for (let i = 0; i < productIds.length; i += 10) {
      const batch = productIds.slice(i, i + 10);
      const snapshot = await adminDb.collection(COLLECTIONS.TAILOR_WORKS)
        .where('__name__', 'in', batch)
        .get();
      
      snapshot.docs.forEach(doc => {
        validIds.push(doc.id);
      });
    }

    return validIds;
  }

  /**
   * Get products for collection
   */
  static async getCollectionProducts(productIds: string[]): Promise<ProductReference[]> {
    const products: ProductReference[] = [];
    
    // Get products in batches of 10
    for (let i = 0; i < productIds.length; i += 10) {
      const batch = productIds.slice(i, i + 10);
      const snapshot = await adminDb.collection(COLLECTIONS.TAILOR_WORKS)
        .where('__name__', 'in', batch)
        .get();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || 'Unnamed Product',
          images: data.images || [],
          price: data.price || 0,
          vendorName: data.vendor_name || 'Unknown Vendor',
          category: data.category
        });
      });
    }

    return products;
  }

  /**
   * Get subscriptions for collection
   */
  static async getCollectionSubscriptions(collectionId: string): Promise<WaitlistSubscription[]> {
    const snapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
      .where('collectionId', '==', collectionId)
      .orderBy('subscribedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistSubscription[];
  }

  /**
   * Get collection analytics
   */
  static async getCollectionAnalytics(collectionId: string): Promise<CollectionAnalytics> {
    const subscriptions = await this.getCollectionSubscriptions(collectionId);
    
    // Group subscriptions by date
    const subscriptionsByDate: { [date: string]: number } = {};
    const subscriptionsBySource: { [source: string]: number } = {};

    subscriptions.forEach(subscription => {
      const date = subscription.subscribedAt.toDate().toISOString().split('T')[0];
      subscriptionsByDate[date] = (subscriptionsByDate[date] || 0) + 1;
      
      subscriptionsBySource[subscription.source] = (subscriptionsBySource[subscription.source] || 0) + 1;
    });

    // Calculate conversion rate (placeholder - would need view tracking)
    const conversionRate = subscriptions.length > 0 ? 0.15 : 0; // 15% placeholder

    return {
      collectionId,
      totalSubscriptions: subscriptions.length,
      conversionRate,
      emailEngagementRate: 0.8, // Placeholder
      clickThroughRate: 0.12, // Placeholder
      subscriptionsByDate: Object.entries(subscriptionsByDate).map(([date, count]) => ({ date, count })),
      subscriptionsBySource: Object.entries(subscriptionsBySource).map(([source, count]) => ({ source, count }))
    };
  }

  /**
   * Export subscriptions to CSV format
   */
  static async exportSubscriptions(collectionId: string, vendorId: string): Promise<string> {
    const collection = await this.getCollectionById(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Verify ownership
    if (collection.vendorId !== vendorId) {
      throw new Error('Unauthorized: You can only export your own collection data');
    }

    const subscriptions = await this.getCollectionSubscriptions(collectionId);

    // CSV headers
    const headers = ['Full Name', 'Email', 'Phone Number', 'Source', 'Subscription Date'];
    
    // CSV rows
    const rows = subscriptions.map(subscription => [
      subscription.fullName,
      subscription.email,
      subscription.phoneNumber,
      subscription.source,
      subscription.subscribedAt.toDate().toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}