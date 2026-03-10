/**
 * Waitlist Subscription Processor
 * Main orchestrator for complete subscription processing including user onboarding
 * Implements Requirements: 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3
 */

import { 
  WaitlistSubscription,
  SubscriptionForm,
  ServiceResponse,
  SubscriptionResult,
  WaitlistErrorCode,
  ServiceError,
  SubscriptionMetadata
} from '@/types/vendor-waitlist';
import { SubscriptionService } from './subscription-service';
import { UserOnboardingService } from './user-onboarding-service';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Complete Subscription Processing Service
 * Orchestrates subscription validation, creation, and user onboarding
 */
export class WaitlistSubscriptionProcessor {

  // ============================================================================
  // Complete Subscription Processing (All Requirements)
  // ============================================================================

  /**
   * Processes a complete subscription including user account creation
   * Validates: Requirements 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3
   */
  static async processCompleteSubscription(
    collectionId: string,
    subscriptionData: SubscriptionForm,
    metadata: Partial<SubscriptionMetadata> = {}
  ): Promise<ServiceResponse<SubscriptionResult>> {
    try {
      console.log(`Starting complete subscription processing for collection: ${collectionId}`);

      // Step 1: Process subscription with validation (Requirements 4.2, 4.3, 4.4, 7.1, 7.3)
      const subscriptionResult = await SubscriptionService.processSubscription(
        collectionId,
        subscriptionData,
        metadata
      );

      if (!subscriptionResult.success || !subscriptionResult.data) {
        console.error('Subscription processing failed:', subscriptionResult.error);
        return {
          success: false,
          error: subscriptionResult.error,
          timestamp: Timestamp.now()
        };
      }

      const subscription = subscriptionResult.data.subscription;
      console.log(`Subscription created successfully: ${subscription.id}`);

      // Step 2: Create user account automatically (Requirements 6.1, 6.2, 6.3, 6.4)
      const userCreationResult = await UserOnboardingService.createUserAccountForSubscription(subscription);

      let userCreated = false;
      let userId = '';
      let temporaryPassword = '';

      if (userCreationResult.success && userCreationResult.data) {
        userCreated = true;
        userId = userCreationResult.data.userId;
        temporaryPassword = userCreationResult.data.password;
        
        console.log(`User account created successfully: ${userId}`);

        // Step 3: Send welcome credentials (if user was newly created)
        if (temporaryPassword) {
          const credentialsResult = await UserOnboardingService.sendWelcomeCredentials(
            userId,
            subscription.email,
            temporaryPassword,
            subscription.id
          );

          if (!credentialsResult.success) {
            console.error('Failed to send welcome credentials:', credentialsResult.error);
            // Don't fail the entire process, but log the error
          }
        }

      } else {
        console.error('User account creation failed:', userCreationResult.error);
        
        // Check if user already exists
        if (userCreationResult.error?.code === WaitlistErrorCode.USER_CREATION_FAILED &&
            userCreationResult.error?.message.includes('already exists')) {
          
          // User already exists, try to get existing user info
          const existingUserResult = await UserOnboardingService.getUserBySubscriptionId(subscription.id);
          
          if (existingUserResult.success && existingUserResult.data) {
            userId = existingUserResult.data.uid;
            userCreated = false; // User already existed
            console.log(`Using existing user account: ${userId}`);
          }
        }

        // If we still don't have a user ID, this is a critical error
        if (!userId) {
          console.error('Critical: Subscription created but no user account available');
          // We could implement cleanup here, but for now we'll continue
          // The subscription is still valid even without automatic user creation
        }
      }

      // Step 4: Prepare final result
      const finalResult: SubscriptionResult = {
        subscription: subscription,
        userCreated: userCreated,
        userId: userId,
        notificationsSent: false, // Will be handled by notification service later
        collectionUpdated: subscriptionResult.data.collectionUpdated
      };

      console.log(`Complete subscription processing finished successfully for: ${subscription.id}`);

      return {
        success: true,
        data: finalResult,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error in complete subscription processing:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Complete subscription processing failed',
        'An error occurred while processing your subscription. Please try again.'
      );
    }
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Gets complete subscription information including user account details
   */
  static async getCompleteSubscriptionInfo(
    subscriptionId: string
  ): Promise<ServiceResponse<{
    subscription: WaitlistSubscription;
    hasUserAccount: boolean;
    userId?: string;
    userEmail?: string;
  }>> {
    try {
      // Get subscription details
      const subscriptionResult = await SubscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscriptionResult.success || !subscriptionResult.data) {
        return {
          success: false,
          error: subscriptionResult.error,
          timestamp: Timestamp.now()
        };
      }

      const subscription = subscriptionResult.data;
      let hasUserAccount = false;
      let userId: string | undefined;
      let userEmail: string | undefined;

      // Check if user account exists
      if (subscription.userId) {
        const userResult = await UserOnboardingService.getUserBySubscriptionId(subscriptionId);
        
        if (userResult.success && userResult.data) {
          hasUserAccount = true;
          userId = userResult.data.uid;
          userEmail = userResult.data.email;
        }
      }

      return {
        success: true,
        data: {
          subscription,
          hasUserAccount,
          userId,
          userEmail
        },
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error getting complete subscription info:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to get subscription information',
        'Unable to retrieve subscription details.'
      );
    }
  }

