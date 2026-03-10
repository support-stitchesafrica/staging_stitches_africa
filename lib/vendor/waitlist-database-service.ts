/**
 * Vendor Waitlist Database Service
 * Firestore operations for collection waitlists and subscriptions
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  writeBatch,
  increment,
  runTransaction
} from 'firebase/firestore';
import { adminDb } from '../firebase-admin';
import { 
  CollectionWaitlist, 
  WaitlistSubscription, 
  CollectionAnalytics,
  NotificationTemplate,
  CreateCollectionForm,
  SubscriptionForm,
  CollectionFilters,
  SubscriptionFilters,
  ServiceResponse,
  ServiceError,
  SubscriptionResult,
  WaitlistErrorCode
} from '../../types/vendor-waitlist';
import { 
  COLLECTIONS, 
  CollectionWaitlistDocument, 
  WaitlistSubscriptionDocument,
  CollectionAnalyticsDocument,
  NotificationTemplateDocument
} from './waitlist-database-schema';
import { 
  validateCollectionForm, 
  validateSubscriptionForm, 
  validateStatusTransition,
  validateSubscriptionStatusTransition,
  generateSlug,
  normalizePhoneNumber,
  sanitizeInput
} from './waitlist-validation-service';

// ============================================================================
// Collection Waitlist Operations
// ============================================================================

/**
 * Creates a new collection waitlist
 */
