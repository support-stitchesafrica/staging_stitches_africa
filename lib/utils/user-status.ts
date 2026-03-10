// Utility functions for determining user status and onboarding state
import { User } from 'firebase/auth';
import { userProfileRepository } from '@/lib/firestore';
import { UserProfile, UserStatus } from '@/types';

/**
 * Determines if a user is accessing the application for the first time
 */
export async function isFirstTimeUser(user: User): Promise<boolean> {
  if (!user?.uid) return true;
  
  try {
    return await userProfileRepository.isFirstTimeUser(user.uid);
  } catch (error) {
    console.error('Error checking first time user status:', error);
    return true; // Default to true for safety
  }
}

/**
 * Determines if a user has completed the onboarding process
 */
export async function hasCompletedOnboarding(user: User): Promise<boolean> {
  if (!user?.uid) return false;
  
  try {
    return await userProfileRepository.hasCompletedOnboarding(user.uid);
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return false; // Default to false for safety
  }
}

/**
 * Gets comprehensive user status information
 */
export async function getUserStatus(user: User): Promise<UserStatus | null> {
  if (!user?.uid) return null;
  
  try {
    return await userProfileRepository.getUserStatus(user.uid);
  } catch (error) {
    console.error('Error getting user status:', error);
    return null;
  }
}

/**
 * Creates or updates user profile on authentication
 */
export async function createOrUpdateUserProfile(user: User): Promise<UserProfile> {
  try {
    // Check if profile already exists
    let profile = await userProfileRepository.getProfile(user.uid);
    
    if (!profile) {
      // Create new profile for first-time user
      profile = await userProfileRepository.createProfile(
        user.uid,
        user.email || '',
        user.displayName || null,
        user.photoURL || null
      );
    } else {
      // Update last login for existing user
      await userProfileRepository.updateLastLogin(
        user.uid,
        user.email || undefined,
        user.displayName || null,
        user.photoURL || null
      );
      // Refresh profile data
      profile = await userProfileRepository.getProfile(user.uid);
    }
    
    return profile!;
  } catch (error) {
    console.error('Error creating or updating user profile:', error);
    throw new Error('Failed to manage user profile');
  }
}

/**
 * Marks user measurements as completed
 */
export async function markMeasurementsCompleted(user: User): Promise<void> {
  if (!user?.uid) throw new Error('User not authenticated');
  
  try {
    await userProfileRepository.markMeasurementsCompleted(user.uid);
  } catch (error) {
    console.error('Error marking measurements completed:', error);
    throw new Error('Failed to mark measurements completed');
  }
}

/**
 * Marks user onboarding as completed
 */
export async function markOnboardingCompleted(user: User): Promise<void> {
  if (!user?.uid) throw new Error('User not authenticated');
  
  try {
    await userProfileRepository.markOnboardingCompleted(user.uid);
  } catch (error) {
    console.error('Error marking onboarding completed:', error);
    throw new Error('Failed to mark onboarding completed');
  }
}

/**
 * Allows user to skip measurements and complete onboarding
 */
export async function skipMeasurements(user: User): Promise<void> {
  if (!user?.uid) throw new Error('User not authenticated');
  
  try {
    await userProfileRepository.skipMeasurements(user.uid);
  } catch (error) {
    console.error('Error skipping measurements:', error);
    throw new Error('Failed to skip measurements');
  }
}

/**
 * Determines the appropriate redirect path based on user status
 */
export async function getRedirectPath(user: User): Promise<string> {
  if (!user?.uid) return '/auth';
  
  try {
    const status = await getUserStatus(user);
    if (!status) return '/measurements';
    
    // First time users go to measurements
    if (status.isFirstTime && status.onboardingStep === 'pending') {
      return '/measurements';
    }
    
    // Users who haven't completed onboarding go to measurements
    if (!status.hasCompletedMeasurements && status.onboardingStep !== 'completed') {
      return '/measurements';
    }
    
    // All other users go to landing page
    return '/';
  } catch (error) {
    console.error('Error determining redirect path:', error);
    return '/'; // Default to landing page
  }
}

/**
 * Checks if user should see measurements screen
 */
export async function shouldShowMeasurements(user: User): Promise<boolean> {
  if (!user?.uid) return false;
  
  try {
    const status = await getUserStatus(user);
    if (!status) return true; // New users should see measurements
    
    return status.isFirstTime || !status.hasCompletedMeasurements;
  } catch (error) {
    console.error('Error checking if should show measurements:', error);
    return false;
  }
}