/**
 * User Profile Management Utilities
 * 
 * This module provides utility functions for managing user profiles,
 * determining user status, and handling onboarding flows.
 */

import { UserProfile, UserStatus } from '@/types';
import { userProfileRepository } from '@/lib/firestore';

/**
 * Determines if a user is accessing the application for the first time
 * @param uid - The user's unique identifier
 * @returns Promise<boolean> - True if user is first-time, false otherwise
 */
export async function isFirstTimeUser(uid: string): Promise<boolean> {
  try {
    return await userProfileRepository.isFirstTimeUser(uid);
  } catch (error) {
    console.error('Error checking if first time user:', error);
    // Default to true for safety - better to show onboarding than skip it
    return true;
  }
}

/**
 * Determines if a user has completed the onboarding process
 * @param uid - The user's unique identifier
 * @returns Promise<boolean> - True if onboarding is complete, false otherwise
 */
export async function hasCompletedOnboarding(uid: string): Promise<boolean> {
  try {
    return await userProfileRepository.hasCompletedOnboarding(uid);
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    // Default to false for safety - better to show onboarding than skip it
    return false;
  }
}

/**
 * Gets comprehensive user status information
 * @param uid - The user's unique identifier
 * @returns Promise<UserStatus | null> - User status object or null if not found
 */
export async function getUserStatus(uid: string): Promise<UserStatus | null> {
  try {
    return await userProfileRepository.getUserStatus(uid);
  } catch (error) {
    console.error('Error getting user status:', error);
    return null;
  }
}

