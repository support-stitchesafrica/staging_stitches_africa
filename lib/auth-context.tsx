// lib/auth-context.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase"; // adjust path to your firebase.ts

interface AuthContextType {
	user: User | null;
	loading: boolean;
	userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	userRole: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);
			if (firebaseUser) {
				// Check if user is an admin first
				try {
					const adminDoc = await getDoc(doc(db, "staging_admins", firebaseUser.uid));
					if (adminDoc.exists()) {
						// User is an admin, get role from admins collection
						const adminData = adminDoc.data();
						setUserRole(adminData.role || null);
						setLoading(false);
						return;
					}
				} catch (adminErr: any) {
					// If admin check fails with permission error, user might still be an admin
					// but rules not deployed yet. Skip users collection check to avoid double error.
					if (
						adminErr?.code === "permission-denied" ||
						adminErr?.message?.includes("permission") ||
						adminErr?.message?.includes("insufficient permissions")
					) {
						console.warn(
							"Admin check permission denied - user may be admin but rules not deployed yet"
						);
						// Set role to null and continue - don't try users collection
						setUserRole(null);
						setLoading(false);
						return;
					}
					// For other errors, continue to check users collection
					console.warn("Error checking admin status:", adminErr);
				}

				// If not an admin, check users collection
				try {
					const userDoc = await getDoc(doc(db, "staging_users", firebaseUser.uid));
					if (userDoc.exists()) {
						const data = userDoc.data();
						setUserRole(data.role || null);
					} else {
						setUserRole(null);
					}
				} catch (err: any) {
					// If users collection also fails with permission error, user might be admin/collections user
					// Just set role to null and continue
					if (
						err?.code === "permission-denied" ||
						err?.message?.includes("permission") ||
						err?.message?.includes("insufficient permissions")
					) {
						console.warn(
							"Users collection permission denied - user may be admin or collections user"
						);
						setUserRole(null);
					} else {
						console.error("Error fetching user role:", err);
						setUserRole(null);
					}
				}
			} else {
				setUserRole(null);
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	return (
		<AuthContext.Provider value={{ user, loading, userRole }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
