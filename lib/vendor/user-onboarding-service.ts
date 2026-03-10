/**
 * User Onboarding Service
 * Handles automatic user account creation for waitlist subscribers
 * Implements Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { 
  WaitlistSubscription,
  AutoUserCreationData,
  ServiceResponse,
  WaitlistErrorCode,
  ServiceError
} from '@/types/vendor-waitlist';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';

// Database collections
const COLLECTIONS = {
  USERS: 'staging_users',
  WAITLIST_SUBSCRIPTIONS: 'staging_waitlist_subscriptions'
} as const;

/**
 * User Onboarding Service
 * Provides automatic user account creation and linking for waitlist subscribers
 */
export class UserOnboardingService {

  // ============================================================================
  // Automatic User Account Creation (Requirements 6.1, 6.2, 6.3, 6.4)
  // ============================================================================

  /**
   * Creates a Firebase Auth user account automatically for a waitlist subscriber
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4
   */
  static async createUserAccountForSubscription(
    subscription: WaitlistSubscription
  ): Promise<ServiceResponse<{ userId: string; password: string; userRecord: UserRecord }>> {
    try {
      // Step 1: Generate secure password (Requirement 6.2)
      const generatedPassword = this.generateSecurePassword();

      // Step 2: Create Firebase Auth user (Requirement 6.1)
      const userCreationData: AutoUserCreationData = {
        email: subscription.email,
        fullName: subscription.fullName,
        phoneNumber: subscription.phoneNumber,
        password: generatedPassword,
        subscriptionId: subscription.id,
        collectionId: subscription.collectionId
      };

      const userResult = await this.createFirebaseAuthUser(userCreationData);
      
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: userResult.error,
          timestamp: Timestamp.now()
        };
      }

      const { userRecord, password } = userResult.data;

      // Step 3: Create user profile document (Requirement 6.2)
      const profileResult = await this.createUserProfile(userRecord, subscription);
      
      if (!profileResult.success) {
        // If profile creation fails, we should clean up the auth user
        try {
          await adminAuth.deleteUser(userRecord.uid);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user after profile creation failure:', cleanupError);
        }
        
        return {
          success: false,
          error: profileResult.error,
          timestamp: Timestamp.now()
        };
      }

      // Step 4: Link subscription to user account (Requirement 6.3)
      const linkResult = await this.linkSubscriptionToUser(subscription.id, userRecord.uid);
      
      if (!linkResult.success) {
        console.error('Failed to link subscription to user account:', linkResult.error);
        // Don't fail the entire process if linking fails, but log it
      }

      console.log(`User account created for subscription: ${subscription.id}, userId: ${userRecord.uid}`);