/**
 * Creates or updates a user profile for new users
 * @param uid - The user's unique identifier
 * @param email - The user's email address
 * @param displayName - Optional display name
 * @param photoURL - Optional profile photo URL
 * @returns Promise<UserProfile> - The created user profile
 */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<UserProfile> {
  try {
    return await userProfileRepository.createProfile(uid, email, displayName, photoURL);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
}

/**
 * Gets or creates a user profile
 * @param uid - The user's unique identifier
 * @param email - The user's email address
 * @param displayName - Optional display name
 * @param photoURL - Optional profile photo URL
 * @returns Promise<UserProfile> - The user profile
 */
export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<UserProfile> {
  try {
    // Try to get existing profile first
    let profile = await userProfileRepository.getProfile(uid);
    
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = await createUserProfile(uid, email, displayName, photoURL);
    } else {
      // Update last login for existing profile
      await userProfileRepository.updateLastLogin(uid, email, displayName, photoURL);
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting or creating user profile:', error);
    throw new Error('Failed to get or create user profile');
  }
}

/**
 * Marks measurements as completed for a user
 * @param uid - The user's unique identifier
 * @returns Promise<void>
 */
export async function markMeasurementsCompleted(uid: string): Promise<void> {
  try {
    await userProfileRepository.markMeasurementsCompleted(uid);
  } catch (error) {
    console.error('Error marking measurements completed:', error);
    throw new Error('Failed to mark measurements completed');
  }
}

/**
 * Marks the entire onboarding process as completed
 * @param uid - The user's unique identifier
 * @returns Promise<void>
 */
export async function markOnboardingCompleted(uid: string): Promise<void> {
  try {
    await userProfileRepository.markOnboardingCompleted(uid);
  } catch (error) {
    console.error('Error marking onboarding completed:', error);
    throw new Error('Failed to mark onboarding completed');
  }
}

/**
 * Allows user to skip measurements and complete onboarding
 * @param uid - The user's unique identifier
 * @returns Promise<void>
 */
export async function skipMeasurements(uid: string): Promise<void> {
  try {
    await userProfileRepository.skipMeasurements(uid);
  } catch (error) {
    console.error('Error skipping measurements:', error);
    throw new Error('Failed to skip measurements');
  }
}

/**
 * Determines the appropriate redirect path based on user status
 * @param uid - The user's unique identifier
 * @returns Promise<string> - The path to redirect to
 */
export async function getRedirectPath(uid: string): Promise<string> {
  try {
    const status = await getUserStatus(uid);
    
    if (!status) {
      // New user - redirect to measurements
      return '/measurements';
    }
    
    if (status.isFirstTime && !status.hasCompletedMeasurements) {
      // First-time user who hasn't completed measurements
      return '/measurements';
    }
    
    // Existing user or completed onboarding - redirect to landing page
    return '/';
  } catch (error) {
    console.error('Error determining redirect path:', error);
    // Default to measurements for safety
    return '/measurements';
  }
}

/**
 * Determines the appropriate redirect path specifically for login flow
 * Login flow should prioritize sending existing users to landing page
 * @param uid - The user's unique identifier
 * @returns Promise<string> - The path to redirect to for login flow
 */
export async function getLoginRedirectPath(uid: string): Promise<string> {
  try {
    const status = await userProfileRepository.getUserStatus(uid);
    
    if (!status) {
      // Genuinely new user (no error, just no status record)
      return '/measurements';
    }
    
    // For login flow, prioritize existing users going to landing page
    // Only redirect to measurements if user is explicitly first-time and hasn't completed onboarding
    if (status.isFirstTime && status.onboardingStep !== 'completed' && !status.hasCompletedMeasurements) {
      // First-time user who hasn't completed measurements - redirect to measurements
      return '/measurements';
    }
    
    // For all other cases (existing users, users who have completed onboarding)
    // redirect to landing page as this is a login flow - existing users should skip measurements
    return '/';
  } catch (error) {
    console.error('Error determining login redirect path:', error);
    // For login flow, default to landing page for better UX - assume existing user
    return '/';
  }
}

/**
 * Determines if user should see the measurements screen
 * @param uid - The user's unique identifier
 * @returns Promise<boolean> - True if user should see measurements, false otherwise
 */
export async function shouldShowMeasurements(uid: string): Promise<boolean> {
  try {
    const status = await getUserStatus(uid);
    
    if (!status) {
      // New user should see measurements
      return true;
    }
    
    // Show measurements if user is first-time and hasn't completed them
    return status.isFirstTime && !status.hasCompletedMeasurements;
  } catch (error) {
    console.error('Error determining if should show measurements:', error);
    // Default to true for safety
    return true;
  }
}

/**
 * Updates user profile with additional information
 * @param uid - The user's unique identifier
 * @param updates - Partial user profile updates
 * @returns Promise<void>
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await userProfileRepository.updateProfile(uid, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Gets the current onboarding step for a user
 * @param uid - The user's unique identifier
 * @returns Promise<'pending' | 'measurements' | 'completed'> - Current onboarding step
 */
export async function getCurrentOnboardingStep(
  uid: string
): Promise<'pending' | 'measurements' | 'completed'> {
  try {
    const status = await getUserStatus(uid);
    return status?.onboardingStep || 'pending';
  } catch (error) {
    console.error('Error getting current onboarding step:', error);
    return 'pending';
  }
}

/**
 * Validates if a redirect URL is safe and allowed
 * @param redirectUrl - The URL to validate
 * @returns boolean - True if the URL is safe to redirect to
 */
export function isValidRedirectUrl(redirectUrl: string): boolean {
  try {
    // Ensure we have a string to work with
    if (!redirectUrl || typeof redirectUrl !== 'string') {
      return false;
    }
    
    // List of allowed paths for redirect
    const validPaths = [
      '/', 
      '/products', 
      '/cart', 
      '/wishlist', 
      '/account', 
      '/measurements',
      '/orders',
      '/checkout',
      '/shops',
      '/shops/products',
      '/shops/cart',
      '/shops/wishlist',
      '/shops/account',
      '/shops/measurements',
      '/shops/orders',
      '/shops/checkout'
    ];
    
    // Check if it's a relative path (starts with /)
    if (!redirectUrl.startsWith('/')) {
      return false;
    }
    
    // Remove query parameters and fragments for path validation
    const pathOnly = redirectUrl.split('?')[0].split('#')[0];
    
    // Additional security checks first
    // Prevent javascript: or data: URLs (case insensitive)
    const lowerUrl = redirectUrl.toLowerCase();
    if (lowerUrl.includes('javascript:') || 
        lowerUrl.includes('data:') ||
        lowerUrl.includes('vbscript:') ||
        lowerUrl.includes('file:')) {
      return false;
    }
    
    // Prevent protocol-relative URLs
    if (redirectUrl.startsWith('//')) {
      return false;
    }
    
    // Prevent encoded characters that could be used for bypassing
    if (redirectUrl.includes('%') && 
        (redirectUrl.includes('%2F') || redirectUrl.includes('%2f') || 
         redirectUrl.includes('%3A') || redirectUrl.includes('%3a'))) {
      return false;
    }
    
    // Check if it matches allowed paths or sub-paths
    const isValidPath = validPaths.some(path => pathOnly === path || pathOnly.startsWith(path + '/')) || 
                       pathOnly.startsWith('/products/') || // Allow product detail pages
                       pathOnly.startsWith('/account/') || // Allow account sub-pages
                       pathOnly.startsWith('/shops/products/') || // Allow shops product detail pages
                       pathOnly.startsWith('/shops/account/'); // Allow shops account sub-pages
    
    return isValidPath;
  } catch (error) {
    console.error('Error validating redirect URL:', error);
    return false;
  }
}

/**
 * Extracts and validates redirect parameters from URL search params
 * @param searchParams - URLSearchParams object
 * @returns string | null - Valid redirect URL or null
 */
export function extractValidRedirectParam(searchParams: URLSearchParams): string | null {
  // Check multiple possible parameter names for intended destination
  const possibleParams = ['redirect', 'returnTo', 'return_to', 'next', 'from'];
  
  for (const param of possibleParams) {
    const redirectUrl = searchParams.get(param);
    if (redirectUrl) {
      // Decode URL-encoded parameters
      try {
        const decodedUrl = decodeURIComponent(redirectUrl);
        if (isValidRedirectUrl(decodedUrl)) {
          return decodedUrl;
        }
      } catch (decodeError) {
        // If decoding fails, try the original
        if (isValidRedirectUrl(redirectUrl)) {
          return redirectUrl;
        }
      }
    }
  }
  return null;
}

/**
 * Determines redirect destination with fallback handling for login flow
 * @param userId - The user's unique identifier
 * @param intendedDestination - Optional intended destination from URL params
 * @returns Promise<string> - The safe redirect destination
 */
export async function getLoginRedirectDestination(
  userId: string, 
  intendedDestination?: string | null
): Promise<string> {
  try {
    // Get user status to determine appropriate redirect logic
    const userRedirectPath = await getLoginRedirectPath(userId);
    
    // If there's an intended destination, validate it first
    if (intendedDestination && isValidRedirectUrl(intendedDestination)) {
      // For login flow, prioritize user onboarding requirements
      // If user needs measurements, redirect there regardless of intended destination
      // unless they specifically requested the measurements page
      if (userRedirectPath === '/measurements') {
        // User needs to complete measurements first
        if (intendedDestination === '/measurements') {
          return '/measurements';
        }
        // User needs measurements but requested different page
        // Prioritize measurements completion for proper onboarding flow
        return '/measurements';
      }
      
      // User doesn't need measurements - honor the intended destination
      // This ensures existing users can access their intended pages directly after login
      return intendedDestination;
    }
    
    // No valid intended destination - use login-specific logic
    // This ensures existing users go to landing page, new users go to measurements
    return userRedirectPath;
  } catch (error) {
    console.error('Error determining login redirect destination:', error);
    // Ultimate fallback for login flow - prioritize landing page for better UX
    return '/';
  }
}