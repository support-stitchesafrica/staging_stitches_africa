"use client";

import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { OrderVolumeChart } from "@/components/dashboard/OrderVolumeChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Dashboard = () => {
	const handleLogout = () => {
		signOut(auth);
	};

	const router = useRouter();
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

	useEffect(() => {
		// Check admin role - check hardcoded admin first, then Firestore
		const checkAdminRole = async () => {
			const currentUser = auth.currentUser;

			if (!currentUser) {
				setIsAuthorized(false);
				router.replace("/");
				return;
			}

			// Check for hardcoded super admin first (bypasses Firestore)
			const SUPER_ADMIN_EMAIL = "admin@stitchesafrica.com";
			const storedEmail = localStorage.getItem("adminEmail");
			const storedRole = localStorage.getItem("adminRole");
			const storedUID = localStorage.getItem("adminUID");

			// Verify UID matches current user
			if (storedUID && storedUID !== currentUser.uid) {
				console.warn("[Dashboard] Stored UID does not match current user UID");
				setIsAuthorized(false);
				router.replace("/");
				return;
			}

			if (
				currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
				storedEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
			) {
				if (storedRole === "superadmin" || storedRole === "admin") {
					console.log(
						"[Dashboard] Hardcoded super admin detected, allowing access"
					);
					setIsAuthorized(true);
					return;
				}
			}

			// For other users, check Firestore `admins` collection
			try {
				const adminRef = doc(db, "admins", currentUser.uid);
				const adminSnap = await getDoc(adminRef);

				if (adminSnap.exists()) {
					const adminData = adminSnap.data();
					const role = adminData?.role;

					// Verify role is either "superadmin" or "admin"
					if (role === "superadmin" || role === "admin") {
						setIsAuthorized(true);
					} else {
						// User exists in admins collection but has invalid role
						console.warn(
							"User found in admins collection but role is invalid:",
							role
						);
						setIsAuthorized(false);
						router.replace("/");
					}
				} else {
					// User not found in admins collection - check localStorage as fallback
					// Verify UID matches
					if (storedUID && storedUID !== currentUser.uid) {
						console.warn(
							"[Dashboard] Fallback UID does not match current user UID"
						);
						setIsAuthorized(false);
						router.replace("/");
						return;
					}

					if (storedRole === "superadmin" || storedRole === "admin") {
						console.log("[Dashboard] Using localStorage role as fallback");
						setIsAuthorized(true);
					} else {
						console.warn("User not found in admins collection");
						setIsAuthorized(false);
						router.replace("/");
					}
				}
			} catch (error) {
				// If Firestore check fails, check localStorage as fallback
				console.warn(
					"Error checking admin role from Firestore, checking localStorage:",
					error
				);

				// Verify UID matches
				if (storedUID && storedUID !== currentUser.uid) {
					console.warn(
						"[Dashboard] Fallback UID does not match current user UID"
					);
					setIsAuthorized(false);
					router.replace("/");
					return;
				}

				if (storedRole === "superadmin" || storedRole === "admin") {
					setIsAuthorized(true);
				} else {
					console.error("Error checking admin role from Firestore:", error);
					setIsAuthorized(false);
					router.replace("/");
				}
			}
		};

		checkAdminRole();
	}, [router]);

	// Show loading while checking authorization
	if (isAuthorized === null) {
		return (
			<div className="flex h-screen items-center justify-center text-gray-600">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
					<p>Verifying access...</p>
				</div>
			</div>
		);
	}

	// If not authorized, the redirect will happen, but show message just in case
	if (!isAuthorized) {
		return (
			<div className="flex h-screen items-center justify-center text-gray-600">
				<p>Unauthorized access. Redirecting...</p>
			</div>
		);
	}

	return (
		<SidebarLayout
			pageTitle="Dashboard"
			pageDescription="Overview of your store's performance and recent activity"
		>
			<div className="space-y-6">
				<DashboardStats />

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<div className="xl:col-span-2">
						<OrderVolumeChart />
					</div>
					<div>
						<RecentActivity />
					</div>
				</div>
			</div>
		</SidebarLayout>
	);
};

export default Dashboard;
