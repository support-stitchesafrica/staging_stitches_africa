/**
 * Guest Checkout Service
 * Handles guest user account creation, bespoke item detection, and email notifications
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { generateSecurePassword } from '@/lib/utils/password-generator';
import { UserProfile, UserAddress, CartItem } from '@/types';
import { GuestCheckoutData } from '@/components/shops/checkout/GuestCheckoutModal';

export interface GuestUserCreationResult {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  hasBespokeItems: boolean;
}

/**
 * Check if cart contains bespoke items
 */
export function hasBespokeItems(cartItems: CartItem[]): boolean {
  const hasBespoke = cartItems.some(item => {
    // Check if item type is explicitly bespoke
    if (item.type === 'bespoke') {
      return true;
    }

    // Check if product has bespoke type
    if (item.product?.type === 'bespoke') {
      return true;
    }

    return false;
  });
  return hasBespoke;
}

/**
 * Create guest user account
 */
export async function createGuestUser(
  guestData: GuestCheckoutData,
  cartItems: CartItem[]
): Promise<GuestUserCreationResult> {
  try {
    // Generate secure password
    const password = generateSecurePassword(16);

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      guestData.email,
      password
    );

    const user = userCredential.user;
    const displayName = `${guestData.firstName} ${guestData.lastName}`;

    // Check for bespoke items
    const hasBespoke = hasBespokeItems(cartItems);

    // Create user profile document
    const userProfile: UserProfile = {
      uid: user.uid,
      email: guestData.email,
      displayName: displayName,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      onboardingStatus: {
        measurementsCompleted: false,
        profileCompleted: true,
        firstLoginCompleted: false
      },
      preferences: {
        productType: hasBespoke ? 'bespoke' : 'ready-to-wear',
        skipMeasurements: false
      },
      metadata: {
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
        onboardingStep: hasBespoke ? 'measurements' : 'completed',
        loginCount: 0,
        isGuestCheckout: true,
        guestCreatedAt: new Date(),
        guestPassword: password
      } as any
    };

    // Save user profile to Firestore
    await setDoc(doc(db, "staging_users", user.uid), {
      ...userProfile,
      createdAt: Timestamp.fromDate(userProfile.createdAt),
      lastLoginAt: Timestamp.fromDate(userProfile.lastLoginAt),
      'metadata.guestCreatedAt': Timestamp.fromDate(new Date())
    });

    // Save default address
    const addressData: UserAddress = {
      ...guestData.address,
      is_default: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Use users_addresses collection to match AddressService
    const addressRef = doc(collection(db, "staging_users_addresses", user.uid, 'user_addresses'));
    await setDoc(addressRef, {
      ...addressData,
      id: addressRef.id,
      userId: user.uid,
      createdAt: Timestamp.fromDate(addressData.createdAt!),
      updatedAt: Timestamp.fromDate(addressData.updatedAt!)
    });

    return {
      uid: user.uid,
      email: guestData.email,
      password: password,
      displayName: displayName,
      hasBespokeItems: hasBespoke
    };
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please provide a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password generation failed. Please try again.');
    }

    throw new Error('Failed to create guest account. Please try again.');
  }
}

/**
 * Send guest account credentials email
 */
export async function sendGuestCredentialsEmail(
  email: string,
  displayName: string,
  password: string,
  orderId?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/shops/send-guest-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        customerName: displayName,
        password,
        orderId
      })
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Migrate guest cart items to Firestore
 */
export async function migrateGuestCart(
  userId: string,
  cartItems: CartItem[]
): Promise<void> {
  if (!cartItems || cartItems.length === 0) return;

  try {
    const batchOp = writeBatch(db);
    const cartCollectionRef = collection(db, 'staging_users_cart_items', userId, 'user_cart_items');

    cartItems.forEach((item) => {
      const itemRef = doc(cartCollectionRef); // Auto-ID
      batchOp.set(itemRef, {
        ...item,
        user_id: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await batchOp.commit();
    console.log(`[GuestCheckout] Migrated ${cartItems.length} items to Firestore for user ${userId}`);
  } catch (error) {
    console.error('[GuestCheckout] Failed to migrate cart items:', error);
    // We don't throw here to avoid failing the whole checkout if migration fails
    // The items are still in the local cart/session
  }
}

/**
 * Complete guest checkout process
 */
export async function processGuestCheckout(
  guestData: GuestCheckoutData,
  cartItems: CartItem[]
): Promise<GuestUserCreationResult> {
  // Create guest user account
  const result = await createGuestUser(guestData, cartItems);

  // Migrate cart items to Firestore
  await migrateGuestCart(result.uid, cartItems);

  // Send credentials email (don't wait for it to complete)
  sendGuestCredentialsEmail(
    result.email,
    result.displayName,
    result.password
  ).catch(error => console.error('Failed to send guest credentials:', error));

  return result;
}

/**
 * Clean up guest password from user profile after email sent
 */
export async function cleanupGuestPassword(uid: string): Promise<void> {
  try {
    const userRef = doc(db, "staging_users", uid);
    await setDoc(userRef, {
      'metadata.guestPassword': null
    }, { merge: true });
  } catch (error) {}
}

