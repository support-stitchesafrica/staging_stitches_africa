/**
 * Subscription Service
 * Handles waitlist subscription processing with validation and duplicate prevention
 * Implements Requirements: 4.2, 4.3, 4.4, 7.1, 7.3
 */

import { 
  WaitlistSubscription,
  SubscriptionForm,
  SubscriptionValidationResult,
  ServiceResponse,
  SubscriptionResult,
  WaitlistErrorCode,
  ServiceError,
  CollectionWaitlist,
  SubscriptionMetadata
} from '@/types/vendor-waitlist';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CollectionWaitlistService } from './collection-waitlist-service';

// Database collections
const COLLECTIONS = {
  WAITLIST_SUBSCRIPTIONS: 'staging_waitlist_subscriptions',
  COLLECTION_WAITLISTS: 'staging_collection_waitlists'
} as const;

/**
 * Subscription Processing Service
 * Provides validation, duplicate prevention, and subscription management
 */
export class SubscriptionService {

  // ============================================================================
  // Subscription Validation (Requirements 4.2, 4.3, 4.4, 7.1, 7.3)
  // ============================================================================

  /**
   * Validates subscription form data
   * Validates: Requirements 4.2, 4.3, 4.4
   */
  static validateSubscriptionForm(data: SubscriptionForm): SubscriptionValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Validate full name (Requirement 4.2)
    if (!data.fullName || data.fullName.trim().length === 0) {
      errors.push({
        field: 'fullName',
        message: 'Full name is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (data.fullName.trim().length < 2) {
      errors.push({
        field: 'fullName',
        message: 'Full name must be at least 2 characters long',
        code: 'MIN_LENGTH'
      });
    } else if (data.fullName.trim().length > 100) {
      errors.push({
        field: 'fullName',
        message: 'Full name must be less than 100 characters',
        code: 'MAX_LENGTH'
      });
    }

    // Validate email address (Requirement 4.2)
    if (!data.email || data.email.trim().length === 0) {
      errors.push({
        field: 'email',
        message: 'Email address is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push({
          field: 'email',
          message: 'Please enter a valid email address',
          code: 'INVALID_FORMAT'
        });
      }
    }

    // Validate phone number (Requirement 4.2)
    if (!data.phoneNumber || data.phoneNumber.trim().length === 0) {
      errors.push({
        field: 'phoneNumber',
        message: 'Phone number is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      // Remove spaces and special characters for validation
      const cleanPhone = data.phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        errors.push({
          field: 'phoneNumber',
          message: 'Please enter a valid phone number',
          code: 'INVALID_FORMAT'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      isDuplicate: false
    };
  }

  /**
   * Checks for duplicate subscriptions
   * Validates: Requirements 7.1, 7.3
   */
  static async checkDuplicateSubscription(
    email: string, 
    collectionId: string
  ): Promise<{ isDuplicate: boolean; existingSubscriptionId?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const snapshot = await adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .where('email', '==', normalizedEmail)
        .where('collectionId', '==', collectionId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return {
          isDuplicate: true,
          existingSubscriptionId: snapshot.docs[0].id
        };
      }

      return { isDuplicate: false };

    } catch (error) {
      console.error('Error checking duplicate subscription:', error);
      // In case of error, assume no duplicate to allow subscription
      return { isDuplicate: false };
    }
  }

  /**
   * Validates collection availability for subscription
   * Validates: Requirements 4.3, 4.4
   */
  static async validateCollectionAvailability(collectionId: string): Promise<ServiceResponse<CollectionWaitlist>> {
    try {
      // Get collection details
      const collectionResult = await CollectionWaitlistService.getCollectionById(collectionId);
      
      if (!collectionResult.success || !collectionResult.data) {
        return this.createErrorResponse(
          WaitlistErrorCode.COLLECTION_NOT_FOUND,
          'Collection not found',
          'The requested collection could not be found.'
        );
      }

      const collection = collectionResult.data;

      // Check if collection is published (Requirement 4.3)
      if (collection.status !== 'published') {
        return this.createErrorResponse(
          WaitlistErrorCode.COLLECTION_NOT_PUBLISHED,
          'Collection not available',
          'This collection is not currently accepting subscriptions.'
        );
      }

      // Check if collection is completed (Requirement 4.4)
      if (collection.status === 'completed') {
        return this.createErrorResponse(
          WaitlistErrorCode.COLLECTION_COMPLETED,
          'Collection completed',
          'This collection has reached its subscription limit and is no longer accepting new subscribers.'
        );
      }

      // Check if collection has reached maximum subscribers (if set)
      if (collection.maxSubscribers && collection.currentSubscribers >= collection.maxSubscribers) {
        return this.createErrorResponse(
          WaitlistErrorCode.COLLECTION_COMPLETED,
          'Collection full',
          'This collection has reached its maximum number of subscribers.'
        );
      }

      return {
        success: true,
        data: collection,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error validating collection availability:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Validation failed',
        'Unable to validate collection availability. Please try again.'
      );
    }
  }

  // ============================================================================
  // Subscription Processing (Requirements 4.2, 4.3, 4.4)
  // ============================================================================

  /**
   * Processes a new subscription with full validation
   * Validates: Requirements 4.2, 4.3, 4.4, 7.1, 7.3
   */
  static async processSubscription(
    collectionId: string,
    subscriptionData: SubscriptionForm,
    metadata: Partial<SubscriptionMetadata> = {}
  ): Promise<ServiceResponse<SubscriptionResult>> {
    try {
      // Step 1: Validate form data (Requirement 4.2)
      const formValidation = this.validateSubscriptionForm(subscriptionData);
      if (!formValidation.isValid) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Invalid subscription data',
          formValidation.errors[0].message,
          { errors: formValidation.errors }
        );
      }

      // Step 2: Validate collection availability (Requirements 4.3, 4.4)
      const collectionValidation = await this.validateCollectionAvailability(collectionId);
      if (!collectionValidation.success || !collectionValidation.data) {
        return {
          success: false,
          error: collectionValidation.error,
          timestamp: Timestamp.now()
        };
      }

      const collection = collectionValidation.data;

      // Step 3: Check for duplicate subscription (Requirements 7.1, 7.3)
      const duplicateCheck = await this.checkDuplicateSubscription(
        subscriptionData.email, 
        collectionId
      );

      if (duplicateCheck.isDuplicate) {
        return this.createErrorResponse(
          WaitlistErrorCode.DUPLICATE_SUBSCRIPTION,
          'Duplicate subscription',
          'You have already subscribed to this collection.',
          { existingSubscriptionId: duplicateCheck.existingSubscriptionId }
        );
      }

      // Step 4: Create subscription record
      const subscriptionResult = await this.createSubscription(
        collectionId,
        subscriptionData,
        metadata
      );

      if (!subscriptionResult.success || !subscriptionResult.data) {
        return {
          success: false,
          error: subscriptionResult.error,
          timestamp: Timestamp.now()
        };
      }

      const subscription = subscriptionResult.data;

      // Step 5: Update collection subscriber count
      const updateResult = await this.updateCollectionSubscriberCount(collectionId, 1);
      
      // Note: We don't fail the subscription if count update fails, but we log it
      if (!updateResult.success) {
        console.error('Failed to update collection subscriber count:', updateResult.error);
      }

      // Return successful result
      const result: SubscriptionResult = {
        subscription,
        userCreated: false, // Will be handled by user onboarding service
        userId: '', // Will be set by user onboarding service
        notificationsSent: false, // Will be handled by notification service
        collectionUpdated: updateResult.success
      };

      return {
        success: true,
        data: result,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error processing subscription:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Subscription processing failed',
        'An error occurred while processing your subscription. Please try again.'
      );
    }
  }

  /**
   * Creates a new subscription record in the database
   */
  private static async createSubscription(
    collectionId: string,
    subscriptionData: SubscriptionForm,
    metadata: Partial<SubscriptionMetadata>
  ): Promise<ServiceResponse<WaitlistSubscription>> {
    try {
      const subscriptionId = adminDb.collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS).doc().id;
      const now = Timestamp.now();

      // Normalize and clean data
      const normalizedEmail = subscriptionData.email.toLowerCase().trim();
      const cleanedPhone = subscriptionData.phoneNumber.replace(/[\s\-\(\)]/g, '');

      const subscription: WaitlistSubscription = {
        id: subscriptionId,
        collectionId,
        fullName: subscriptionData.fullName.trim(),
        email: normalizedEmail,
        phoneNumber: cleanedPhone,
        userId: '', // Will be set by user onboarding service
        subscribedAt: now,
        source: 'direct', // Default source, can be overridden by metadata
        status: 'active',
        metadata: {
          userAgent: metadata.userAgent,
          referrer: metadata.referrer,
          ipAddress: metadata.ipAddress,
          deviceType: metadata.deviceType || 'unknown',
          location: metadata.location,
          utmSource: metadata.utmSource,
          utmMedium: metadata.utmMedium,
          utmCampaign: metadata.utmCampaign
        },
        preferences: {
          emailNotifications: subscriptionData.emailNotifications ?? true,
          smsNotifications: subscriptionData.smsNotifications ?? false,
          launchNotifications: true,
          marketingEmails: subscriptionData.marketingEmails ?? false,
          frequency: 'immediate'
        }
      };

      // Save to Firestore
      await adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .doc(subscriptionId)
        .set(subscription);

      console.log(`Subscription created: ${subscriptionId} for collection: ${collectionId}`);

      return {
        success: true,
        data: subscription,
        timestamp: now
      };

    } catch (error) {
      console.error('Error creating subscription:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to create subscription',
        'Unable to save your subscription. Please try again.'
      );
    }
  }

