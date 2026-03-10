/**
 * Email Change Service
 * 
 * Handles email change requests with Firebase Auth verification
 * and updates email across all Firestore collections.
 */

import {
	Auth,
	User,
	verifyBeforeUpdateEmail,
	reauthenticateWithCredential,
	EmailAuthProvider,
	GoogleAuthProvider,
	OAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { db } from "@/firebase";
import { doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";

// ============================================
// ERROR HANDLING
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
	"auth/requires-recent-login":
		"For security, please confirm your identity to continue.",
	"auth/invalid-email": "That email looks invalid. Check and try again.",
	"auth/email-already-in-use":
		"That email is already used by another account.",
	"auth/weak-password": "Password is too weak.",
	"auth/wrong-password": "Incorrect password. Please try again.",
	"auth/user-not-found": "User account not found.",
	"auth/network-request-failed": "Network error. Please check your connection.",
	"auth/too-many-requests": "Too many attempts. Please try again later.",
};

function getErrorMessage(error: any): string {
	const code = error?.code;
	if (code && ERROR_MESSAGES[code]) {
		return ERROR_MESSAGES[code];
	}
	return error?.message || "Something went wrong. Please try again.";
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

export function hasPasswordCredential(user: User): boolean {
	return user.providerData.some(
		(provider) => provider.providerId === "password"
	);
}

export function getFederatedProviders(user: User): string[] {
	return user.providerData
		.filter((provider) => provider.providerId !== "password")
		.map((provider) => provider.providerId);
}

// ============================================
// MAIN EMAIL CHANGE FUNCTION
// ============================================

export interface EmailChangeResult {
	success: boolean;
	error?: string;
	requiresReauth?: boolean;
}

export async function requestEmailChange({
	auth,
	user,
	newEmail,
}: {
	auth: Auth;
	user: User;
	newEmail: string;
}): Promise<EmailChangeResult> {
	try {
		// Validate email format
		if (!isValidEmail(newEmail)) {
			return {
				success: false,
				error: ERROR_MESSAGES["auth/invalid-email"],
			};
		}

		// Check if it's the same email
		if (newEmail.toLowerCase() === user.email?.toLowerCase()) {
			return {
				success: false,
				error: "This is already your current email address.",
			};
		}

		// Firebase sends verification email to new address
		await verifyBeforeUpdateEmail(user, newEmail);

		return { success: true };
	} catch (error: any) {
		const errorCode = error?.code;
		
		// Check if reauth is required
		if (errorCode === "auth/requires-recent-login") {
			return {
				success: false,
				error: getErrorMessage(error),
				requiresReauth: true,
			};
		}

		return {
			success: false,
			error: getErrorMessage(error),
		};
	}
}

// ============================================
// REAUTHENTICATION FUNCTIONS
// ============================================

export interface ReauthResult {
	success: boolean;
	error?: string;
	user?: User;
}

export async function reauthWithPassword({
	user,
	currentPassword,
}: {
	user: User;
	currentPassword: string;
}): Promise<ReauthResult> {
	try {
		if (!user.email) {
			return {
				success: false,
				error: "No email address found for this account.",
			};
		}

		const credential = EmailAuthProvider.credential(
			user.email,
			currentPassword
		);
		await reauthenticateWithCredential(user, credential);

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: getErrorMessage(error),
		};
	}
}

export async function reauthWithProvider({
	auth,
	providerId,
}: {
	auth: Auth;
	providerId: "google.com" | "apple.com";
}): Promise<ReauthResult> {
	try {
		let provider;

		if (providerId === "google.com") {
			provider = new GoogleAuthProvider();
		} else if (providerId === "apple.com") {
			provider = new OAuthProvider("apple.com");
			provider.addScope("email");
			provider.addScope("name");
		} else {
			return { success: false, error: "Unsupported provider" };
		}

		const result = await signInWithPopup(auth, provider);
		return { success: true, user: result.user };
	} catch (error: any) {
		return {
			success: false,
			error: getErrorMessage(error),
		};
	}
}

// ============================================
// FIRESTORE EMAIL UPDATE SERVICE
// ============================================

export interface UpdateEmailInCollectionsResult {
	success: boolean;
	error?: string;
	updatedCollections: string[];
}

/**
 * Updates email address across all Firestore collections
 * This should be called after Firebase Auth email is verified and changed
 */
export async function updateEmailInCollections({
	userId,
	newEmail,
	oldEmail,
}: {
	userId: string;
	newEmail: string;
	oldEmail: string;
}): Promise<UpdateEmailInCollectionsResult> {
	const updatedCollections: string[] = [];
	const batch = writeBatch(db);

	try {
		// 1. Update users collection
		const userRef = doc(db, "staging_users", userId);
		const userSnap = await getDoc(userRef);
		
		if (userSnap.exists()) {
			batch.update(userRef, {
				email: newEmail,
				updatedAt: new Date().toISOString(),
			});
			updatedCollections.push("users");
		}

		// 2. Update tailors collection
		const tailorRef = doc(db, "staging_tailors", userId);
		const tailorSnap = await getDoc(tailorRef);
		
		if (tailorSnap.exists()) {
			const tailorData = tailorSnap.data();
			
			// Update email at root level if it exists
			if (tailorData.email) {
				batch.update(tailorRef, {
					email: newEmail,
					updatedAt: new Date().toISOString(),
				});
			}
			
			// Update email in tailor_registered_info if it exists
			if (tailorData.tailor_registered_info?.email) {
				batch.update(tailorRef, {
					"tailor_registered_info.email": newEmail,
					updatedAt: new Date().toISOString(),
				});
			}
			
			updatedCollections.push("tailors");
		}

		// 3. Update tailors_local collection (if exists)
		const tailorLocalRef = doc(db, "staging_tailors_local", userId);
		const tailorLocalSnap = await getDoc(tailorLocalRef);
		
		if (tailorLocalSnap.exists()) {
			const tailorLocalData = tailorLocalSnap.data();
			
			if (tailorLocalData.email) {
				batch.update(tailorLocalRef, {
					email: newEmail,
					updatedAt: new Date().toISOString(),
				});
			}
			
			if (tailorLocalData.tailor_registered_info?.email) {
				batch.update(tailorLocalRef, {
					"tailor_registered_info.email": newEmail,
					updatedAt: new Date().toISOString(),
				});
			}
			
			updatedCollections.push("tailors_local");
		}

		// Execute all updates in a single batch
		if (updatedCollections.length > 0) {
			await batch.commit();
		}

		return {
			success: true,
			updatedCollections,
		};
	} catch (error: any) {
		console.error("Error updating email in collections:", error);
		return {
			success: false,
			error: error.message || "Failed to update email in collections",
			updatedCollections,
		};
	}
}

/**
 * Checks if the user's email has been updated in Firebase Auth
 * Call this after user returns from email verification link
 */
export async function checkAndUpdateEmailIfChanged(
	user: User,
	userId: string
): Promise<{
	emailChanged: boolean;
	updatedCollections?: string[];
	error?: string;
}> {
	try {
		// Get current email from Auth
		const currentAuthEmail = user.email;
		
		if (!currentAuthEmail) {
			return {
				emailChanged: false,
				error: "No email found in Auth",
			};
		}

		// Get email from Firestore users collection
		const userRef = doc(db, "staging_users", userId);
		const userSnap = await getDoc(userRef);
		
		if (!userSnap.exists()) {
			return {
				emailChanged: false,
				error: "User document not found",
			};
		}

		const firestoreEmail = userSnap.data()?.email;

		// If emails match, no update needed
		if (currentAuthEmail.toLowerCase() === firestoreEmail?.toLowerCase()) {
			return {
				emailChanged: false,
			};
		}

		// Email has changed in Auth, update Firestore
		const result = await updateEmailInCollections({
			userId,
			newEmail: currentAuthEmail,
			oldEmail: firestoreEmail || "",
		});

		return {
			emailChanged: true,
			updatedCollections: result.updatedCollections,
			error: result.error,
		};
	} catch (error: any) {
		console.error("Error checking email change:", error);
		return {
			emailChanged: false,
			error: error.message || "Failed to check email change",
		};
	}
}