      return {
        success: true,
        data: {
          userId: userRecord.uid,
          password: password,
          userRecord: userRecord
        },
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error creating user account for subscription:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.USER_CREATION_FAILED,
        'Failed to create user account',
        'Unable to create your account automatically. Please contact support.'
      );
    }
  }

  /**
   * Creates a Firebase Auth user with generated credentials
   * Validates: Requirements 6.1, 6.2
   */
  private static async createFirebaseAuthUser(
    userData: AutoUserCreationData
  ): Promise<ServiceResponse<{ userRecord: UserRecord; password: string }>> {
    try {
      // Check if user already exists
      const existingUserResult = await this.checkExistingUser(userData.email);
      
      if (existingUserResult.exists) {
        // User already exists, return existing user info
        if (existingUserResult.userRecord) {
          return {
            success: true,
            data: {
              userRecord: existingUserResult.userRecord,
              password: '' // Don't return password for existing users
            },
            timestamp: Timestamp.now()
          };
        } else {
          return this.createErrorResponse(
            WaitlistErrorCode.USER_CREATION_FAILED,
            'User exists but could not be retrieved',
            'An account with this email already exists.'
          );
        }
      }

      // Create new Firebase Auth user (Requirement 6.1)
      const userRecord = await adminAuth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.fullName,
        phoneNumber: this.formatPhoneNumberForFirebase(userData.phoneNumber),
        emailVerified: false, // Will be verified through email confirmation
        disabled: false
      });

      // Set custom claims for user type
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        userType: 'waitlist_subscriber',
        subscriptionId: userData.subscriptionId,
        collectionId: userData.collectionId,
        createdVia: 'waitlist_auto_registration'
      });

      console.log(`Firebase Auth user created: ${userRecord.uid} for email: ${userData.email}`);

      return {
        success: true,
        data: {
          userRecord: userRecord,
          password: userData.password
        },
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error creating Firebase Auth user:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-exists') {
        return this.createErrorResponse(
          WaitlistErrorCode.USER_CREATION_FAILED,
          'Email already exists',
          'An account with this email address already exists.'
        );
      }
      
      if (error.code === 'auth/invalid-email') {
        return this.createErrorResponse(
          WaitlistErrorCode.INVALID_EMAIL,
          'Invalid email address',
          'The provided email address is invalid.'
        );
      }
      
      if (error.code === 'auth/invalid-phone-number') {
        return this.createErrorResponse(
          WaitlistErrorCode.INVALID_PHONE,
          'Invalid phone number',
          'The provided phone number is invalid.'
        );
      }

      return this.createErrorResponse(
        WaitlistErrorCode.USER_CREATION_FAILED,
        'Failed to create Firebase Auth user',
        'Unable to create your account. Please try again.'
      );
    }
  }

  /**
   * Creates a user profile document in Firestore
   * Validates: Requirements 6.2, 6.4
   */
  private static async createUserProfile(
    userRecord: UserRecord,
    subscription: WaitlistSubscription
  ): Promise<ServiceResponse<void>> {
    try {
      const now = Timestamp.now();
      
      const userProfile = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || subscription.fullName,
        phoneNumber: userRecord.phoneNumber || subscription.phoneNumber,
        
        // Profile information
        firstName: this.extractFirstName(subscription.fullName),
        lastName: this.extractLastName(subscription.fullName),
        fullName: subscription.fullName,
        
        // Account metadata
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
        emailVerified: userRecord.emailVerified,
        phoneVerified: false,
        
        // Account source tracking
        accountSource: 'waitlist_auto_registration',
        sourceSubscriptionId: subscription.id,
        sourceCollectionId: subscription.collectionId,
        
        // User preferences (inherited from subscription)
        preferences: {
          emailNotifications: subscription.preferences?.emailNotifications ?? true,
          smsNotifications: subscription.preferences?.smsNotifications ?? false,
          marketingEmails: subscription.preferences?.marketingEmails ?? false,
          language: 'en',
          timezone: 'UTC'
        },
        
        // User status
        status: 'active',
        userType: 'customer',
        roles: ['waitlist_subscriber'],
        
        // Onboarding status
        onboardingCompleted: false,
        onboardingStep: 'email_verification',
        passwordChangeRequired: true, // User should change auto-generated password
        
        // Privacy and terms
        termsAcceptedAt: now,
        privacyPolicyAcceptedAt: now,
        marketingOptIn: subscription.preferences?.marketingEmails ?? false
      };

      // Save user profile to Firestore
      await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userRecord.uid)
        .set(userProfile);

      console.log(`User profile created: ${userRecord.uid}`);

      return {
        success: true,
        timestamp: now
      };

    } catch (error) {
      console.error('Error creating user profile:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.USER_CREATION_FAILED,
        'Failed to create user profile',
        'Unable to complete account setup.'
      );
    }
  }

  /**
   * Links the waitlist subscription to the created user account
   * Validates: Requirements 6.3, 6.4
   */
  private static async linkSubscriptionToUser(
    subscriptionId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Update subscription with user ID
      await adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .doc(subscriptionId)
        .update({
          userId: userId,
          userLinkedAt: Timestamp.now()
        });

      console.log(`Subscription linked to user: ${subscriptionId} -> ${userId}`);

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error linking subscription to user:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.USER_CREATION_FAILED,
        'Failed to link subscription to user',
        'Unable to complete account linking.'
      );
    }
  }

  // ============================================================================
  // User Management Utilities
  // ============================================================================

  /**
   * Checks if a user already exists with the given email
   */
  private static async checkExistingUser(
    email: string
  ): Promise<{ exists: boolean; userRecord?: UserRecord }> {
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      return {
        exists: true,
        userRecord: userRecord
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return { exists: false };
      }
      
      console.error('Error checking existing user:', error);
      return { exists: false };
    }
  }

  /**
   * Generates a secure random password
   * Validates: Requirement 6.2
   */
  private static generateSecurePassword(): string {
    // Generate a secure 12-character password with mixed case, numbers, and symbols
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Formats phone number for Firebase Auth
   */
  private static formatPhoneNumberForFirebase(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present and number doesn't start with +
    if (!cleaned.startsWith('+')) {
      // Assume it's a Nigerian number if no country code
      if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = '+234' + cleaned.substring(1);
      } else if (cleaned.length === 10) {
        cleaned = '+234' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Extracts first name from full name
   */
  private static extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts[0] || '';
  }

  /**
   * Extracts last name from full name
   */
  private static extractLastName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return '';
  }

  // ============================================================================
  // Account Management
  // ============================================================================

  /**
   * Enables future login for auto-created accounts
   * Validates: Requirement 6.4
   */
  static async enableAccountLogin(
    userId: string,
    newPassword?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const updates: any = {
        disabled: false,
        emailVerified: true
      };

      if (newPassword) {
        updates.password = newPassword;
      }

      await adminAuth.updateUser(userId, updates);

      // Update user profile
      await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({
          emailVerified: true,
          passwordChangeRequired: newPassword ? false : true,
          onboardingStep: newPassword ? 'completed' : 'password_change',
          updatedAt: Timestamp.now()
        });

      console.log(`Account login enabled for user: ${userId}`);

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error enabling account login:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.USER_CREATION_FAILED,
        'Failed to enable account login',
        'Unable to activate your account for login.'
      );
    }
  }

  /**
   * Sends welcome email with login credentials
   * Note: This would integrate with the notification service
   */
  static async sendWelcomeCredentials(
    userId: string,
    email: string,
    password: string,
    subscriptionId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // TODO: Integrate with notification service to send welcome email
      // For now, we'll just log the credentials (in production, this should be sent via email)
      
      console.log(`Welcome credentials for user ${userId}:`);
      console.log(`Email: ${email}`);
      console.log(`Temporary Password: ${password}`);
      console.log(`Subscription ID: ${subscriptionId}`);
      
      // In production, this would call the notification service:
      // await NotificationService.sendWelcomeEmail({
      //   recipientEmail: email,
      //   recipientName: fullName,
      //   temporaryPassword: password,
      //   loginUrl: process.env.NEXT_PUBLIC_APP_URL + '/login',
      //   subscriptionId: subscriptionId
      // });

      return {
        success: true,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error sending welcome credentials:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.NOTIFICATION_FAILED,
        'Failed to send welcome credentials',
        'Your account was created but we could not send the login details. Please contact support.'
      );
    }
  }

  /**
   * Gets user account information by subscription ID
   */
  static async getUserBySubscriptionId(subscriptionId: string): Promise<ServiceResponse<UserRecord>> {
    try {
      // Get subscription to find user ID
      const subscriptionDoc = await adminDb
        .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
        .doc(subscriptionId)
        .get();

      if (!subscriptionDoc.exists) {
        return this.createErrorResponse(
          WaitlistErrorCode.SUBSCRIPTION_NOT_FOUND,
          'Subscription not found',
          'The subscription could not be found.'
        );
      }

      const subscription = subscriptionDoc.data() as WaitlistSubscription;
      
      if (!subscription.userId) {
        return this.createErrorResponse(
          WaitlistErrorCode.USER_CREATION_FAILED,
          'User not linked to subscription',
          'No user account is linked to this subscription.'
        );
      }

      // Get user record
      const userRecord = await adminAuth.getUser(subscription.userId);

      return {
        success: true,
        data: userRecord,
        timestamp: Timestamp.now()
      };

    } catch (error) {
      console.error('Error getting user by subscription ID:', error);
      return this.createErrorResponse(
        WaitlistErrorCode.UNKNOWN_ERROR,
        'Failed to get user information',
        'Unable to retrieve user account information.'
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
   * Validates that a user account was created successfully
   */
  static async validateUserCreation(userId: string): Promise<boolean> {
    try {
      const userRecord = await adminAuth.getUser(userId);
      const userProfile = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();

      return userRecord && userProfile.exists;
    } catch (error) {
      console.error('Error validating user creation:', error);
      return false;
    }
  }

  /**
   * Cleans up failed user creation attempts
   */
  static async cleanupFailedUserCreation(userId: string): Promise<void> {
    try {
      // Delete Firebase Auth user
      await adminAuth.deleteUser(userId);
      
      // Delete user profile document
      await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .delete();

      console.log(`Cleaned up failed user creation: ${userId}`);
    } catch (error) {
      console.error('Error cleaning up failed user creation:', error);
    }
  }
}