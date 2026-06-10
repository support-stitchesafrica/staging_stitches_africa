"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useSearch } from "@/hooks/useSearch";
import { logout } from "@/lib/auth-simple";
import { CartSidebar } from "@/components/shops/cart/CartSidebar";
import { MobileSearchModal } from "@/components/shops/search/MobileSearchModal";
import { withComponentRuntimeGuard } from "@/components/shops/wrappers/ComponentRuntimeGuard";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { WEAR_CATEGORY_PRESETS } from "@/lib/wear-category-presets";

import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import
	{
		Search,
		ShoppingCart,
		Heart,
		User,
		Menu,
		X,
		LogOut,
		Settings,
		Package,
		Clock,
		TrendingUp,
		ChevronRight,
	} from "lucide-react";

const HeaderComponent: React.FC = () =>
{
	const router = useRouter();
	const { t } = useLanguage();
	const { user } = useAuth();
	const { itemCount } = useCart();
	const { itemCount: wishlistCount } = useWishlist();
	const { isMobileMenuOpen, toggleMobileMenu } = useMobileMenu();
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [isTabletMenuOpen, setIsTabletMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
	const [isShopByOpen, setIsShopByOpen] = useState(false);
	const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

	const {
		query: searchQuery,
		setQuery: setSearchQuery,
		suggestions,
		history,
		getPopularSearches,
		clearHistory,
		removeFromHistory,
	} = useSearch();
	const popularSearches = getPopularSearches();

	const handleLogout = async () =>
	{
		await logout();
		setIsUserMenuOpen(false);
		router.push('/shops');
	};

	const handleSearch = (e: React.FormEvent) =>
	{
		e.preventDefault();
		const q = searchQuery.trim();
		if (q)
		{
			router.push(`/shops/search?q=${encodeURIComponent(q)}`);
			setShowSearchSuggestions(false);
		}
	};

	const handleSuggestionClick = (suggestion: string) =>
	{
		setSearchQuery(suggestion);
		const q = suggestion.trim();
		if (q)
		{
			router.push(`/shops/search?q=${encodeURIComponent(q)}`);
			setShowSearchSuggestions(false);
		}
	};

	const handleHistoryClick = (historyItem: any) =>
	{
		setSearchQuery(historyItem.query);
		const q = String(historyItem.query ?? "").trim();
		if (q)
		{
			router.push(`/shops/search?q=${encodeURIComponent(q)}`);
			setShowSearchSuggestions(false);
		}
	};

	// Lock body scroll when dropdown is open
	useEffect(() =>
	{
		if (showSearchSuggestions)
		{
			document.body.style.overflow = "hidden";
		} else
		{
			document.body.style.overflow = "unset";
		}
		return () =>
		{
			document.body.style.overflow = "unset";
		};
	}, [showSearchSuggestions]);

	// Close "Shop by" on Escape (desktop dropdown)
	useEffect(() =>
	{
		if (!isShopByOpen) return;
		const onKey = (e: KeyboardEvent) =>
		{
			if (e.key === "Escape") setIsShopByOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isShopByOpen]);

	return (
		<>
			<header className="bg-white border-b pb-2 border-gray-100 sticky top-0 z-40 overflow-visible">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
					{/* Desktop: Top Row (Logo) */}
					<div className="hidden lg:flex items-center justify-between">
						<Link
							href="/shops"
							className="flex items-center space-x-2 flex-shrink-0"
						>
							<Image
								src="/Stitches-Africa-Logo-06.png"
								alt="Stitches Africa"
								width={100}
								height={50}
								className="h-auto"
								priority
							/>
						</Link>
						<div className="flex items-center space-x-4">
							<LanguageSelector />
						</div>
					</div>

					{/* Bottom Row / Main Mobile Header */}
					<div className="flex items-center justify-between h-11 lg:h-8 pb-1 lg:pb-0">
						{/* Mobile/Tablet Logo (Hidden on Desktop Row 1) */}
						<Link
							href="/shops"
							className="flex items-center space-x-2 flex-shrink-0 lg:hidden"
						>
							<Image
								src="/Stitches-Africa-Logo-06.png"
								alt="Stitches Africa"
								width={80}
								height={40}
								className="h-auto"
								priority
							/>
						</Link>

						{/* Desktop Navigation (Moved Left) */}
						<nav className="hidden lg:flex items-center space-x-8">
							<Link
								href="/shops/products"
								className="text-sm text-gray-700 hover:text-black font-medium transition-colors"
								onClick={() => setIsShopByOpen(false)}
							>
								{t.header.products}
							</Link>
							{/* <div className="relative"> */}
								{/* <button
									type="button"
									onClick={() =>
									{
										setIsUserMenuOpen(false);
										setShowSearchSuggestions(false);
										setIsShopByOpen((o) => !o);
									}}
									className="inline-flex border-none! items-center !bg-transparent gap-1 text-sm !text-gray-700 hover:text-black font-medium transition-colors"
									aria-expanded={isShopByOpen}
									aria-haspopup="menu"
								>
									{t.header.shopBy}
									<ChevronRight
										className={`size-4 shrink-0 transition-transform ${isShopByOpen ? "rotate-90" : ""}`}
										aria-hidden
									/> */}
								{/* </button> */}
								{/* {isShopByOpen && (
									<div
										className="absolute left-0 top-full z-[55] mt-2 w-[min(92vw,28rem)] max-h-[min(70vh,24rem)] overflow-y-hidden rounded-xl border border-gray-200 bg-white py-3 shadow-xl"
										role="menu"
									>
										<ul className="grid grid-cols-1 gap-0 px-2 sm:grid-cols-2 sm:gap-1">
											{WEAR_CATEGORY_PRESETS.map((preset) => (
												<li key={preset.value} role="none">
													<Link
														href={`/shops/products?subcategory=${encodeURIComponent(preset.value)}`}
														role="menuitem"
														className="block rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
														onClick={() => setIsShopByOpen(false)}
													>
														<span className="font-medium text-gray-900 text-sm">
															{preset.value}
														</span>
														{preset.hint ? (
															<span className="mt-0.5 block text-xs leading-snug text-gray-500">
																{preset.hint}
															</span>
														) : null}
													</Link>
												</li>
											))}
										</ul>
									</div>
								)}
							</div> */}
							<Link
								href="/shops/brands"
								className="text-sm text-gray-700 hover:text-black font-medium transition-colors"
								onClick={() => setIsShopByOpen(false)}
							>
								{t.header.brands}
							</Link>
	
							<Link
								href="/vendor"
								className="text-sm text-gray-700 hover:text-black font-medium transition-colors"
								onClick={() => setIsShopByOpen(false)}
							>
								{t.header.becomeAvendor}
							</Link>
							<Link
								href="/track-order"
								className="text-sm text-gray-700 hover:text-black font-medium transition-colors"
							>
								Track Order
							</Link>
						</nav>

						{/* Compact Toolbar (Search + Icons) - Desktop lg screens */}
						<div className="hidden lg:flex items-center space-x-6 flex-shrink-0">
							{/* Compact Search */}
							<div className="relative w-48 xl:w-64">
								<form onSubmit={handleSearch} className="w-full relative">
									<input
										type="text"
										placeholder={t.header.searchPlaceholder}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										onFocus={() =>
										{
											setShowSearchSuggestions(true);
											setIsShopByOpen(false);
											setIsUserMenuOpen(false);
										}}
										className="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-gray-50/30 transition-all placeholder:text-gray-400"
									/>
									<Search
										className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
										size={14}
									/>
								</form>

								{/* Search Suggestions Dropdown */}
								{showSearchSuggestions &&
									(searchQuery.length >= 2 || history.length > 0) && (
										<div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-96 overflow-y-auto">
											<div className="p-4 space-y-4">
												{/* Suggestions */}
												{suggestions.length > 0 && (
													<div>
														<h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
															<Search size={12} className="mr-2" />
															{t.header.suggestions}
														</h3>
														<div className="space-y-1">
															{suggestions.map((suggestion, index) => (
																<button
																	key={index}
																	onClick={() =>
																		handleSuggestionClick(suggestion)
																	}
																	className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-900 break-words"
																>
																	{suggestion}
																</button>
															))}
														</div>
													</div>
												)}

												{/* Search History */}
												{history.length > 0 && (
													<div>
														<div className="flex items-center justify-between mb-3">
															<h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
																<Clock size={12} className="mr-2" />
																{t.header.recent}
															</h3>
															<button
																onClick={clearHistory}
																className="text-[10px] text-gray-400 hover:text-black transition-colors"
															>
																{t.header.clear}
															</button>
														</div>
														<div className="space-y-1">
															{history.slice(0, 5).map((item) => (
																<div
																	key={item.id}
																	className="flex items-center group"
																>
																	<button
																		onClick={() => handleHistoryClick(item)}
																		className="flex-1 text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
																	>
																		<span className="text-sm text-gray-900 break-words">
																			{item.query}
																		</span>
																	</button>
																	<button
																		onClick={() => removeFromHistory(item.id)}
																		className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all"
																	>
																		<X size={12} className="text-gray-400" />
																	</button>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										</div>
									)}
							</div>

							{/* User Account Icon */}
							<div className="relative">
								{user ? (
									<>
										<button
											onClick={() =>
											{
												setIsShopByOpen(false);
												setShowSearchSuggestions(false);
												setIsUserMenuOpen((o) => !o);
											}}
											className="p-1.5 !bg-white !text-black !border-none hover:text-black transition-colors flex items-center"
										>
											<User size={20} strokeWidth={1.5} />
										</button>

										{/* Account Dropdown */}
										{isUserMenuOpen && (
											<div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 overflow-hidden">
												<div className="px-4 py-3 bg-gray-50/50 border-b border-gray-50 mb-1">
													<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
														Signed in as
													</p>
													<p className="text-sm font-semibold truncate text-gray-900">
														{user.displayName || user.email}
													</p>
												</div>
												<Link href="/shops/account">
													<button
														onClick={() => setIsUserMenuOpen(false)}
														className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
													>
														<Settings size={16} strokeWidth={1.5} />
														<span>{t.header.accountSettings}</span>
													</button>
												</Link>
												<Link href="/shops/account/orders">
													<button
														onClick={() => setIsUserMenuOpen(false)}
														className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
													>
														<Package size={16} strokeWidth={1.5} />
														<span>{t.header.myOrders}</span>
													</button>
												</Link>
												<hr className="my-1 border-gray-50" />
												<button
													onClick={handleLogout}
													className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
												>
													<LogOut size={16} strokeWidth={1.5} />
													<span>{t.header.signOut}</span>
												</button>
											</div>
										)}
									</>
								) : (
									<Link href="/shops/auth">
										<button className="text-xs font-bold uppercase tracking-widest !bg-white !text-black !border-none hover:text-gray-500 transition-colors">
											{t.header.signIn}
										</button>
									</Link>
								)}
							</div>

							{/* Wishlist Icon */}
							{user && (
								<Link href="/shops/wishlist">
									<button className="p-1.5 !bg-white !text-black !border-none hover:text-black transition-colors relative ">
										<Heart size={20} strokeWidth={1.5} />
										{wishlistCount > 0 && (
											<span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
												{wishlistCount}
											</span>
										)}
									</button>
								</Link>
							)}

							{/* Cart Icon */}
							<button
								onClick={() => setIsCartOpen(true)}
								className="p-1.5 !bg-white !text-black !border-none hover:text-black transition-colors relative"
							>
								<ShoppingCart size={20} strokeWidth={1.5} />
								{itemCount > 0 && (
									<span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
										{itemCount}
									</span>
								)}
							</button>
						</div>

						{/* Mobile/Tablet Actions (lg and below) */}
						<div className="flex items-center space-x-3 lg:hidden">
							<LanguageSelector />
							<button
								onClick={() => setIsMobileSearchOpen(true)}
								className="p-2 !bg-white !text-black !border-none hover:text-black transition-colors"
							>
								<Search size={22} strokeWidth={1.5} />
							</button>
							<button
								onClick={() => setIsCartOpen(true)}
								className="p-2 !bg-white !text-black !border-none hover:text-black transition-colors relative"
							>
								<ShoppingCart size={22} strokeWidth={1.5} />
								{itemCount > 0 && (
									<span className="absolute top-1 right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
										{itemCount}
									</span>
								)}
							</button>
							<button
								onClick={toggleMobileMenu}
								className="p-2 !bg-white !text-black !border-none hover:text-black transition-colors"
							>
								<Menu size={24} strokeWidth={1.5} />
							</button>
						</div>
					</div>

					{/* Tablet Menu Drawer (hidden on mobile, only show on tablet) */}
					{isTabletMenuOpen && (
						<div className="hidden md:block lg:hidden border-t border-gray-100 py-6 bg-white animate-in slide-in-from-top duration-300">
							<nav className="flex flex-col space-y-4">
								{["Products", "Brands", "Bespoke", "Ready-to-Wear"].map(
									(item, idx) => (
										<Link
											key={idx}
											href={
												item === "Products"
													? "/shops/products"
													: item === "Brands"
														? "/shops/brands"
														: item === "Bespoke"
															? "/shops/products?type=bespoke"
															: "/shops/products?type=ready-to-wear"
											}
											onClick={() => setIsTabletMenuOpen(false)}
											className="text-sm text-gray-700 hover:text-black font-medium transition-colors py-2 px-1 border-b border-gray-50 last:border-0"
										>
											{item === "Products"
												? t.header.products
												: item === "Brands"
													? t.header.brands
													: item === "Bespoke"
														? t.header.bespoke
														: t.header.readyToWear}
										</Link>
									),
								)}
							</nav>
						</div>
					)}
				</div>
			</header>

			{/* Cart Sidebar */}
			<CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

			{/* Mobile Search Modal */}
			<MobileSearchModal
				isOpen={isMobileSearchOpen}
				onClose={() => setIsMobileSearchOpen(false)}
			/>

			{/* Overlays */}
			{isUserMenuOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/5"
					onClick={() => setIsUserMenuOpen(false)}
				/>
			)}
			{isShopByOpen && (
				<div
					className="fixed inset-0 z-[45] bg-black/5"
					aria-hidden
					onClick={() => setIsShopByOpen(false)}
				/>
			)}
			{showSearchSuggestions && (
				<div
					className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
					onClick={() => setShowSearchSuggestions(false)}
				/>
			)}
		</>
	);
};

// Export Header wrapped with runtime protection
export const Header = withComponentRuntimeGuard(HeaderComponent, {
	componentName: "Header",
	enableHMRBoundary: true,
	enableRuntimeWrapper: true,
	fallback: (
		<header className="bg-white shadow-sm border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div className="flex items-center space-x-4">
						<div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
						<div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
						<div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
					</div>
				</div>
			</div>
		</header>
	),
});
