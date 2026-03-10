"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAtlasAuth } from "@/contexts/AtlasAuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Optimized Atlas Auth Guard Component
 * Simplified authentication check with faster loading
 */
interface AtlasAuthGuardProps {
	/** Content to render when user is authenticated and authorized */
	children: React.ReactNode;
}

export const AtlasAuthGuard: React.FC<AtlasAuthGuardProps> = ({ children }) => {
	const { user, atlasUser, loading } = useAtlasAuth();
	const router = useRouter();
	const pathname = usePathname();
	const isRedirecting = useRef(false);

	useEffect(() => {
		// Wait for loading to complete before checking auth state
		if (loading) return;

		// Prevent multiple redirects
		if (isRedirecting.current) return;

		// If no user is authenticated, redirect to auth page
		if (!user) {
			if (pathname !== "/atlas/auth") {
				isRedirecting.current = true;
				router.push("/atlas/auth");
			}
			return;
		}

		// If user is authenticated but doesn't have Atlas access, redirect to auth page
		if (!atlasUser || !atlasUser.isAtlasUser) {
			if (pathname !== "/atlas/auth") {
				isRedirecting.current = true;
				router.push("/atlas/auth");
			}
			return;
		}

		// Reset redirect flag when successfully authenticated and authorized
		isRedirecting.current = false;
	}, [user, atlasUser, loading, pathname, router]);

	// Reset redirect flag when pathname changes
	useEffect(() => {
		isRedirecting.current = false;
	}, [pathname]);

	// Show minimal loading while checking authentication
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-white">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600 text-sm">Loading...</p>
				</div>
			</div>
		);
	}

	// If user is not authenticated or not authorized, show minimal loading
	// (redirect will happen in useEffect)
	if (!user || !atlasUser || !atlasUser.isAtlasUser) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-white">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600 text-sm">Redirecting...</p>
				</div>
			</div>
		);
	}

	// User is authenticated and authorized, render protected content immediately
	return <>{children}</>;
};