  /**
   * Processes user account creation for existing subscription (retry mechanism)
   */
  static async retryUserAccountCreation(
    subscriptionId: string
  ): Promise<ServiceResponse<{ userId: string; password: string }>> {
    try {
      // Get subscription details
      const subscriptionResult = await SubscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscriptionResult.success || !subscriptionResult.data) {
        return {
          success: false,
          error: subscriptionResult.error,
          timestamp: Timestamp.now()
        };
      }

      const subscription = subscriptionResult.data;

      // Check if user account already exists
      if (subscription.userId) {
        const existingUserResult = await UserOnboardingService.getUserBySubscriptionId(subscriptionId);
        
        if (existingUserResult.success) {
          return this.createErrorResponse(
            WaitlistErrorCode.USER_CREATION_FAILED,
            'User account already exists',
            'A user account is already linked to this subscription.'
          );
        }
      }

      // Create user account
      const userCreationResult = await UserOnboardingService.createUserAccountForSubscription(subscription);

      if (!userCreationResult.success || !userCreationResult.data) {
        return {
          success: false,
          error: userCreationResult.error,
          timestamp: Timestamp.now()
        };
      }

      const { userId, password } = userCreationResult.data;

      // Send welcome credentials
      const credentialsResult = await UserOnboardingService.sendWelcomeCredentials(
        userId,
        subscription.email,
        password,
        subscription.id
      );

      if (!credentialsResult.success) {
        console.error('Failed to send welcome credentials during retry:', credentialsResult.error);
      }

      return {
        success: true,
        data: {
          userId,
          password
        },
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error retrying user account creation:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.USER_CREATION_FAILED,
        'Failed to retry user account creation',
        'Unable to create user account. Please contact support.'
      );
    }
  }

  // ============================================================================
  // Batch Processing
  // ============================================================================

  /**
   * Processes multiple subscriptions in batch (for data migration or bulk operations)
   */
  static async processBatchSubscriptions(
    subscriptions: Array<{
      collectionId: string;
      subscriptionData: SubscriptionForm;
      metadata?: Partial<SubscriptionMetadata>;
    }>
  ): Promise<ServiceResponse<{
    successful: number;
    failed: number;
    results: Array<{
      index: number;
      success: boolean;
      subscriptionId?: string;
      userId?: string;
      error?: ServiceError;
    }>;
  }>> {
    try {
      const results: Array<{
        index: number;
        success: boolean;
        subscriptionId?: string;
        userId?: string;
        error?: ServiceError;
      }> = [];

      let successful = 0;
      let failed = 0;

      // Process subscriptions sequentially to avoid overwhelming the system
      for (let i = 0; i < subscriptions.length; i++) {
        const { collectionId, subscriptionData, metadata } = subscriptions[i];
        
        try {
          const result = await this.processCompleteSubscription(
            collectionId,
            subscriptionData,
            metadata || {}
          );

          if (result.success && result.data) {
            successful++;
            results.push({
              index: i,
              success: true,
              subscriptionId: result.data.subscription.id,
              userId: result.data.userId
            });
          } else {
            failed++;
            results.push({
              index: i,
              success: false,
              error: result.error
            });
          }

        } catch (error) {
          failed++;
          results.push({
            index: i,
            success: false,
            error: {
              code: WaitlistErrorCode.UNKNOWN_ERROR,
              message: error.message || 'Unknown error',
              userMessage: 'Processing failed for this subscription',
              recoverable: true
            }
          });
        }

        // Add small delay between processing to avoid rate limits
        if (i < subscriptions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        success: true,
        data: {
          successful,
          failed,
          results
        },
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error in batch subscription processing:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Batch processing failed',
        'Unable to process batch subscriptions.'
      );
    }
  }

  // ============================================================================
  // Validation and Utilities
  // ============================================================================

  /**
   * Validates subscription data before processing
   */
  static async validateSubscriptionRequest(
    collectionId: string,
    subscriptionData: SubscriptionForm
  ): Promise<ServiceResponse<void>> {
    try {
      // Validate form data
      const formValidation = SubscriptionService.validateSubscriptionForm(subscriptionData);
      if (!formValidation.isValid) {
        return this.createErrorResponse(
          WaitlistErrorCode.VALIDATION_ERROR,
          'Invalid subscription data',
          formValidation.errors[0].message,
          { errors: formValidation.errors }
        );
      }

      // Validate collection availability
      const collectionValidation = await SubscriptionService.validateCollectionAvailability(collectionId);
      if (!collectionValidation.success) {
        return {
          success: false,
          error: collectionValidation.error,
          timestamp: Timestamp.now()
        };
      }

      // Check for duplicate subscription
      const duplicateCheck = await SubscriptionService.checkDuplicateSubscription(
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

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error validating subscription request:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.VALIDATION_ERROR,
        'Validation failed',
        'Unable to validate subscription request.'
      );
    }
  }

  /**
   * Gets processing statistics for monitoring
   */
  static async getProcessingStats(): Promise<ServiceResponse<{
    totalSubscriptions: number;
    subscriptionsWithUsers: number;
    subscriptionsWithoutUsers: number;
    userCreationSuccessRate: number;
  }>> {
    try {
      // This would typically query analytics or aggregate data
      // For now, we'll return placeholder data
      
      const stats = {
        totalSubscriptions: 0,
        subscriptionsWithUsers: 0,
        subscriptionsWithoutUsers: 0,
        userCreationSuccessRate: 0
      };

      // TODO: Implement actual statistics gathering from database
      // This would involve querying the waitlist_subscriptions collection
      // and calculating the metrics

      return {
        success: true,
        data: stats,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error getting processing stats:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to get processing statistics',
        'Unable to retrieve processing statistics.'
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
   * Extracts processing metadata from request
   */
  static extractProcessingMetadata(request: Request): SubscriptionMetadata {
    return SubscriptionService.extractSubscriptionMetadata(request);
  }

  /**
   * Validates email format using subscription service
   */
  static isValidEmail(email: string): boolean {
    return SubscriptionService.isValidEmail(email);
  }

  /**
   * Validates phone number format using subscription service
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    return SubscriptionService.isValidPhoneNumber(phoneNumber);
  }
}