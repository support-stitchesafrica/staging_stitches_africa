"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CartSidebar } from "@/components/shops/cart/CartSidebar";
import { logout } from "@/lib/auth-simple";
import { AuthSelectionDialog } from "@/components/common/AuthSelectionDialog";
import {
	NavigationVisibilityState,
	AuthState,
	NavItem,
} from "@/types/navigation";
import {
	getNavigationItems,
	sortNavigationItemsByPriority,
} from "@/lib/navigation-config";
import {
	useNavigationVisibility,
	getFallbackNavigation,
} from "@/lib/navigation-visibility-controller";
import {
	useMemoizedNavigationItems,
	useMemoizedNavigationVisibility,
	useStableNavigationCallbacks,
	useOptimizedAuthStateChange,
	useNavigationPerformanceMonitoring,
	navigationVisibilityStateEqual,
} from "@/lib/utils/navigation-performance";
import {
	useScreenReaderAnnouncements,
	useKeyboardNavigation,
	useFocusManagement,
	getNavigationContainerAttributes,
	getNavigationItemAttributes,
	getNavigationBadgeAttributes,
} from "@/lib/utils/navigation-accessibility";
import {
	User,
	Package,
	Settings,
	Ruler,
	Heart,
	X,
	ShoppingCart,
	Users,
} from "lucide-react";

