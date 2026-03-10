/**
 * Collection Status Management Service
 * Handles collection publishing, status transitions, and business rule enforcement
 * Implements Requirements: 7.2, 7.4
 */

import { 
  CollectionWaitlist, 
  CollectionStatus,
  ServiceResponse,
  WaitlistErrorCode,
  ServiceError
} from '@/types/vendor-waitlist';
import { 
  validateStatusTransition,
  validatePublishingRules
} from './waitlist-validation-service';
import { 
  getCollectionWaitlist,
  updateCollectionStatus as updateCollectionStatusInDb
} from './waitlist-database-service';
import { Timestamp } from 'firebase/firestore';

/**
 * Collection Status Management Service
 * Provides specialized functionality for collection status transitions and publishing
 */
export class CollectionStatusService {

  // ============================================================================
  // Publishing Operations (Requirement 7.2)
  // ============================================================================

  /**
   * Publishes a collection with comprehensive validation
   * Validates: Requirement 7.2 - Publishing business rules
   */
  static async publishCollection(
    collectionId: string,
    vendorId: string
  ): Promise<ServiceResponse<CollectionWaitlist>> {
    try {
      // Get current collection
      const collectionResult = await getCollectionWaitlist(collectionId);
      if (!collectionResult.success || !collectionResult.data) {
        return collectionResult;
      }

      const collection = collectionResult.data;

      // Verify ownership
      if (collection.vendorId !== vendorId) {
        return this.createErrorResponse(
          WaitlistErrorCode.PERMISSION_DENIED,
          'Access denied',
          'You do not have permission to publish this collection.'
        );
      }

      // Validate current status allows publishing
      const transitionError = validateStatusTransition(collection.status, 'published');
      if (transitionError) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          transitionError.message,
          transitionError.message
        );
      }

