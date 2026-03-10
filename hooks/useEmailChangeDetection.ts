/**
 * Hook to automatically detect and sync email changes after verification
 * 
 * This hook monitors Firebase Auth email changes and automatically
 * updates Firestore collections when a user returns after clicking
 * the email verification link.
 */

import { useEffect, useRef } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import {
	checkAndUpdateEmailIfChanged,
} from "@/vendor-services/emailChangeService";
import { toast } from "sonner";

/**
 * Hook to detect email changes and sync with Firestore
 * Call this in a component that's always mounted (like layout or auth provider)
 */
export function useEmailChangeDetection() {
	const lastCheckedEmailRef = useRef<string | null>(null);
	const hasCheckedRef = useRef(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
			// Only check if user is authenticated
			if (!user || !user.email) {
				lastCheckedEmailRef.current = null;
				hasCheckedRef.current = false;
				return;
			}

			// Skip if we've already checked this email
			if (lastCheckedEmailRef.current === user.email && hasCheckedRef.current) {
				return;
			}

			// Mark as checked
			hasCheckedRef.current = true;
			lastCheckedEmailRef.current = user.email;

			// Check if email has changed and needs Firestore sync
			try {
				const result = await checkAndUpdateEmailIfChanged(user, user.uid);

				if (result.emailChanged) {
					// Show success notification
					toast.success("Email updated successfully! ✅", {
						description: `Your email has been updated to ${user.email} across all your accounts.`,
						duration: 6000,
					});

					// Optionally trigger a page refresh or data refetch
					// You can add a callback here if needed
				}
			} catch (error) {
				// Silently fail - this is just a background check
				console.error("Error checking email change:", error);
			}
		});

		return () => unsubscribe();
	}, []);
}

