import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { logoutTailor } from "@/vendor-services/userAuth";

/**
 * useStrictVendorAuth
 *
 * Strictly enforces vendor authentication.
 * If Firebase session is invalid or user is not logged in,
 * it clears local storage via logoutTailor() and redirects to /vendor.
 */
export function useStrictVendorAuth() {
	const router = useRouter();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Listen for Firebase Auth state changes
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// User is signed in to Firebase
				// Optionally, we could verify claims here, but for now checking existence is checking the session
				setIsAuthenticated(true);
			} else {
				// User is signed out or session expired
				setIsAuthenticated(false);
				
				// Perform cleanup and cleanup redirect
				await logoutTailor();
				router.replace("/vendor");
			}
			setIsLoading(false);
		});

		// Check if we have local storage tokens as a preliminary check
		// This handles the "initial load" state before Firebase initializes
		const token = localStorage.getItem("tailorToken");
		if (!token) {
			setIsAuthenticated(false);
			setIsLoading(false);
			// Don't redirect immediately in render, wait for effect or let the onAuthStateChanged handle it
			// IF we are sure, we can redirect. rely on onAuthStateChanged to be authoritative.
		}

		return () => unsubscribe();
	}, [router]);

	return { isAuthenticated, isLoading };
}
