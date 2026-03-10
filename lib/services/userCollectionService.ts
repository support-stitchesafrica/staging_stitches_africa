/**
 * User Collection Service
 * 
 * This service manages the `users` collection (mobile app format)
 * Separate from `user_profiles` collection (web format)
 * 
 * Usage:
 * ```typescript
 * import { createUserDocument } from '@/lib/services/userCollectionService';
 * 
 * await createUserDocument(userId, userData);
 * ```
 */

import { db } from "@/firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface UserDocumentData {
  email: string;
  first_name: string;
  last_name: string;
  is_general_admin: boolean;
  is_sub_tailor: boolean;
  is_tailor: boolean;
  language_preference: string;
  shopping_preference: string[];
  ratings?: any[];
  transactions?: any;
  created_at?: any;
  registration_country?: string;
  registration_state?: string;
}

/**
 * Split display name into first and last name
 * @param displayName - Full name from auth provider
 * @returns Object with firstName and lastName
 */
export function splitDisplayName(displayName?: string | null): { 
  firstName: string; 
  lastName: string;
} {
  if (!displayName || displayName.trim() === '') {
    return { firstName: 'User', lastName: '' };
  }

  const parts = displayName.trim().split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { firstName: 'User', lastName: '' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  } else {
    // First part is first name, rest is last name
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }
}

/**
 * Extract first name from email
 * @param email - Email address
 * @returns First name extracted from email
 */
export function getFirstNameFromEmail(email: string): string {
  const username = email.split('@')[0];
  // Capitalize first letter
  return username.charAt(0).toUpperCase() + username.slice(1);
}

/**
 * Create user document in users collection
 * @param userId - Firebase Auth UID
 * @param data - User data
 */
export async function createUserDocument(
  userId: string,
  data: {
    email: string;
    displayName?: string | null;
    shoppingPreference?: string[];
    registrationCountry?: string;
    registrationState?: string;
  }
): Promise<void> {
  try {
    const { firstName, lastName } = splitDisplayName(data.displayName);
    
    // Fallback to email-based name if displayName provided nothing useful
    const finalFirstName = firstName === 'User' ? getFirstNameFromEmail(data.email) : firstName;
    
    const userData: UserDocumentData = {
      email: data.email,
      first_name: finalFirstName,
      last_name: lastName,
      is_general_admin: false,
      is_sub_tailor: false,
      is_tailor: false,
      language_preference: "en",
      shopping_preference: data.shoppingPreference || [],
      ratings: [],
      transactions: {},
      created_at: serverTimestamp(),
    };

    // Add location data if available
    if (data.registrationCountry) {
      userData.registration_country = data.registrationCountry;
    }
    if (data.registrationState) {
      userData.registration_state = data.registrationState;
    }

    const userDocRef = doc(db, "staging_users", userId);
    await setDoc(userDocRef, userData, { merge: true });
    
    console.log('✅ User document created in users collection:', userId);
  } catch (error) {
    console.error('Error creating user document:', error);
    // Don't throw - this is supplementary, shouldn't block auth
  }
}

/**
 * Update shopping preference for existing user
 * @param userId - Firebase Auth UID
 * @param shoppingPreference - Shopping preference value
 */
export async function updateShoppingPreference(
  userId: string,
  shoppingPreference: string
): Promise<void> {
  try {
    const userDocRef = doc(db, "staging_users", userId);
    await updateDoc(userDocRef, {
      shopping_preference: shoppingPreference,
    });
    
    console.log('✅ Shopping preference updated:', shoppingPreference);
  } catch (error) {
    console.error('Error updating shopping preference:', error);
  }
}

/**
 * Check if user document exists
 * @param userId - Firebase Auth UID
 * @returns True if document exists
 */
export async function userDocumentExists(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, "staging_users", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user document:', error);
    return false;
  }
}

/**
 * Get user document
 * @param userId - Firebase Auth UID
 * @returns User document data or null
 */
export async function getUserDocument(userId: string): Promise<UserDocumentData | null> {
  try {
    const userDocRef = doc(db, "staging_users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserDocumentData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
}