export async function createCollectionWaitlist(
  vendorId: string, 
  data: CreateCollectionForm
): Promise<ServiceResponse<CollectionWaitlist>> {
  try {
    // Validate input data
    const validation = validateCollectionForm(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          userMessage: validation.errors[0].message,
          details: { errors: validation.errors },
          recoverable: true
        },
        timestamp: Timestamp.now()
      };
    }

    // Generate unique slug
    const slug = generateSlug(data.name, vendorId);
    
    // Check slug uniqueness
    const existingSlug = await getCollectionBySlug(slug);
    if (existingSlug.success && existingSlug.data) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.VALIDATION_ERROR,
          message: 'Slug already exists',
          userMessage: 'A collection with this name already exists. Please choose a different name.',
          recoverable: true
        },
        timestamp: Timestamp.now()
      };
    }

    const now = Timestamp.now();
    const collectionData: Omit<CollectionWaitlistDocument, 'id'> = {
      vendorId,
      name: sanitizeInput(data.name),
      description: sanitizeInput(data.description),
      imageUrl: data.imageUrl || '', // Will be updated after image upload
      pairedProducts: data.pairedProducts.map((pair, index) => ({
        primaryProductId: pair.primaryProductId,
        secondaryProductId: pair.secondaryProductId,
        relationship: pair.relationship,
        displayOrder: index,
        description: pair.description ? sanitizeInput(pair.description) : undefined,
        bundleDiscount: pair.bundleDiscount
      })),
      minSubscribers: data.minSubscribers,
      currentSubscribers: 0,
      status: 'draft',
      slug,
      createdAt: now,
      updatedAt: now,
      tags: data.tags?.map(tag => sanitizeInput(tag).toLowerCase()),
      category: data.category ? sanitizeInput(data.category) : undefined,
      estimatedLaunchDate: data.estimatedLaunchDate ? Timestamp.fromDate(data.estimatedLaunchDate) : undefined,
      maxSubscribers: data.maxSubscribers
    };

    // Create document in Firestore
    const collectionRef = collection(adminDb, COLLECTIONS.COLLECTION_WAITLISTS);
    const docRef = await addDoc(collectionRef, collectionData);

    // Update document with its ID
    await updateDoc(docRef, { id: docRef.id });

    // Fetch and return the created collection
    const createdDoc = await getDoc(docRef);
    const createdData = createdDoc.data() as CollectionWaitlistDocument;

    return {
      success: true,
      data: convertDocumentToCollection(createdData),
      timestamp: Timestamp.now()
    };

  } catch (error) {
    console.error('Error creating collection waitlist:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to create collection',
        userMessage: 'An error occurred while creating the collection. Please try again.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

/**
 * Gets a collection waitlist by ID
 */
export async function getCollectionWaitlist(
  collectionId: string
): Promise<ServiceResponse<CollectionWaitlist>> {
  try {
    const docRef = doc(adminDb, COLLECTIONS.COLLECTION_WAITLISTS, collectionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.COLLECTION_NOT_FOUND,
          message: 'Collection not found',
          userMessage: 'The requested collection could not be found.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    const data = docSnap.data() as CollectionWaitlistDocument;
    return {
      success: true,
      data: convertDocumentToCollection(data),
      timestamp: Timestamp.now()
    };

  } catch (error) {
    console.error('Error getting collection waitlist:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to get collection',
        userMessage: 'An error occurred while loading the collection.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

/**
 * Gets a collection waitlist by slug
 */
export async function getCollectionBySlug(
  slug: string
): Promise<ServiceResponse<CollectionWaitlist>> {
  try {
    const collectionRef = collection(adminDb, COLLECTIONS.COLLECTION_WAITLISTS);
    const q = query(collectionRef, where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.COLLECTION_NOT_FOUND,
          message: 'Collection not found',
          userMessage: 'The requested collection could not be found.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as CollectionWaitlistDocument;
    
    return {
      success: true,
      data: convertDocumentToCollection(data),
      timestamp: Timestamp.now()
    };

  } catch (error) {
    console.error('Error getting collection by slug:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to get collection',
        userMessage: 'An error occurred while loading the collection.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

/**
 * Updates a collection waitlist
 */
export async function updateCollectionWaitlist(
  collectionId: string,
  updates: Partial<CreateCollectionForm>,
  vendorId: string
): Promise<ServiceResponse<CollectionWaitlist>> {
  try {
    // Get current collection to validate ownership and status
    const currentResult = await getCollectionWaitlist(collectionId);
    if (!currentResult.success || !currentResult.data) {
      return currentResult;
    }

    const currentCollection = currentResult.data;

    // Verify ownership
    if (currentCollection.vendorId !== vendorId) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.PERMISSION_DENIED,
          message: 'Permission denied',
          userMessage: 'You do not have permission to update this collection.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    // Validate business rules for published collections
    if (currentCollection.status === 'published' && updates.minSubscribers !== undefined) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.VALIDATION_ERROR,
          message: 'Cannot update minimum subscribers for published collection',
          userMessage: 'Minimum subscribers cannot be changed after publishing.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    // Prepare update data
    const updateData: Partial<CollectionWaitlistDocument> = {
      updatedAt: Timestamp.now()
    };

    if (updates.name !== undefined) {
      updateData.name = sanitizeInput(updates.name);
    }

    if (updates.description !== undefined) {
      updateData.description = sanitizeInput(updates.description);
    }

    if (updates.imageUrl !== undefined) {
      updateData.imageUrl = updates.imageUrl;
    }

    if (updates.pairedProducts !== undefined) {
      updateData.pairedProducts = updates.pairedProducts.map((pair, index) => ({
        primaryProductId: pair.primaryProductId,
        secondaryProductId: pair.secondaryProductId,
        relationship: pair.relationship,
        displayOrder: index,
        description: pair.description ? sanitizeInput(pair.description) : undefined,
        bundleDiscount: pair.bundleDiscount
      }));
    }

    if (updates.minSubscribers !== undefined) {
      updateData.minSubscribers = updates.minSubscribers;
    }

    if (updates.maxSubscribers !== undefined) {
      updateData.maxSubscribers = updates.maxSubscribers;
    }

    if (updates.tags !== undefined) {
      updateData.tags = updates.tags.map(tag => sanitizeInput(tag).toLowerCase());
    }

    if (updates.category !== undefined) {
      updateData.category = sanitizeInput(updates.category);
    }

    if (updates.estimatedLaunchDate !== undefined) {
      updateData.estimatedLaunchDate = Timestamp.fromDate(updates.estimatedLaunchDate);
    }

    // Update document
    const docRef = doc(adminDb, COLLECTIONS.COLLECTION_WAITLISTS, collectionId);
    await updateDoc(docRef, updateData);

    // Return updated collection
    return await getCollectionWaitlist(collectionId);

  } catch (error) {
    console.error('Error updating collection waitlist:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to update collection',
        userMessage: 'An error occurred while updating the collection.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

/**
 * Updates collection status
 */
export async function updateCollectionStatus(
  collectionId: string,
  newStatus: CollectionWaitlist['status'],
  vendorId: string
): Promise<ServiceResponse<CollectionWaitlist>> {
  try {
    // Get current collection
    const currentResult = await getCollectionWaitlist(collectionId);
    if (!currentResult.success || !currentResult.data) {
      return currentResult;
    }

    const currentCollection = currentResult.data;

    // Verify ownership
    if (currentCollection.vendorId !== vendorId) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.PERMISSION_DENIED,
          message: 'Permission denied',
          userMessage: 'You do not have permission to update this collection.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    // Validate status transition
    const transitionError = validateStatusTransition(currentCollection.status, newStatus);
    if (transitionError) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.VALIDATION_ERROR,
          message: transitionError.message,
          userMessage: transitionError.message,
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    // Prepare update data
    const updateData: Partial<CollectionWaitlistDocument> = {
      status: newStatus,
      updatedAt: Timestamp.now()
    };

    // Set timestamp for status changes
    if (newStatus === 'published') {
      updateData.publishedAt = Timestamp.now();
    } else if (newStatus === 'completed') {
      updateData.completedAt = Timestamp.now();
    }

    // Update document
    const docRef = doc(adminDb, COLLECTIONS.COLLECTION_WAITLISTS, collectionId);
    await updateDoc(docRef, updateData);

    // Return updated collection
    return await getCollectionWaitlist(collectionId);

  } catch (error) {
    console.error('Error updating collection status:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to update collection status',
        userMessage: 'An error occurred while updating the collection status.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

/**
 * Gets collections with filters
 */
export async function getCollections(
  filters: CollectionFilters = {}
): Promise<ServiceResponse<CollectionWaitlist[]>> {
  try {
    const collectionRef = collection(adminDb, COLLECTIONS.COLLECTION_WAITLISTS);
    let q = query(collectionRef);

    // Apply filters
    if (filters.vendorId) {
      q = query(q, where('vendorId', '==', filters.vendorId));
    }

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }

    // Apply ordering
    const orderByField = filters.orderBy || 'createdAt';
    const orderDirection = filters.orderDirection || 'desc';
    q = query(q, orderBy(orderByField, orderDirection));

    // Apply limit
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const querySnapshot = await getDocs(q);
    const collections = querySnapshot.docs.map(doc => {
      const data = doc.data() as CollectionWaitlistDocument;
      return convertDocumentToCollection(data);
    });

    return {
      success: true,
      data: collections,
      timestamp: Timestamp.now()
    };

  } catch (error) {
    console.error('Error getting collections:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to get collections',
        userMessage: 'An error occurred while loading collections.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

// ============================================================================
// Subscription Operations
// ============================================================================

/**
 * Creates a new waitlist subscription
 */
export async function createWaitlistSubscription(
  collectionId: string,
  data: SubscriptionForm
): Promise<ServiceResponse<SubscriptionResult>> {
  try {
    // Validate input data
    const validation = validateSubscriptionForm(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          userMessage: validation.errors[0].message,
          details: { errors: validation.errors },
          recoverable: true
        },
        timestamp: Timestamp.now()
      };
    }

    // Check if collection exists and is published
    const collectionResult = await getCollectionWaitlist(collectionId);
    if (!collectionResult.success || !collectionResult.data) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.COLLECTION_NOT_FOUND,
          message: 'Collection not found',
          userMessage: 'The collection you are trying to subscribe to does not exist.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    const collection = collectionResult.data;
    if (collection.status !== 'published') {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.COLLECTION_NOT_PUBLISHED,
          message: 'Collection not published',
          userMessage: 'This collection is not currently accepting subscriptions.',
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    // Check for duplicate subscription
    const duplicateCheck = await checkDuplicateSubscription(collectionId, data.email);
    if (duplicateCheck.success && duplicateCheck.data) {
      return {
        success: false,
        error: {
          code: WaitlistErrorCode.DUPLICATE_SUBSCRIPTION,
          message: 'Duplicate subscription',
          userMessage: 'You have already subscribed to this collection.',
          details: { existingSubscriptionId: duplicateCheck.data.id },
          recoverable: false
        },
        timestamp: Timestamp.now()
      };
    }

    // Use transaction to ensure data consistency
    return await runTransaction(adminDb, async (transaction) => {
      const now = Timestamp.now();
      
      // Generate user ID (will be used for auto-created Firebase Auth user)
      const userId = `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

      // Create subscription document
      const subscriptionData: Omit<WaitlistSubscriptionDocument, 'id'> = {
        collectionId,
        fullName: sanitizeInput(data.fullName),
        email: data.email.toLowerCase().trim(),
        phoneNumber: normalizedPhone,
        userId,
        subscribedAt: now,
        source: 'direct', // Default source, can be updated based on referrer
        status: 'active',
        metadata: {
          // Will be populated by client-side data
        },
        preferences: {
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? false,
          launchNotifications: true,
          marketingEmails: data.marketingEmails ?? false,
          frequency: 'immediate'
        }
      };

      // Add subscription document
      const subscriptionRef = collection(adminDb, COLLECTIONS.WAITLIST_SUBSCRIPTIONS);
      const subscriptionDocRef = doc(subscriptionRef);
      subscriptionData.id = subscriptionDocRef.id;
      transaction.set(subscriptionDocRef, subscriptionData);

      // Update collection subscriber count
      const collectionDocRef = doc(adminDb, COLLECTIONS.COLLECTION_WAITLISTS, collectionId);
      transaction.update(collectionDocRef, {
        currentSubscribers: increment(1),
        updatedAt: now
      });

      // Check if collection should be marked as completed
      const newSubscriberCount = collection.currentSubscribers + 1;
      if (newSubscriberCount >= collection.minSubscribers && collection.status === 'published') {
        transaction.update(collectionDocRef, {
          status: 'completed',
          completedAt: now
        });
      }

      return {
        success: true,
        data: {
          subscription: convertDocumentToSubscription(subscriptionData as WaitlistSubscriptionDocument),
          userCreated: false, // Will be handled by Cloud Function
          userId,
          notificationsSent: false, // Will be handled by Cloud Function
          collectionUpdated: true
        },
        timestamp: Timestamp.now()
      };
    });

  } catch (error) {
    console.error('Error creating waitlist subscription:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to create subscription',
        userMessage: 'An error occurred while subscribing to the waitlist. Please try again.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

/**
 * Checks for duplicate subscription
 */
export async function checkDuplicateSubscription(
  collectionId: string,
  email: string
): Promise<ServiceResponse<WaitlistSubscription | null>> {
  try {
    const subscriptionRef = collection(adminDb, COLLECTIONS.WAITLIST_SUBSCRIPTIONS);
    const q = query(
      subscriptionRef,
      where('collectionId', '==', collectionId),
      where('email', '==', email.toLowerCase().trim()),
      where('status', '==', 'active'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: true,
        data: null,
        timestamp: Timestamp.now()
      };
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as WaitlistSubscriptionDocument;

    return {
      success: true,
      data: convertDocumentToSubscription(data),
      timestamp: Timestamp.now()
    };

  } catch (error) {
    console.error('Error checking duplicate subscription:', error);
    return {
      success: false,
      error: {
        code: WaitlistErrorCode.UNKNOWN_ERROR,
        message: 'Failed to check duplicate subscription',
        userMessage: 'An error occurred while processing your subscription.',
        recoverable: true
      },
      timestamp: Timestamp.now()
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts Firestore document to CollectionWaitlist type
 */
function convertDocumentToCollection(doc: CollectionWaitlistDocument): CollectionWaitlist {
  return {
    ...doc,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt,
    completedAt: doc.completedAt,
    estimatedLaunchDate: doc.estimatedLaunchDate
  };
}

/**
 * Converts Firestore document to WaitlistSubscription type
 */
function convertDocumentToSubscription(doc: WaitlistSubscriptionDocument): WaitlistSubscription {
  return {
    ...doc,
    subscribedAt: doc.subscribedAt,
    unsubscribedAt: doc.unsubscribedAt,
    convertedAt: doc.convertedAt
  };
}