  /**
   * Updates the collection's current subscriber count
   */
  private static async updateCollectionSubscriberCount(
    collectionId: string, 
    increment: number
  ): Promise<ServiceResponse<void>> {
    try {
      const collectionRef = adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(collectionId);
      
      await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(collectionRef);
        
        if (!doc.exists) {
          throw new Error('Collection not found');
        }

        const currentCount = doc.data()?.currentSubscribers || 0;
        const newCount = Math.max(0, currentCount + increment);

        transaction.update(collectionRef, {
          currentSubscribers: newCount,
          updatedAt: Timestamp.now()
        });

        // Check if collection should be marked as completed
        const minSubscribers = doc.data()?.minSubscribers || 0;
        const maxSubscribers = doc.data()?.maxSubscribers;
        
        if ((minSubscribers > 0 && newCount >= minSubscribers) || 
            (maxSubscribers && newCount >= maxSubscribers)) {
          transaction.update(collectionRef, {
            status: 'completed',
            completedAt: Timestamp.now()
          });
        }
      });

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error updating collection subscriber count:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to update collection',
        'Unable to update collection information.'
      );
    }
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Gets a subscription by ID
   */
  static async getSubscriptionById(subscriptionId: string): Promise<ServiceResponse<WaitlistSubscription>> {
    try {
      const doc = await adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .doc(subscriptionId)
        .get();

      if (!doc.exists) {
        return this.createErrorResponse(
          WaitlistErrorCode.SUBSCRIPTION_NOT_FOUND,
          'Subscription not found',
          'The requested subscription could not be found.'
        );
      }

      const subscription = { id: doc.id, ...doc.data() } as WaitlistSubscription;

      return {
        success: true,
        data: subscription,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error getting subscription:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to get subscription',
        'Unable to retrieve subscription information.'
      );
    }
  }

  /**
   * Gets subscriptions for a collection
   */
  static async getCollectionSubscriptions(
    collectionId: string,
    limit: number = 50
  ): Promise<ServiceResponse<WaitlistSubscription[]>> {
    try {
      const snapshot = await adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .where('collectionId', '==', collectionId)
        .where('status', '==', 'active')
        .orderBy('subscribedAt', 'desc')
        .limit(limit)
        .get();

      const subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistSubscription[];

      return {
        success: true,
        data: subscriptions,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error getting collection subscriptions:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to get subscriptions',
        'Unable to retrieve subscription list.'
      );
    }
  }

  /**
   * Unsubscribes a user from a collection
   */
  static async unsubscribe(
    subscriptionId: string,
    reason?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const subscriptionRef = adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .doc(subscriptionId);

      await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(subscriptionRef);
        
        if (!doc.exists) {
          throw new Error('Subscription not found');
        }

        const subscription = doc.data() as WaitlistSubscription;
        
        if (subscription.status !== 'active') {
          throw new Error('Subscription is not active');
        }

        // Update subscription status
        transaction.update(subscriptionRef, {
          status: 'unsubscribed',
          unsubscribedAt: Timestamp.now(),
          unsubscribeReason: reason || 'User requested'
        });

        // Decrease collection subscriber count
        const collectionRef = adminDb
          .collection(COLLECTIONS.COLLECTION_WAITLISTS)
          .doc(subscription.collectionId);
        
        const collectionDoc = await transaction.get(collectionRef);
        if (collectionDoc.exists) {
          const currentCount = collectionDoc.data()?.currentSubscribers || 0;
          transaction.update(collectionRef, {
            currentSubscribers: Math.max(0, currentCount - 1),
            updatedAt: Timestamp.now()
          });
        }
      });

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error unsubscribing:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to unsubscribe',
        'Unable to process unsubscription. Please try again.'
      );
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Creates a standardized error response
   */
  private static createErrorResponse(
    code: WaitlistErrorCode,
    message: string,
    userMessage: string,
    details?: Record<string, any>
  ): ServiceResponse<any> {
    const error: ServiceError = {
      code,
      message,
      userMessage,
      recoverable: code !== WaitlistErrorCode.PERMISSION_DENIED,
      details
    };

    return {
      success: false,
      error,
      timestamp: Timestamp.now()
    };
  }

  /**
   * Extracts metadata from request headers and user agent
   */
  static extractSubscriptionMetadata(request: Request): SubscriptionMetadata {
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    // Extract IP address
    let ipAddress: string | undefined;
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ipAddress = realIp;
    }

    // Determine device type from user agent
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    if (userAgent) {
      if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (/iPad|Tablet/i.test(userAgent)) {
          deviceType = 'tablet';
        } else {
          deviceType = 'mobile';
        }
      } else {
        deviceType = 'desktop';
      }
    }

    return {
      userAgent,
      referrer,
      ipAddress,
      deviceType
    };
  }

  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Normalizes email address
   */
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Normalizes phone number
   */
  static normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[\s\-\(\)]/g, '');
  }
}