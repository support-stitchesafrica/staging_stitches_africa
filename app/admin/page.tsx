"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import AdminLogin from "@/components/AdminLogin";
import Dashboard from "@/components/Dashboard";

export default function AdminPage() {
	const [admin, setAdmin] = useState<User | null>(null);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// Listen to Firebase auth state
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// Check for hardcoded super admin first (bypasses Firestore)
				const SUPER_ADMIN_EMAIL = "admin@stitchesafrica.com";
				const storedEmail = localStorage.getItem("adminEmail");
				const storedRole = localStorage.getItem("adminRole");
				const storedUID = localStorage.getItem("adminUID");

				// Verify UID matches current user
				if (storedUID && storedUID !== user.uid) {
					console.warn(
						"[AdminPage] Stored UID does not match current user UID"
					);
					setAdmin(null);
					setCheckingAuth(false);
					return;
				}

				// Check if this is the hardcoded super admin
				if (
					user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
					storedEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
				) {
					// Verify role in localStorage and UID matches
					if (
						(storedRole === "superadmin" || storedRole === "admin") &&
						(!storedUID || storedUID === user.uid)
					) {
						console.log(
							"[AdminPage] Hardcoded super admin detected, allowing access"
						);
						setAdmin(user);
						setCheckingAuth(false);
						return;
					}
				}

				// For other users, check Firestore `admins` collection
				try {
					const adminRef = doc(db, "admins", user.uid);
					const adminSnap = await getDoc(adminRef);

					if (adminSnap.exists()) {
						const adminData = adminSnap.data();
						const role = adminData?.role;

						// Verify role is either "superadmin" or "admin"
						if (role === "superadmin" || role === "admin") {
							setAdmin(user);
							setCheckingAuth(false);
						} else {
							// User exists in admins collection but has invalid role
							console.warn(
								"User found in admins collection but role is invalid:",
								role
							);
							setAdmin(null);
							setCheckingAuth(false);
						}
					} else {
						// User not found in admins collection - check localStorage as fallback
						const fallbackRole = localStorage.getItem("adminRole");
						const fallbackUID = localStorage.getItem("adminUID");

						// Verify UID matches
						if (fallbackUID && fallbackUID !== user.uid) {
							console.warn(
								"[AdminPage] Fallback UID does not match current user UID"
							);
							setAdmin(null);
							setCheckingAuth(false);
							return;
						}

						if (fallbackRole === "superadmin" || fallbackRole === "admin") {
							console.log("[AdminPage] Using localStorage role as fallback");
							setAdmin(user);
							setCheckingAuth(false);
						} else {
							console.warn("User not found in admins collection");
							setAdmin(null);
							setCheckingAuth(false);
						}
					}
				} catch (error) {
					// If Firestore check fails, check localStorage as fallback
					console.warn(
						"Error checking admin role from Firestore, checking localStorage:",
						error
					);
					const fallbackRole = localStorage.getItem("adminRole");
					const fallbackEmail = localStorage.getItem("adminEmail");
					const fallbackUID = localStorage.getItem("adminUID");

					// Verify UID matches
					if (fallbackUID && fallbackUID !== user.uid) {
						console.warn(
							"[AdminPage] Fallback UID does not match current user UID"
						);
						setAdmin(null);
						setCheckingAuth(false);
						return;
					}

					if (
						(fallbackRole === "superadmin" || fallbackRole === "admin") &&
						(fallbackEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
							user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())
					) {
						console.log(
							"[AdminPage] Using localStorage as fallback for hardcoded admin"
						);
						setAdmin(user);
						setCheckingAuth(false);
					} else {
						setAdmin(null);
						setCheckingAuth(false);
					}
				}
			} else {
				setAdmin(null);
				setCheckingAuth(false);
			}
		});

		return () => unsubscribe();
	}, []);

	// Additional safety check: redirect if somehow we have a user but they're not an admin
	useEffect(() => {
		if (!checkingAuth && admin) {
			// Check for hardcoded super admin first
			const SUPER_ADMIN_EMAIL = "admin@stitchesafrica.com";
			const storedEmail = localStorage.getItem("adminEmail");
			const storedRole = localStorage.getItem("adminRole");
			const storedUID = localStorage.getItem("adminUID");

			// Verify UID matches
			if (storedUID && storedUID !== admin.uid) {
				console.warn(
					"[AdminPage] Stored UID does not match admin UID, redirecting..."
				);
				router.replace("/");
				return;
			}

			if (
				admin.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
				storedEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
			) {
				if (storedRole === "superadmin" || storedRole === "admin") {
					// Hardcoded admin is valid, no need to check Firestore
					return;
				}
			}

			// For other users, verify from Firestore
			const verifyAdmin = async () => {
				try {
					const adminRef = doc(db, "admins", admin.uid);
					const adminSnap = await getDoc(adminRef);

					if (!adminSnap.exists()) {
						// Check localStorage as fallback
						const fallbackRole = localStorage.getItem("adminRole");
						const fallbackUID = localStorage.getItem("adminUID");

						// Verify UID matches
						if (fallbackUID && fallbackUID !== admin.uid) {
							console.warn(
								"[AdminPage] Verification: UID does not match, redirecting..."
							);
							router.replace("/");
							return;
						}

						if (fallbackRole !== "superadmin" && fallbackRole !== "admin") {
							console.warn(
								"User authenticated but not found in admins collection, redirecting..."
							);
							router.replace("/");
							return;
						}
					}

					const adminData = adminSnap.data();
					const role = adminData?.role;

					if (role !== "superadmin" && role !== "admin") {
						// Check localStorage as fallback
						const fallbackRole = localStorage.getItem("adminRole");
						const fallbackUID = localStorage.getItem("adminUID");

						// Verify UID matches
						if (fallbackUID && fallbackUID !== admin.uid) {
							console.warn(
								"[AdminPage] Verification: UID does not match, redirecting..."
							);
							router.replace("/");
							return;
						}

						if (fallbackRole !== "superadmin" && fallbackRole !== "admin") {
							console.warn(
								"User authenticated but not authorized as admin, redirecting..."
							);
							router.replace("/");
						}
					}
				} catch (error) {
					// If Firestore check fails, check localStorage
					const fallbackRole = localStorage.getItem("adminRole");
					const fallbackUID = localStorage.getItem("adminUID");

					// Verify UID matches
					if (fallbackUID && fallbackUID !== admin.uid) {
						console.warn(
							"[AdminPage] Verification: UID does not match, redirecting..."
						);
						router.replace("/");
						return;
					}

					if (fallbackRole !== "superadmin" && fallbackRole !== "admin") {
						console.error("Error verifying admin role:", error);
						router.replace("/");
					}
				}
			};

			verifyAdmin();
		}
	}, [admin, checkingAuth, router]);

	if (checkingAuth) {
		return (
			<div className="flex h-screen items-center justify-center text-gray-600">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			{admin ? (
				<Dashboard />
			) : (
				<AdminLogin
					onLogin={() => {
						// The onAuthStateChanged listener will handle updating the admin state
						// This callback is kept for compatibility but doesn't need to do anything
					}}
				/>
			)}
		</>
	);
}