const MobileBottomNavComponent: React.FC = () => {
	const pathname = usePathname();
	const router = useRouter();
	const { t } = useLanguage();
	const authContext = useAuth();
	const { itemCount } = useCart();
	const { itemCount: wishlistCount } = useWishlist();
	const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [showSignupDialog, setShowSignupDialog] = useState(false);

	// Performance monitoring in development
	const { renderCount } = useNavigationPerformanceMonitoring("MobileBottomNav");

	// Store previous navigation state to handle smooth transitions
	const previousStateRef = useRef<NavigationVisibilityState | null>(null);

	// Use the memoized navigation auth state from context to prevent unnecessary re-renders
	const authState: AuthState = authContext.navigationAuthState;

	// Use memoized authentication state from context
	const isAuthenticated = authContext.isAuthenticated;

	// Get stable callback references to prevent unnecessary re-renders
	const { getStableCartCallback, getStableMenuCallback } =
		useStableNavigationCallbacks();
	const stableCartCallback = useCallback(() => setIsCartOpen(true), []);
	const stableMenuCallback = useCallback(
		() => setIsMobileMenuOpen(true),
		[setIsMobileMenuOpen],
	);

	// Get base navigation items with memoized callbacks
	const baseNavItems = useMemo(() => {
		try {
			return getNavigationItems(
				isAuthenticated,
				itemCount,
				wishlistCount,
				stableCartCallback,
				stableMenuCallback,
			);
		} catch (error) {
			console.error("Error getting navigation items:", error);
			// Return fallback navigation on error
			return getFallbackNavigation(authState);
		}
	}, [
		isAuthenticated,
		itemCount,
		wishlistCount,
		stableCartCallback,
		stableMenuCallback,
		authState,
	]);

	// Use memoized navigation items calculation
	const memoizedNavItems = useMemoizedNavigationItems(
		baseNavItems,
		isAuthenticated,
		itemCount,
		wishlistCount,
		stableCartCallback,
		stableMenuCallback,
	);

	// Use memoized navigation visibility state calculation
	const navigationState = useMemoizedNavigationVisibility(
		memoizedNavItems,
		authState,
		previousStateRef.current,
	);

	// Update previous state reference only when state meaningfully changes
	const shouldUpdatePreviousState =
		!previousStateRef.current ||
		!navigationVisibilityStateEqual(previousStateRef.current, navigationState);

	if (shouldUpdatePreviousState) {
		previousStateRef.current = navigationState;
	}

	// Get final filtered and sorted navigation items with memoization
	const filteredNavItems = useMemo(() => {
		if (!navigationState.shouldShowNavigation) {
			return [];
		}
		return sortNavigationItemsByPriority(navigationState.visibleItems);
	}, [navigationState.shouldShowNavigation, navigationState.visibleItems]);

	const isActive = (href?: string) => {
		if (!href) return false;
		if (href === "/shops") {
			return pathname === "/shops";
		}
		return pathname.startsWith(href);
	};

	// Accessibility features
	useScreenReaderAnnouncements(navigationState, isAuthenticated);

	const handleItemActivate = useCallback((item: NavItem, index: number) => {
		if (item.onClick) {
			item.onClick();
		} else if (item.href) {
			window.location.href = item.href;
		}
	}, []);

	const { currentFocus, setFocus } = useKeyboardNavigation(
		filteredNavItems,
		handleItemActivate,
	);
	const { saveFocus, restoreFocus, focusFirstNavigationItem } =
		useFocusManagement();

	// Get navigation container accessibility attributes
	const navigationContainerAttributes = useMemo(
		() =>
			getNavigationContainerAttributes(
				isAuthenticated,
				navigationState.isLoading,
				filteredNavItems.length,
			),
		[isAuthenticated, navigationState.isLoading, filteredNavItems.length],
	);

	// Handle escape key to close menu and prevent body scroll
	React.useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isMobileMenuOpen) {
				setIsMobileMenuOpen(false);
			}
		};

		if (isMobileMenuOpen) {
			document.addEventListener("keydown", handleEscape);
			// Prevent body scroll when menu is open
			document.body.style.overflow = "hidden";
			return () => {
				document.removeEventListener("keydown", handleEscape);
				document.body.style.overflow = "unset";
			};
		}
	}, [isMobileMenuOpen, setIsMobileMenuOpen]);

	// Don't render navigation if it should be hidden (but allow rendering when menu is closed for CSS transitions)
	if (!navigationState.shouldShowNavigation) {
		return null;
	}

	// Close menu when clicking outside
	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsMobileMenuOpen(false);
		},
		[setIsMobileMenuOpen],
	);

	// Close menu when clicking on a navigation item
	const handleNavItemClick = useCallback(
		(item: NavItem) => {
			// Execute the item's onClick handler if it exists
			if (item.onClick) {
				item.onClick();
			}

			// Always close the menu after clicking any navigation item
			// This ensures the menu closes for both links and action buttons
			setIsMobileMenuOpen(false);
		},
		[setIsMobileMenuOpen],
	);

	return (
		<>
			{/* Overlay - Only show when menu is open */}
			{isMobileMenuOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
					onClick={handleOverlayClick}
					aria-hidden="true"
				/>
			)}

			{/* Slide-up Menu */}
			<nav
				className={`lg:hidden fixed inset-x-0 bottom-0 mobile-bottom-nav bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-50 safe-area-inset-bottom transition-all duration-300 transform ${
					isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
				} ${navigationState.isLoading ? "opacity-90" : "opacity-100"} ${
					authContext.moduleLoadError ? "border-red-200" : ""
				}`}
				{...navigationContainerAttributes}
			>
				{/* Header with close button */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200/50">
					<h3 className="text-lg font-semibold text-gray-900">Menu</h3>
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setIsMobileMenuOpen(false);
						}}
						className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
						aria-label="Close menu"
						type="button"
					>
						<X size={20} />
					</button>
				</div>

				{/* Loading indicator for authentication state transitions */}
				{navigationState.isLoading && filteredNavItems.length > 0 && (
					<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-200 overflow-hidden">
						<div className="h-full bg-primary-500 animate-pulse"></div>
					</div>
				)}

				<div className="p-4 max-h-[70vh] overflow-y-auto">
					{/* User Info Section */}
					{authContext.loading && !authContext.user ? (
						<div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50/50 rounded-lg border border-gray-200/30">
							<div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
							<div className="flex-1 min-w-0">
								<div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
								<div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
							</div>
						</div>
					) : isAuthenticated && authContext.user ? (
						<div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50/50 rounded-lg border border-gray-200/30">
							<div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
								<User size={24} className="text-primary-600" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-gray-900 truncate">
									{authContext.user.displayName ||
										authContext.user.email?.split("@")[0]}
								</p>
								<p className="text-sm text-gray-500 truncate">
									{authContext.user.email}
								</p>
							</div>
						</div>
					) : (
						<div className="mb-6">
							{authContext.moduleLoadError ? (
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p className="text-sm text-yellow-800 mb-2">
										{authContext.isServiceAvailable
											? "Authentication service recovered"
											: "Authentication temporarily unavailable"}
									</p>
									{!authContext.isServiceAvailable && (
										<div className="flex space-x-2">
											<button
												onClick={authContext.retryModuleLoading}
												className="text-sm text-yellow-600 underline hover:text-yellow-700"
												disabled={authContext.moduleLoadingState === "loading"}
											>
												{authContext.moduleLoadingState === "loading"
													? "Retrying..."
													: "Retry"}
											</button>
											<button
												onClick={() => window.location.reload()}
												className="text-sm text-yellow-600 underline hover:text-yellow-700"
											>
												Refresh page
											</button>
										</div>
									)}
								</div>
							) : (
								<div className="space-y-3">
									<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
										<p className="text-sm text-blue-800 mb-2">
											Sign in to access your wishlist, orders, and personalized
											features
										</p>
									</div>
									<button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setShowSignupDialog(true);
										}}
										className="flex items-center justify-center w-full p-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
										type="button"
									>
										Sign In / Register
									</button>
								</div>
							)}
						</div>
					)}

					{/* Public Shop Items */}
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
								Shop
							</h3>
							<span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
								Public
							</span>
						</div>
						<div className="space-y-1">
							<Link
								href="/shops/products"
								onClick={(e) => {
									e.stopPropagation();
									setIsMobileMenuOpen(false);
								}}
								className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							>
								<Package size={20} className="text-gray-600" />
								<span className="text-gray-900 font-medium">
									{t.header.products}
								</span>
							</Link>
							<Link
								href="/shops/vendors"
								onClick={(e) => {
									e.stopPropagation();
									setIsMobileMenuOpen(false);
								}}
								className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							>
								<Heart size={20} className="text-gray-600" />
								<span className="text-gray-900 font-medium">
									{t.header.brands}
								</span>
							</Link>
							<Link
								href="/shops/products?type=bespoke"
								onClick={(e) => {
									e.stopPropagation();
									setIsMobileMenuOpen(false);
								}}
								className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							>
								<Ruler size={20} className="text-gray-600" />
								<span className="text-gray-900 font-medium">
									{t.header.bespoke}
								</span>
							</Link>
							<Link
								href="/shops/products?type=ready-to-wear"
								onClick={(e) => {
									e.stopPropagation();
									setIsMobileMenuOpen(false);
								}}
								className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							>
								<Package size={20} className="text-gray-600" />
								<span className="text-gray-900 font-medium">
									{t.header.readyToWear}
								</span>
							</Link>
							<Link
								href="/vendor/register"
								onClick={(e) => {
									e.stopPropagation();
									setIsMobileMenuOpen(false);
								}}
								className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							>
								<Users size={20} className="text-gray-600" />
								<span className="text-gray-900 font-medium">
									{t.header.becomeAvendor}
								</span>
							</Link>
						</div>
					</div>

					{/* Personal Items - Only for Authenticated Users */}
					{isAuthenticated && (
						<div className="mb-6">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
									My Items
								</h3>
								<span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
									Personal
								</span>
							</div>
							<div className="space-y-1">
								<Link
									href="/shops/wishlist"
									onClick={(e) => {
										e.stopPropagation();
										setIsMobileMenuOpen(false);
									}}
									className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									<Heart size={20} className="text-blue-600" />
									<span className="text-gray-900 font-medium">
										{t.header.wishlist}
									</span>
									{wishlistCount > 0 && (
										<span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{wishlistCount}
										</span>
									)}
								</Link>
								<Link
									href="/shops/measurements"
									onClick={(e) => {
										e.stopPropagation();
										setIsMobileMenuOpen(false);
									}}
									className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								>
									<Ruler size={20} className="text-blue-600" />
									<span className="text-gray-900 font-medium">
										{t.header.measurements}
									</span>
								</Link>
								<span
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setIsCartOpen(true);
										setIsMobileMenuOpen(false);
									}}
									className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full text-left"
								>
									<ShoppingCart size={20} className="text-blue-600" />
									<span className="text-gray-900 font-medium">My Cart</span>
									{itemCount > 0 && (
										<span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{itemCount}
										</span>
									)}
								</span>
							</div>
						</div>
					)}

					{/* Account Management - Only for Authenticated Users */}
					{isAuthenticated && authContext.user && (
						<div className="mb-6">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
									Account Management
								</h3>
								<span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
									Settings
								</span>
							</div>
							<div className="space-y-1">
								<Link
									href="/shops/account"
									onClick={(e) => {
										e.stopPropagation();
										setIsMobileMenuOpen(false);
									}}
									className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
								>
									<Settings size={20} className="text-purple-600" />
									<span className="text-gray-900 font-medium">
										{t.header.accountSettings}
									</span>
								</Link>
								<Link
									href="/shops/account/orders"
									onClick={(e) => {
										e.stopPropagation();
										setIsMobileMenuOpen(false);
									}}
									className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
								>
									<Package size={20} className="text-purple-600" />
									<span className="text-gray-900 font-medium">
										{t.header.myOrders}
									</span>
								</Link>
							</div>
						</div>
					)}

					{/* Logout - Only for Authenticated Users */}
					{isAuthenticated && authContext.user && (
						<div className="pt-4 border-t border-gray-200">
							<button
								onClick={async (e) => {
									e.preventDefault();
									e.stopPropagation();
									await logout();
									setIsMobileMenuOpen(false);
								}}
								className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50/30 transition-colors text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
								type="button"
							>
								<Settings size={20} />
								<span className="font-medium">{t.header.signOut}</span>
							</button>
						</div>
					)}

					{/* Safe area padding for devices with home indicator */}
					<div className="pb-safe"></div>
				</div>

				{/* Service unavailable indicator */}
				{authContext.moduleLoadError && !authContext.isServiceAvailable && (
					<div className="absolute -top-8 left-2 right-2 bg-red-50 border border-red-200 rounded-md px-2 py-1">
						<div className="flex items-center justify-between">
							<span className="text-xs text-red-600">
								Service temporarily unavailable
							</span>
							<button
								onClick={authContext.retryModuleLoading}
								className="text-xs text-red-600 hover:text-red-700 font-medium underline"
								disabled={authContext.moduleLoadingState === "loading"}
							>
								{authContext.moduleLoadingState === "loading"
									? "Retrying..."
									: "Retry"}
							</button>
						</div>
					</div>
				)}
			</nav>

			{/* Cart Sidebar */}
			<CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

			{/* Signup Choice Dialog */}
			<AuthSelectionDialog
				open={showSignupDialog}
				onOpenChange={setShowSignupDialog}
				onAuthAction={() => setIsMobileMenuOpen(false)}
			/>
		</>
	);
};

// Memoization comparison function for MobileBottomNav
const mobileBottomNavComparison = (prevProps: {}, nextProps: {}): boolean => {
	// Since this component has no props, it should only re-render when internal state changes
	// The memoization is handled internally through the performance optimization hooks
	return true;
};

// Export memoized component for performance optimization
export const MobileBottomNav = React.memo(
	MobileBottomNavComponent,
	mobileBottomNavComparison,
);