      // Validate publishing requirements (Requirement 7.2)
      const publishingErrors = validatePublishingRules(collection);
      if (publishingErrors.length > 0) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Collection not ready for publishing',
          publishingErrors[0].message,
          { 
            errors: publishingErrors,
            missingRequirements: this.getMissingPublishingRequirements(collection)
          }
        );
      }

      // Additional business rule validations
      const businessRuleErrors = this.validatePublishingBusinessRules(collection);
      if (businessRuleErrors.length > 0) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Business rule validation failed',
          businessRuleErrors[0].message,
          { errors: businessRuleErrors }
        );
      }

      // Update status to published
      const updateResult = await updateCollectionStatusInDb(collectionId, 'published', vendorId);
      
      if (!updateResult.success) {
        return updateResult;
      }

      // Log publishing event
      console.log(`Collection published: ${collectionId} by vendor: ${vendorId}`);
      
      // TODO: Trigger notifications and analytics events
      await this.handlePublishingEvents(collectionId, vendorId);

      return updateResult;

    } catch (error) {
      console.error('Error publishing collection:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to publish collection',
        'An error occurred while publishing the collection.'
      );
    }
  }

  /**
   * Unpublishes a collection (archives it)
   * Validates: Requirement 7.2 - Status transition rules
   */
  static async unpublishCollection(
    collectionId: string,
    vendorId: string,
    reason?: string
  ): Promise<ServiceResponse<CollectionWaitlist>> {
    try {
      // Get current collection
      const collectionResult = await getCollectionWaitlist(collectionId);
      if (!collectionResult.success || !collectionResult.data) {
        return collectionResult;
      }

      const collection = collectionResult.data;

      // Verify ownership
      if (collection.vendorId !== vendorId) {
        return this.createErrorResponse(
          WaitlistErrorCode.PERMISSION_DENIED,
          'Access denied',
          'You do not have permission to unpublish this collection.'
        );
      }

      // Validate current status allows unpublishing
      const transitionError = validateStatusTransition(collection.status, 'archived');
      if (transitionError) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          transitionError.message,
          transitionError.message
        );
      }

      // Check if collection has active subscriptions
      if (collection.currentSubscribers > 0) {
        // Allow unpublishing but warn about impact
        console.warn(`Unpublishing collection with ${collection.currentSubscribers} active subscriptions: ${collectionId}`);
      }

      // Update status to archived
      const updateResult = await updateCollectionStatusInDb(collectionId, 'archived', vendorId);
      
      if (!updateResult.success) {
        return updateResult;
      }

      // Log unpublishing event
      console.log(`Collection unpublished: ${collectionId} by vendor: ${vendorId}, reason: ${reason || 'Not specified'}`);
      
      // TODO: Trigger notifications to subscribers about collection being unpublished
      await this.handleUnpublishingEvents(collectionId, vendorId, reason);

      return updateResult;

    } catch (error) {
      console.error('Error unpublishing collection:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to unpublish collection',
        'An error occurred while unpublishing the collection.'
      );
    }
  }

  // ============================================================================
  // Status Transition Management (Requirement 7.4)
  // ============================================================================

  /**
   * Updates collection status with comprehensive business rule enforcement
   * Validates: Requirement 7.4 - Business rule enforcement
   */
  static async updateCollectionStatus(
    collectionId: string,
    vendorId: string,
    newStatus: CollectionStatus,
    metadata?: { reason?: string; force?: boolean }
  ): Promise<ServiceResponse<CollectionWaitlist>> {
    try {
      // Get current collection
      const collectionResult = await getCollectionWaitlist(collectionId);
      if (!collectionResult.success || !collectionResult.data) {
        return collectionResult;
      }

      const collection = collectionResult.data;

      // Verify ownership
      if (collection.vendorId !== vendorId) {
        return this.createErrorResponse(
          WaitlistErrorCode.PERMISSION_DENIED,
          'Access denied',
          'You do not have permission to update this collection status.'
        );
      }

      // Validate status transition
      const transitionError = validateStatusTransition(collection.status, newStatus);
      if (transitionError && !metadata?.force) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          transitionError.message,
          transitionError.message
        );
      }

      // Apply status-specific business rules (Requirement 7.4)
      const businessRuleValidation = await this.validateStatusChangeBusinessRules(
        collection, 
        newStatus, 
        metadata
      );
      
      if (!businessRuleValidation.success) {
        return businessRuleValidation;
      }

      // Handle special status transitions
      switch (newStatus) {
        case 'published':
          return await this.publishCollection(collectionId, vendorId);
        
        case 'archived':
          return await this.unpublishCollection(collectionId, vendorId, metadata?.reason);
        
        case 'completed':
          return await this.completeCollection(collectionId, vendorId);
        
        default:
          // Generic status update
          const updateResult = await updateCollectionStatusInDb(collectionId, newStatus, vendorId);
          
          if (updateResult.success) {
            console.log(`Collection status updated: ${collectionId} to ${newStatus} by vendor: ${vendorId}`);
            await this.handleStatusChangeEvents(collectionId, collection.status, newStatus, vendorId);
          }
          
          return updateResult;
      }

    } catch (error) {
      console.error('Error updating collection status:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to update collection status',
        'An error occurred while updating the collection status.'
      );
    }
  }

  /**
   * Completes a collection when minimum subscribers reached
   * Validates: Requirement 7.4 - Automatic completion rules
   */
  static async completeCollection(
    collectionId: string,
    vendorId: string
  ): Promise<ServiceResponse<CollectionWaitlist>> {
    try {
      // Get current collection
      const collectionResult = await getCollectionWaitlist(collectionId);
      if (!collectionResult.success || !collectionResult.data) {
        return collectionResult;
      }

      const collection = collectionResult.data;

      // Verify ownership
      if (collection.vendorId !== vendorId) {
        return this.createErrorResponse(
          WaitlistErrorCode.PERMISSION_DENIED,
          'Access denied',
          'You do not have permission to complete this collection.'
        );
      }

      // Validate completion requirements
      if (collection.status !== 'published') {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Collection must be published to be completed',
          'Only published collections can be marked as completed.'
        );
      }

      if (collection.currentSubscribers < collection.minSubscribers) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Minimum subscribers not reached',
          `Collection needs ${collection.minSubscribers - collection.currentSubscribers} more subscribers to be completed.`
        );
      }

      // Update status to completed
      const updateResult = await updateCollectionStatusInDb(collectionId, 'completed', vendorId);
      
      if (!updateResult.success) {
        return updateResult;
      }

      // Log completion event
      console.log(`Collection completed: ${collectionId} with ${collection.currentSubscribers} subscribers`);
      
      // TODO: Trigger completion notifications and launch processes
      await this.handleCollectionCompletionEvents(collectionId, vendorId, collection.currentSubscribers);

      return updateResult;

    } catch (error) {
      console.error('Error completing collection:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to complete collection',
        'An error occurred while completing the collection.'
      );
    }
  }

  // ============================================================================
  // Business Rule Validation (Requirement 7.4)
  // ============================================================================

  /**
   * Validates business rules for publishing
   * Enforces: Requirement 7.2 - Publishing requirements
   */
  private static validatePublishingBusinessRules(collection: CollectionWaitlist): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    // Minimum subscribers validation
    if (collection.minSubscribers < 1) {
      errors.push({
        field: 'minSubscribers',
        message: 'Minimum subscribers must be at least 1 to publish the collection.'
      });
    }

    if (collection.minSubscribers > 10000) {
      errors.push({
        field: 'minSubscribers',
        message: 'Minimum subscribers cannot exceed 10,000 for a single collection.'
      });
    }

    // Product pairs validation
    if (!collection.pairedProducts || collection.pairedProducts.length === 0) {
      errors.push({
        field: 'pairedProducts',
        message: 'At least one product pair is required to publish the collection.'
      });
    }

    // Image validation
    if (!collection.imageUrl || collection.imageUrl.trim().length === 0) {
      errors.push({
        field: 'imageUrl',
        message: 'Collection image is required to publish the collection.'
      });
    }

    // Name and description validation
    if (!collection.name || collection.name.trim().length < 3) {
      errors.push({
        field: 'name',
        message: 'Collection name must be at least 3 characters to publish.'
      });
    }

    if (!collection.description || collection.description.trim().length < 10) {
      errors.push({
        field: 'description',
        message: 'Collection description must be at least 10 characters to publish.'
      });
    }

    return errors;
  }

  /**
   * Validates business rules for status changes
   * Enforces: Requirement 7.4 - Status change business rules
   */
  private static async validateStatusChangeBusinessRules(
    collection: CollectionWaitlist,
    newStatus: CollectionStatus,
    metadata?: { reason?: string; force?: boolean }
  ): Promise<ServiceResponse<void>> {
    try {
      // Rule: Cannot change minimum subscribers after publishing (Requirement 7.2)
      if (collection.status === 'published' && newStatus === 'published') {
        // This would be an update to a published collection, which should be handled separately
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Collection is already published',
          'Collection is already in published status.'
        );
      }

      // Rule: Cannot unpublish completed collections unless forced
      if (collection.status === 'completed' && newStatus === 'archived' && !metadata?.force) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Cannot archive completed collection',
          'Completed collections cannot be archived without administrator approval.'
        );
      }

      // Rule: Cannot change status if collection has active subscriptions (unless archiving)
      if (collection.currentSubscribers > 0 && newStatus === 'draft') {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Cannot revert to draft with active subscriptions',
          'Collections with active subscriptions cannot be reverted to draft status.'
        );
      }

      // Rule: Automatic completion when minimum subscribers reached
      if (collection.status === 'published' && 
          collection.currentSubscribers >= collection.minSubscribers && 
          newStatus !== 'completed') {
        console.warn(`Collection ${collection.id} has reached minimum subscribers but is not being completed`);
      }

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error validating status change business rules:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.VALIDATION_ERROR,
        'Business rule validation failed',
        'Unable to validate status change requirements.'
      );
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles events triggered by collection publishing
   */
  private static async handlePublishingEvents(collectionId: string, vendorId: string): Promise<void> {
    try {
      // TODO: Implement event handling
      // - Send notification to vendor about successful publishing
      // - Update analytics
      // - Trigger SEO indexing for public collection page
      // - Send to marketing channels if configured
      
      console.log(`Publishing events triggered for collection: ${collectionId}`);
    } catch (error) {
      console.error('Error handling publishing events:', error);
    }
  }

  /**
   * Handles events triggered by collection unpublishing
   */
  private static async handleUnpublishingEvents(
    collectionId: string, 
    vendorId: string, 
    reason?: string
  ): Promise<void> {
    try {
      // TODO: Implement event handling
      // - Send notifications to active subscribers about collection being unpublished
      // - Update analytics
      // - Remove from public listings
      // - Archive related data
      
      console.log(`Unpublishing events triggered for collection: ${collectionId}, reason: ${reason}`);
    } catch (error) {
      console.error('Error handling unpublishing events:', error);
    }
  }

  /**
   * Handles events triggered by collection completion
   */
  private static async handleCollectionCompletionEvents(
    collectionId: string, 
    vendorId: string, 
    subscriberCount: number
  ): Promise<void> {
    try {
      // TODO: Implement event handling
      // - Send launch notifications to all subscribers
      // - Trigger product launch processes
      // - Update vendor analytics and achievements
      // - Generate completion report
      
      console.log(`Completion events triggered for collection: ${collectionId} with ${subscriberCount} subscribers`);
    } catch (error) {
      console.error('Error handling completion events:', error);
    }
  }

  /**
   * Handles general status change events
   */
  private static async handleStatusChangeEvents(
    collectionId: string,
    oldStatus: CollectionStatus,
    newStatus: CollectionStatus,
    vendorId: string
  ): Promise<void> {
    try {
      // TODO: Implement event handling
      // - Update analytics
      // - Log status change history
      // - Trigger relevant notifications
      
      console.log(`Status change events triggered for collection: ${collectionId} from ${oldStatus} to ${newStatus}`);
    } catch (error) {
      console.error('Error handling status change events:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Gets missing requirements for publishing
   */
  private static getMissingPublishingRequirements(collection: CollectionWaitlist): string[] {
    const missing: string[] = [];

    if (!collection.name || collection.name.trim().length < 3) {
      missing.push('Collection name (minimum 3 characters)');
    }

    if (!collection.description || collection.description.trim().length < 10) {
      missing.push('Collection description (minimum 10 characters)');
    }

    if (!collection.imageUrl) {
      missing.push('Collection image');
    }

    if (!collection.pairedProducts || collection.pairedProducts.length === 0) {
      missing.push('At least one product pair');
    }

    if (collection.minSubscribers < 1) {
      missing.push('Minimum subscribers (at least 1)');
    }

    return missing;
  }

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
   * Checks if a collection can be published
   */
  static canPublishCollection(collection: CollectionWaitlist): boolean {
    const errors = validatePublishingRules(collection);
    return errors.length === 0 && collection.status === 'draft';
  }

  /**
   * Checks if a collection can be unpublished
   */
  static canUnpublishCollection(collection: CollectionWaitlist): boolean {
    return collection.status === 'published';
  }

  /**
   * Checks if a collection can be completed
   */
  static canCompleteCollection(collection: CollectionWaitlist): boolean {
    return collection.status === 'published' && 
           collection.currentSubscribers >= collection.minSubscribers;
  }

  /**
   * Gets the progress percentage towards minimum subscribers
   */
  static getCollectionProgress(collection: CollectionWaitlist): number {
    if (collection.minSubscribers === 0) return 100;
    return Math.min(100, (collection.currentSubscribers / collection.minSubscribers) * 100);
  }
}